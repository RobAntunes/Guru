// Global type definitions for window.api
interface Window {
  api: {
    selectFolder: () => Promise<string | null>;
    readDirectory: (path: string) => Promise<FileItem[]>;
    analyzeFiles: (files: string[], batchMode: boolean) => Promise<string>;
    checkModelStatus: () => Promise<{ exists: boolean; path?: string; size?: number }>;
    downloadModel: (progressCallback: (progress: any) => void) => Promise<{ success: boolean; error?: string }>;
  }
}

interface FileItem {
  name: string;
  path: string;
  is_file: boolean;
  size?: number;
}