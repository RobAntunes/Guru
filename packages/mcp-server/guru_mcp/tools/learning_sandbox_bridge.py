"""
Learning-Sandbox Bridge - Integrates WASM sandbox experiments with adaptive learning
"""

import asyncio
from typing import Any, Dict, List, Optional
from loguru import logger


class LearningSandboxBridge:
    """
    Bridges WASM sandbox experiments with the adaptive learning system
    """
    
    def __init__(self, adaptive_learning, wasm_sandbox):
        self.adaptive_learning = adaptive_learning
        self.wasm_sandbox = wasm_sandbox
        
        # Track experiment-to-strategy mappings
        self.experiment_strategies = {}
        
    async def run_learning_experiment(self, args: Dict[str, Any]) -> str:
        """
        Run an experiment and feed results to adaptive learning
        """
        
        problem_type = args.get("problem_type", "general")
        hypothesis = args.get("hypothesis", "")
        code_attempts = args.get("code_attempts", [])
        context = args.get("context", {})
        
        logger.info(f"Running learning experiment for {problem_type}")
        
        try:
            # Get strategy recommendations from past learning
            recommendations = await self.wasm_sandbox.get_strategy_recommendations(
                problem_type, 
                context
            )
            
            # If we have recommendations, add them to attempts
            if recommendations and len(code_attempts) < 5:
                for rec in recommendations[:2]:  # Add top 2 recommendations
                    code_attempts.append({
                        "code": rec["code_template"],
                        "approach": f"learned_{rec['approach']}",
                        "language": "python"
                    })
            
            # Run experiment in sandbox
            sandbox_result = await self.wasm_sandbox.execute({
                "experiment_type": problem_type,
                "problem_context": context,
                "hypothesis": hypothesis,
                "code_attempts": code_attempts,
                "success_criteria": args.get("success_criteria", {})
            })
            
            # Extract learning data from sandbox result
            learning_data = self._extract_learning_data(sandbox_result, problem_type)
            
            # Feed to adaptive learning system
            if learning_data:
                learning_result = await self._update_adaptive_learning(learning_data)
                
                # Combine results
                return self._format_integrated_results(
                    sandbox_result,
                    learning_result,
                    recommendations
                )
            else:
                return sandbox_result
                
        except Exception as e:
            logger.error(f"Learning experiment failed: {e}")
            return f"## Error\n\nLearning experiment failed: {str(e)}"
    
    def _extract_learning_data(self, sandbox_result: str, problem_type: str) -> Optional[Dict[str, Any]]:
        """
        Extract learning-relevant data from sandbox results
        """
        
        # Parse sandbox results (simplified - in reality would parse markdown)
        if "Best Strategy" not in sandbox_result:
            return None
        
        # Extract key metrics
        import re
        
        efficiency_match = re.search(r'Efficiency Score: ([\d.]+)', sandbox_result)
        approach_match = re.search(r'Approach: (\w+)', sandbox_result)
        success_match = re.search(r'Success Rate: ([\d.]+)%', sandbox_result)
        
        if not (efficiency_match and approach_match):
            return None
        
        efficiency = float(efficiency_match.group(1))
        approach = approach_match.group(1)
        success_rate = float(success_match.group(1)) / 100 if success_match else efficiency
        
        # Create strategy name
        strategy_name = f"{problem_type}_{approach}"
        
        # Store mapping
        self.experiment_strategies[strategy_name] = {
            "problem_type": problem_type,
            "approach": approach,
            "last_efficiency": efficiency
        }
        
        return {
            "strategy_space": [strategy_name],
            "performance_history": [{
                "strategy": strategy_name,
                "outcome": efficiency,
                "context": problem_type
            }],
            "exploration_rate": 0.1  # Can be adjusted based on confidence
        }
    
    async def _update_adaptive_learning(self, learning_data: Dict[str, Any]) -> str:
        """
        Update adaptive learning system with experiment results
        """
        
        # Call adaptive learning tool
        learning_result = await self.adaptive_learning.execute(learning_data)
        
        return learning_result
    
    def _format_integrated_results(self, sandbox_result: str, 
                                 learning_result: str,
                                 recommendations: List[Dict[str, Any]]) -> str:
        """
        Format combined results from sandbox and learning system
        """
        
        result = "## 🧪 Integrated Learning Experiment\n\n"
        
        # Add recommendations used
        if recommendations:
            result += "### 📚 Applied Past Learning\n"
            for rec in recommendations[:2]:
                result += f"- Used **{rec['approach']}** strategy (confidence: {rec['confidence']:.2f})\n"
                result += f"  - Reason: {rec['reason']}\n"
            result += "\n"
        
        # Add sandbox results
        result += sandbox_result
        result += "\n\n---\n\n"
        
        # Add adaptive learning update
        result += "### 🧠 Adaptive Learning Update\n\n"
        
        # Extract key learning metrics
        import re
        
        efficiency_match = re.search(r'Average Reward: ([\d.]+)', learning_result)
        if efficiency_match:
            result += f"- Strategy Performance Score: {efficiency_match.group(1)}\n"
        
        recommendation_match = re.search(r'Focus on \'(.+?)\' Strategy', learning_result)
        if recommendation_match:
            result += f"- Recommended Strategy: {recommendation_match.group(1)}\n"
        
        # Add learning insights
        insights_section = re.search(r'### 🎓 Learning Insights\n((?:.*\n)*?)(?=###|\Z)', learning_result, re.MULTILINE)
        if insights_section:
            result += "\n**Learning Insights:**\n"
            result += insights_section.group(1)
        
        # Add integration summary
        result += "\n### 🔄 Integration Summary\n\n"
        result += "The experiment results have been integrated into the adaptive learning system:\n"
        result += "- ✅ New strategy performance recorded\n"
        result += "- ✅ Learning algorithms updated with latest data\n"
        result += "- ✅ Future experiments will benefit from this knowledge\n"
        
        return result
    
    async def get_experiment_history(self) -> List[Dict[str, Any]]:
        """
        Get combined history of experiments and their learning outcomes
        """
        
        sandbox_history = self.wasm_sandbox.experiments
        learning_history = self.adaptive_learning.performance_history
        
        # Combine histories
        combined = []
        
        for exp in sandbox_history:
            exp_data = {
                "timestamp": exp["timestamp"],
                "type": exp["experiment_type"],
                "best_approach": exp.get("best_approach"),
                "patterns": exp.get("patterns_discovered", [])
            }
            
            # Find corresponding learning data
            strategy_key = f"{exp['experiment_type']}_{exp.get('best_approach', {}).get('name', '')}"
            if strategy_key in learning_history:
                exp_data["learning_metrics"] = learning_history[strategy_key]
            
            combined.append(exp_data)
        
        return combined
    
    async def suggest_next_experiment(self, problem_domain: str) -> Dict[str, Any]:
        """
        Suggest next experiment based on learning gaps
        """
        
        # Analyze what we've learned
        all_strategies = list(self.experiment_strategies.keys())
        
        # Find areas with low coverage
        domain_coverage = {}
        for strategy in all_strategies:
            domain = strategy.split('_')[0]
            domain_coverage[domain] = domain_coverage.get(domain, 0) + 1
        
        # Suggest experiment in least covered area
        if problem_domain not in domain_coverage:
            confidence = 0.9
            reason = "No experiments in this domain yet"
        else:
            coverage = domain_coverage[problem_domain]
            if coverage < 3:
                confidence = 0.7
                reason = f"Only {coverage} experiments in this domain"
            else:
                confidence = 0.5
                reason = "Good coverage, but more data always helps"
        
        # Get specific suggestions based on adaptive learning
        learning_suggestions = []
        
        # Look for strategies that need more exploration
        for strategy, data in self.experiment_strategies.items():
            if strategy.startswith(problem_domain):
                if data["last_efficiency"] < 0.8:
                    learning_suggestions.append({
                        "focus": "optimization",
                        "description": f"Improve {data['approach']} approach (current: {data['last_efficiency']:.2f})"
                    })
        
        return {
            "confidence": confidence,
            "reason": reason,
            "domain": problem_domain,
            "coverage": domain_coverage.get(problem_domain, 0),
            "total_experiments": len(self.wasm_sandbox.experiments),
            "suggestions": learning_suggestions or [{
                "focus": "exploration",
                "description": f"Explore new approaches for {problem_domain}"
            }]
        }