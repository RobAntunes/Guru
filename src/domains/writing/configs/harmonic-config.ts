import { BaseConfig } from '../../../core/base-config';
import { HarmonicAnalyzer } from '../../../core/intelligence/harmonic';

export interface WritingPattern {
  type: 'narrative' | 'descriptive' | 'dialogue' | 'exposition' | 'action';
  frequency: number;
  amplitude: number;
  phase: number;
  coherence: number;
}

export interface TextStructure {
  sentences: number;
  paragraphs: number;
  avgSentenceLength: number;
  avgParagraphLength: number;
  rhythmVariation: number;
  tensionArc: number[];
}

export class WritingHarmonicConfig extends BaseConfig {
  readonly domain = 'writing';
  readonly version = '1.0.0';
  
  // FFT parameters adapted for text analysis
  readonly fftConfig = {
    sampleRate: 100,        // Words per sample
    windowSize: 512,        // Analysis window in words
    hopSize: 128,          // Overlap between windows
    frequencyBins: 256,    // Resolution of analysis
  };
  
  // Text-specific harmonic patterns
  readonly patternConfig = {
    narrativeFlow: {
      minFrequency: 0.1,   // Slow narrative arcs
      maxFrequency: 2.0,   // Fast scene changes
      threshold: 0.3,
    },
    sentenceRhythm: {
      minFrequency: 5.0,   // Sentence-level variations
      maxFrequency: 20.0,  // Word-level patterns
      threshold: 0.2,
    },
    emotionalResonance: {
      minFrequency: 0.01,  // Chapter-level emotional arcs
      maxFrequency: 0.5,   // Scene-level emotions
      threshold: 0.4,
    },
  };
  
  // Writing-specific features to analyze
  readonly features = {
    // Structural features
    sentenceLength: { weight: 0.15, normalize: true },
    paragraphStructure: { weight: 0.10, normalize: true },
    dialogueRatio: { weight: 0.12, normalize: true },
    
    // Rhythmic features
    punctuationPattern: { weight: 0.08, normalize: true },
    clauseVariation: { weight: 0.10, normalize: true },
    
    // Semantic features
    vocabularyDiversity: { weight: 0.15, normalize: true },
    metaphorDensity: { weight: 0.10, normalize: true },
    
    // Narrative features
    tensionProgression: { weight: 0.10, normalize: true },
    paceVariation: { weight: 0.10, normalize: true },
  };
  
  // Transform text to analyzable signal
  textToSignal(text: string): Float32Array {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const signal = new Float32Array(sentences.length * 10);
    
    sentences.forEach((sentence, i) => {
      const words = sentence.trim().split(/\s+/);
      const baseIndex = i * 10;
      
      // Encode various features into signal
      signal[baseIndex] = words.length;                          // Sentence length
      signal[baseIndex + 1] = this.calculateComplexity(sentence); // Complexity
      signal[baseIndex + 2] = this.detectEmotion(sentence);      // Emotional tone
      signal[baseIndex + 3] = this.measureRhythm(sentence);      // Rhythmic quality
      signal[baseIndex + 4] = this.detectDialogue(sentence);     // Dialogue indicator
      signal[baseIndex + 5] = this.calculateTension(sentence);   // Narrative tension
      signal[baseIndex + 6] = this.measureImagery(sentence);     // Imagery density
      signal[baseIndex + 7] = this.detectPace(sentence);         // Pacing indicator
      signal[baseIndex + 8] = this.calculateVariety(words);      // Vocabulary variety
      signal[baseIndex + 9] = this.measureFlow(sentence, i);     // Flow continuity
    });
    
    return signal;
  }
  
  private calculateComplexity(sentence: string): number {
    const words = sentence.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    const clauseCount = sentence.split(/[,;:]/).length;
    return (avgWordLength * 0.5 + clauseCount * 0.5) / 10;
  }
  
  private detectEmotion(sentence: string): number {
    // Simplified emotion detection based on keywords
    const emotionalWords = /joy|sad|anger|fear|love|hate|hope|despair/gi;
    const matches = sentence.match(emotionalWords) || [];
    return Math.min(matches.length / 10, 1);
  }
  
  private measureRhythm(sentence: string): number {
    // Analyze punctuation and word length variation
    const words = sentence.split(/\s+/);
    const lengths = words.map(w => w.length);
    const variance = this.calculateVariance(lengths);
    return Math.min(variance / 10, 1);
  }
  
  private detectDialogue(sentence: string): number {
    return /["'].*["']/.test(sentence) ? 1 : 0;
  }
  
  private calculateTension(sentence: string): number {
    // Detect tension through action words and short sentences
    const actionWords = /run|fight|scream|rush|crash|explode/gi;
    const matches = sentence.match(actionWords) || [];
    const shortness = 1 - Math.min(sentence.length / 100, 1);
    return (matches.length / 5 + shortness) / 2;
  }
  
  private measureImagery(sentence: string): number {
    // Detect sensory and descriptive words
    const imageryWords = /color|sound|smell|taste|touch|bright|dark|soft|hard/gi;
    const matches = sentence.match(imageryWords) || [];
    return Math.min(matches.length / 5, 1);
  }
  
  private detectPace(sentence: string): number {
    // Short sentences = fast pace
    const words = sentence.split(/\s+/).length;
    return 1 - Math.min(words / 30, 1);
  }
  
  private calculateVariety(words: string[]): number {
    const unique = new Set(words.map(w => w.toLowerCase()));
    return unique.size / words.length;
  }
  
  private measureFlow(sentence: string, index: number): number {
    // Simplified flow - would compare to previous sentence
    return 0.5 + Math.sin(index * 0.1) * 0.5;
  }
  
  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length);
  }
  
  // Interpret FFT results for writing
  interpretHarmonics(fftResult: Float32Array): WritingPattern[] {
    const patterns: WritingPattern[] = [];
    const binSize = this.fftConfig.sampleRate / this.fftConfig.frequencyBins;
    
    for (let i = 0; i < fftResult.length / 2; i++) {
      const frequency = i * binSize;
      const amplitude = fftResult[i];
      const phase = fftResult[i + fftResult.length / 2];
      
      // Map frequency ranges to writing patterns
      let type: WritingPattern['type'];
      if (frequency < 0.5) {
        type = 'narrative';  // Long-term story arcs
      } else if (frequency < 2.0) {
        type = 'exposition'; // Chapter/scene level
      } else if (frequency < 5.0) {
        type = 'descriptive'; // Paragraph level
      } else if (frequency < 10.0) {
        type = 'dialogue';    // Sentence level
      } else {
        type = 'action';      // Word/phrase level
      }
      
      if (amplitude > this.getThreshold(type)) {
        patterns.push({
          type,
          frequency,
          amplitude,
          phase,
          coherence: this.calculateCoherence(amplitude, phase),
        });
      }
    }
    
    return patterns;
  }
  
  private getThreshold(type: WritingPattern['type']): number {
    const thresholds = {
      narrative: 0.3,
      exposition: 0.25,
      descriptive: 0.2,
      dialogue: 0.15,
      action: 0.1,
    };
    return thresholds[type];
  }
  
  private calculateCoherence(amplitude: number, phase: number): number {
    // Coherence based on amplitude strength and phase stability
    return amplitude * (1 - Math.abs(Math.sin(phase)));
  }
  
  // Generate writing recommendations based on harmonic analysis
  generateRecommendations(patterns: WritingPattern[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze pattern distribution
    const typeCount = patterns.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Check for imbalances
    if (!typeCount.narrative || typeCount.narrative < 2) {
      recommendations.push('Consider strengthening the overall narrative arc');
    }
    
    if (typeCount.action > typeCount.descriptive * 2) {
      recommendations.push('Balance action with more descriptive passages');
    }
    
    if (!typeCount.dialogue || typeCount.dialogue < 3) {
      recommendations.push('Add more dialogue to bring characters to life');
    }
    
    // Check rhythm variation
    const rhythmPatterns = patterns.filter(p => p.frequency > 5 && p.frequency < 20);
    if (rhythmPatterns.length < 5) {
      recommendations.push('Vary sentence structure for better rhythm');
    }
    
    // Check emotional resonance
    const emotionalPatterns = patterns.filter(p => p.frequency < 0.5 && p.amplitude > 0.4);
    if (emotionalPatterns.length === 0) {
      recommendations.push('Strengthen emotional journey throughout the piece');
    }
    
    return recommendations;
  }
}

export const writingHarmonicConfig = new WritingHarmonicConfig();