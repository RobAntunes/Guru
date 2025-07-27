use phi4_mini::{Phi4MiniEngine, Phi4Config, Phi4Analysis};
use std::sync::Arc;
use tokio::sync::Mutex;
use serde_json::Value;

/// Global Phi-4 engine instance
static PHI4_ENGINE: once_cell::sync::OnceCell<Arc<Mutex<Phi4MiniEngine>>> = once_cell::sync::OnceCell::new();

/// Initialize the Phi-4 engine
pub async fn initialize_phi4_engine() -> Result<(), String> {
    if PHI4_ENGINE.get().is_some() {
        return Ok(()); // Already initialized
    }
    
    // Get model path from app data directory
    let app_dir = dirs::data_local_dir()
        .ok_or("Failed to get local data directory")?
        .join("guru")
        .join("models")
        .join("phi4-mini");
    
    let config = Phi4Config {
        model_path: app_dir.join("model.onnx").to_string_lossy().to_string(),
        tokenizer_path: app_dir.join("tokenizer.json").to_string_lossy().to_string(),
        max_length: 2048,
        temperature: 0.7,
        num_threads: 4,
        use_gpu: false, // CPU for now
    };
    
    match Phi4MiniEngine::with_config(config).await {
        Ok(engine) => {
            PHI4_ENGINE.set(Arc::new(Mutex::new(engine)))
                .map_err(|_| "Failed to set global engine")?;
            Ok(())
        }
        Err(e) => Err(format!("Failed to initialize Phi-4 engine: {}", e))
    }
}

/// Run Phi-4 analysis on project data
pub async fn run_phi4_analysis(project_data: Value) -> Result<Value, String> {
    // Ensure engine is initialized
    initialize_phi4_engine().await?;
    
    let engine = PHI4_ENGINE.get()
        .ok_or("Phi-4 engine not initialized")?;
    
    let engine = engine.lock().await;
    
    // Extract prompt from project data
    let system_prompt = project_data["systemPrompt"]
        .as_str()
        .unwrap_or("You are an expert project analyst");
    
    let analysis_prompt = project_data["analysisPrompt"]
        .as_str()
        .unwrap_or("Analyze this project");
    
    // Combine prompts
    let full_prompt = format!("{}\n\n{}", system_prompt, analysis_prompt);
    
    // Run cognitive analysis
    match engine.cognitive_analysis(&full_prompt).await {
        Ok(analysis) => {
            // Convert Phi4Analysis to JSON response format expected by frontend
            let response = serde_json::json!({
                "detectedDomain": "code", // This would come from analysis
                "domainConfidence": analysis.confidence,
                "summary": analysis.mathematical_insights,
                "insights": analysis.reasoning_steps.into_iter().map(|step| {
                    serde_json::json!({
                        "category": "Analysis",
                        "title": step.split('.').next().unwrap_or(&step),
                        "description": step,
                        "severity": "info"
                    })
                }).collect::<Vec<_>>(),
                "recommendations": extract_recommendations(&analysis),
                "patterns": extract_patterns(&analysis),
                "opportunities": extract_opportunities(&analysis),
                "analysisDepth": "deep",
                "confidence": analysis.confidence
            });
            
            Ok(response)
        }
        Err(e) => Err(format!("Phi-4 analysis failed: {}", e))
    }
}

/// Extract recommendations from Phi-4 analysis
fn extract_recommendations(analysis: &Phi4Analysis) -> Vec<Value> {
    let mut recommendations = Vec::new();
    
    if let Some(arch_analysis) = &analysis.architectural_analysis {
        for (i, suggestion) in arch_analysis.optimization_suggestions.iter().enumerate() {
            recommendations.push(serde_json::json!({
                "priority": if i == 0 { "high" } else { "medium" },
                "category": "Optimization",
                "title": suggestion.split('.').next().unwrap_or(suggestion),
                "description": suggestion,
                "impact": "Improve project quality and performance"
            }));
        }
    }
    
    recommendations
}

/// Extract patterns from Phi-4 analysis
fn extract_patterns(analysis: &Phi4Analysis) -> Vec<Value> {
    let mut patterns = Vec::new();
    
    for (i, pattern) in analysis.pattern_detection.detected_patterns.iter().enumerate() {
        let confidence = analysis.pattern_detection.confidence_scores
            .get(i)
            .unwrap_or(&0.5);
        
        patterns.push(serde_json::json!({
            "type": "detected",
            "name": pattern,
            "value": format!("Confidence: {:.0}%", confidence * 100.0),
            "quality": if *confidence > 0.7 { "good" } else { "needs attention" }
        }));
    }
    
    patterns
}

/// Extract opportunities from Phi-4 analysis
fn extract_opportunities(analysis: &Phi4Analysis) -> Vec<Value> {
    let mut opportunities = Vec::new();
    
    if let Some(arch_analysis) = &analysis.architectural_analysis {
        for insight in &arch_analysis.structure_insights {
            opportunities.push(serde_json::json!({
                "area": "Architecture",
                "opportunity": insight,
                "potential": "high",
                "effort": "medium"
            }));
        }
    }
    
    opportunities
}

// Add once_cell dependency to Cargo.toml