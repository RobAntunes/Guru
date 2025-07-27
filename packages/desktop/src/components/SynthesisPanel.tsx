import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Atom,
  Sparkles,
  GitBranch,
  Zap,
  Code,
  FileCode,
  Play,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Layers,
  Brain,
  Activity,
  Download,
  Copy,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { 
  synthesisEngine, 
  SynthesisRequest, 
  SynthesisResult,
  SynthesisInsight,
  GeneratedWork,
  IntegrationPoint,
  ProjectDirection,
  MissingPiece
} from '../services/synthesis-engine';
// TODO: Import sandbox service when implemented
// import { sandboxService } from '../services/sandbox-service';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SynthesisPanelProps {
  knowledgeBaseId: string;
  selectedGroupIds?: string[];
  selectedDocumentIds?: string[];
  onIntegrationRequest?: (integration: IntegrationPoint) => void;
}

export const SynthesisPanel: React.FC<SynthesisPanelProps> = ({
  knowledgeBaseId,
  selectedGroupIds,
  selectedDocumentIds,
  onIntegrationRequest
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState<SynthesisResult | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<SynthesisInsight | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['insights']));
  const [synthesisProgress, setSynthesisProgress] = useState(0);

  const startSynthesis = async (type: 'patterns' | 'features' | 'architecture' | 'roadmap' | 'gaps' | 'opportunities' | 'full') => {
    setIsProcessing(true);
    setSynthesisProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSynthesisProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      const request: SynthesisRequest = {
        knowledgeBaseId,
        groupIds: selectedGroupIds,
        documentIds: selectedDocumentIds,
        synthesisType: type,
        targetLanguage: 'typescript',
        projectContext: {
          framework: 'React',
          architecture: 'Component-based'
        }
      };
      
      const result = await synthesisEngine.synthesize(request);
      clearInterval(progressInterval);
      setSynthesisProgress(100);
      setSynthesisResult(result);
      
      if (result.insights.length > 0) {
        setSelectedInsight(result.insights[0]);
      }
    } catch (error) {
      console.error('Synthesis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const downloadWork = (work: GeneratedWork) => {
    const blob = new Blob([work.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthesis-${work.id}.${work.format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Synthesis Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Knowledge Synthesis</h3>
          <Badge variant="outline" className="text-xs">
            <Atom className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
        
        {!isProcessing && !synthesisResult && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              onClick={() => startSynthesis('patterns')}
              className="text-xs"
            >
              <Brain className="h-3 w-3 mr-1" />
              Find Patterns
            </Button>
            <Button
              size="sm"
              onClick={() => startSynthesis('features')}
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Feature Ideas
            </Button>
            <Button
              size="sm"
              onClick={() => startSynthesis('roadmap')}
              className="text-xs"
            >
              <GitBranch className="h-3 w-3 mr-1" />
              Roadmap
            </Button>
            <Button
              size="sm"
              onClick={() => startSynthesis('gaps')}
              className="text-xs"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Find Gaps
            </Button>
            <Button
              size="sm"
              onClick={() => startSynthesis('architecture')}
              className="text-xs"
            >
              <Layers className="h-3 w-3 mr-1" />
              Architecture
            </Button>
            <Button
              size="sm"
              onClick={() => startSynthesis('opportunities')}
              className="text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Opportunities
            </Button>
            <Button
              size="sm"
              onClick={() => startSynthesis('full')}
              variant="default"
              className="col-span-2 text-xs"
            >
              <Activity className="h-3 w-3 mr-1" />
              Complete Analysis
            </Button>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Synthesizing knowledge...</span>
            <span>{synthesisProgress}%</span>
          </div>
          <Progress value={synthesisProgress} className="h-1" />
        </div>
      )}

      {/* Results */}
      {synthesisResult && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {/* Insights Section */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('insights')}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Generated Insights</span>
                <Badge variant="secondary" className="text-xs">
                  {synthesisResult.insights.length}
                </Badge>
              </div>
              {expandedSections.has('insights') ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
            
            {expandedSections.has('insights') && (
              <div className="p-3 pt-0 space-y-2">
                {synthesisResult.insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-2 rounded-md cursor-pointer transition-colors ${
                      selectedInsight?.id === insight.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'bg-muted/20 hover:bg-muted/30'
                    }`}
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {insight.summary}
                        </p>
                      </div>
                      {insight.actionable && (
                        <Badge variant="outline" className="text-xs ml-2">
                          Actionable
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {insight.patterns.length} patterns
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(insight.generatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generated Code Section */}
          {synthesisResult.generatedWork.length > 0 && (
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('code')}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Generated Code</span>
                  <Badge variant="secondary" className="text-xs">
                    {synthesisResult.generatedWork.length}
                  </Badge>
                </div>
                {expandedSections.has('code') ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              
              {expandedSections.has('code') && (
                <div className="p-3 pt-0 space-y-3">
                  {synthesisResult.generatedWork.map((code) => (
                    <div key={code.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">{code.purpose}</p>
                        <div className="flex items-center gap-1">
                          {code.sandboxResult?.error ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          ) : code.sandboxResult ? (
                            <Badge variant="success" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Tested
                            </Badge>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyCode(code.code)}
                            className="h-6 px-2"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadCode(code)}
                            className="h-6 px-2"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="rounded-md overflow-hidden text-xs">
                        <SyntaxHighlighter
                          language={code.language}
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            padding: '0.5rem',
                            fontSize: '0.75rem',
                            maxHeight: '200px'
                          }}
                        >
                          {code.code}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Integration Points */}
          {synthesisResult.suggestedIntegrations.length > 0 && (
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('integrations')}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Integration Points</span>
                  <Badge variant="secondary" className="text-xs">
                    {synthesisResult.suggestedIntegrations.length}
                  </Badge>
                </div>
                {expandedSections.has('integrations') ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              
              {expandedSections.has('integrations') && (
                <div className="p-3 pt-0 space-y-2">
                  {synthesisResult.suggestedIntegrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="p-2 bg-muted/20 rounded-md space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium">{integration.targetFile}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {integration.suggestedChanges}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            integration.impact === 'high' ? 'destructive' :
                            integration.impact === 'medium' ? 'default' : 
                            'secondary'
                          } 
                          className="text-xs"
                        >
                          {integration.impact}
                        </Badge>
                      </div>
                      {integration.automated && onIntegrationRequest && (
                        <Button
                          size="sm"
                          onClick={() => onIntegrationRequest(integration)}
                          className="h-6 text-xs w-full"
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Apply Integration
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Learning Outcomes */}
          {synthesisResult.learningOutcomes.length > 0 && (
            <div className="p-3 bg-muted/20 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs font-medium">Learning Outcomes</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Recorded {synthesisResult.learningOutcomes.length} patterns for future synthesis
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reset Button */}
      {synthesisResult && !isProcessing && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSynthesisResult(null);
            setSelectedInsight(null);
            setSynthesisProgress(0);
          }}
          className="text-xs"
        >
          New Synthesis
        </Button>
      )}
    </div>
  );
};