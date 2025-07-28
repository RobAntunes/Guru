use std::path::Path;
use std::process::Command;
use anyhow::{Result, Context};
use log::{info, warn, debug};

use crate::Phi4Error;

/// Download and quantize Phi-4 Mini model to ONNX format
pub async fn download_phi4_model(target_path: &str) -> Result<(), Phi4Error> {
    info!("📥 Downloading Phi-4 Mini model...");
    
    let parent_dir = Path::new(target_path)
        .parent()
        .ok_or_else(|| Phi4Error::ModelNotFound("Invalid target path".to_string()))?;
    
    // Create models directory if it doesn't exist
    if !parent_dir.exists() {
        std::fs::create_dir_all(parent_dir)
            .context("Failed to create models directory")
            .map_err(|e| Phi4Error::ModelNotFound(e.to_string()))?;
    }
    
    // Check if we need to install dependencies
    ensure_python_dependencies().await?;
    
    // Download and convert model
    download_and_convert_model(target_path).await?;
    
    // Download tokenizer
    download_tokenizer(parent_dir).await?;
    
    info!("✅ Phi-4 Mini model ready at: {}", target_path);
    Ok(())
}

/// Ensure required Python dependencies are installed
async fn ensure_python_dependencies() -> Result<(), Phi4Error> {
    info!("🔧 Checking Python dependencies...");
    
    let required_packages = vec![
        "torch",
        "transformers",
        "onnx", 
        "onnxruntime",
        "optimum[onnxruntime]",
        "bitsandbytes",
    ];
    
    for package in required_packages {
        debug!("Checking for {}", package);
        let output = Command::new("python3")
            .args(&["-c", &format!("import {}", package.split('[').next().unwrap())])
            .output();
            
        if output.is_err() || !output.unwrap().status.success() {
            warn!("📦 Installing {}", package);
            let install_result = Command::new("pip3")
                .args(&["install", package])
                .status()
                .context("Failed to run pip3")
                .map_err(|e| Phi4Error::ModelNotFound(e.to_string()))?;
                
            if !install_result.success() {
                return Err(Phi4Error::ModelNotFound(
                    format!("Failed to install {}", package)
                ));
            }
        }
    }
    
    info!("✅ Python dependencies ready");
    Ok(())
}

/// Download and convert Phi-4 model to ONNX with quantization
async fn download_and_convert_model(target_path: &str) -> Result<(), Phi4Error> {
    info!("🔄 Converting Phi-4 Mini to ONNX with 4-bit quantization...");
    
    // Create Python script for model conversion
    let conversion_script = create_conversion_script(target_path);
    let script_path = "/tmp/phi4_convert.py";
    
    std::fs::write(script_path, conversion_script)
        .context("Failed to write conversion script")
        .map_err(|e| Phi4Error::ModelNotFound(e.to_string()))?;
    
    // Run conversion script
    let output = Command::new("python3")
        .arg(script_path)
        .output()
        .context("Failed to run conversion script")
        .map_err(|e| Phi4Error::ModelNotFound(e.to_string()))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(Phi4Error::ModelNotFound(
            format!("Model conversion failed: {}", stderr)
        ));
    }
    
    // Clean up script
    let _ = std::fs::remove_file(script_path);
    
    info!("✅ Model converted successfully");
    Ok(())
}

/// Create Python script for model conversion
fn create_conversion_script(target_path: &str) -> String {
    format!(r#"
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from optimum.onnxruntime import ORTModelForCausalLM
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def convert_phi4_to_onnx():
    model_name = "microsoft/Phi-4"
    target_path = "{target_path}"
    target_dir = os.path.dirname(target_path)
    
    logger.info("🔄 Starting Phi-4 Mini conversion...")
    
    try:
        # Load tokenizer
        logger.info("📝 Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        
        # Load model with 4-bit quantization
        logger.info("🧠 Loading model with 4-bit quantization...")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            load_in_4bit=True,
            trust_remote_code=True,
            attn_implementation="flash_attention_2" if torch.cuda.is_available() else "eager"
        )
        
        # Convert to ONNX
        logger.info("⚡ Converting to ONNX format...")
        ort_model = ORTModelForCausalLM.from_pretrained(
            model_name,
            from_transformers=True,
            use_cache=True,
            provider="CPUExecutionProvider"  # Use CPU for compatibility
        )
        
        # Save ONNX model
        logger.info(f"💾 Saving ONNX model to {{target_dir}}")
        os.makedirs(target_dir, exist_ok=True)
        ort_model.save_pretrained(target_dir)
        
        # Save tokenizer
        tokenizer_path = os.path.join(target_dir, "phi4-tokenizer.json")
        tokenizer.save_pretrained(target_dir)
        
        # Rename model file to match expected name
        model_files = [f for f in os.listdir(target_dir) if f.endswith('.onnx')]
        if model_files:
            src_path = os.path.join(target_dir, model_files[0])
            dst_path = target_path
            os.rename(src_path, dst_path)
            logger.info(f"✅ Model saved as {{dst_path}}")
        
        logger.info("🎉 Conversion completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Conversion failed: {{e}}")
        raise

if __name__ == "__main__":
    convert_phi4_to_onnx()
"#, target_path = target_path)
}

/// Download tokenizer separately
async fn download_tokenizer(models_dir: &Path) -> Result<(), Phi4Error> {
    info!("📝 Downloading tokenizer...");
    
    // Create Python script for tokenizer download
    let tokenizer_script = format!(r#"
from transformers import AutoTokenizer
import os

model_name = "microsoft/Phi-4"
target_dir = "{}"

print("📝 Loading and saving tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)

# Save as both formats for compatibility  
tokenizer.save_pretrained(target_dir)

# Also save as JSON for tokenizers crate
tokenizer_json_path = os.path.join(target_dir, "phi4-tokenizer.json")
tokenizer.backend_tokenizer.save(tokenizer_json_path)

print(f"✅ Tokenizer saved to {{target_dir}}")
"#, models_dir.display());

    let script_path = "/tmp/phi4_tokenizer.py";
    std::fs::write(script_path, tokenizer_script)
        .context("Failed to write tokenizer script")
        .map_err(|e| Phi4Error::ModelNotFound(e.to_string()))?;
    
    let output = Command::new("python3")
        .arg(script_path)
        .output()
        .context("Failed to run tokenizer script")
        .map_err(|e| Phi4Error::ModelNotFound(e.to_string()))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(Phi4Error::ModelNotFound(
            format!("Tokenizer download failed: {}", stderr)
        ));
    }
    
    // Clean up script
    let _ = std::fs::remove_file(script_path);
    
    info!("✅ Tokenizer ready");
    Ok(())
}

/// Check if model files exist and are valid
pub fn verify_model_files(model_path: &str, tokenizer_path: &str) -> Result<bool, Phi4Error> {
    let model_exists = Path::new(model_path).exists();
    let tokenizer_exists = Path::new(tokenizer_path).exists();
    
    if !model_exists {
        debug!("Model file not found: {}", model_path);
        return Ok(false);
    }
    
    if !tokenizer_exists {
        debug!("Tokenizer file not found: {}", tokenizer_path);
        return Ok(false);
    }
    
    // Check file sizes (basic validation)
    let model_size = std::fs::metadata(model_path)
        .context("Failed to get model file metadata")
        .map_err(|e| Phi4Error::ModelNotFound(e.to_string()))?
        .len();
    
    if model_size < 1_000_000 { // Less than 1MB is suspicious
        warn!("Model file seems too small: {} bytes", model_size);
        return Ok(false);
    }
    
    info!("✅ Model files verified ({}MB)", model_size / 1_000_000);
    Ok(true)
}

/// Get expected model download size for user feedback
pub fn get_expected_download_size() -> &'static str {
    "~2-4GB (quantized from 14GB full model)"
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_conversion_script_generation() {
        let script = create_conversion_script("/tmp/test-model.onnx");
        assert!(script.contains("microsoft/Phi-4"));
        assert!(script.contains("/tmp/test-model.onnx"));
        assert!(script.contains("load_in_4bit=True"));
    }
    
    #[test]
    fn test_expected_size() {
        let size = get_expected_download_size();
        assert!(size.contains("GB"));
    }
}