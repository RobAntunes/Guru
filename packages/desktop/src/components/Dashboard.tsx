import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  FlaskConical,
  Dna,
  Atom,
  TrendingUp,
  Activity,
  Sparkles,
  BarChart3,
  Clock,
  CheckCircle,
  ArrowUpRight,
  Zap
} from 'lucide-react';

interface DashboardProps {
  tasks?: any[];
  memories?: any[];
  experiments?: any[];
  knowledgeBases?: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  tasks = [], 
  memories = [], 
  experiments = [],
  knowledgeBases = []
}) => {
  // Calculate some metrics
  const activeTasks = tasks.filter(t => t.status === 'evolving').length;
  const avgMemoryConfidence = memories.length > 0 
    ? (memories.reduce((acc, m) => acc + m.confidence, 0) / memories.length * 100).toFixed(0)
    : 0;
  const totalExperiments = 127; // Mock data
  const successRate = 89; // Mock data

  return (
    <div className="space-y-8 max-w-7xl relative bottom-4">
      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Dna className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active Tasks</span>
          </div>
          <div className="text-3xl font-light">{activeTasks}</div>
          <p className="text-xs text-muted-foreground">
            {tasks.length} total
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Atom className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Memory Confidence</span>
          </div>
          <div className="text-3xl font-light">{avgMemoryConfidence}%</div>
          <p className="text-xs text-muted-foreground">
            {memories.length} memories
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Experiments</span>
          </div>
          <div className="text-3xl font-light">{totalExperiments}</div>
          <p className="text-xs text-muted-foreground">
            {successRate}% success
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Knowledge Bases</span>
          </div>
          <div className="text-3xl font-light">{knowledgeBases.length}</div>
          <p className="text-xs text-muted-foreground">
            Ready for queries
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Feed - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6 !text-left">
          {/* Recent Activity */}
          <Card className="border-muted">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-normal">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">Task Evolution Complete</p>
                  <p className="text-xs text-muted-foreground">Neural Architecture optimized with 94% improvement</p>
                </div>
                <span className="text-xs text-muted-foreground">2m</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">New Strategy Discovered</p>
                  <p className="text-xs text-muted-foreground">Binary search optimization reduced complexity by 87%</p>
                </div>
                <span className="text-xs text-muted-foreground">15m</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Atom className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">Quantum Memory Synthesized</p>
                  <p className="text-xs text-muted-foreground">Pattern recognition enhanced with new neural pathways</p>
                </div>
                <span className="text-xs text-muted-foreground">1h</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">Knowledge Base Updated</p>
                  <p className="text-xs text-muted-foreground">12 new documents processed and indexed</p>
                </div>
                <span className="text-xs text-muted-foreground">2h</span>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="border-muted">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-normal">Performance Metrics</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Task Evolution</span>
                  <span className="text-sm text-muted-foreground">87%</span>
                </div>
                <Progress value={87} className="h-1" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Learning Velocity</span>
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
                <Progress value={92} className="h-1" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memory Coherence</span>
                  <span className="text-sm text-muted-foreground">78%</span>
                </div>
                <Progress value={78} className="h-1" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Strategy Success</span>
                  <span className="text-sm text-muted-foreground">94%</span>
                </div>
                <Progress value={94} className="h-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Panel */}
        <div className="space-y-6 !text-left">
          {/* Quick Stats */}
          <Card className="border-muted">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-normal">This Week</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Learning Speed</p>
                <p className="text-sm font-medium">+12%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Strategies</p>
                <p className="text-sm font-medium">43</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patterns Found</p>
                <p className="text-sm font-medium">156</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Strategy Reuse</p>
                <p className="text-sm font-medium">3.2x</p>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="border-muted">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-normal">System Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Core Engine</p>
                  <p className="text-xs">Operational</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Learning System</p>
                  <p className="text-xs">Active</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Memory Synthesis</p>
                  <p className="text-xs">Online</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SILC Protocol</p>
                  <p className="text-xs">Connected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};