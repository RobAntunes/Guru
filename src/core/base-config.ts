export abstract class BaseConfig {
  abstract readonly domain: string;
  abstract readonly version: string;
  
  // Optional metadata that all configs can include
  readonly metadata?: {
    author?: string;
    created?: Date;
    updated?: Date;
    description?: string;
  };
  
  // Common validation method
  validate(): boolean {
    return this.domain !== '' && this.version !== '';
  }
  
  // Convert config to JSON
  toJSON(): object {
    return {
      domain: this.domain,
      version: this.version,
      metadata: this.metadata,
      ...this,
    };
  }
}