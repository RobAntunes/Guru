import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Activity, 
  Target, 
  GitBranch, 
  Layers, 
  BookOpen, 
  RefreshCw, 
  ChevronRight, 
  Code, 
  Cpu, 
  AlertCircle, 
  CheckCircle, 
  Lightbulb, 
  FlaskConical, 
  Beaker, 
  TestTube2, 
  Sparkles,
  Clock,
  Award,
  BarChart,
  LineChart
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
    switch (type) {
      case 'algorithm_optimization': return <Zap className="w-4 h-4" />;
      case 'data_structure_exploration': return <Layers className="w-4 h-4" />;
      case 'pattern_validation': return <GitBranch className="w-4 h-4" />;
      default: return <Beaker className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Running</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-red-500 text-red-600">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const renderExperiments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Active Experiments</h3>
          <p className="text-sm text-muted-foreground">AI is testing hypotheses and discovering optimal strategies</p>
        </div>
        <Button size="sm" variant="outline">
          <FlaskConical className="w-4 h-4 mr-2" />
          New Experiment
        </Button>
      </div>

      <div className="grid gap-4">
        {experiments.map((experiment) => (
          <Card 
            key={experiment.id} 
            className={`cursor-pointer transition-all ${
              selectedExperiment?.id === experiment.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedExperiment(experiment)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getExperimentIcon(experiment.type)}
                  </div>
                  <div>
                    <CardTitle className="text-base capitalize">
                      {experiment.type.replace(/_/g, ' ')}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {experiment.hypothesis}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(experiment.status)}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Attempts</p>
                  <p className="text-2xl font-semibold">{experiment.attempts}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-semibold">{experiment.successRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Best Efficiency</p>
                  <p className="text-2xl font-semibold">
                    {experiment.bestStrategy ? 
                      `${(experiment.bestStrategy.efficiency * 100).toFixed(0)}%` : 
                      '-'}
                  </p>
                </div>
              </div>

              {experiment.status === 'running' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{experiment.attempts}/5 attempts</span>
                  </div>
                  <Progress value={(experiment.attempts / 5) * 100} />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="w-3 h-3 animate-pulse" />
                    Experimenting with different approaches...
                  </p>
                </div>
              )}

              {experiment.bestStrategy && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Best strategy: {experiment.bestStrategy.name}
                  </p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(experiment.timestamp)}
                </span>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  View Details
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedExperiment && selectedExperiment.bestStrategy && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Experiment Results</CardTitle>
            <CardDescription>{selectedExperiment.hypothesis}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Winning Code:</h4>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                <code className="text-sm">{selectedExperiment.bestStrategy.code}</code>
              </pre>
            </div>
            
            {selectedExperiment.insights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Learning Insights:</h4>
                <ul className="space-y-2">
                  {selectedExperiment.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Strategy Library</h3>
          <p className="text-sm text-muted-foreground">Proven approaches discovered through experimentation</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <BookOpen className="w-4 h-4" />
          {savedStrategies.length} strategies saved
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {savedStrategies.map((strategy) => (
          <Card key={strategy.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{strategy.approach}</CardTitle>
                  <CardDescription className="capitalize">
                    {strategy.experimentType.replace(/_/g, ' ')}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {(strategy.efficiency * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">efficiency</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Times Used</p>
                  <p className="text-lg font-semibold">{strategy.timesUsed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-lg font-semibold">{strategy.successRate}%</p>
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <code className="text-xs font-mono text-muted-foreground line-clamp-2">
                  {strategy.codeTemplate}
                </code>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
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
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Learning Insights</h3>
        <p className="text-sm text-muted-foreground">Patterns and principles discovered through experimentation</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Learning Velocity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">+12%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Week-over-week improvement in solution efficiency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Hypothesis Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">87%</div>
            <p className="text-sm text-muted-foreground mt-1">
              AI hypotheses correct on first attempt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4" />
              Strategy Reuse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">3.2x</div>
            <p className="text-sm text-muted-foreground mt-1">
              Average reuse per successful strategy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Patterns Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">156</div>
            <p className="text-sm text-muted-foreground mt-1">
              Unique patterns discovered
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Key Discoveries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-1">Recursive solutions elegant but may hit stack limits</h4>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BarChart className="w-3 h-3" />
                95% confidence
              </span>
              <span>•</span>
              <span>23 experiments</span>
              <span>•</span>
              <span>Applies to: tree traversal, divide & conquer</span>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-1">Hash-based structures optimal for frequency problems</h4>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BarChart className="w-3 h-3" />
                98% confidence
              </span>
              <span>•</span>
              <span>45 experiments</span>
              <span>•</span>
              <span>Applies to: counting, grouping, deduplication</span>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-1">Memoization transforms exponential to polynomial time</h4>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BarChart className="w-3 h-3" />
                99% confidence
              </span>
              <span>•</span>
              <span>67 experiments</span>
              <span>•</span>
              <span>Applies to: dynamic programming, recursion</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Adaptive Learning Laboratory</h2>
          <p className="text-muted-foreground">
            AI discovers optimal strategies through controlled experimentation
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <Activity className="w-3 h-3" />
            3 Active Experiments
          </Badge>
          <Button size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          {[
            { id: 'experiments', label: 'Experiments', icon: TestTube2 },
            { id: 'strategies', label: 'Strategy Library', icon: BookOpen },
            { id: 'insights', label: 'Learning Insights', icon: Lightbulb }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
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