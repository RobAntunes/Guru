"""
Adaptive Learning Tool - Multi-armed bandit and reinforcement learning for strategy optimization
"""

import asyncio
import math
import random
from typing import Any, Dict, List, Optional
from loguru import logger
import numpy as np


class AdaptiveLearningTool:
    """
    Optimize strategies and approaches using multi-armed bandit and reinforcement learning
    """
    
    def __init__(self, core_bridge):
        self.core_bridge = core_bridge
        self.name = "guru_adaptive_learning"
        
        # Learning algorithms
        self.algorithms = {
            "epsilon_greedy": self._epsilon_greedy,
            "ucb1": self._ucb1,
            "thompson_sampling": self._thompson_sampling,
            "gradient_bandit": self._gradient_bandit
        }
        
        # Strategy performance tracking
        self.performance_history = {}
        
    async def execute(self, args: Dict[str, Any]) -> str:
        """Execute adaptive learning for strategy optimization"""
        strategy_space = args.get("strategy_space", [])
        performance_history = args.get("performance_history", [])
        exploration_rate = args.get("exploration_rate", 0.1)
        
        if not strategy_space:
            return "## Error\n\nNo strategy space provided for adaptive learning"
            
        try:
            logger.info(f"Running adaptive learning on {len(strategy_space)} strategies")
            
            # Perform adaptive learning optimization
            learning_result = await self._optimize_strategies(strategy_space, performance_history, exploration_rate)
            
            # Format results
            return self._format_learning_result(learning_result, strategy_space, exploration_rate)
            
        except Exception as e:
            logger.error(f"Adaptive learning failed: {e}")
            return f"## Error\n\nAdaptive learning failed: {str(e)}"
    
    async def _optimize_strategies(self, strategy_space: List[str], performance_history: List[Dict[str, Any]], exploration_rate: float) -> Dict[str, Any]:
        """Run adaptive learning algorithms to optimize strategy selection"""
        
        # Initialize strategy performance data
        strategy_stats = self._initialize_strategy_stats(strategy_space, performance_history)
        
        # Run multiple learning algorithms for comparison
        algorithm_results = {}
        
        for algo_name in self.algorithms.keys():
            logger.info(f"Running {algo_name} algorithm")
            result = await self._run_algorithm(algo_name, strategy_stats, exploration_rate)
            algorithm_results[algo_name] = result
            
            # Small delay between algorithms
            await asyncio.sleep(0.1)
        
        # Select best performing algorithm
        best_algorithm = self._select_best_algorithm(algorithm_results)
        
        # Generate learning insights
        learning_insights = self._generate_learning_insights(strategy_stats, algorithm_results)
        
        # Provide recommendations
        recommendations = self._generate_recommendations(strategy_stats, best_algorithm, exploration_rate)
        
        # Calculate learning metrics
        learning_metrics = self._calculate_learning_metrics(strategy_stats, algorithm_results)
        
        return {
            "strategy_stats": strategy_stats,
            "algorithm_results": algorithm_results,
            "best_algorithm": best_algorithm,
            "learning_insights": learning_insights,
            "recommendations": recommendations,
            "learning_metrics": learning_metrics,
            "exploration_analysis": self._analyze_exploration_exploitation(strategy_stats, exploration_rate)
        }
    
    def _initialize_strategy_stats(self, strategy_space: List[str], performance_history: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Initialize strategy statistics from historical data"""
        
        strategy_stats = {}
        
        for strategy in strategy_space:
            strategy_stats[strategy] = {
                "total_trials": 0,
                "total_reward": 0.0,
                "reward_history": [],
                "average_reward": 0.0,
                "confidence_interval": [0.0, 0.0],
                "last_updated": 0,
                "success_rate": 0.0,
                "variance": 0.0,
                "regret": 0.0
            }
        
        # Process historical performance data
        for record in performance_history:
            strategy = record.get("strategy", "")
            outcome = record.get("outcome", 0.0)
            context = record.get("context", "")
            
            if strategy in strategy_stats:
                stats = strategy_stats[strategy]
                stats["total_trials"] += 1
                stats["total_reward"] += outcome
                stats["reward_history"].append(outcome)
                
                # Update statistics
                if stats["total_trials"] > 0:
                    stats["average_reward"] = stats["total_reward"] / stats["total_trials"]
                    stats["success_rate"] = len([r for r in stats["reward_history"] if r > 0.5]) / stats["total_trials"]
                    
                    if len(stats["reward_history"]) > 1:
                        stats["variance"] = np.var(stats["reward_history"])
                        # 95% confidence interval
                        std_err = np.sqrt(stats["variance"] / stats["total_trials"])
                        margin = 1.96 * std_err
                        stats["confidence_interval"] = [
                            max(0.0, stats["average_reward"] - margin),
                            min(1.0, stats["average_reward"] + margin)
                        ]
        
        return strategy_stats
    
    async def _run_algorithm(self, algo_name: str, strategy_stats: Dict[str, Dict[str, Any]], exploration_rate: float) -> Dict[str, Any]:
        """Run a specific learning algorithm"""
        
        algorithm_func = self.algorithms[algo_name]
        
        # Simulate algorithm execution with multiple rounds
        simulation_rounds = 20
        selections = []
        rewards = []
        cumulative_regret = []
        
        # Create working copy of stats for simulation
        sim_stats = {k: v.copy() for k, v in strategy_stats.items()}
        
        for round_num in range(simulation_rounds):
            # Select strategy using algorithm
            selected_strategy = algorithm_func(sim_stats, exploration_rate, round_num)
            selections.append(selected_strategy)
            
            # Simulate reward (in real implementation, this would be actual performance)
            simulated_reward = self._simulate_strategy_performance(selected_strategy, sim_stats)
            rewards.append(simulated_reward)
            
            # Update statistics
            self._update_strategy_stats(sim_stats, selected_strategy, simulated_reward, round_num)
            
            # Calculate regret
            best_possible_reward = max(stats["average_reward"] for stats in strategy_stats.values())
            instant_regret = max(0, best_possible_reward - simulated_reward)
            cumulative_regret.append(sum(cumulative_regret) + instant_regret if cumulative_regret else instant_regret)
            
            await asyncio.sleep(0.02)  # Small delay for realistic simulation
        
        # Calculate algorithm performance metrics
        total_reward = sum(rewards)
        average_reward = total_reward / len(rewards) if rewards else 0
        final_regret = cumulative_regret[-1] if cumulative_regret else 0
        
        # Strategy selection frequency
        strategy_frequency = {}
        for strategy in strategy_stats.keys():
            strategy_frequency[strategy] = selections.count(strategy) / len(selections)
        
        return {
            "algorithm_name": algo_name,
            "total_reward": total_reward,
            "average_reward": average_reward,
            "cumulative_regret": final_regret,
            "strategy_selections": selections,
            "rewards": rewards,
            "strategy_frequency": strategy_frequency,
            "final_strategy_stats": sim_stats,
            "convergence_round": self._detect_convergence(selections)
        }
    
    def _epsilon_greedy(self, strategy_stats: Dict[str, Dict[str, Any]], epsilon: float, round_num: int) -> str:
        """Epsilon-greedy strategy selection"""
        
        if random.random() < epsilon:
            # Explore: select random strategy
            return random.choice(list(strategy_stats.keys()))
        else:
            # Exploit: select best strategy based on average reward
            best_strategy = max(strategy_stats.keys(), 
                              key=lambda s: strategy_stats[s]["average_reward"])
            return best_strategy
    
    def _ucb1(self, strategy_stats: Dict[str, Dict[str, Any]], exploration_rate: float, round_num: int) -> str:
        """Upper Confidence Bound (UCB1) strategy selection"""
        
        total_trials = sum(stats["total_trials"] for stats in strategy_stats.values())
        
        if total_trials == 0:
            return random.choice(list(strategy_stats.keys()))
        
        ucb_values = {}
        
        for strategy, stats in strategy_stats.items():
            if stats["total_trials"] == 0:
                ucb_values[strategy] = float('inf')  # Prioritize untried strategies
            else:
                confidence_bonus = math.sqrt(2 * math.log(total_trials + 1) / stats["total_trials"])
                ucb_values[strategy] = stats["average_reward"] + exploration_rate * confidence_bonus
        
        best_strategy = max(ucb_values.keys(), key=lambda s: ucb_values[s])
        return best_strategy
    
    def _thompson_sampling(self, strategy_stats: Dict[str, Dict[str, Any]], exploration_rate: float, round_num: int) -> str:
        """Thompson sampling (Bayesian) strategy selection"""
        
        strategy_samples = {}
        
        for strategy, stats in strategy_stats.items():
            if stats["total_trials"] == 0:
                # Prior: Beta(1, 1) - uniform distribution
                alpha, beta = 1, 1
            else:
                # Update Beta distribution parameters
                successes = sum(1 for r in stats["reward_history"] if r > 0.5)
                failures = stats["total_trials"] - successes
                alpha = 1 + successes
                beta = 1 + failures
            
            # Sample from Beta distribution
            strategy_samples[strategy] = np.random.beta(alpha, beta)
        
        best_strategy = max(strategy_samples.keys(), key=lambda s: strategy_samples[s])
        return best_strategy
    
    def _gradient_bandit(self, strategy_stats: Dict[str, Dict[str, Any]], exploration_rate: float, round_num: int) -> str:
        """Gradient bandit algorithm strategy selection"""
        
        # Initialize preferences if not exists
        if not hasattr(self, '_preferences'):
            self._preferences = {strategy: 0.0 for strategy in strategy_stats.keys()}
        
        # Calculate action probabilities using softmax
        exp_preferences = {s: math.exp(pref) for s, pref in self._preferences.items()}
        total_exp = sum(exp_preferences.values())
        
        probabilities = {s: exp_val / total_exp for s, exp_val in exp_preferences.items()}
        
        # Select strategy based on probabilities
        rand_val = random.random()
        cumulative_prob = 0.0
        
        for strategy, prob in probabilities.items():
            cumulative_prob += prob
            if rand_val <= cumulative_prob:
                return strategy
        
        # Fallback to random selection
        return random.choice(list(strategy_stats.keys()))
    
    def _simulate_strategy_performance(self, strategy: str, strategy_stats: Dict[str, Dict[str, Any]]) -> float:
        """Simulate strategy performance based on historical data"""
        
        stats = strategy_stats[strategy]
        
        if stats["total_trials"] == 0:
            # No historical data, return random performance
            return random.uniform(0.3, 0.8)
        
        # Use historical average with some noise
        base_performance = stats["average_reward"]
        noise = random.gauss(0, 0.1)  # Add Gaussian noise
        
        # Simulate learning curve (improvement over time)
        learning_bonus = min(0.1, stats["total_trials"] * 0.005)
        
        performance = base_performance + noise + learning_bonus
        return max(0.0, min(1.0, performance))
    
    def _update_strategy_stats(self, strategy_stats: Dict[str, Dict[str, Any]], strategy: str, reward: float, round_num: int):
        """Update strategy statistics with new performance data"""
        
        stats = strategy_stats[strategy]
        stats["total_trials"] += 1
        stats["total_reward"] += reward
        stats["reward_history"].append(reward)
        stats["last_updated"] = round_num
        
        # Recalculate statistics
        stats["average_reward"] = stats["total_reward"] / stats["total_trials"]
        stats["success_rate"] = len([r for r in stats["reward_history"] if r > 0.5]) / stats["total_trials"]
        
        if len(stats["reward_history"]) > 1:
            stats["variance"] = np.var(stats["reward_history"])
            
            # Update confidence interval
            std_err = np.sqrt(stats["variance"] / stats["total_trials"])
            margin = 1.96 * std_err
            stats["confidence_interval"] = [
                max(0.0, stats["average_reward"] - margin),
                min(1.0, stats["average_reward"] + margin)
            ]
        
        # Update gradient bandit preferences if using that algorithm
        if hasattr(self, '_preferences'):
            learning_rate = 0.1
            baseline = np.mean([s["average_reward"] for s in strategy_stats.values()])
            
            for s in strategy_stats.keys():
                if s == strategy:
                    # Increase preference for selected strategy
                    self._preferences[s] += learning_rate * (reward - baseline)
                else:
                    # Decrease preference for non-selected strategies
                    prob = 1.0 / len(strategy_stats)  # Simplified probability
                    self._preferences[s] -= learning_rate * (reward - baseline) * prob
    
    def _detect_convergence(self, selections: List[str]) -> Optional[int]:
        """Detect when algorithm converged to a strategy"""
        
        if len(selections) < 10:
            return None
        
        # Check last 10 selections
        recent_selections = selections[-10:]
        most_common = max(set(recent_selections), key=recent_selections.count)
        
        # Consider converged if 80% of recent selections are the same strategy
        if recent_selections.count(most_common) >= 8:
            # Find when convergence started
            for i in range(len(selections) - 10, -1, -1):
                if i + 10 <= len(selections):
                    window = selections[i:i+10]
                    if window.count(most_common) >= 8:
                        return i
        
        return None
    
    def _select_best_algorithm(self, algorithm_results: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Select the best performing algorithm"""
        
        best_algo = None
        best_score = -float('inf')
        
        for algo_name, result in algorithm_results.items():
            # Score based on average reward and low regret
            score = result["average_reward"] - 0.1 * result["cumulative_regret"] / 20.0
            
            if score > best_score:
                best_score = score
                best_algo = result
        
        return best_algo or list(algorithm_results.values())[0]
    
    def _generate_learning_insights(self, strategy_stats: Dict[str, Dict[str, Any]], algorithm_results: Dict[str, Dict[str, Any]]) -> List[str]:
        """Generate insights from the learning process"""
        
        insights = []
        
        # Strategy performance insights
        best_strategy = max(strategy_stats.keys(), key=lambda s: strategy_stats[s]["average_reward"])
        best_reward = strategy_stats[best_strategy]["average_reward"]
        
        if best_reward > 0.8:
            insights.append(f"Strategy '{best_strategy}' shows excellent performance ({best_reward:.2f} average reward)")
        elif best_reward > 0.6:
            insights.append(f"Strategy '{best_strategy}' demonstrates good performance with optimization potential")
        else:
            insights.append("All strategies show moderate performance - consider expanding strategy space")
        
        # Algorithm comparison insights
        best_algo = self._select_best_algorithm(algorithm_results)
        insights.append(f"Algorithm '{best_algo['algorithm_name']}' achieved best balance of exploration and exploitation")
        
        # Convergence insights
        converged_algos = [name for name, result in algorithm_results.items() if result["convergence_round"] is not None]
        if converged_algos:
            insights.append(f"Algorithms {', '.join(converged_algos)} showed convergence behavior")
        else:
            insights.append("No clear convergence detected - strategies may need more exploration")
        
        # Variance insights
        high_variance_strategies = [s for s, stats in strategy_stats.items() if stats["variance"] > 0.1]
        if high_variance_strategies:
            insights.append(f"Strategies {', '.join(high_variance_strategies)} show high variance - inconsistent performance")
        
        # Success rate insights
        reliable_strategies = [s for s, stats in strategy_stats.items() if stats["success_rate"] > 0.7]
        if reliable_strategies:
            insights.append(f"Most reliable strategies: {', '.join(reliable_strategies)}")
        
        return insights[:6]  # Limit to 6 insights
    
    def _generate_recommendations(self, strategy_stats: Dict[str, Dict[str, Any]], best_algorithm: Dict[str, Any], exploration_rate: float) -> List[Dict[str, Any]]:
        """Generate actionable recommendations"""
        
        recommendations = []
        
        # Strategy recommendations based on performance
        sorted_strategies = sorted(strategy_stats.items(), key=lambda x: x[1]["average_reward"], reverse=True)
        
        top_strategy = sorted_strategies[0]
        recommendations.append({
            "type": "strategy_selection",
            "priority": "high",
            "title": f"Focus on '{top_strategy[0]}' Strategy",
            "description": f"This strategy shows best performance ({top_strategy[1]['average_reward']:.2f} average reward)",
            "confidence": min(1.0, top_strategy[1]["average_reward"] + 0.2),
            "implementation": f"Allocate primary resources to {top_strategy[0]} approach"
        })
        
        # Algorithm recommendations
        recommendations.append({
            "type": "algorithm_optimization",
            "priority": "medium",
            "title": f"Use {best_algorithm['algorithm_name'].replace('_', ' ').title()} Algorithm",
            "description": f"Best balance of exploration/exploitation with {best_algorithm['average_reward']:.2f} average reward",
            "confidence": 0.8,
            "implementation": f"Implement {best_algorithm['algorithm_name']} for future strategy selection"
        })
        
        # Exploration rate recommendations
        if exploration_rate > 0.3:
            recommendations.append({
                "type": "parameter_tuning",
                "priority": "medium",
                "title": "Reduce Exploration Rate",
                "description": f"Current exploration rate ({exploration_rate:.1f}) may be too high for exploitation",
                "confidence": 0.7,
                "implementation": f"Consider reducing exploration rate to {exploration_rate * 0.7:.2f}"
            })
        elif exploration_rate < 0.05:
            recommendations.append({
                "type": "parameter_tuning",
                "priority": "low",
                "title": "Increase Exploration",
                "description": "Low exploration may miss better strategies",
                "confidence": 0.6,
                "implementation": f"Consider increasing exploration rate to {min(0.15, exploration_rate * 2):.2f}"
            })
        
        # Data collection recommendations
        low_trial_strategies = [s for s, stats in strategy_stats.items() if stats["total_trials"] < 5]
        if low_trial_strategies:
            recommendations.append({
                "type": "data_collection",
                "priority": "medium",
                "title": "Gather More Data",
                "description": f"Strategies {', '.join(low_trial_strategies)} need more trials for reliable assessment",
                "confidence": 0.8,
                "implementation": "Allocate trials to under-explored strategies for better statistical confidence"
            })
        
        return recommendations
    
    def _calculate_learning_metrics(self, strategy_stats: Dict[str, Dict[str, Any]], algorithm_results: Dict[str, Dict[str, Any]]) -> Dict[str, float]:
        """Calculate comprehensive learning metrics"""
        
        # Overall learning effectiveness
        total_trials = sum(stats["total_trials"] for stats in strategy_stats.values())
        total_reward = sum(stats["total_reward"] for stats in strategy_stats.values())
        overall_efficiency = total_reward / total_trials if total_trials > 0 else 0.0
        
        # Strategy diversity (entropy)
        trial_distribution = [stats["total_trials"] for stats in strategy_stats.values()]
        total = sum(trial_distribution)
        if total > 0:
            probabilities = [t / total for t in trial_distribution]
            entropy = -sum(p * math.log(p) for p in probabilities if p > 0)
            max_entropy = math.log(len(strategy_stats))
            diversity_score = entropy / max_entropy if max_entropy > 0 else 0.0
        else:
            diversity_score = 0.0
        
        # Algorithm comparison metrics
        algorithm_rewards = [result["average_reward"] for result in algorithm_results.values()]
        algorithm_regrets = [result["cumulative_regret"] for result in algorithm_results.values()]
        
        best_algorithm_reward = max(algorithm_rewards) if algorithm_rewards else 0.0
        lowest_regret = min(algorithm_regrets) if algorithm_regrets else 0.0
        
        # Confidence metrics
        confident_strategies = [s for s, stats in strategy_stats.items() 
                             if stats["confidence_interval"][0] > 0.5]  
        confidence_ratio = len(confident_strategies) / len(strategy_stats) if strategy_stats else 0.0
        
        return {
            "overall_efficiency": overall_efficiency,
            "strategy_diversity": diversity_score,
            "best_algorithm_performance": best_algorithm_reward,
            "lowest_cumulative_regret": lowest_regret,
            "confidence_ratio": confidence_ratio,
            "total_trials": total_trials,
            "exploration_completeness": min(1.0, total_trials / (len(strategy_stats) * 10))
        }
    
    def _analyze_exploration_exploitation(self, strategy_stats: Dict[str, Dict[str, Any]], exploration_rate: float) -> Dict[str, Any]:
        """Analyze exploration vs exploitation balance"""
        
        total_trials = sum(stats["total_trials"] for stats in strategy_stats.values())
        
        if total_trials == 0:
            return {
                "exploration_ratio": 0.0,
                "exploitation_ratio": 0.0,
                "balance_score": 0.0,
                "recommendation": "No trials conducted yet"
            }
        
        # Estimate exploration vs exploitation
        # Strategies with few trials indicate exploration
        exploration_trials = sum(stats["total_trials"] for stats in strategy_stats.values() 
                                if stats["total_trials"] < total_trials * 0.3)
        
        exploration_ratio = exploration_trials / total_trials
        exploitation_ratio = 1.0 - exploration_ratio
        
        # Balance score (optimal is around 0.2-0.3 exploration)
        optimal_exploration = 0.25
        balance_score = 1.0 - abs(exploration_ratio - optimal_exploration) / optimal_exploration
        
        # Generate recommendation
        if exploration_ratio > 0.4:
            recommendation = "High exploration detected - consider more exploitation of best strategies"
        elif exploration_ratio < 0.1:
            recommendation = "Low exploration detected - may miss better strategies"
        else:
            recommendation = "Good exploration-exploitation balance"
        
        return {
            "exploration_ratio": exploration_ratio,
            "exploitation_ratio": exploitation_ratio,
            "balance_score": balance_score,
            "optimal_exploration_rate": optimal_exploration,
            "current_exploration_rate": exploration_rate,
            "recommendation": recommendation
        }
    
    def _format_learning_result(self, learning: Dict[str, Any], strategy_space: List[str], exploration_rate: float) -> str:
        """Format the adaptive learning results for presentation"""
        
        result = f"## 🧠 Guru Adaptive Learning\n\n"
        result += f"**Strategy Space:** {len(strategy_space)} strategies\n"
        result += f"**Exploration Rate:** {exploration_rate:.2f}\n"
        result += f"**Learning Efficiency:** {learning['learning_metrics']['overall_efficiency']:.2f}/1.0\n"
        result += f"**Strategy Diversity:** {learning['learning_metrics']['strategy_diversity']:.2f}/1.0\n\n"
        
        # Strategy Performance Rankings
        strategy_stats = learning["strategy_stats"]
        ranked_strategies = sorted(strategy_stats.items(), key=lambda x: x[1]["average_reward"], reverse=True)
        
        result += f"### 📊 Strategy Performance Rankings\n"
        for i, (strategy, stats) in enumerate(ranked_strategies, 1):
            rank_emoji = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "📍"
            confidence_width = stats["confidence_interval"][1] - stats["confidence_interval"][0]
            result += f"{rank_emoji} **{strategy.replace('_', ' ').title()}**\n"
            result += f"   • Average Reward: {stats['average_reward']:.3f}\n"
            result += f"   • Success Rate: {stats['success_rate']:.1%}\n"
            result += f"   • Trials: {stats['total_trials']}\n"
            result += f"   • Confidence: ±{confidence_width:.3f}\n\n"
        
        # Best Algorithm Results
        best_algo = learning["best_algorithm"]
        result += f"### 🎯 Best Algorithm: {best_algo['algorithm_name'].replace('_', ' ').title()}\n"
        result += f"- **Average Reward:** {best_algo['average_reward']:.3f}\n"
        result += f"- **Cumulative Regret:** {best_algo['cumulative_regret']:.2f}\n"
        result += f"- **Convergence:** {'Yes' if best_algo['convergence_round'] else 'No'}\n"
        if best_algo['convergence_round']:
            result += f"- **Convergence Round:** {best_algo['convergence_round']}\n"
        result += "\n"
        
        # Algorithm Comparison
        result += f"### ⚔️ Algorithm Comparison\n"
        for algo_name, algo_result in learning["algorithm_results"].items():
            performance_emoji = "🔥" if algo_result == best_algo else "⚡" if algo_result["average_reward"] > 0.6 else "🔧"
            result += f"{performance_emoji} **{algo_name.replace('_', ' ').title()}:** "
            result += f"Reward: {algo_result['average_reward']:.3f}, "
            result += f"Regret: {algo_result['cumulative_regret']:.2f}\n"
        result += "\n"
        
        # Top Recommendations
        recommendations = learning["recommendations"]
        if recommendations:
            result += f"### 💡 Adaptive Learning Recommendations\n"
            for rec in recommendations[:3]:
                priority_emoji = "🔴" if rec["priority"] == "high" else "🟡" if rec["priority"] == "medium" else "🟢"
                result += f"{priority_emoji} **{rec['title']}** ({rec['type']})\n"
                result += f"   {rec['description']}\n"
                result += f"   *Confidence: {rec['confidence']:.2f}, Implementation: {rec['implementation']}*\n\n"
        
        # Exploration vs Exploitation Analysis
        exploration_analysis = learning["exploration_analysis"]
        result += f"### 🔍 Exploration vs Exploitation\n"
        result += f"- **Exploration:** {exploration_analysis['exploration_ratio']:.1%}\n"
        result += f"- **Exploitation:** {exploration_analysis['exploitation_ratio']:.1%}\n"
        result += f"- **Balance Score:** {exploration_analysis['balance_score']:.2f}/1.0\n"
        result += f"- **Recommendation:** {exploration_analysis['recommendation']}\n\n"
        
        # Learning Insights
        insights = learning["learning_insights"]
        if insights:
            result += f"### 🎓 Learning Insights\n"
            for i, insight in enumerate(insights, 1):
                result += f"{i}. {insight}\n"
            result += "\n"
        
        # Learning Metrics
        metrics = learning["learning_metrics"]
        result += f"### 📈 Learning Metrics\n"
        result += f"- **Total Trials:** {metrics['total_trials']}\n"
        result += f"- **Exploration Completeness:** {metrics['exploration_completeness']:.1%}\n"
        result += f"- **Confidence Ratio:** {metrics['confidence_ratio']:.1%}\n"
        result += f"- **Best Algorithm Performance:** {metrics['best_algorithm_performance']:.3f}\n\n"
        
        result += f"---\n"
        result += f"*Adaptive learning uses multi-armed bandit algorithms and reinforcement learning to optimize strategy selection through intelligent exploration and exploitation.*"
        
        return result