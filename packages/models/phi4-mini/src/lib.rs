/*!
# Phi-4 Mini Engine for Guru Cognitive Systems

High-performance ONNX-based inference engine for Phi-4 Mini with 4-bit quantization.
Provides mathematical reasoning and pattern analysis capabilities for AI-to-AI collaboration.

## Features
- 🚀 ONNX Runtime for fast inference (sub-100ms)
- 📦 4-bit quantization (2-4GB vs 14GB full model)
- 🧠 Cognitive analysis specialization
- ⚡ Async-first design for SILC protocol
- 🔋 Offline-first operation

## Usage
```rust
use phi4_mini::Phi4MiniEngine;

let engine = Phi4MiniEngine::new().await?;
let analysis = engine.cognitive_analysis("Analyze this architectural pattern").await?;
println!("Confidence: {}", analysis.confidence);
```
*/

mod engine;
mod cognitive;
mod quantization;
mod download;
mod generation;

pub use engine::Phi4MiniEngine;
pub use cognitive::{Phi4Analysis, CognitiveAnalysis, ReasoningStep};

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Errors that can occur during Phi-4 Mini inference
#[derive(Error, Debug)]
pub enum Phi4Error {
    #[error("ONNX Runtime error: {0}")]
    OnnxError(#[from] ort::Error),
    
    #[error("Tokenization error: {0}")]
    TokenizerError(#[from] tokenizers::Error),
    
    #[error("Model not found: {0}")]
    ModelNotFound(String),
    
    #[error("Invalid input: {0}")]
    InvalidInput(String),
    
    #[error("Inference failed: {0}")]
    InferenceFailed(String),
}

/// Configuration for Phi-4 Mini engine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Phi4Config {
    /// Path to the ONNX model file
    pub model_path: String,
    
    /// Path to the tokenizer file
    pub tokenizer_path: String,
    
    /// Maximum sequence length
    pub max_length: usize,
    
    /// Temperature for sampling (0.0 = deterministic)
    pub temperature: f32,
    
    /// Number of threads for inference
    pub num_threads: usize,
    
    /// Enable GPU acceleration if available
    pub use_gpu: bool,
}

impl Default for Phi4Config {
    fn default() -> Self {
        Self {
            model_path: "models/phi4-mini-int4.onnx".to_string(),
            tokenizer_path: "models/phi4-tokenizer.json".to_string(),
            max_length: 2048,
            temperature: 0.7,
            num_threads: 4,
            use_gpu: true,
        }
    }
}

/// Result type for Phi-4 operations
pub type Phi4Result<T> = Result<T, Phi4Error>;