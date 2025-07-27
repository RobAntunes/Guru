import React, { useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp, Activity, Target, BarChart3, GitBranch, Layers, BookOpen, RefreshCw, Settings, ChevronRight, Code, FileCode, Cpu, Database, Network, AlertCircle, CheckCircle, Lightbulb, FileText, MessageSquare, Search, PenTool, Calculator, FlaskConical, Beaker, TestTube2, Sparkles } from 'lucide-react';

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

interface LearningPattern {
  pattern: string;
  confidence: number;
  evidence: number;
  applicableTo: string[];
}

export const AdaptiveLearningExperimental: React.FC = () => {
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
      hypothesis: 'Memoization improves recursive Fibonacci by eliminating redundant calculations',
      attempts: 4,
      successRate: 75,
      bestStrategy: {
        name: 'lru_cache_decorator',
        efficiency: 0.98,
        code: `from functools import lru_cache

@lru_cache(maxsize=None)
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`
      },
      timestamp: new Date(Date.now() - 1800000),
      status: 'completed',
      insights: [
        'LRU cache decorator provides cleanest implementation',
        'Performance improvement: O(2^n) to O(n)',
        'Memory usage grows linearly with n'
      ]
    },
    {
      id: 'exp-4',
      type: 'hypothesis_testing',
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
    },
    {
      id: 'strat-3',
      experimentType: 'pattern_validation',
      approach: 'dynamic_programming_tabulation',
      efficiency: 0.91,
      timesUsed: 67,
      successRate: 92.8,
      codeTemplate: 'def dp_tabulation(n):\n    dp = [0] * (n + 1)\n    ...',
      discoveredAt: new Date(Date.now() - 86400000 * 14),
      lastUsed: new Date(Date.now() - 14400000)
    }
  ]);

  const [learningPatterns] = useState<LearningPattern[]>([
    {
      pattern: 'Recursive solutions elegant but may hit stack limits',
      confidence: 0.95,
      evidence: 23,
      applicableTo: ['tree traversal', 'divide and conquer', 'backtracking']
    },
    {
      pattern: 'Hash-based structures optimal for frequency/counting problems',
      confidence: 0.98,
      evidence: 45,
      applicableTo: ['anagram detection', 'duplicate finding', 'grouping problems']
    },
    {
      pattern: 'Memoization transforms exponential to polynomial time',
      confidence: 0.99,
      evidence: 67,
      applicableTo: ['dynamic programming', 'recursive optimization', 'overlapping subproblems']
    },
    {
      pattern: 'Two-pointer technique efficient for array/string problems',
      confidence: 0.87,
      evidence: 34,
      applicableTo: ['palindrome checking', 'pair sum problems', 'partition problems']
    }
  ]);

  const getExperimentIcon = (type: string) => {
    switch (type) {
      case 'algorithm_optimization': return <Zap className="w-5 h-5" />;
      case 'data_structure_exploration': return <Database className="w-5 h-5" />;
      case 'pattern_validation': return <GitBranch className="w-5 h-5" />;
      case 'hypothesis_testing': return <FlaskConical className="w-5 h-5" />;
      case 'performance_profiling': return <Activity className="w-5 h-5" />;
      default: return <Beaker className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
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
      {/* Active Experiments */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TestTube2 className="w-5 h-5 text-purple-400" />
          AI Experimentation Lab
        </h3>
        
        <div className="space-y-4">
          {experiments.map((experiment) => (
            <div
              key={experiment.id}
              className={`p-4 bg-slate-700/30 rounded-lg border cursor-pointer transition-all ${
                selectedExperiment?.id === experiment.id 
                  ? 'border-purple-500' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              onClick={() => setSelectedExperiment(experiment)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getExperimentIcon(experiment.type)}
                  <span className="text-sm font-medium text-white capitalize">
                    {experiment.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className={`text-xs ${getStatusColor(experiment.status)}`}>
                  {experiment.status}
                </span>
              </div>
              
              <h4 className="font-medium text-white mb-2">
                Hypothesis: {experiment.hypothesis}
              </h4>
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-slate-400">Attempts</p>
                  <p className="text-sm text-white">{experiment.attempts}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Success Rate</p>
                  <p className="text-sm text-white">{experiment.successRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Best Efficiency</p>
                  <p className="text-sm text-white">
                    {experiment.bestStrategy ? 
                      `${(experiment.bestStrategy.efficiency * 100).toFixed(0)}%` : 
                      'Testing...'}
                  </p>
                </div>
              </div>
              
              {experiment.status === 'running' && (
                <div className="flex items-center gap-2 text-xs text-yellow-400">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  Experimenting with different approaches...
                </div>
              )}
              
              {experiment.bestStrategy && (
                <div className="mt-3 p-2 bg-green-400/10 rounded text-xs text-green-400">
                  ✓ Best strategy: {experiment.bestStrategy.name}
                </div>
              )}
              
              <div className="mt-2 text-xs text-slate-500">
                {formatTimeAgo(experiment.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experiment Details */}
      {selectedExperiment && selectedExperiment.bestStrategy && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Experiment Results: {selectedExperiment.hypothesis}
          </h3>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Winning Code:</h4>
            <pre className="p-4 bg-slate-900 rounded-lg overflow-x-auto">
              <code className="text-sm text-slate-300">
                {selectedExperiment.bestStrategy.code}
              </code>
            </pre>
          </div>
          
          {selectedExperiment.insights.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Learning Insights:</h4>
              <ul className="space-y-1">
                {selectedExperiment.insights.map((insight, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStrategies = () => (
    <div className="space-y-6">
      {/* Strategy Library */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          Discovered Strategy Library
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {savedStrategies.map((strategy) => (
            <div
              key={strategy.id}
              className="p-4 bg-slate-700/30 rounded-lg border border-slate-600"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-white">{strategy.approach}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {strategy.experimentType.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">
                    {(strategy.efficiency * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-slate-400">efficiency</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div>
                  <p className="text-slate-400">Times Used</p>
                  <p className="text-white">{strategy.timesUsed}</p>
                </div>
                <div>
                  <p className="text-slate-400">Success Rate</p>
                  <p className="text-white">{strategy.successRate}%</p>
                </div>
              </div>
              
              <div className="p-2 bg-slate-800/50 rounded text-xs font-mono text-slate-400 truncate">
                {strategy.codeTemplate}
              </div>
              
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Discovered {formatTimeAgo(strategy.discoveredAt)}</span>
                <span>Last used {formatTimeAgo(strategy.lastUsed)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Performance */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Strategy Evolution</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Algorithm Optimization</span>
              <span className="text-sm text-green-400">+18% efficiency gain</span>
            </div>
            <div className="text-xs text-slate-400">
              Started with naive O(n²) approach → Discovered O(n log n) solution → 
              Optimized to O(n) with clever data structures
            </div>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Memory Usage</span>
              <span className="text-sm text-blue-400">-45% reduction</span>
            </div>
            <div className="text-xs text-slate-400">
              Learned to prefer in-place algorithms → Discovered space-time tradeoffs → 
              Now selects based on constraints
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      {/* Learning Patterns */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          Discovered Patterns & Principles
        </h3>
        
        <div className="space-y-4">
          {learningPatterns.map((pattern, index) => (
            <div key={index} className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm text-white font-medium">{pattern.pattern}</p>
                <div className="text-right">
                  <p className="text-sm text-purple-400">{(pattern.confidence * 100).toFixed(0)}%</p>
                  <p className="text-xs text-slate-400">confidence</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>Evidence: {pattern.evidence} experiments</span>
                <span>•</span>
                <span>Applies to: {pattern.applicableTo.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meta-Learning Insights */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Meta-Learning Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <Sparkles className="w-8 h-8 text-yellow-400 mb-2" />
            <h4 className="font-medium text-white mb-1">Hypothesis Success Rate</h4>
            <p className="text-2xl font-bold text-green-400">87%</p>
            <p className="text-xs text-slate-400 mt-1">
              AI's hypotheses about optimal solutions are correct 87% of the time
            </p>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <Target className="w-8 h-8 text-blue-400 mb-2" />
            <h4 className="font-medium text-white mb-1">Strategy Reuse</h4>
            <p className="text-2xl font-bold text-blue-400">3.2x</p>
            <p className="text-xs text-slate-400 mt-1">
              Each successful strategy is reused an average of 3.2 times
            </p>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <TrendingUp className="w-8 h-8 text-purple-400 mb-2" />
            <h4 className="font-medium text-white mb-1">Learning Velocity</h4>
            <p className="text-2xl font-bold text-purple-400">+12%</p>
            <p className="text-xs text-slate-400 mt-1">
              Week-over-week improvement in solution efficiency
            </p>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <Brain className="w-8 h-8 text-green-400 mb-2" />
            <h4 className="font-medium text-white mb-1">Pattern Recognition</h4>
            <p className="text-2xl font-bold text-green-400">156</p>
            <p className="text-xs text-slate-400 mt-1">
              Unique patterns discovered through experimentation
            </p>
          </div>
        </div>
      </div>

      {/* Improvement Timeline */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Learning Timeline</h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <div className="flex-1">
              <p className="text-sm text-white">Discovered binary search optimization</p>
              <p className="text-xs text-slate-400">2 hours ago • 95% efficiency improvement</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <div className="flex-1">
              <p className="text-sm text-white">Learned hash table benefits for counting</p>
              <p className="text-xs text-slate-400">1 day ago • O(n) vs O(n²) improvement</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-purple-400 rounded-full" />
            <div className="flex-1">
              <p className="text-sm text-white">Mastered dynamic programming patterns</p>
              <p className="text-xs text-slate-400">3 days ago • Solved 15 new problem types</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-400" />
            Adaptive Learning Laboratory
          </h2>
          <p className="text-slate-400 mt-1">
            AI discovers optimal strategies through experimentation
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-green-400/10 rounded-full text-sm text-green-400 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Actively Learning
          </div>
          
          <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {[
          { id: 'experiments', label: 'Experiments', icon: <TestTube2 className="w-4 h-4" /> },
          { id: 'strategies', label: 'Strategy Library', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'insights', label: 'Learning Insights', icon: <Lightbulb className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'experiments' && renderExperiments()}
        {activeTab === 'strategies' && renderStrategies()}
        {activeTab === 'insights' && renderInsights()}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-purple-400">127</p>
          <p className="text-sm text-slate-400">Experiments Run</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-green-400">43</p>
          <p className="text-sm text-slate-400">Strategies Saved</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-blue-400">89%</p>
          <p className="text-sm text-slate-400">Success Rate</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-yellow-400">+34%</p>
          <p className="text-sm text-slate-400">Avg Improvement</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-400/10 border border-purple-400/20 rounded-xl p-4">
        <p className="text-sm text-purple-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          The AI experiments with different code solutions in a secure sandbox, learns which 
          strategies work best, and builds a library of proven approaches. Each experiment 
          contributes to better problem-solving capabilities over time.
        </p>
      </div>
    </div>
  );
};