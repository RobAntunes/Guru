use serde::{Deserialize, Serialize};

/// Structured cognitive analysis result from Phi-4 Mini
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Phi4Analysis {
    /// Overall confidence score (0.0-1.0) 
    pub confidence: f32,
    
    /// Key mathematical insights and observations
    pub mathematical_insights: String,
    
    /// Step-by-step reasoning process
    pub reasoning_steps: Vec<String>,
    
    /// Pattern detection results
    pub pattern_detection: PatternDetection,
    
    /// Architectural analysis (optional)
    pub architectural_analysis: Option<ArchitecturalAnalysis>,
    
    /// Raw response from the model (for debugging)
    pub raw_response: String,
}

/// Pattern detection results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternDetection {
    /// List of detected patterns
    pub detected_patterns: Vec<String>,
    
    /// Confidence scores for each pattern (0.0-1.0)
    pub confidence_scores: Vec<f32>,
}

/// Architectural analysis results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchitecturalAnalysis {
    /// Structural insights about the analyzed content
    pub structure_insights: Vec<String>,
    
    /// Optimization suggestions
    pub optimization_suggestions: Vec<String>,
}

/// Raw cognitive analysis structure (matches JSON output format)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CognitiveAnalysis {
    pub confidence: f32,
    pub mathematical_insights: String,
    pub reasoning_steps: Vec<String>,
    pub pattern_detection: PatternDetection,
    pub architectural_analysis: Option<ArchitecturalAnalysis>,
}

/// Reasoning step with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReasoningStep {
    /// The reasoning step description
    pub description: String,
    
    /// Confidence in this step (0.0-1.0)
    pub confidence: f32,
    
    /// Type of reasoning used
    pub reasoning_type: ReasoningType,
    
    /// References to supporting evidence
    pub evidence: Vec<String>,
}

/// Types of reasoning Phi-4 can perform
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReasoningType {
    /// Mathematical/logical reasoning
    Mathematical,
    
    /// Pattern-based reasoning
    PatternBased,
    
    /// Structural analysis
    Structural,
    
    /// Causal reasoning
    Causal,
    
    /// Analogical reasoning
    Analogical,
}

impl Phi4Analysis {
    /// Create a new analysis with default values
    pub fn new(confidence: f32, insights: String) -> Self {
        Self {
            confidence,
            mathematical_insights: insights,
            reasoning_steps: Vec::new(),
            pattern_detection: PatternDetection {
                detected_patterns: Vec::new(),
                confidence_scores: Vec::new(),
            },
            architectural_analysis: None,
            raw_response: String::new(),
        }
    }
    
    /// Add a reasoning step
    pub fn add_reasoning_step(&mut self, step: String) {
        self.reasoning_steps.push(step);
    }
    
    /// Add a detected pattern with confidence
    pub fn add_pattern(&mut self, pattern: String, confidence: f32) {
        self.pattern_detection.detected_patterns.push(pattern);
        self.pattern_detection.confidence_scores.push(confidence);
    }
    
    /// Set architectural analysis
    pub fn set_architectural_analysis(&mut self, analysis: ArchitecturalAnalysis) {
        self.architectural_analysis = Some(analysis);
    }
    
    /// Get the highest confidence pattern
    pub fn best_pattern(&self) -> Option<(&String, f32)> {
        self.pattern_detection
            .detected_patterns
            .iter()
            .zip(self.pattern_detection.confidence_scores.iter())
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
    }
    
    /// Check if analysis meets minimum confidence threshold
    pub fn is_confident(&self, threshold: f32) -> bool {
        self.confidence >= threshold
    }
    
    /// Get summary of key insights
    pub fn summary(&self) -> String {
        format!(
            "Confidence: {:.2}% | Patterns: {} | Steps: {} | Insights: {}",
            self.confidence * 100.0,
            self.pattern_detection.detected_patterns.len(),
            self.reasoning_steps.len(),
            self.mathematical_insights.chars().take(100).collect::<String>()
                + if self.mathematical_insights.len() > 100 { "..." } else { "" }
        )
    }
}

impl PatternDetection {
    /// Create new pattern detection result
    pub fn new() -> Self {
        Self {
            detected_patterns: Vec::new(),
            confidence_scores: Vec::new(),
        }
    }
    
    /// Add a pattern with confidence score
    pub fn add_pattern(&mut self, pattern: String, confidence: f32) {
        self.detected_patterns.push(pattern);
        self.confidence_scores.push(confidence);
    }
    
    /// Get patterns above confidence threshold
    pub fn confident_patterns(&self, threshold: f32) -> Vec<(&String, f32)> {
        self.detected_patterns
            .iter()
            .zip(self.confidence_scores.iter())
            .filter(|(_, &score)| score >= threshold)
            .map(|(pattern, &score)| (pattern, score))
            .collect()
    }
    
    /// Get average confidence across all patterns
    pub fn average_confidence(&self) -> f32 {
        if self.confidence_scores.is_empty() {
            0.0
        } else {
            self.confidence_scores.iter().sum::<f32>() / self.confidence_scores.len() as f32
        }
    }
}

impl ArchitecturalAnalysis {
    /// Create new architectural analysis
    pub fn new() -> Self {
        Self {
            structure_insights: Vec::new(),
            optimization_suggestions: Vec::new(),
        }
    }
    
    /// Add a structural insight
    pub fn add_insight(&mut self, insight: String) {
        self.structure_insights.push(insight);
    }
    
    /// Add an optimization suggestion
    pub fn add_suggestion(&mut self, suggestion: String) {
        self.optimization_suggestions.push(suggestion);
    }
    
    /// Get total number of recommendations
    pub fn recommendation_count(&self) -> usize {
        self.structure_insights.len() + self.optimization_suggestions.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_phi4_analysis_creation() {
        let mut analysis = Phi4Analysis::new(0.85, "Test insights".to_string());
        analysis.add_reasoning_step("Step 1: Analyze structure".to_string());
        analysis.add_pattern("recursive_pattern".to_string(), 0.92);
        
        assert_eq!(analysis.confidence, 0.85);
        assert_eq!(analysis.reasoning_steps.len(), 1);
        assert_eq!(analysis.pattern_detection.detected_patterns.len(), 1);
        assert!(analysis.is_confident(0.8));
        assert!(!analysis.is_confident(0.9));
    }
    
    #[test]
    fn test_pattern_detection() {
        let mut detection = PatternDetection::new();
        detection.add_pattern("pattern1".to_string(), 0.9);
        detection.add_pattern("pattern2".to_string(), 0.6);
        detection.add_pattern("pattern3".to_string(), 0.8);
        
        let confident = detection.confident_patterns(0.75);
        assert_eq!(confident.len(), 2);
        assert_eq!(detection.average_confidence(), 0.7666667);
    }
}