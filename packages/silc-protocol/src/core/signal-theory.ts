/**
 * SILC Signal Theory Implementation
 * Mathematical foundation for AI-to-AI communication using signal encoding
 */

/**
 * Signal components as defined in SILC specification
 */
export interface SILCSignal {
  amplitude: number;    // 0.0-1.0 (confidence level)
  frequency: number;    // 0.0-1.0 (urgency/priority)
  phase: number;        // 0.0-1.0 (relationship/context)
  harmonics: number;    // 0.0-1.0 (complexity/nuance)
}

/**
 * Base64 encoded signal state (6 bits per character)
 */
export interface SignalState {
  encoded: string;      // Base64 encoded signal
  raw: SILCSignal;     // Raw signal components
  metadata: {
    timestamp: number;
    channel: string;
    sequence: number;
  };
}

/**
 * Signal encoder/decoder for SILC protocol
 */
export class SignalCodec {
  private static readonly SIGNAL_BITS = 6; // 6 bits per component
  private static readonly MAX_VALUE = (1 << SignalCodec.SIGNAL_BITS) - 1; // 63
  
  /**
   * Encode signal components into Base64 string
   */
  static encode(signal: SILCSignal): string {
    // Convert 0.0-1.0 range to 6-bit integers (0-63)
    const amplitude = Math.round(signal.amplitude * SignalCodec.MAX_VALUE);
    const frequency = Math.round(signal.frequency * SignalCodec.MAX_VALUE);
    const phase = Math.round(signal.phase * SignalCodec.MAX_VALUE);
    const harmonics = Math.round(signal.harmonics * SignalCodec.MAX_VALUE);
    
    // Pack into 24-bit value (4 components × 6 bits each)
    const packed = (amplitude << 18) | (frequency << 12) | (phase << 6) | harmonics;
    
    // Convert to Base64 (4 characters for 24 bits)
    const bytes = new Uint8Array(3);
    bytes[0] = (packed >> 16) & 0xFF;
    bytes[1] = (packed >> 8) & 0xFF;
    bytes[2] = packed & 0xFF;
    
    return btoa(String.fromCharCode(...bytes));
  }
  
  /**
   * Decode Base64 string back to signal components
   */
  static decode(encoded: string): SILCSignal {
    const decoded = atob(encoded);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    
    // Unpack 24-bit value
    const packed = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
    
    // Extract 6-bit components
    const amplitude = (packed >> 18) & 0x3F;
    const frequency = (packed >> 12) & 0x3F;
    const phase = (packed >> 6) & 0x3F;
    const harmonics = packed & 0x3F;
    
    // Convert back to 0.0-1.0 range
    return {
      amplitude: amplitude / SignalCodec.MAX_VALUE,
      frequency: frequency / SignalCodec.MAX_VALUE,
      phase: phase / SignalCodec.MAX_VALUE,
      harmonics: harmonics / SignalCodec.MAX_VALUE
    };
  }
  
  /**
   * Create signal from semantic meaning
   */
  static createSignal(
    confidence: number = 0.8,
    urgency: number = 0.5,
    contextRelevance: number = 0.7,
    complexity: number = 0.6
  ): SILCSignal {
    return {
      amplitude: Math.max(0, Math.min(1, confidence)),
      frequency: Math.max(0, Math.min(1, urgency)),
      phase: Math.max(0, Math.min(1, contextRelevance)),
      harmonics: Math.max(0, Math.min(1, complexity))
    };
  }
  
  /**
   * Analyze signal characteristics
   */
  static analyzeSignal(signal: SILCSignal): {
    interpretation: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    complexity_level: 'simple' | 'moderate' | 'complex' | 'expert';
    context_strength: number;
  } {
    const priority = signal.frequency > 0.8 ? 'critical' :
                    signal.frequency > 0.6 ? 'high' :
                    signal.frequency > 0.3 ? 'medium' : 'low';
    
    const complexity_level = signal.harmonics > 0.8 ? 'expert' :
                           signal.harmonics > 0.6 ? 'complex' :
                           signal.harmonics > 0.3 ? 'moderate' : 'simple';
    
    const interpretation = `Signal: ${(signal.amplitude * 100).toFixed(0)}% confidence, ` +
                          `${priority} priority, ${complexity_level} complexity`;
    
    return {
      interpretation,
      priority,
      complexity_level,
      context_strength: signal.phase
    };
  }
}

/**
 * Signal channel for SILC communication
 */
export class SILCChannel {
  private static channels = new Map<string, SILCChannel>();
  private signals: SignalState[] = [];
  private subscribers: ((signal: SignalState) => void)[] = [];
  
  constructor(
    public readonly id: string,
    public readonly participants: string[],
    private maxHistory: number = 1000
  ) {
    SILCChannel.channels.set(id, this);
  }
  
  /**
   * Send signal on this channel
   */
  send(signal: SILCSignal, metadata: { sender: string; message?: string }): SignalState {
    const signalState: SignalState = {
      encoded: SignalCodec.encode(signal),
      raw: signal,
      metadata: {
        timestamp: Date.now(),
        channel: this.id,
        sequence: this.signals.length,
        ...metadata
      }
    };
    
    this.signals.push(signalState);
    
    // Maintain history limit
    if (this.signals.length > this.maxHistory) {
      this.signals = this.signals.slice(-this.maxHistory);
    }
    
    // Notify subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(signalState);
      } catch (error) {
        console.error('SILC channel subscriber error:', error);
      }
    });
    
    return signalState;
  }
  
  /**
   * Subscribe to signals on this channel
   */
  subscribe(callback: (signal: SignalState) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
  
  /**
   * Get recent signals
   */
  getRecentSignals(count: number = 10): SignalState[] {
    return this.signals.slice(-count);
  }
  
  /**
   * Get signal history for analysis
   */
  getSignalHistory(since?: number): SignalState[] {
    if (!since) return [...this.signals];
    
    return this.signals.filter(s => s.metadata.timestamp >= since);
  }
  
  /**
   * Create or get existing channel
   */
  static getOrCreate(id: string, participants: string[]): SILCChannel {
    const existing = SILCChannel.channels.get(id);
    if (existing) return existing;
    
    return new SILCChannel(id, participants);
  }
  
  /**
   * List all active channels
   */
  static listChannels(): { id: string; participants: string[]; signalCount: number }[] {
    return Array.from(SILCChannel.channels.values()).map(channel => ({
      id: channel.id,
      participants: channel.participants,
      signalCount: channel.signals.length
    }));
  }
  
  /**
   * Close channel and clean up
   */
  close(): void {
    SILCChannel.channels.delete(this.id);
    this.subscribers.length = 0;
    this.signals.length = 0;
  }
}