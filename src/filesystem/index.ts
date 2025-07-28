/**
 * Direct Filesystem and Document APIs for Guru
 * Can be used without MCP from any part of the ecosystem
 */

export { FilesystemAnalyzer } from './filesystem-analyzer';
export type { 
  FileInfo, 
  FilesystemAnalysisOptions, 
  FilesystemAnalysisResult 
} from './filesystem-analyzer';

export { DocumentProcessor } from './document-processor';
export type { 
  DocumentInput, 
  ProcessedDocument, 
  DocumentBatch 
} from './document-processor';