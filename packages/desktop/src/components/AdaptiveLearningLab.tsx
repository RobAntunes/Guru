import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Activity, 
  GitBranch, 
  Layers, 
  BookOpen, 
  ChevronRight, 
  Code, 
  Lightbulb, 
  FlaskConical, 
  TestTube2, 
  Clock,
  BarChart,
  Zap
} from 'lucide-react';

interface Experiment {
  id: string;
  type: string;
  hypothesis: string;
  attempts: number;
  successRate: number;
  bestStrategy: {
    name: string;
    efficiency: number;
    code: string;
  } | null;
  timestamp: Date;
  status: 'running' | 'completed' | 'failed';
  insights: string[];
}

interface Strategy {
  id: string;
  experimentType: string;
  approach: string;
  efficiency: number;
  timesUsed: number;
  successRate: number;
  codeTemplate: string;
  discoveredAt: Date;
  lastUsed: Date;
}

export const AdaptiveLearningLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'experiments' | 'strategies' | 'insights'>('experiments');
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  
  // Example experiments showing AI learning process
  const [experiments] = useState<Experiment[]>([
    {
      id: 'exp-1',
      type: 'algorithm_optimization',
      hypothesis: 'Binary search will outperform linear search for sorted arrays',
      attempts: 5,
      successRate: 100,
      bestStrategy: {
        name: 'recursive_binary_search',
        efficiency: 0.95,
        code: `def binary_search(arr, target, low=0, high=None):
    if high is None:
        high = len(arr) - 1
    
    if low > high:
        return -1
    
    mid = (low + high) // 2
    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        return binary_search(arr, target, mid + 1, high)
    else:
        return binary_search(arr, target, low, mid - 1)`
      },
      timestamp: new Date(Date.now() - 7200000),
      status: 'completed',
      insights: [
        'Recursive approach more elegant but uses O(log n) stack space',
        'Iterative version slightly more efficient for very large arrays',
        'Performance gain over linear search: 99.7% for 10k elements'
      ]
    },
    {
      id: 'exp-2',
      type: 'data_structure_exploration',
      hypothesis: 'Hash tables provide O(1) lookup for frequency counting problems',
      attempts: 3,
      successRate: 100,
      bestStrategy: {
        name: 'defaultdict_approach',
        efficiency: 0.92,
        code: `from collections import defaultdict

def count_frequencies(items):
    freq = defaultdict(int)
    for item in items:
        freq[item] += 1
    return dict(freq)`
      },
      timestamp: new Date(Date.now() - 3600000),
      status: 'completed',
      insights: [
        'defaultdict eliminates key existence checks',
        'Counter class even more efficient for this specific use case',
        'Memory overhead acceptable for performance gain'
      ]
    },
    {
      id: 'exp-3',
      type: 'pattern_validation',
      hypothesis: 'Testing if sliding window technique optimizes substring problems',
      attempts: 2,
      successRate: 50,
      bestStrategy: null,
      timestamp: new Date(Date.now() - 600000),
      status: 'running',
      insights: []
    }
  ]);

  const [savedStrategies] = useState<Strategy[]>([
    {
      id: 'strat-1',
      experimentType: 'algorithm_optimization',
      approach: 'binary_search_iterative',
      efficiency: 0.96,
      timesUsed: 45,
      successRate: 98.5,
      codeTemplate: 'def binary_search_iterative(arr, target):\n    left, right = 0, len(arr) - 1\n    ...',
      discoveredAt: new Date(Date.now() - 86400000 * 7),
      lastUsed: new Date(Date.now() - 3600000)
    },
    {
      id: 'strat-2',
      experimentType: 'data_structure_exploration',
      approach: 'trie_for_prefix_search',
      efficiency: 0.94,
      timesUsed: 23,
      successRate: 95.2,
      codeTemplate: 'class TrieNode:\n    def __init__(self):\n        self.children = {}\n        ...',
      discoveredAt: new Date(Date.now() - 86400000 * 5),
      lastUsed: new Date(Date.now() - 7200000)
    }
  ]);

  const getExperimentIcon = (type: string) => {
    const iconClass = "h-4 w-4 text-muted-foreground";
    switch (type) {
      case 'algorithm_optimization': return <Zap className={iconClass} />;
      case 'data_structure_exploration': return <Layers className={iconClass} />;
      case 'pattern_validation': return <GitBranch className={iconClass} />;
      default: return <FlaskConical className={iconClass} />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const renderExperiments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-normal">Active Experiments</h2>
          <p className="text-sm text-muted-foreground mt-1">Testing hypotheses and discovering optimal strategies</p>
        </div>
        <Button size="sm" variant="outline" className="text-xs">
          New Experiment
        </Button>
      </div>

      <div className="space-y-4">
        {experiments.map((experiment) => (
          <Card 
            key={experiment.id} 
            className={`border-muted cursor-pointer transition-all ${
              selectedExperiment?.id === experiment.id ? 'ring-1 ring-primary' : ''
            }`}
            onClick={() => setSelectedExperiment(experiment)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {getExperimentIcon(experiment.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">
                      {experiment.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {experiment.hypothesis}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatTimeAgo(experiment.timestamp)}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Attempts</p>
                  <p className="text-xl font-light">{experiment.attempts}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-xl font-light">{experiment.successRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Efficiency</p>
                  <p className="text-xl font-light">
                    {experiment.bestStrategy ? 
                      `${(experiment.bestStrategy.efficiency * 100).toFixed(0)}%` : 
                      '-'}
                  </p>
                </div>
              </div>

              {experiment.status === 'running' && (
                <div className="space-y-2">
                  <Progress value={(experiment.attempts / 5) * 100} className="h-1" />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Experimenting with different approaches...
                  </p>
                </div>
              )}

              {experiment.bestStrategy && (
                <div className="mt-4 pt-4 border-t border-muted">
                  <p className="text-xs text-muted-foreground">
                    Best strategy: {experiment.bestStrategy.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedExperiment && selectedExperiment.bestStrategy && (
        <Card className="border-muted mt-6">
          <CardHeader>
            <CardTitle className="text-base font-normal">Experiment Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Winning Code</p>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                <code className="text-xs">{selectedExperiment.bestStrategy.code}</code>
              </pre>
            </div>
            
            {selectedExperiment.insights.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Learning Insights</p>
                <ul className="space-y-2">
                  {selectedExperiment.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStrategies = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-normal">Strategy Library</h2>
        <p className="text-sm text-muted-foreground mt-1">Proven approaches discovered through experimentation</p>
      </div>

      <div className="grid gap-4">
        {savedStrategies.map((strategy) => (
          <Card key={strategy.id} className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium">{strategy.approach}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {strategy.experimentType.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-light">
                    {(strategy.efficiency * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">efficiency</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Times Used</p>
                  <p className="text-lg font-light">{strategy.timesUsed}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-lg font-light">{strategy.successRate}%</p>
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded">
                <code className="text-xs font-mono text-muted-foreground line-clamp-2">
                  {strategy.codeTemplate}
                </code>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-muted text-xs text-muted-foreground">
                <span>Discovered {formatTimeAgo(strategy.discoveredAt)}</span>
                <span>Last used {formatTimeAgo(strategy.lastUsed)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-normal">Learning Insights</h2>
        <p className="text-sm text-muted-foreground mt-1">Patterns and principles discovered through experimentation</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-muted">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Learning Velocity</span>
            </div>
            <p className="text-3xl font-light">+12%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Week-over-week improvement
            </p>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Hypothesis Success</span>
            </div>
            <p className="text-3xl font-light">87%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Correct on first attempt
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base font-normal">Key Discoveries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded">
            <p className="text-sm mb-2">Recursive solutions elegant but may hit stack limits</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>95% confidence</span>
              <span>•</span>
              <span>23 experiments</span>
            </div>
          </div>

          <div className="p-4 bg-muted rounded">
            <p className="text-sm mb-2">Hash-based structures optimal for frequency problems</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>98% confidence</span>
              <span>•</span>
              <span>45 experiments</span>
            </div>
          </div>

          <div className="p-4 bg-muted rounded">
            <p className="text-sm mb-2">Memoization transforms exponential to polynomial time</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>99% confidence</span>
              <span>•</span>
              <span>67 experiments</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light tracking-tight">Adaptive Learning Laboratory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI discovers optimal strategies through controlled experimentation
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-muted">
        <div className="flex gap-8">
          {[
            { id: 'experiments', label: 'Experiments', icon: TestTube2 },
            { id: 'strategies', label: 'Strategy Library', icon: BookOpen },
            { id: 'insights', label: 'Learning Insights', icon: Lightbulb }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 text-sm transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-foreground border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'experiments' && renderExperiments()}
        {activeTab === 'strategies' && renderStrategies()}
        {activeTab === 'insights' && renderInsights()}
      </div>
    </div>
  );
};