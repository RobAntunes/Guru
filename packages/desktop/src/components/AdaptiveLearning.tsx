import React, { useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp, Activity, Target, BarChart3, GitBranch, Layers, BookOpen, RefreshCw, Settings, ChevronRight, Code, FileCode, Cpu, Database, Network, AlertCircle, CheckCircle, Lightbulb, FileText, MessageSquare, Search, PenTool, Calculator } from 'lucide-react';

interface KnowledgeTask {
  id: string;
  type: 'analysis' | 'synthesis' | 'research' | 'problem-solving' | 'creative' | 'technical';
  domain: string;
  description: string;
  status: 'active' | 'completed' | 'optimizing';
  performance: {
    quality: number;
    speed: number;
    accuracy: number;
  };
  strategyUsed: string;
  outcome?: string;
  timestamp: Date;
}

interface OptimizationResult {
  taskType: string;
  improvements: {
    metric: string;
    before: number;
    after: number;
    improvement: string;
  }[];
  strategyChanges: string[];
  learningOutcome: string;
}

interface AdaptiveLearningProps {
  onTaskOptimize?: (task: KnowledgeTask) => void;
}

export const AdaptiveLearning: React.FC<AdaptiveLearningProps> = ({ onTaskOptimize }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'insights'>('current');
  const [selectedTask, setSelectedTask] = useState<KnowledgeTask | null>(null);
  
  // Example knowledge tasks being optimized
  const [activeTasks] = useState<KnowledgeTask[]>([
    {
      id: 'task-1',
      type: 'analysis',
      domain: 'Technical Documentation Review',
      description: 'Analyzing API documentation for completeness and clarity',
      status: 'active',
      performance: {
        quality: 0.85,
        speed: 0.72,
        accuracy: 0.91
      },
      strategyUsed: 'pattern-recognition',
      timestamp: new Date()
    },
    {
      id: 'task-2',
      type: 'synthesis',
      domain: 'Research Paper Summarization',
      description: 'Creating comprehensive summaries of academic papers',
      status: 'optimizing',
      performance: {
        quality: 0.78,
        speed: 0.65,
        accuracy: 0.88
      },
      strategyUsed: 'quantum-learning',
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: 'task-3',
      type: 'problem-solving',
      domain: 'Bug Investigation',
      description: 'Finding root causes of complex software issues',
      status: 'completed',
      performance: {
        quality: 0.92,
        speed: 0.81,
        accuracy: 0.95
      },
      strategyUsed: 'self-reflection',
      outcome: 'Identified memory leak in event handler cleanup',
      timestamp: new Date(Date.now() - 7200000)
    },
    {
      id: 'task-4',
      type: 'creative',
      domain: 'Architecture Design',
      description: 'Designing scalable microservice architectures',
      status: 'active',
      performance: {
        quality: 0.88,
        speed: 0.69,
        accuracy: 0.84
      },
      strategyUsed: 'emergent-behavior',
      timestamp: new Date(Date.now() - 1800000)
    }
  ]);

  const [optimizationHistory] = useState<OptimizationResult[]>([
    {
      taskType: 'Code Review',
      improvements: [
        { metric: 'Issue Detection Rate', before: 0.72, after: 0.89, improvement: '+23.6%' },
        { metric: 'Review Speed', before: 0.65, after: 0.78, improvement: '+20.0%' },
        { metric: 'False Positive Rate', before: 0.15, after: 0.08, improvement: '-46.7%' }
      ],
      strategyChanges: ['Switched from pattern-recognition to quantum-learning for complex logic'],
      learningOutcome: 'Discovered that quantum entanglement patterns work better for identifying subtle code smells'
    },
    {
      taskType: 'Documentation Writing',
      improvements: [
        { metric: 'Clarity Score', before: 0.68, after: 0.85, improvement: '+25.0%' },
        { metric: 'Completeness', before: 0.75, after: 0.92, improvement: '+22.7%' },
        { metric: 'Time to Complete', before: 0.55, after: 0.71, improvement: '+29.1%' }
      ],
      strategyChanges: ['Added emergent-behavior strategy for creative examples'],
      learningOutcome: 'Combining analytical and creative strategies produces more engaging documentation'
    }
  ]);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <Search className="w-5 h-5" />;
      case 'synthesis': return <Layers className="w-5 h-5" />;
      case 'research': return <BookOpen className="w-5 h-5" />;
      case 'problem-solving': return <Lightbulb className="w-5 h-5" />;
      case 'creative': return <PenTool className="w-5 h-5" />;
      case 'technical': return <Code className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'optimizing': return 'text-yellow-400';
      case 'completed': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const renderCurrentTasks = () => (
    <div className="space-y-6">
      {/* Active Optimizations */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          Currently Optimizing
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 bg-slate-700/30 rounded-lg border cursor-pointer transition-all ${
                selectedTask?.id === task.id 
                  ? 'border-purple-500' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getTaskIcon(task.type)}
                  <span className="text-sm font-medium text-white capitalize">{task.type}</span>
                </div>
                <span className={`text-xs ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
              
              <h4 className="font-medium text-white mb-1">{task.domain}</h4>
              <p className="text-sm text-slate-400 mb-3">{task.description}</p>
              
              {/* Performance Metrics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Quality</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-400"
                        style={{ width: `${task.performance.quality * 100}%` }}
                      />
                    </div>
                    <span className="text-slate-300">{(task.performance.quality * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Speed</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400"
                        style={{ width: `${task.performance.speed * 100}%` }}
                      />
                    </div>
                    <span className="text-slate-300">{(task.performance.speed * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Accuracy</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-400"
                        style={{ width: `${task.performance.accuracy * 100}%` }}
                      />
                    </div>
                    <span className="text-slate-300">{(task.performance.accuracy * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Strategy: <span className="text-purple-400">{task.strategyUsed}</span>
                </span>
                <span className="text-xs text-slate-500">{formatTimeAgo(task.timestamp)}</span>
              </div>
              
              {task.outcome && (
                <div className="mt-2 p-2 bg-green-400/10 rounded text-xs text-green-400">
                  ✓ {task.outcome}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Optimization Status */}
      {selectedTask && selectedTask.status === 'optimizing' && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Optimization in Progress</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-sm text-white">Testing alternative strategies...</p>
                <p className="text-xs text-slate-400 mt-1">
                  Comparing quantum-learning vs self-reflection for {selectedTask.domain.toLowerCase()}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                <span className="text-sm text-slate-300">Current approach performance</span>
                <span className="text-sm text-yellow-400">78%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                <span className="text-sm text-slate-300">Alternative approach performance</span>
                <span className="text-sm text-green-400">85% ↑</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                <span className="text-sm text-slate-300">Confidence in improvement</span>
                <span className="text-sm text-purple-400">92%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      {/* Optimization Results */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Optimization History
        </h3>
        
        <div className="space-y-6">
          {optimizationHistory.map((result, index) => (
            <div key={index} className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="font-medium text-white mb-3">{result.taskType}</h4>
              
              {/* Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {result.improvements.map((improvement, i) => (
                  <div key={i} className="bg-slate-800/50 p-3 rounded">
                    <p className="text-xs text-slate-400 mb-1">{improvement.metric}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-slate-500">{(improvement.before * 100).toFixed(0)}%</span>
                      <span className="text-xs text-slate-600">→</span>
                      <span className="text-sm text-white">{(improvement.after * 100).toFixed(0)}%</span>
                      <span className="text-xs text-green-400 ml-auto">{improvement.improvement}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Strategy Changes */}
              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-1">Strategy Optimization</p>
                {result.strategyChanges.map((change, i) => (
                  <p key={i} className="text-sm text-slate-300 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    {change}
                  </p>
                ))}
              </div>
              
              {/* Learning Outcome */}
              <div className="p-3 bg-purple-400/10 rounded">
                <p className="text-sm text-purple-300 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {result.learningOutcome}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Trends</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <p className="text-3xl font-bold text-green-400">+24%</p>
            <p className="text-sm text-slate-400 mt-1">Avg Quality Improvement</p>
            <p className="text-xs text-slate-500 mt-2">Across all task types</p>
          </div>
          
          <div className="text-center p-4">
            <p className="text-3xl font-bold text-blue-400">+31%</p>
            <p className="text-sm text-slate-400 mt-1">Speed Increase</p>
            <p className="text-xs text-slate-500 mt-2">Task completion time</p>
          </div>
          
          <div className="text-center p-4">
            <p className="text-3xl font-bold text-purple-400">+18%</p>
            <p className="text-sm text-slate-400 mt-1">Accuracy Gain</p>
            <p className="text-xs text-slate-500 mt-2">Error reduction</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      {/* Key Learnings */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          Key Learning Insights
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h4 className="font-medium text-white mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              Research Tasks
            </h4>
            <p className="text-sm text-slate-300 mb-2">
              Pattern recognition strategy excels at finding connections between disparate sources
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-green-400">✓ 15% faster synthesis</span>
              <span className="text-green-400">✓ 22% better insights</span>
            </div>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h4 className="font-medium text-white mb-2 flex items-center gap-2">
              <Code className="w-4 h-4 text-green-400" />
              Technical Analysis
            </h4>
            <p className="text-sm text-slate-300 mb-2">
              Quantum learning shows superior performance for complex system understanding
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-green-400">✓ 28% accuracy boost</span>
              <span className="text-green-400">✓ Handles ambiguity better</span>
            </div>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h4 className="font-medium text-white mb-2 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-yellow-400" />
              Creative Work
            </h4>
            <p className="text-sm text-slate-300 mb-2">
              Emergent behavior strategy generates more innovative solutions
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-green-400">✓ 3x more unique ideas</span>
              <span className="text-green-400">✓ Higher user satisfaction</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Effectiveness Matrix */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Strategy Effectiveness by Task Type</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2">Task Type</th>
                <th className="text-center py-2">Quantum</th>
                <th className="text-center py-2">Emergent</th>
                <th className="text-center py-2">Pattern</th>
                <th className="text-center py-2">Reflection</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Analysis', quantum: 92, emergent: 78, pattern: 85, reflection: 88 },
                { type: 'Synthesis', quantum: 85, emergent: 88, pattern: 90, reflection: 82 },
                { type: 'Problem Solving', quantum: 88, emergent: 82, pattern: 86, reflection: 91 },
                { type: 'Creative', quantum: 75, emergent: 95, pattern: 78, reflection: 80 },
                { type: 'Research', quantum: 82, emergent: 85, pattern: 92, reflection: 78 }
              ].map((row) => (
                <tr key={row.type} className="border-b border-slate-700/50">
                  <td className="py-3 text-slate-300">{row.type}</td>
                  <td className="text-center py-3">
                    <span className={`${row.quantum >= 90 ? 'text-green-400' : row.quantum >= 80 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {row.quantum}%
                    </span>
                  </td>
                  <td className="text-center py-3">
                    <span className={`${row.emergent >= 90 ? 'text-green-400' : row.emergent >= 80 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {row.emergent}%
                    </span>
                  </td>
                  <td className="text-center py-3">
                    <span className={`${row.pattern >= 90 ? 'text-green-400' : row.pattern >= 80 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {row.pattern}%
                    </span>
                  </td>
                  <td className="text-center py-3">
                    <span className={`${row.reflection >= 90 ? 'text-green-400' : row.reflection >= 80 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {row.reflection}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            Adaptive Learning System
          </h2>
          <p className="text-slate-400 mt-1">
            Continuously optimizing strategies for all knowledge work tasks
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-green-400/10 rounded-full text-sm text-green-400 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Learning Active
          </div>
          
          <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {[
          { id: 'current', label: 'Current Tasks', icon: <Activity className="w-4 h-4" /> },
          { id: 'history', label: 'Optimization History', icon: <TrendingUp className="w-4 h-4" /> },
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
        {activeTab === 'current' && renderCurrentTasks()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'insights' && renderInsights()}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-purple-400">4</p>
          <p className="text-sm text-slate-400">Active Strategies</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-green-400">892</p>
          <p className="text-sm text-slate-400">Tasks Optimized</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-blue-400">24%</p>
          <p className="text-sm text-slate-400">Avg Improvement</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-yellow-400">156</p>
          <p className="text-sm text-slate-400">Patterns Learned</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-400/10 border border-purple-400/20 rounded-xl p-4">
        <p className="text-sm text-purple-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          The adaptive learning system analyzes your knowledge work patterns and automatically 
          optimizes strategies for better quality, speed, and accuracy. It learns what approaches 
          work best for different types of tasks and continuously improves performance.
        </p>
      </div>
    </div>
  );
};