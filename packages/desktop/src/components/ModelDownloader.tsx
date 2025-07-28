import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ModelDownloaderProps {
  onComplete: () => void;
  onCancel?: () => void;
}

interface DownloadProgress {
  stage: 'model' | 'tokenizer' | 'complete' | 'error';
  progress: number;
  downloaded?: string;
  total?: string;
  speed?: string;
  error?: string;
}

export function ModelDownloader({ onComplete, onCancel }: ModelDownloaderProps) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress>({ stage: 'model', progress: 0 });
  const [checking, setChecking] = useState(true);
  const [modelExists, setModelExists] = useState(false);

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    try {
      const result = await window.api.checkModelStatus();
      setModelExists(result.exists);
      if (result.exists) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to check model status:', error);
    } finally {
      setChecking(false);
    }
  };

  const startDownload = async () => {
    setDownloading(true);
    
    try {
      // Start model download with progress tracking
      const result = await window.api.downloadModel((progressData: DownloadProgress) => {
        setProgress(progressData);
      });

      if (result.success) {
        setProgress({ stage: 'complete', progress: 100 });
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setProgress({ 
          stage: 'error', 
          progress: 0, 
          error: result.error || 'Download failed' 
        });
      }
    } catch (error) {
      setProgress({ 
        stage: 'error', 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Download failed' 
      });
    } finally {
      setDownloading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (modelExists) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Phi-4-mini Model Required
        </CardTitle>
        <CardDescription>
          The Phi-4-mini ONNX analysis model needs to be downloaded before you can analyze projects.
          This is a one-time download of approximately 5GB (optimized for CPU).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!downloading && progress.stage !== 'complete' && progress.stage !== 'error' && (
          <div className="flex gap-2">
            <Button onClick={startDownload} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download Model (~5GB)
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        )}

        {downloading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {progress.stage === 'model' ? 'Downloading model...' : 'Downloading tokenizer...'}
              </span>
              <span>{progress.progress}%</span>
            </div>
            
            <Progress value={progress.progress} className="h-2" />
            
            {progress.downloaded && progress.total && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress.downloaded} / {progress.total}</span>
                {progress.speed && <span>{progress.speed}</span>}
              </div>
            )}
          </div>
        )}

        {progress.stage === 'complete' && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>Model downloaded successfully!</span>
          </div>
        )}

        {progress.stage === 'error' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Download failed: {progress.error}</span>
            </div>
            <Button onClick={startDownload} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Retry Download
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}