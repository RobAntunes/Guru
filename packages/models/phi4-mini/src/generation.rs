use std::collections::HashMap;
use ort::session::{Session, SessionInputValue, SessionOutputs};
use ort::value::Value;
use log::{debug, info};

use crate::{Phi4Result, Phi4Error};

/// Text generation module with KV cache support for Phi-4
pub struct TextGenerator<'a> {
    session: &'a Session,
    tokenizer: &'a tokenizers::Tokenizer,
    config: GenerationConfig,
}

#[derive(Debug, Clone)]
pub struct GenerationConfig {
    pub max_new_tokens: usize,
    pub temperature: f32,
    pub top_k: usize,
    pub top_p: f32,
    pub repetition_penalty: f32,
    pub do_sample: bool,
    pub num_layers: usize,
    pub num_heads: usize,
    pub head_dim: usize,
}

impl Default for GenerationConfig {
    fn default() -> Self {
        Self {
            max_new_tokens: 500,
            temperature: 0.7,
            top_k: 50,
            top_p: 0.9,
            repetition_penalty: 1.1,
            do_sample: true,
            num_layers: 32,
            num_heads: 32,
            head_dim: 96,
        }
    }
}

/// Represents the KV cache state between generation steps
pub struct KVCache {
    cache: HashMap<String, Vec<f32>>, // Store raw cache data
}

impl<'a> TextGenerator<'a> {
    pub fn new(
        session: &'a Session,
        tokenizer: &'a tokenizers::Tokenizer,
        config: GenerationConfig,
    ) -> Self {
        Self {
            session,
            tokenizer,
            config,
        }
    }

    /// Generate text completion for the given input IDs
    pub async fn generate(&self, input_ids: Vec<i64>) -> Phi4Result<String> {
        info!("🚀 Starting text generation for {} input tokens", input_ids.len());
        
        let mut current_ids = input_ids;
        let mut generated_tokens = Vec::new();
        let mut kv_cache: Option<KVCache> = None;
        
        // Generation loop
        for step in 0..self.config.max_new_tokens {
            // Prepare inputs for this step
            let inputs = self.prepare_inputs(&current_ids, &kv_cache)?;
            
            // Run inference
            let outputs = self.session.run(inputs)?;
            
            // Extract logits and process
            let next_token = self.process_outputs(&outputs, &current_ids)?;
            
            // Check stopping conditions
            if self.should_stop(next_token, &generated_tokens) {
                debug!("🛑 Stopping generation at step {}", step);
                break;
            }
            
            // Update state
            generated_tokens.push(next_token);
            current_ids.push(next_token);
            
            // Update KV cache from outputs
            kv_cache = Some(self.extract_kv_cache(&outputs)?);
            
            // Progress indicator
            if step % 20 == 0 && step > 0 {
                debug!("Generated {} tokens", step);
            }
        }
        
        // Decode generated tokens to text
        let generated_ids: Vec<u32> = generated_tokens.iter().map(|&id| id as u32).collect();
        let text = self.tokenizer
            .decode(&generated_ids, true)
            .map_err(Phi4Error::TokenizerError)?;
        
        info!("✅ Generated {} tokens", generated_tokens.len());
        Ok(text)
    }

    /// Prepare model inputs for the current generation step
    fn prepare_inputs<'b>(
        &self,
        token_ids: &[i64],
        kv_cache: &Option<KVCache>,
    ) -> Phi4Result<Vec<SessionInputValue<'b>>> {
        let batch_size = 1;
        let is_first_step = kv_cache.is_none();
        
        // For subsequent steps, we only need the last token
        let input_ids = if is_first_step {
            token_ids.to_vec()
        } else {
            vec![*token_ids.last().unwrap()]
        };
        
        let seq_len = input_ids.len();
        
        // Create input_ids tensor
        let input_ids_tensor = Value::from_array(([batch_size, seq_len], input_ids.into_boxed_slice()))
            .map_err(|e| Phi4Error::InferenceFailed(format!("Failed to create tensor: {}", e)))?;
        
        // Create attention mask
        let total_length = token_ids.len();
        let attention_mask: Vec<i64> = vec![1i64; total_length];
        let attention_mask_tensor = Value::from_array(([batch_size, total_length], attention_mask.into_boxed_slice()))
            .map_err(|e| Phi4Error::InferenceFailed(format!("Failed to create attention mask: {}", e)))?;
        
        // Build inputs
        let mut inputs: Vec<SessionInputValue> = vec![
            SessionInputValue::from(input_ids_tensor),
            SessionInputValue::from(attention_mask_tensor),
        ];
        
        // Add KV cache inputs - for now, use empty cache
        // TODO: Implement proper KV cache handling with ort 2.0 API
        for _ in 0..self.config.num_layers {
            // Empty key tensor: [batch_size, num_heads, 0, head_dim]
            let empty_key = vec![0.0f32; 0];
            let key_tensor = Value::from_array(([batch_size, self.config.num_heads, 0, self.config.head_dim], empty_key.into_boxed_slice()))
                .map_err(|e| Phi4Error::InferenceFailed(format!("Failed to create KV key: {}", e)))?;
            inputs.push(SessionInputValue::from(key_tensor));
            
            // Empty value tensor: [batch_size, num_heads, 0, head_dim]
            let empty_value = vec![0.0f32; 0];
            let value_tensor = Value::from_array(([batch_size, self.config.num_heads, 0, self.config.head_dim], empty_value.into_boxed_slice()))
                .map_err(|e| Phi4Error::InferenceFailed(format!("Failed to create KV value: {}", e)))?;
            inputs.push(SessionInputValue::from(value_tensor));
        }
        
        Ok(inputs)
    }

    /// Process model outputs to get next token
    fn process_outputs(
        &self,
        outputs: &SessionOutputs,
        current_ids: &[i64],
    ) -> Phi4Result<i64> {
        // Get logits output
        let logits = outputs.get("logits")
            .ok_or_else(|| Phi4Error::InferenceFailed("No logits output found".to_string()))?;
        
        // Extract tensor data
        let (shape, data) = logits.try_extract_raw_tensor::<f32>()
            .map_err(|e| Phi4Error::InferenceFailed(format!("Failed to extract logits: {}", e)))?;
        
        // Get dimensions
        let last_position = shape[1] - 1;
        let vocab_size = shape[2];
        
        // Extract logits for last token
        let mut last_logits = vec![0.0f32; vocab_size];
        let offset = (last_position * vocab_size) as usize;
        for i in 0..vocab_size {
            last_logits[i] = data[offset + i];
        }
        
        // Apply repetition penalty
        if self.config.repetition_penalty != 1.0 {
            for &token_id in current_ids {
                if (token_id as usize) < vocab_size {
                    last_logits[token_id as usize] /= self.config.repetition_penalty;
                }
            }
        }
        
        // Sample next token
        let next_token = if self.config.do_sample {
            self.sample_token(&last_logits)?
        } else {
            // Greedy decoding
            last_logits
                .iter()
                .enumerate()
                .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
                .map(|(idx, _)| idx as i64)
                .unwrap()
        };
        
        Ok(next_token)
    }

    /// Sample token from logits distribution
    fn sample_token(&self, logits: &[f32]) -> Phi4Result<i64> {
        // Apply temperature
        let scaled_logits: Vec<f32> = logits
            .iter()
            .map(|&x| x / self.config.temperature)
            .collect();
        
        // Apply top-k filtering
        let mut filtered_logits = self.apply_top_k(&scaled_logits);
        
        // Apply top-p (nucleus) filtering
        filtered_logits = self.apply_top_p(&filtered_logits);
        
        // Convert to probabilities
        let max_logit = filtered_logits
            .iter()
            .fold(f32::NEG_INFINITY, |a, &b| a.max(b));
        
        let exp_logits: Vec<f32> = filtered_logits
            .iter()
            .map(|&x| (x - max_logit).exp())
            .collect();
        
        let sum_exp: f32 = exp_logits.iter().sum();
        let probs: Vec<f32> = exp_logits
            .iter()
            .map(|&x| x / sum_exp)
            .collect();
        
        // Sample from distribution
        use rand::prelude::*;
        let mut rng = thread_rng();
        let sample: f32 = rng.gen();
        
        let mut cumulative = 0.0;
        for (idx, &prob) in probs.iter().enumerate() {
            cumulative += prob;
            if sample < cumulative {
                return Ok(idx as i64);
            }
        }
        
        // Fallback to last token
        Ok((probs.len() - 1) as i64)
    }

    /// Apply top-k filtering to logits
    fn apply_top_k(&self, logits: &[f32]) -> Vec<f32> {
        if self.config.top_k == 0 || self.config.top_k >= logits.len() {
            return logits.to_vec();
        }
        
        // Get indices of top-k values
        let mut indexed: Vec<(usize, f32)> = logits
            .iter()
            .enumerate()
            .map(|(i, &v)| (i, v))
            .collect();
        
        indexed.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        let top_k_indices: std::collections::HashSet<usize> = indexed
            .iter()
            .take(self.config.top_k)
            .map(|(i, _)| *i)
            .collect();
        
        // Set non-top-k values to -inf
        logits
            .iter()
            .enumerate()
            .map(|(i, &v)| {
                if top_k_indices.contains(&i) {
                    v
                } else {
                    f32::NEG_INFINITY
                }
            })
            .collect()
    }

    /// Apply top-p (nucleus) filtering to logits
    fn apply_top_p(&self, logits: &[f32]) -> Vec<f32> {
        if self.config.top_p >= 1.0 {
            return logits.to_vec();
        }
        
        // Convert to probabilities for sorting
        let max_logit = logits.iter().fold(f32::NEG_INFINITY, |a, &b| a.max(b));
        let exp_logits: Vec<f32> = logits.iter().map(|&x| (x - max_logit).exp()).collect();
        let sum_exp: f32 = exp_logits.iter().sum();
        let probs: Vec<f32> = exp_logits.iter().map(|&x| x / sum_exp).collect();
        
        // Sort by probability
        let mut indexed: Vec<(usize, f32)> = probs
            .iter()
            .enumerate()
            .map(|(i, &p)| (i, p))
            .collect();
        
        indexed.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        // Find cutoff for top-p
        let mut cumulative = 0.0;
        let mut cutoff_idx = 0;
        for (i, (_, prob)) in indexed.iter().enumerate() {
            cumulative += prob;
            if cumulative >= self.config.top_p {
                cutoff_idx = i;
                break;
            }
        }
        
        // Keep only tokens in top-p
        let top_p_indices: std::collections::HashSet<usize> = indexed
            .iter()
            .take(cutoff_idx + 1)
            .map(|(i, _)| *i)
            .collect();
        
        logits
            .iter()
            .enumerate()
            .map(|(i, &v)| {
                if top_p_indices.contains(&i) {
                    v
                } else {
                    f32::NEG_INFINITY
                }
            })
            .collect()
    }

    /// Extract KV cache from model outputs
    fn extract_kv_cache(&self, _outputs: &SessionOutputs) -> Phi4Result<KVCache> {
        // TODO: Implement proper KV cache extraction with ort 2.0
        // For now, return empty cache
        Ok(KVCache { cache: HashMap::new() })
    }

    /// Check if generation should stop
    fn should_stop(&self, token_id: i64, generated_tokens: &[i64]) -> bool {
        // Check for EOS token (typically 2 for many models)
        if token_id == 2 || token_id == 0 {
            return true;
        }
        
        // Check for repetition
        if generated_tokens.len() >= 20 {
            let recent = &generated_tokens[generated_tokens.len() - 20..];
            let last_10 = &recent[10..];
            let prev_10 = &recent[..10];
            
            if last_10 == prev_10 {
                debug!("Repetition detected, stopping generation");
                return true;
            }
        }
        
        // Check for JSON completion (useful for structured outputs)
        if generated_tokens.len() > 5 {
            // Simple check - in practice we'd decode and verify
            let last_few: Vec<u32> = generated_tokens
                .iter()
                .rev()
                .take(5)
                .map(|&id| id as u32)
                .collect();
            
            if let Ok(text) = self.tokenizer.decode(&last_few, false) {
                if text.contains("}") && text.contains("\n") {
                    debug!("JSON completion detected");
                    return true;
                }
            }
        }
        
        false
    }
}

// Add rand dependency to Cargo.toml for sampling