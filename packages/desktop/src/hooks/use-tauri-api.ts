import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Create window.api object that wraps Tauri commands
if (typeof window !== 'undefined') {
  window.api = {
    selectFolder: async () => {
      return await invoke<string | null>('select_folder');
    },
    
    readDirectory: async (path: string) => {
      return await invoke<FileItem[]>('read_directory', { path });
    },
    
    analyzeFiles: async (files: string[], batchMode: boolean) => {
      return await invoke<string>('analyze_files', { files, batchMode });
    },
    
    checkModelStatus: async () => {
      return await invoke<{ exists: boolean; path?: string; size?: number }>('check_model_status');
    },
    
    downloadModel: async (progressCallback: (progress: any) => void) => {
      // Listen for progress events
      const unlisten = await listen('download-progress', (event) => {
        progressCallback(event.payload);
      });
      
      try {
        const result = await invoke<{ success: boolean; error?: string }>('download_model');
        unlisten(); // Stop listening when done
        return result;
      } catch (error) {
        unlisten(); // Stop listening on error
        throw error;
      }
    }
  };
}

export {};