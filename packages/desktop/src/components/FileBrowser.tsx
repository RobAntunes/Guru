import { useState, useEffect } from 'react';
import { guruService } from '../services/guru-integration';

interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  children?: FileNode[];
  checked?: boolean;
  expanded?: boolean;
}

interface FileBrowserProps {
  onAnalyze: (selectedFiles: string[], batchMode: boolean) => void;
  isLoading: boolean;
}

export function FileBrowser({ onAnalyze, isLoading }: FileBrowserProps) {
  const [_rootPath, setRootPath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const [batchMode, setBatchMode] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0); // Force updates

  // Load directory structure
  const loadDirectory = async (path: string) => {
    try {
      setLoadingDirectory(true);
      const result = await guruService.scanDirectory(path);
      setFileTree(result);
      setRootPath(path);
      // Trigger update after loading
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      alert(`Failed to load directory: ${error}`);
    } finally {
      setLoadingDirectory(false);
    }
  };

  // Toggle file/folder selection
  const toggleNode = (node: FileNode, checked: boolean) => {
    const updateNodeRecursively = (n: FileNode, isChecked: boolean) => {
      n.checked = isChecked;
      
      // If it's a directory, toggle all children
      if (n.type === 'directory' && n.children) {
        n.children.forEach(child => updateNodeRecursively(child, isChecked));
      }
    };
    
    updateNodeRecursively(node, checked);
    
    // Force re-render with a deep clone to ensure React detects the change
    setFileTree(JSON.parse(JSON.stringify(fileTree)));
    // Trigger update
    setUpdateTrigger(prev => prev + 1);
  };

  // Count selected files
  const updateSelectedCount = () => {
    let count = 0;
    const countSelected = (node: FileNode) => {
      if (node.type === 'file' && node.checked) count++;
      if (node.children) {
        node.children.forEach(countSelected);
      }
    };
    if (fileTree) countSelected(fileTree);
    setSelectedCount(count);
  };

  // Estimate tokens for selected files
  const updateTokenEstimate = () => {
    let totalSize = 0;
    const calculateSize = (node: FileNode) => {
      if (node.type === 'file' && node.checked) {
        totalSize += node.size;
      }
      if (node.children) {
        node.children.forEach(calculateSize);
      }
    };
    if (fileTree) calculateSize(fileTree);
    
    // Rough estimate: 1 token ≈ 3.5 characters
    const estimatedTokens = Math.ceil(totalSize / 3.5);
    setEstimatedTokens(estimatedTokens);
  };

  // Update count and token estimate whenever fileTree changes or updateTrigger changes
  useEffect(() => {
    if (fileTree) {
      updateSelectedCount();
      updateTokenEstimate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileTree, updateTrigger]);

  // Toggle directory expansion
  const toggleExpanded = (node: FileNode) => {
    node.expanded = !node.expanded;
    setFileTree({ ...fileTree! });
  };

  // Get all selected paths (files and directories)
  const getSelectedPaths = (): string[] => {
    const selected: string[] = [];
    
    // Collect all checked items (both files and directories)
    const collectSelected = (node: FileNode) => {
      if (node.checked) {
        selected.push(node.path);
      }
      if (node.children) {
        node.children.forEach(collectSelected);
      }
    };
    
    if (fileTree) collectSelected(fileTree);
    
    // Remove duplicates
    const uniquePaths = Array.from(new Set(selected));
    return uniquePaths;
  };

  // Render file tree node
  const renderNode = (node: FileNode, depth: number = 0) => {
    const isDirectory = node.type === 'directory';
    const _hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path}>
        <div 
          className={`flex items-center py-1 px-2 hover:bg-slate-700/30 rounded cursor-pointer ${
            depth > 0 ? 'ml-' + (depth * 4) : ''
          }`}
          style={{ paddingLeft: `${depth * 20}px` }}
        >
          <input
            type="checkbox"
            checked={node.checked || false}
            onChange={(e) => toggleNode(node, e.target.checked)}
            className="mr-2"
            onClick={(e) => e.stopPropagation()}
          />
          
          {isDirectory && (
            <button
              onClick={() => toggleExpanded(node)}
              className="mr-1 text-slate-400 hover:text-white"
            >
              {node.expanded ? '▼' : '▶'}
            </button>
          )}
          
          <span className={`flex-1 ${isDirectory ? 'font-medium' : ''}`}>
            {isDirectory ? '📁' : '📄'} {node.name}
          </span>
          
          {!isDirectory && (
            <span className="text-xs text-slate-500">
              {(node.size / 1024).toFixed(1)}KB
            </span>
          )}
        </div>
        
        {isDirectory && node.expanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">File Browser</h3>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-400">
            {selectedCount} files selected
          </span>
          <button
            onClick={async () => {
              const folder = await guruService.openFolderDialog();
              if (folder) {
                await loadDirectory(folder);
              }
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
          >
            📂 Select Folder
          </button>
        </div>
      </div>

      {/* Context Meter and Batching Toggle */}
      {selectedCount > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Estimated Context Usage</span>
                <span className="text-xs text-slate-400">
                  {(estimatedTokens / 1000).toFixed(1)}k / 100k tokens
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    estimatedTokens > 100000 ? 'bg-red-500' : 
                    estimatedTokens > 80000 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (estimatedTokens / 100000) * 100)}%` }}
                />
              </div>
              {estimatedTokens > 100000 && (
                <p className="text-xs text-red-400 mt-1">
                  ⚠️ Selection exceeds context limit. Enable batching or select fewer files.
                </p>
              )}
            </div>
            <div className="ml-4 flex items-center space-x-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={batchMode}
                  onChange={(e) => setBatchMode(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-white">Batch Mode</span>
              </label>
              {batchMode && (
                <span className="text-xs text-slate-400">
                  (Analyzes in chunks)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {loadingDirectory ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 text-center">
          <div className="text-slate-400">
            <div className="text-4xl mb-2 animate-spin">⏳</div>
            <p className="text-sm">Loading directory structure...</p>
          </div>
        </div>
      ) : fileTree ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
          <div className="max-h-96 overflow-y-auto">
            {renderNode(fileTree)}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const selectAll = (node: FileNode, checked: boolean) => {
                    toggleNode(node, checked);
                  };
                  if (fileTree) selectAll(fileTree, true);
                }}
                className="px-3 py-1 bg-slate-600 hover:bg-slate-700 rounded text-sm transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => {
                  const selectAll = (node: FileNode, checked: boolean) => {
                    toggleNode(node, checked);
                  };
                  if (fileTree) selectAll(fileTree, false);
                }}
                className="px-3 py-1 bg-slate-600 hover:bg-slate-700 rounded text-sm transition-colors"
              >
                Deselect All
              </button>
            </div>
            
            <button
              onClick={() => {
                const selected = getSelectedPaths();
                if (selected.length > 0) {
                  onAnalyze(selected, batchMode);
                }
              }}
              disabled={selectedCount === 0 || isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
            >
              {isLoading ? '⏳ Analyzing...' : `🔍 Analyze Selection${batchMode ? ' (Batch)' : ''}`}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 text-center">
          <div className="text-slate-400">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-sm">No folder selected</p>
            <p className="text-xs mt-1">Click "Select Folder" to browse files</p>
          </div>
        </div>
      )}
    </div>
  );
}