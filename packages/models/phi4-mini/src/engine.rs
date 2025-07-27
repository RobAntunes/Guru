use std::path::Path;
use ort::session::{Session, builder::GraphOptimizationLevel};
use tokenizers::Tokenizer;
use log::{info, debug, warn};

use crate::{Phi4Config, Phi4Result, Phi4Error, Phi4Analysis, CognitiveAnalysis};
use crate::generation::{TextGenerator, GenerationConfig};

/// High-performance Phi-4 Mini inference engine using ONNX Runtime
pub struct Phi4MiniEngine {
    session: Session,
    tokenizer: Tokenizer,
    config: Phi4Config,
}

impl Phi4MiniEngine {
    /// Create a new Phi-4 Mini engine with default configuration
    pub async fn new() -> Phi4Result<Self> {
        Self::with_config(Phi4Config::default()).await
    }
    
    /// Create a new Phi-4 Mini engine with custom configuration
    pub async fn with_config(config: Phi4Config) -> Phi4Result<Self> {
        info!("🚀 Initializing Phi-4 Mini Engine...");
        
        // Check if model files exist
        if !Path::new(&config.model_path).exists() {
            warn!("📥 Model not found, downloading...");
            crate::download::download_phi4_model(&config.model_path).await?;
        }
        
        // Initialize ONNX Runtime session
        debug!("🔧 Setting up ONNX Runtime session");
        let session = Session::builder()?
            .with_optimization_level(GraphOptimizationLevel::Level3)?
            .with_intra_threads(config.num_threads as i16)?
            .with_model_from_file(&config.model_path)?;
            
        // Load tokenizer
        debug!("📝 Loading tokenizer");
        let tokenizer = Tokenizer::from_file(&config.tokenizer_path)
            .map_err(|e| Phi4Error::TokenizerError(e))?;
        
        info!("✅ Phi-4 Mini Engine ready! Model: {}", config.model_path);
        
        Ok(Self {
            session,
            tokenizer,
            config,
        })
    }
    
    /// Perform cognitive analysis on the given prompt
    /// 
    /// This is the main entry point for Guru's AI-to-AI collaboration.
    /// Returns structured analysis with mathematical reasoning and pattern detection.
    pub async fn cognitive_analysis(&self, prompt: &str) -> Phi4Result<Phi4Analysis> {
        debug!("🧠 Starting cognitive analysis for prompt length: {}", prompt.len());
        
        // Enhanced prompt for cognitive focus
        let enhanced_prompt = self.create_cognitive_prompt(prompt);
        
        // Tokenize input
        let encoding = self.tokenizer
            .encode(&enhanced_prompt[..], true)
            .map_err(Phi4Error::TokenizerError)?;
            
        let input_ids: Vec<i64> = encoding
            .get_ids()
            .iter()
            .map(|&x| x as i64)
            .collect();
        
        // Truncate if too long (leave room for generation)
        let max_input_length = self.config.max_length - 500; // Reserve 500 tokens for generation
        let input_ids = if input_ids.len() > max_input_length {
            warn!("🔪 Truncating input from {} to {} tokens", input_ids.len(), max_input_length);
            input_ids[..max_input_length].to_vec()
        } else {
            input_ids
        };
        
        // Create text generator with appropriate config
        let gen_config = GenerationConfig {
            max_new_tokens: 500,
            temperature: self.config.temperature,
            top_k: 50,
            top_p: 0.9,
            repetition_penalty: 1.1,
            do_sample: true,
            num_layers: 32,
            num_heads: 32,
            head_dim: 96,
        };
        
        let generator = TextGenerator::new(&self.session, &self.tokenizer, gen_config);
        
        // Generate response using proper text generation with KV cache
        debug!("⚡ Running text generation with KV cache");
        let response = generator.generate(input_ids).await?;
        
        debug!("📝 Generated response length: {}", response.len());
        
        // Parse structured cognitive analysis
        let analysis = self.parse_cognitive_response(&response)?;
        
        Ok(analysis)
    }
    
    /// Create an enhanced prompt for cognitive analysis
    fn create_cognitive_prompt(&self, user_prompt: &str) -> String {
        format!(
            r#"<|system|>
You are Phi-4 Mini, a mathematical reasoning specialist providing cognitive analysis for AI systems. 

Your task is to provide structured analysis with:
1. Mathematical insights and reasoning steps
2. Pattern detection and confidence scores  
3. Architectural recommendations
4. Structured JSON output

Focus on precision, mathematical accuracy, and actionable insights.

<|user|>
{user_prompt}

Please provide your analysis in this JSON format:
{{
    "confidence": <0.0-1.0>,
    "mathematical_insights": "<key mathematical observations>",
    "reasoning_steps": ["<step1>", "<step2>", ...],
    "pattern_detection": {{
        "detected_patterns": ["<pattern1>", "<pattern2>", ...],
        "confidence_scores": [<score1>, <score2>, ...]
    }},
    "architectural_analysis": {{
        "structure_insights": ["<insight1>", "<insight2>", ...],
        "optimization_suggestions": ["<suggestion1>", "<suggestion2>", ...]
    }}
}}

<|assistant|>
"#,
            user_prompt = user_prompt
        )
    }
    
    /// Parse the cognitive response into structured analysis
    fn parse_cognitive_response(&self, response: &str) -> Phi4Result<Phi4Analysis> {
        // Try to extract JSON from response
        if let Some(json_start) = response.find('{') {
            if let Some(json_end) = response.rfind('}') {
                let json_str = &response[json_start..=json_end];
                
                if let Ok(analysis) = serde_json::from_str::<CognitiveAnalysis>(json_str) {
                    return Ok(Phi4Analysis {
                        confidence: analysis.confidence,
                        mathematical_insights: analysis.mathematical_insights,
                        reasoning_steps: analysis.reasoning_steps,
                        pattern_detection: analysis.pattern_detection,
                        architectural_analysis: analysis.architectural_analysis,
                        raw_response: response.to_string(),
                    });
                }
            }
        }
        
        // Fallback: create analysis from raw response
        warn!("📄 Could not parse JSON, using fallback analysis");
        Ok(Phi4Analysis {
            confidence: 0.75, // Default confidence
            mathematical_insights: response.to_string(),
            reasoning_steps: response.lines().map(|s| s.to_string()).collect(),
            pattern_detection: crate::cognitive::PatternDetection {
                detected_patterns: vec!["text_analysis".to_string()],
                confidence_scores: vec![0.75],
            },
            architectural_analysis: Some(crate::cognitive::ArchitecturalAnalysis {
                structure_insights: vec!["Raw text analysis".to_string()],
                optimization_suggestions: vec!["Parse structured output".to_string()],
            }),
            raw_response: response.to_string(),
        })
    }
    
    /// Get model configuration
    pub fn config(&self) -> &Phi4Config {
        &self.config
    }
    
    /// Check if the engine is ready for inference
    pub fn is_ready(&self) -> bool {
        // Simple check - in practice, we might want more sophisticated health checks
        true
    }
}