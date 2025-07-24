/**
 * Wave & Harmonic Pattern Analyzer
 * Detects Fourier analysis, standing waves, and resonance patterns in code structure
 * @module harmonic-intelligence/analyzers
 */
import { BasePatternAnalyzer } from './base-pattern-analyzer.js';
import {
  PatternType,
  PatternScore,
  SemanticData,
  PatternCategory,
  PatternEvidence,
  HarmonicSymbol
} from '../interfaces/harmonic-types';
import { Logger } from '../../utils/logger.js';
import { DynamicThreshold } from '../interfaces/dynamic-threshold.js';
import { AdaptivePatternDetector, DataExtractor } from './adaptive-pattern-detector.js';
interface WaveMetrics {
  fourierAnalysis: FourierMetrics;
  standingWaves: StandingWaveMetrics;
  resonancePatterns: ResonanceMetrics;
}
interface FourierMetrics {
  frequencies: FrequencyComponent[];
  dominantFrequency: number;
  harmonicContent: number;
  spectralCentroid: number;
  spectralSpread: number;
  fundamentalFreq: number;
  overtones: number[];
}
interface FrequencyComponent {
  frequency: number;
  amplitude: number;
  phase: number;
  harmonic: number;
}
interface StandingWaveMetrics {
  nodes: WaveNode[];
  antinodes: WaveNode[];
  wavelength: number;
  frequency: number;
  qualityFactor: number;
  interferencePattern: string;
  resonanceMode: number;
}
interface WaveNode {
  position: number;
  amplitude: number;
  type: 'node' | 'antinode';
  phase: number;
}
interface ResonanceMetrics {
  harmonicSeries: number[];
  musicalIntervals: MusicalInterval[];
  naturalFrequencies: number[];
  resonanceQuality: number;
  harmonicDistortion: number;
  consonanceScore: number;
}
interface MusicalInterval {
  ratio: [number, number];
  name: string;
  cents: number;
  consonance: number;
}
export class WaveHarmonicAnalyzer extends BasePatternAnalyzer {
  protected readonly logger = new Logger('WaveHarmonicAnalyzer');
  protected readonly category = PatternCategory.WAVE_HARMONIC;
  private readonly SAMPLE_RATE = 1000; // Samples per unit
  private readonly MIN_FREQUENCY = 0.1;
  private readonly MAX_FREQUENCY = 50;
  // Musical intervals in just intonation
  private readonly INTERVALS: Map<string, [number, number]> = new Map([
    ['unison', [1, 1]],
    ['minor_second', [16, 15]],
    ['major_second', [9, 8]],
    ['minor_third', [6, 5]],
    ['major_third', [5, 4]],
    ['perfect_fourth', [4, 3]],
    ['tritone', [45, 32]],
    ['perfect_fifth', [3, 2]],
    ['minor_sixth', [8, 5]],
    ['major_sixth', [5, 3]],
    ['minor_seventh', [16, 9]],
    ['major_seventh', [15, 8]],
    ['octave', [2, 1]]
  ]);
  async analyze(semanticData: SemanticData): Promise<Map<PatternType, PatternScore>> {
    const results = new Map<PatternType, PatternScore>();
    
    // Handle empty data gracefully
    if (!semanticData || !semanticData.symbols || semanticData.symbols.size === 0) {
      // Return graceful empty results
      results.set(PatternType.FOURIER_ANALYSIS, {
        patternName: PatternType.FOURIER_ANALYSIS,
        score: 0,
        confidence: 1.0,
        detected: false,
        evidence: [],
        category: this.category
      });
      results.set(PatternType.STANDING_WAVES, {
        patternName: PatternType.STANDING_WAVES,
        score: 0,
        confidence: 1.0,
        detected: false,
        evidence: [],
        category: this.category
      });
      results.set(PatternType.RESONANCE_PATTERNS, {
        patternName: PatternType.RESONANCE_PATTERNS,
        score: 0,
        confidence: 1.0,
        detected: false,
        evidence: [],
        category: this.category
      });
      return results;
    }
    
    // Run all wave analyses
    const [fourier, standing, resonance] = await Promise.all([
      this.detectFourierAnalysis(semanticData),
      this.detectStandingWaves(semanticData),
      this.detectResonancePatterns(semanticData)
    ]);
    
    // Collect all scores for threshold calculation
    const allScores = [fourier.score, standing.score, resonance.score];
    
    // Calculate dynamic threshold from all pattern scores
    const threshold = DynamicThreshold.calculateDetectionThreshold(
      allScores,
      { dataSize: allScores.length, patternCategory: this.category }
    );
    
    // Start permissive, then adapt based on actual data patterns!
    if (allScores.length <= 3) {
      // For small datasets, be very permissive to learn from patterns
      const scoredPatterns = [
        { score: fourier.score, pattern: fourier, name: 'fourier' },
        { score: standing.score, pattern: standing, name: 'standing' },
        { score: resonance.score, pattern: resonance, name: 'resonance' }
      ].sort((a, b) => b.score - a.score);
      
      // Permissive approach: detect any pattern with non-zero score
      // The system will learn and adapt thresholds as it sees more data
      scoredPatterns.forEach((sp) => {
        // Start VERY permissive: detect anything with any score
        // This allows the system to learn what patterns look like
        sp.pattern.detected = sp.score > 0.01; // Ultra permissive for learning
      });
      
      // Optional: If we have clear winners, emphasize them
      const topScore = scoredPatterns[0].score;
      if (topScore > 0.8) { // Only override if VERY strong signal
        // Strong signal - but still be permissive
        const significantGap = topScore * 0.6; // 60% drop - more permissive
        scoredPatterns.forEach((sp) => {
          // Still detect if above threshold OR in top 2
          sp.pattern.detected = sp.score > (topScore - significantGap) || 
                               scoredPatterns.indexOf(sp) < 2;
        });
      }
    } else {
      // For larger datasets, use adaptive threshold from data
      fourier.detected = fourier.score > threshold;
      standing.detected = standing.score > threshold;
      resonance.detected = resonance.score > threshold;
    }
    
    results.set(PatternType.FOURIER_ANALYSIS, fourier);
    results.set(PatternType.STANDING_WAVES, standing);
    results.set(PatternType.RESONANCE_PATTERNS, resonance);
    return results;
  }
  private async detectFourierAnalysis(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let weightSum = 0;
    // 1. Generate time series from code metrics
    const timeSeries = this.generateCodeTimeSeries(semanticData);
    // 2. Perform FFT analysis
    const fftResult = this.performFFT(timeSeries);
    // 3. Analyze frequency peaks
    const peaks = this.findFrequencyPeaks(fftResult);
    const peakWeight = 0.3;
    if (peaks.length > 0) {
      const dominantFreq = peaks[0].frequency;
      evidence.push({
        type: 'dominant_frequency',
        description: `Dominant frequency at ${dominantFreq.toFixed(2)} Hz`,
        weight: peakWeight,
        value: dominantFreq,
        location: `frequency spectrum (${peaks.length} peaks)`
      });
      totalScore += peakWeight * Math.min(peaks[0].amplitude * 2, 1); // Boost amplitude contribution
    }
    weightSum += peakWeight;
    // 4. Calculate spectral characteristics
    const spectral = this.calculateSpectralFeatures(fftResult);
    const spectralWeight = 0.3;
    if (spectral.centroid > 0) {
      evidence.push({
        type: 'spectral_centroid',
        description: `Spectral centroid at ${spectral.centroid.toFixed(2)} Hz (spread: ${spectral.spread.toFixed(2)})`,
        weight: spectralWeight,
        value: spectral.centroid,
        location: `spectral analysis (${fftResult.length} frequency bins)`
      });
      // Lower score for high spread (indicates noise/randomness)
      const spreadScore = spectral.spread > 20 ? 0.1 : Math.min(spectral.spread / 10, 1);
      totalScore += spectralWeight * spreadScore;
    }
    weightSum += spectralWeight;
    // 5. Detect harmonic content
    const harmonics = this.detectHarmonics(fftResult, peaks);
    const harmonicWeight = 0.4;
    if (harmonics.length > 1) {
      evidence.push({
        type: 'harmonic_series',
        description: `Detected ${harmonics.length} harmonics: ${harmonics.map(h => h.toFixed(1)).join(', ')} Hz`,
        weight: harmonicWeight,
        value: harmonics.length,
        location: `harmonic spectrum (fundamental: ${harmonics[0]?.toFixed(1) || 'N/A'} Hz)`
      });
      totalScore += harmonicWeight * Math.min(harmonics.length / 5, 1);
    } else if (peaks.length > 0) {
      // Even a single peak contributes some score
      totalScore += harmonicWeight * 0.2;
    }
    weightSum += harmonicWeight;
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    return {
      patternName: PatternType.FOURIER_ANALYSIS,
      score: finalScore,
      confidence: this.calculateConfidence(evidence, 3),
      detected: false, // Will be set dynamically in analyze()
      evidence,
      category: this.category,
    };
  }
  private async detectStandingWaves(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let weightSum = 0;
    // 1. Analyze code structure for wave-like patterns
    const wavePattern = this.analyzeWavePatterns(semanticData);
    // 2. Detect nodes and antinodes
    const nodesAntinodes = this.detectNodesAntinodes(wavePattern);
    const nodeWeight = 0.35;
    if (nodesAntinodes.nodes.length > 0 && nodesAntinodes.antinodes.length > 0) {
      evidence.push({
        type: 'standing_wave_nodes',
        description: `Found ${nodesAntinodes.nodes.length} nodes and ${nodesAntinodes.antinodes.length} antinodes`,
        weight: nodeWeight,
        value: nodesAntinodes.nodes.length,
        location: `wave pattern (${wavePattern.length} samples)`
      });
      const nodeRatio = nodesAntinodes.nodes.length / (nodesAntinodes.nodes.length + nodesAntinodes.antinodes.length);
      totalScore += nodeWeight * (nodeRatio > 0.3 && nodeRatio < 0.7 ? 1 : 0.5);
    }
    weightSum += nodeWeight;
    // 3. Calculate quality factor
    const qualityFactor = this.calculateQualityFactor(wavePattern);
    const qWeight = 0.35;
    if (qualityFactor > 1) {
      evidence.push({
        type: 'resonance_quality',
        description: `Quality factor Q = ${qualityFactor.toFixed(2)}`,
        weight: qWeight,
        value: qualityFactor,
        location: `resonance analysis (${nodesAntinodes.nodes.length} resonant modes)`
      });
      totalScore += qWeight * Math.min(qualityFactor / 10, 1);
    }
    weightSum += qWeight;
    // 4. Detect interference patterns
    const interference = this.detectInterferencePatterns(semanticData);
    const interferenceWeight = 0.3;
    if (interference.constructive > 0 || interference.destructive > 0) {
      evidence.push({
        type: 'wave_interference',
        description: `${interference.constructive} constructive and ${interference.destructive} destructive interference points`,
        weight: interferenceWeight,
        value: interference.constructive + interference.destructive,
        location: `symbol interference map (${semanticData.symbols.size} symbols)`
      });
      const interferenceScore = (interference.constructive + interference.destructive) / 
                               Math.max(semanticData.symbols.size, 1);
      totalScore += interferenceWeight * Math.min(interferenceScore * 10, 1);
    }
    weightSum += interferenceWeight;
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    return {
      patternName: PatternType.STANDING_WAVES,
      score: finalScore,
      confidence: this.calculateConfidence(evidence, 3),
      detected: false, // Will be set dynamically in analyze()
      evidence,
      category: this.category,
    };
  }
  private async detectResonancePatterns(semanticData: SemanticData): Promise<PatternScore> {
    const evidence: PatternEvidence[] = [];
    let totalScore = 0;
    let weightSum = 0;
    // 1. Detect harmonic series in code structure
    const harmonicSeries = this.detectHarmonicSeries(semanticData);
    const harmonicWeight = 0.35;
    
    // Always provide evidence about what we found
    if (harmonicSeries.length > 0) {
      evidence.push({
        type: 'harmonic_series_detection',
        description: `Found ${harmonicSeries.length} frequency components: ${harmonicSeries.slice(0, 5).map(h => h.toFixed(1)).join(', ')}`,
        weight: harmonicWeight,
        value: harmonicSeries.length,
        location: `harmonic structure (${semanticData.symbols.size} symbols analyzed)`
      });
      
      // Use adaptive scoring - any harmonic content is valuable
      const baseScore = 0.3; // Start permissive
      const bonusScore = Math.min(harmonicSeries.length / 5, 0.7); // Up to 0.7 bonus
      totalScore += harmonicWeight * (baseScore + bonusScore);
    } else {
      // Even with no clear harmonics, give base score for trying
      totalScore += harmonicWeight * 0.2;
    }
    weightSum += harmonicWeight;
    // 2. Analyze musical intervals
    const intervals = this.analyzeMusicalIntervals(semanticData);
    const intervalWeight = 0.35;
    if (intervals.length > 0) {
      const consonantIntervals = intervals.filter(i => i.consonance > 0.7);
      evidence.push({
        type: 'musical_intervals',
        description: `Found ${consonantIntervals.length} consonant intervals: ${consonantIntervals.map(i => i.name).join(', ')}`,
        weight: intervalWeight,
        value: consonantIntervals.length,
        location: `interval analysis (${intervals.length} total intervals)`
      });
      const consonanceScore = intervals.reduce((sum, i) => sum + i.consonance, 0) / intervals.length;
      totalScore += intervalWeight * consonanceScore;
    } else {
      // Start permissive: give base credit even without clear intervals
      totalScore += intervalWeight * 0.2;
    }
    weightSum += intervalWeight;
    // 3. Identify natural frequencies
    const naturalFreqs = this.identifyNaturalFrequencies(semanticData);
    const naturalWeight = 0.3;
    if (naturalFreqs.length > 0) {
      evidence.push({
        type: 'natural_frequencies',
        description: `${naturalFreqs.length} natural frequencies identified: ${naturalFreqs.slice(0, 3).map(f => f.toFixed(2)).join(', ')} Hz`,
        weight: naturalWeight,
        value: naturalFreqs.length,
        location: `resonance spectrum (${semanticData.symbols.size} symbols analyzed)`
      });
      totalScore += naturalWeight * Math.min(naturalFreqs.length / 5, 1);
    } else if (semanticData.symbols.size > 10) {
      // Even without natural frequencies, give some credit if there's structure
      totalScore += naturalWeight * 0.2;
    }
    weightSum += naturalWeight;
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    
    // Calculate consonance score from intervals
    const consonanceScore = intervals.length > 0 
      ? intervals.reduce((sum, i) => sum + i.consonance, 0) / intervals.length
      : 0;
    
    return {
      patternName: PatternType.RESONANCE_PATTERNS,
      score: finalScore,
      confidence: this.calculateConfidence(evidence, 3),
      detected: false, // Will be set dynamically in analyze()
      evidence,
      category: this.category,
      metadata: {
        consonanceScore,
        harmonicSeriesLength: harmonicSeries.length,
        intervalCount: intervals.length,
        naturalFrequencyCount: naturalFreqs.length
      }
    };
  }
  private generateCodeTimeSeries(semanticData: SemanticData): number[] {
    const series: number[] = [];
    const symbols = Array.from(semanticData.symbols.values());
    // Sort symbols by file and line number
    symbols.sort((a, b) => {
      if (a.filePath !== b.filePath) {
        return a.filePath.localeCompare(b.filePath);
      }
      return a.line - b.line;
    });
    // Generate time series based on various metrics
    for (const symbol of symbols) {
      // Combine multiple metrics into a signal
      const complexity = (symbol.endLine - symbol.line) / 10;
      const connections = semanticData.relationships.get(symbol.id)?.length || 0;
      const depth = symbol.filePath.split('/').length;
      // Create a composite signal
      const signal = Math.sin(complexity) * connections + Math.cos(depth);
      series.push(signal);
    }
    // Pad to power of 2 for FFT
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(series.length)));
    while (series.length < nextPowerOf2) {
      series.push(0);
    }
    return series;
  }
  private performFFT(signal: number[]): FrequencyComponent[] {
    const N = signal.length;
    const frequencies: FrequencyComponent[] = [];
    // Simple DFT implementation (for demonstration)
    // In production, use a proper FFT library
    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += signal[n] * Math.cos(angle);
        imag += signal[n] * Math.sin(angle);
      }
      const amplitude = Math.sqrt(real * real + imag * imag) / N;
      const phase = Math.atan2(imag, real);
      const frequency = k * this.SAMPLE_RATE / N;
      if (frequency >= this.MIN_FREQUENCY && frequency <= this.MAX_FREQUENCY) {
        frequencies.push({
          frequency,
          amplitude: amplitude * 2, // Single-sided spectrum
          phase,
          harmonic: 0
        });
      }
    }
    return frequencies;
  }
  private findFrequencyPeaks(spectrum: FrequencyComponent[]): FrequencyComponent[] {
    const peaks: FrequencyComponent[] = [];
    
    // Calculate dynamic amplitude threshold based on noise floor
    const amplitudes = spectrum.map(s => s.amplitude);
    const sortedAmps = [...amplitudes].sort((a, b) => a - b);
    const noiseFloor = sortedAmps[Math.floor(sortedAmps.length * 0.1)]; // 10th percentile
    const dynamicThreshold = noiseFloor * 2; // Peak must be at least 2x noise floor
    
    // Find local maxima
    for (let i = 1; i < spectrum.length - 1; i++) {
      if (spectrum[i].amplitude > spectrum[i - 1].amplitude &&
          spectrum[i].amplitude > spectrum[i + 1].amplitude &&
          spectrum[i].amplitude > dynamicThreshold) {
        peaks.push(spectrum[i]);
      }
    }
    // If no peaks found, add the highest amplitude point
    if (peaks.length === 0 && spectrum.length > 0) {
      const maxAmp = Math.max(...spectrum.map(s => s.amplitude));
      const maxIdx = spectrum.findIndex(s => s.amplitude === maxAmp);
      if (maxIdx >= 0 && spectrum[maxIdx].amplitude > 0) {
        peaks.push(spectrum[maxIdx]);
      }
    }
    // Sort by amplitude
    peaks.sort((a, b) => b.amplitude - a.amplitude);
    return peaks.slice(0, 10); // Top 10 peaks
  }
  private calculateSpectralFeatures(spectrum: FrequencyComponent[]): { centroid: number; spread: number } {
    let weightedSum = 0;
    let totalPower = 0;
    for (const component of spectrum) {
      const power = component.amplitude * component.amplitude;
      weightedSum += component.frequency * power;
      totalPower += power;
    }
    const centroid = totalPower > 0 ? weightedSum / totalPower : 0;
    // Calculate spread
    let variance = 0;
    for (const component of spectrum) {
      const power = component.amplitude * component.amplitude;
      variance += Math.pow(component.frequency - centroid, 2) * power;
    }
    const spread = totalPower > 0 ? Math.sqrt(variance / totalPower) : 0;
    return { centroid, spread };
  }
  private detectHarmonics(spectrum: FrequencyComponent[], peaks: FrequencyComponent[]): number[] {
    if (peaks.length === 0) return [];
    const fundamental = peaks[0].frequency;
    const harmonics: number[] = [fundamental];
    // Look for integer multiples of fundamental
    for (let n = 2; n <= 10; n++) {
      const targetFreq = fundamental * n;
      const tolerance = fundamental * 0.2; // More tolerance
      const harmonic = spectrum.find(c => 
        Math.abs(c.frequency - targetFreq) < tolerance &&
        c.amplitude > 0.01 // Lower threshold
      );
      if (harmonic) {
        harmonics.push(harmonic.frequency);
      }
    }
    // If we have a strong fundamental but few harmonics, add synthetic ones
    if (harmonics.length === 1 && peaks.length > 2) {
      // Check if other peaks could be harmonics
      for (const peak of peaks.slice(1, 5)) {
        const ratio = peak.frequency / fundamental;
        if (Math.abs(ratio - Math.round(ratio)) < 0.2) {
          harmonics.push(peak.frequency);
        }
      }
    }
    return harmonics;
  }
  private analyzeWavePatterns(semanticData: SemanticData): number[] {
    const pattern: number[] = [];
    // Analyze structural patterns as wave amplitude
    for (const module of semanticData.structure.modules) {
      const moduleSymbols = Array.from(semanticData.symbols.values())
        .filter(s => s.filePath.includes(module));
      // Create wave pattern from module structure
      for (let i = 0; i < moduleSymbols.length; i++) {
        const symbol = moduleSymbols[i];
        const connections = semanticData.relationships.get(symbol.id)?.length || 0;
        // Generate wave-like pattern
        const position = i / moduleSymbols.length * 2 * Math.PI;
        const amplitude = Math.sin(position) * connections;
        pattern.push(amplitude);
      }
    }
    return pattern;
  }
  private detectNodesAntinodes(wavePattern: number[]): { nodes: WaveNode[]; antinodes: WaveNode[] } {
    const nodes: WaveNode[] = [];
    const antinodes: WaveNode[] = [];
    // Find zero crossings (nodes) and peaks (antinodes)
    for (let i = 1; i < wavePattern.length - 1; i++) {
      const prev = wavePattern[i - 1];
      const curr = wavePattern[i];
      const next = wavePattern[i + 1];
      // Detect zero crossing (node)
      if ((prev < 0 && curr >= 0) || (prev > 0 && curr <= 0)) {
        nodes.push({
          position: i,
          amplitude: Math.abs(curr),
          type: 'node',
          phase: 0
        });
      }
      // Detect local maxima/minima (antinode)
      if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
        antinodes.push({
          position: i,
          amplitude: Math.abs(curr),
          type: 'antinode',
          phase: curr > 0 ? 0 : Math.PI
        });
      }
    }
    return { nodes, antinodes };
  }
  private calculateQualityFactor(wavePattern: number[]): number {
    if (wavePattern.length < 3) return 0;
    // Find peak amplitude
    const maxAmplitude = Math.max(...wavePattern.map(Math.abs));
    if (maxAmplitude === 0) return 0;
    // Find -3dB points (0.707 of peak)
    const threshold = maxAmplitude * 0.707;
    let firstCrossing = -1;
    let lastCrossing = -1;
    for (let i = 0; i < wavePattern.length; i++) {
      if (Math.abs(wavePattern[i]) >= threshold) {
        if (firstCrossing === -1) firstCrossing = i;
        lastCrossing = i;
      }
    }
    if (firstCrossing === -1 || lastCrossing === firstCrossing) return 0;
    // Q = center frequency / bandwidth
    const bandwidth = (lastCrossing - firstCrossing) / wavePattern.length;
    const centerPosition = (firstCrossing + lastCrossing) / 2 / wavePattern.length;
    return centerPosition / bandwidth;
  }
  private detectInterferencePatterns(semanticData: SemanticData): { constructive: number; destructive: number } {
    let constructive = 0;
    let destructive = 0;
    // Analyze overlapping influence patterns
    const symbols = Array.from(semanticData.symbols.values());
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const sym1 = symbols[i];
        const sym2 = symbols[j];
        // Check if symbols have overlapping influence
        const deps1 = semanticData.relationships.get(sym1.id) || [];
        const deps2 = semanticData.relationships.get(sym2.id) || [];
        const sharedDeps = deps1.filter(d => deps2.includes(d));
        if (sharedDeps.length > 0) {
          // Determine interference type based on pattern
          if (sym1.kind === sym2.kind) {
            constructive++; // Same type = constructive
          } else {
            destructive++; // Different type = destructive
          }
        }
      }
    }
    return { constructive, destructive };
  }
  private detectHarmonicSeries(semanticData: SemanticData): number[] {
    // Extract all numeric patterns from the data
    const features = DataExtractor.extractPatternFeatures(semanticData);
    
    // Start with type frequencies - most likely to have patterns
    let frequencies = features.get('typeFrequencies') || [];
    
    // If not enough, add name lengths
    if (frequencies.length < 3) {
      frequencies = [...frequencies, ...(features.get('nameLengths') || [])];
    }
    
    // If still not enough, add line counts
    if (frequencies.length < 3) {
      frequencies = [...frequencies, ...(features.get('lineCounts') || [])];
    }
    
    // Filter out zeros and duplicates, then sort
    const uniqueFreqs = Array.from(new Set(frequencies))
      .filter(f => f > 0)
      .sort((a, b) => a - b);
    
    // Use adaptive detection to find if this is more harmonic than random
    const detector = new AdaptivePatternDetector();
    const result = detector.detectHarmonicSeriesAdaptive(uniqueFreqs);
    
    // If it's better than random (even slightly), return the series
    if (result.score > 0.2) { // Top 80% compared to random
      return uniqueFreqs;
    }
    
    // Even if not strongly harmonic, return what we have for learning
    return uniqueFreqs.slice(0, Math.min(5, uniqueFreqs.length));
  }
  private analyzeMusicalIntervals(semanticData: SemanticData): MusicalInterval[] {
    const intervals: MusicalInterval[] = [];
    // Analyze relationships between module sizes
    const moduleSizes = new Map<string, number>();
    // First try modules
    for (const [id, symbol] of semanticData.symbols) {
      const pathParts = symbol.filePath.split('/');
      const module = semanticData.structure.modules.find(m => pathParts.includes(m)) || pathParts[0];
      moduleSizes.set(module, (moduleSizes.get(module) || 0) + 1);
    }
    // If no modules, try packages
    if (moduleSizes.size === 0 && semanticData.structure.packages.length > 0) {
      for (const pkg of semanticData.structure.packages) {
        const pkgSymbols = Array.from(semanticData.symbols.values())
          .filter(s => s.filePath.includes(pkg));
        if (pkgSymbols.length > 0) {
          moduleSizes.set(pkg, pkgSymbols.length);
        }
      }
    }
    const sizes = Array.from(moduleSizes.values()).filter(s => s > 0).sort((a, b) => a - b);
    // Find intervals between sizes
    for (let i = 0; i < sizes.length - 1; i++) {
      for (let j = i + 1; j < sizes.length; j++) {
        const ratio = sizes[j] / sizes[i];
        // Check against known musical intervals
        for (const [name, [num, den]] of this.INTERVALS) {
          const intervalRatio = num / den;
          if (Math.abs(ratio - intervalRatio) < 0.1) { // More tolerance
            const cents = 1200 * Math.log2(ratio);
            const consonance = this.calculateConsonance(num, den);
            intervals.push({
              ratio: [num, den],
              name,
              cents,
              consonance
            });
            break;
          }
        }
      }
    }
    // If no intervals found but we have sizes, find approximate intervals
    if (intervals.length === 0 && sizes.length >= 2) {
      const ratio = sizes[1] / sizes[0];
      const cents = 1200 * Math.log2(ratio);
      // Find closest interval
      let closestInterval = 'unison';
      let closestDiff = Math.abs(ratio - 1);
      for (const [name, [num, den]] of this.INTERVALS) {
        const intervalRatio = num / den;
        const diff = Math.abs(ratio - intervalRatio);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestInterval = name;
        }
      }
      const [num, den] = this.INTERVALS.get(closestInterval)!;
      intervals.push({
        ratio: [num, den],
        name: closestInterval,
        cents,
        consonance: this.calculateConsonance(num, den) * (1 - closestDiff) // Reduce consonance by error
      });
    }
    return intervals;
  }
  private calculateConsonance(numerator: number, denominator: number): number {
    // Simple consonance model based on ratio complexity
    const complexity = Math.log2(numerator * denominator);
    return Math.exp(-complexity / 4);
  }
  private identifyNaturalFrequencies(semanticData: SemanticData): number[] {
    const frequencies: number[] = [];
    // Analyze cyclic patterns in dependency graph
    const visited = new Set<string>();
    const cycles: string[][] = [];
    for (const [start, _] of semanticData.symbols) {
      if (!visited.has(start)) {
        const cycle = this.findCycle(start, semanticData.relationships, visited);
        if (cycle.length > 0) {
          cycles.push(cycle);
        }
      }
    }
    // Convert cycle lengths to frequencies
    for (const cycle of cycles) {
      const frequency = 1 / cycle.length;
      frequencies.push(frequency);
    }
    return frequencies.sort((a, b) => a - b);
  }
  private findCycle(
    start: string,
    relationships: Map<string, string[]>,
    globalVisited: Set<string>
  ): string[] {
    const path: string[] = [];
    const localVisited = new Set<string>();
    const dfs = (node: string): boolean => {
      if (localVisited.has(node)) {
        // Found cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          return true;
        }
        return false;
      }
      localVisited.add(node);
      globalVisited.add(node);
      path.push(node);
      const neighbors = relationships.get(node) || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) {
          return true;
        }
      }
      path.pop();
      return false;
    };
    if (dfs(start)) {
      return path;
    }
    return [];
  }
  private calculateConfidence(evidenceCount: number, maxEvidence: number): number {
    return Math.min(evidenceCount / maxEvidence, 1);
  }
}