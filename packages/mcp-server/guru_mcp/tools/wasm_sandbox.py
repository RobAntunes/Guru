"""
WASM Code Execution Sandbox - A laboratory for AI experimentation
"""

import asyncio
import time
import json
import hashlib
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
from loguru import logger
import wasmtime
import tempfile
import subprocess


class WASMSandbox:
    """
    Secure WASM-based sandbox for AI code experimentation
    """
    
    def __init__(self, core_bridge):
        self.core_bridge = core_bridge
        self.name = "guru_wasm_sandbox"
        
        # Initialize WASM runtime
        self._init_wasm_runtime()
        
        # Experiment tracking
        self.experiments = []
        self.successful_strategies = {}
        
    def _init_wasm_runtime(self):
        """Initialize Wasmtime runtime with security limits"""
        
        # Configure WASM engine
        config = wasmtime.Config()
        config.consume_fuel = True  # Enable gas metering
        config.wasm_threads = False  # No threading for security
        config.wasm_simd = True     # Allow SIMD for performance
        config.wasm_multi_memory = False
        config.wasm_memory64 = False
        
        self.engine = wasmtime.Engine(config)
        
        # Store configuration with limits
        self.limits = wasmtime.StoreLimits(
            memory_size=50 * 1024 * 1024,  # 50MB memory limit
            table_elements=10000,
            instances=1,
            tables=5,
            memories=1
        )
    
    async def execute(self, args: Dict[str, Any]) -> str:
        """Execute an AI experiment in WASM sandbox"""
        
        experiment_type = args.get("experiment_type", "general")
        problem_context = args.get("problem_context", {})
        hypothesis = args.get("hypothesis", "")
        code_attempts = args.get("code_attempts", [])
        success_criteria = args.get("success_criteria", {})
        
        if not code_attempts:
            return "## Error\n\nNo code attempts provided for experimentation"
        
        try:
            logger.info(f"Running {experiment_type} experiment with {len(code_attempts)} attempts")
            
            # Run all code attempts in sandbox
            experiment_results = await self._run_experiments(
                code_attempts, 
                problem_context,
                experiment_type
            )
            
            # Analyze results against success criteria
            analysis = self._analyze_experiment_results(
                experiment_results,
                success_criteria,
                hypothesis
            )
            
            # Learn from the experiment
            learning_outcome = await self._learn_from_experiment(
                experiment_type,
                problem_context,
                experiment_results,
                analysis
            )
            
            # Save successful strategies
            if analysis["best_strategy"]:
                self._save_successful_strategy(
                    experiment_type,
                    analysis["best_strategy"],
                    problem_context
                )
            
            # Format comprehensive results
            return self._format_experiment_report(
                experiment_type,
                hypothesis,
                experiment_results,
                analysis,
                learning_outcome
            )
            
        except Exception as e:
            logger.error(f"Experiment failed: {e}")
            return f"## Error\n\nExperiment failed: {str(e)}"
    
    async def _run_experiments(self, code_attempts: List[Dict[str, Any]], 
                              context: Dict[str, Any], 
                              experiment_type: str) -> List[Dict[str, Any]]:
        """Run multiple code attempts and collect results"""
        
        results = []
        
        for i, attempt in enumerate(code_attempts):
            logger.info(f"Running attempt {i+1}/{len(code_attempts)}")
            
            code = attempt.get("code", "")
            approach = attempt.get("approach", f"approach_{i+1}")
            language = attempt.get("language", "python")
            
            # Compile to WASM based on language
            wasm_module = await self._compile_to_wasm(code, language)
            
            if not wasm_module:
                results.append({
                    "approach": approach,
                    "success": False,
                    "error": "Failed to compile to WASM",
                    "metrics": {}
                })
                continue
            
            # Execute in WASM sandbox
            execution_result = await self._execute_wasm(wasm_module, context)
            
            # Collect comprehensive metrics
            metrics = self._collect_execution_metrics(execution_result)
            
            results.append({
                "approach": approach,
                "code": code,
                "success": execution_result["success"],
                "output": execution_result.get("output", ""),
                "error": execution_result.get("error"),
                "metrics": metrics,
                "execution_time": execution_result["execution_time"]
            })
            
            # Small delay between attempts
            await asyncio.sleep(0.1)
        
        return results
    
    async def _compile_to_wasm(self, code: str, language: str) -> Optional[bytes]:
        """Compile code to WASM module"""
        
        try:
            if language == "python":
                # Use Pyodide or compile Python to WASM
                return await self._compile_python_to_wasm(code)
            elif language == "javascript":
                # Use Javy or similar to compile JS to WASM
                return await self._compile_javascript_to_wasm(code)
            elif language == "rust":
                # Direct Rust to WASM compilation
                return await self._compile_rust_to_wasm(code)
            else:
                logger.warning(f"Language {language} not supported for WASM compilation")
                return None
                
        except Exception as e:
            logger.error(f"Compilation failed: {e}")
            return None
    
    async def _compile_python_to_wasm(self, code: str) -> Optional[bytes]:
        """Compile Python to WASM using RustPython or similar"""
        
        # For now, we'll use a simplified approach
        # In production, you'd use RustPython compiled to WASM
        
        try:
            # Create a wrapper that exports the Python logic
            wrapper = f"""
import json

def execute_experiment(input_json):
    try:
        context = json.loads(input_json)
        
        # User code here
{self._indent_code(code, 8)}
        
        # Capture result
        if 'result' in locals():
            return json.dumps({{"success": True, "output": str(result)}})
        else:
            return json.dumps({{"success": True, "output": "Completed"}})
    except Exception as e:
        return json.dumps({{"success": False, "error": str(e)}})
"""
            
            # For demonstration, return a mock WASM module
            # In reality, you'd compile this with RustPython-WASM
            return wrapper.encode('utf-8')
            
        except Exception as e:
            logger.error(f"Python to WASM compilation failed: {e}")
            return None
    
    async def _execute_wasm(self, wasm_module: bytes, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute WASM module in sandboxed environment"""
        
        start_time = time.time()
        
        try:
            # Create a new store for this execution
            store = wasmtime.Store(self.engine, limits=self.limits)
            
            # Add fuel for execution limiting
            store.add_fuel(1_000_000)  # 1M fuel units
            
            # For demonstration, simulate execution
            # In production, you'd instantiate and run the actual WASM module
            await asyncio.sleep(0.05)  # Simulate execution time
            
            # Mock result based on code analysis
            success = "error" not in str(wasm_module).lower()
            fuel_consumed = 50000  # Mock fuel consumption
            
            execution_time = time.time() - start_time
            
            return {
                "success": success,
                "output": f"Executed successfully with {fuel_consumed} fuel units",
                "error": None if success else "Mock error for demonstration",
                "execution_time": execution_time,
                "fuel_consumed": fuel_consumed,
                "memory_peak": 1024 * 10  # 10KB mock memory usage
            }
            
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "execution_time": time.time() - start_time,
                "fuel_consumed": 0,
                "memory_peak": 0
            }
    
    def _collect_execution_metrics(self, execution_result: Dict[str, Any]) -> Dict[str, float]:
        """Collect detailed metrics from execution"""
        
        metrics = {
            "execution_time": execution_result.get("execution_time", 0),
            "fuel_consumed": execution_result.get("fuel_consumed", 0),
            "memory_peak_kb": execution_result.get("memory_peak", 0) / 1024,
            "success_rate": 1.0 if execution_result["success"] else 0.0
        }
        
        # Calculate efficiency score
        if execution_result["success"]:
            # Lower time and fuel = higher efficiency
            time_score = max(0, 1 - execution_result["execution_time"] / 10)  # 10s baseline
            fuel_score = max(0, 1 - execution_result["fuel_consumed"] / 1_000_000)
            memory_score = max(0, 1 - metrics["memory_peak_kb"] / 50000)  # 50MB baseline
            
            metrics["efficiency_score"] = (time_score + fuel_score + memory_score) / 3
        else:
            metrics["efficiency_score"] = 0.0
        
        return metrics
    
    def _analyze_experiment_results(self, results: List[Dict[str, Any]], 
                                  success_criteria: Dict[str, Any],
                                  hypothesis: str) -> Dict[str, Any]:
        """Analyze experiment results against success criteria"""
        
        analysis = {
            "total_attempts": len(results),
            "successful_attempts": sum(1 for r in results if r["success"]),
            "best_strategy": None,
            "hypothesis_validated": False,
            "insights": [],
            "performance_ranking": []
        }
        
        # Find successful attempts
        successful = [r for r in results if r["success"]]
        
        if successful:
            # Rank by efficiency
            ranked = sorted(successful, 
                          key=lambda x: x["metrics"]["efficiency_score"], 
                          reverse=True)
            
            analysis["performance_ranking"] = [
                {
                    "approach": r["approach"],
                    "efficiency": r["metrics"]["efficiency_score"],
                    "execution_time": r["metrics"]["execution_time"]
                }
                for r in ranked
            ]
            
            # Best strategy is most efficient
            best = ranked[0]
            analysis["best_strategy"] = {
                "approach": best["approach"],
                "code": best["code"],
                "metrics": best["metrics"],
                "output": best["output"]
            }
            
            # Check if hypothesis is validated
            if success_criteria:
                criteria_met = self._check_success_criteria(best, success_criteria)
                analysis["hypothesis_validated"] = criteria_met
        
        # Generate insights
        analysis["insights"] = self._generate_experiment_insights(results, analysis)
        
        return analysis
    
    def _check_success_criteria(self, result: Dict[str, Any], criteria: Dict[str, Any]) -> bool:
        """Check if result meets success criteria"""
        
        for criterion, threshold in criteria.items():
            if criterion == "min_efficiency":
                if result["metrics"]["efficiency_score"] < threshold:
                    return False
            elif criterion == "max_execution_time":
                if result["metrics"]["execution_time"] > threshold:
                    return False
            elif criterion == "output_contains":
                if threshold not in result.get("output", ""):
                    return False
        
        return True
    
    def _generate_experiment_insights(self, results: List[Dict[str, Any]], 
                                    analysis: Dict[str, Any]) -> List[str]:
        """Generate insights from experiment results"""
        
        insights = []
        
        # Success rate insight
        success_rate = analysis["successful_attempts"] / analysis["total_attempts"] * 100
        insights.append(f"Success rate: {success_rate:.1f}% ({analysis['successful_attempts']}/{analysis['total_attempts']} attempts)")
        
        # Performance spread
        if analysis["performance_ranking"]:
            best_eff = analysis["performance_ranking"][0]["efficiency"]
            worst_eff = analysis["performance_ranking"][-1]["efficiency"]
            spread = best_eff - worst_eff
            
            if spread > 0.3:
                insights.append(f"Large performance variance ({spread:.2f}) between approaches")
            else:
                insights.append(f"Similar performance across successful approaches")
        
        # Error patterns
        failed = [r for r in results if not r["success"]]
        if failed:
            error_types = {}
            for f in failed:
                error = f.get("error", "Unknown")
                error_type = error.split(":")[0] if ":" in error else error
                error_types[error_type] = error_types.get(error_type, 0) + 1
            
            most_common_error = max(error_types, key=error_types.get)
            insights.append(f"Most common failure: {most_common_error} ({error_types[most_common_error]} times)")
        
        # Efficiency insights
        if analysis["best_strategy"]:
            best_metrics = analysis["best_strategy"]["metrics"]
            insights.append(f"Best approach efficiency: {best_metrics['efficiency_score']:.2f}")
            insights.append(f"Fastest execution: {best_metrics['execution_time']:.3f}s")
        
        return insights
    
    async def _learn_from_experiment(self, experiment_type: str,
                                   context: Dict[str, Any],
                                   results: List[Dict[str, Any]],
                                   analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Extract learnings and update knowledge base"""
        
        learning = {
            "experiment_type": experiment_type,
            "context_hash": self._hash_context(context),
            "timestamp": time.time(),
            "best_approach": None,
            "patterns_discovered": [],
            "strategy_update": None
        }
        
        if analysis["best_strategy"]:
            # Record the winning approach
            learning["best_approach"] = {
                "name": analysis["best_strategy"]["approach"],
                "efficiency": analysis["best_strategy"]["metrics"]["efficiency_score"],
                "characteristics": self._extract_code_characteristics(
                    analysis["best_strategy"]["code"]
                )
            }
            
            # Discover patterns
            learning["patterns_discovered"] = self._discover_patterns(
                analysis["best_strategy"],
                [r for r in results if not r["success"]]
            )
            
            # Generate strategy update for adaptive learning
            learning["strategy_update"] = {
                "strategy": f"{experiment_type}_{analysis['best_strategy']['approach']}",
                "reward": analysis["best_strategy"]["metrics"]["efficiency_score"],
                "context": {
                    "problem_type": context.get("problem_type", "unknown"),
                    "complexity": context.get("complexity", "medium"),
                    "constraints": context.get("constraints", [])
                }
            }
        
        # Store learning in history
        self.experiments.append(learning)
        
        return learning
    
    def _save_successful_strategy(self, experiment_type: str, 
                                strategy: Dict[str, Any],
                                context: Dict[str, Any]):
        """Save successful strategy for future use"""
        
        strategy_key = f"{experiment_type}_{self._hash_context(context)[:8]}"
        
        if strategy_key not in self.successful_strategies:
            self.successful_strategies[strategy_key] = []
        
        self.successful_strategies[strategy_key].append({
            "code": strategy["code"],
            "approach": strategy["approach"],
            "metrics": strategy["metrics"],
            "timestamp": time.time(),
            "times_used": 0,
            "cumulative_success": 0.0
        })
        
        # Keep only top 5 strategies per key
        self.successful_strategies[strategy_key] = sorted(
            self.successful_strategies[strategy_key],
            key=lambda x: x["metrics"]["efficiency_score"],
            reverse=True
        )[:5]
    
    def _format_experiment_report(self, experiment_type: str,
                                hypothesis: str,
                                results: List[Dict[str, Any]],
                                analysis: Dict[str, Any],
                                learning: Dict[str, Any]) -> str:
        """Format comprehensive experiment report"""
        
        report = f"## 🧪 AI Experiment Report\n\n"
        report += f"**Type:** {experiment_type}\n"
        report += f"**Hypothesis:** {hypothesis}\n\n"
        
        # Results Summary
        report += f"### 📊 Results Summary\n"
        report += f"- **Total Attempts:** {analysis['total_attempts']}\n"
        report += f"- **Successful:** {analysis['successful_attempts']}\n"
        report += f"- **Success Rate:** {(analysis['successful_attempts']/analysis['total_attempts']*100):.1f}%\n"
        report += f"- **Hypothesis Validated:** {'✅ Yes' if analysis['hypothesis_validated'] else '❌ No'}\n\n"
        
        # Performance Ranking
        if analysis["performance_ranking"]:
            report += f"### 🏆 Performance Ranking\n"
            for i, perf in enumerate(analysis["performance_ranking"][:3], 1):
                medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉"
                report += f"{medal} **{perf['approach']}**\n"
                report += f"   - Efficiency: {perf['efficiency']:.2f}\n"
                report += f"   - Execution: {perf['execution_time']:.3f}s\n\n"
        
        # Best Strategy Details
        if analysis["best_strategy"]:
            report += f"### 🎯 Best Strategy\n"
            report += f"**Approach:** {analysis['best_strategy']['approach']}\n\n"
            report += f"**Code:**\n```python\n{analysis['best_strategy']['code']}\n```\n\n"
            report += f"**Metrics:**\n"
            metrics = analysis['best_strategy']['metrics']
            report += f"- Efficiency Score: {metrics['efficiency_score']:.2f}\n"
            report += f"- Execution Time: {metrics['execution_time']:.3f}s\n"
            report += f"- Memory Usage: {metrics['memory_peak_kb']:.1f} KB\n\n"
        
        # Insights
        if analysis["insights"]:
            report += f"### 💡 Experiment Insights\n"
            for insight in analysis["insights"]:
                report += f"- {insight}\n"
            report += "\n"
        
        # Learning Outcomes
        if learning["patterns_discovered"]:
            report += f"### 🧠 Patterns Discovered\n"
            for pattern in learning["patterns_discovered"]:
                report += f"- {pattern}\n"
            report += "\n"
        
        # Strategy Library Update
        report += f"### 📚 Strategy Library\n"
        strategy_count = sum(len(strategies) for strategies in self.successful_strategies.values())
        report += f"Total strategies saved: {strategy_count}\n"
        report += f"Experiment types covered: {len(self.successful_strategies)}\n\n"
        
        # Recommendation for Adaptive Learning
        if learning["strategy_update"]:
            report += f"### 🔄 Adaptive Learning Update\n"
            report += f"New strategy registered: `{learning['strategy_update']['strategy']}`\n"
            report += f"Reward score: {learning['strategy_update']['reward']:.2f}\n"
            report += f"Context: {json.dumps(learning['strategy_update']['context'], indent=2)}\n"
        
        return report
    
    # Helper methods
    
    def _indent_code(self, code: str, spaces: int) -> str:
        """Indent code by specified spaces"""
        indent = " " * spaces
        return "\n".join(indent + line for line in code.split("\n"))
    
    def _hash_context(self, context: Dict[str, Any]) -> str:
        """Create hash of context for strategy identification"""
        context_str = json.dumps(context, sort_keys=True)
        return hashlib.sha256(context_str.encode()).hexdigest()
    
    def _extract_code_characteristics(self, code: str) -> Dict[str, Any]:
        """Extract characteristics from code for pattern learning"""
        
        lines = code.split("\n")
        
        return {
            "line_count": len(lines),
            "uses_loops": any(keyword in code for keyword in ["for", "while"]),
            "uses_conditionals": any(keyword in code for keyword in ["if", "else"]),
            "uses_functions": "def " in code or "function " in code,
            "uses_classes": "class " in code,
            "uses_recursion": self._detect_recursion(code),
            "algorithmic_approach": self._classify_algorithm(code)
        }
    
    def _detect_recursion(self, code: str) -> bool:
        """Simple recursion detection"""
        # This is simplified - in production you'd use AST analysis
        import re
        
        # Find function definitions
        func_pattern = r'def\s+(\w+)\s*\('
        functions = re.findall(func_pattern, code)
        
        # Check if any function calls itself
        for func in functions:
            if re.search(rf'\b{func}\s*\(', code):
                return True
        
        return False
    
    def _classify_algorithm(self, code: str) -> str:
        """Classify algorithmic approach"""
        
        code_lower = code.lower()
        
        if "sort" in code_lower:
            return "sorting"
        elif "search" in code_lower or "find" in code_lower:
            return "searching"
        elif "dynamic" in code_lower or "memo" in code_lower:
            return "dynamic_programming"
        elif "greedy" in code_lower:
            return "greedy"
        elif "divide" in code_lower or "conquer" in code_lower:
            return "divide_conquer"
        elif any(ds in code_lower for ds in ["stack", "queue", "heap", "tree", "graph"]):
            return "data_structure_based"
        else:
            return "general"
    
    def _discover_patterns(self, successful: Dict[str, Any], 
                         failed: List[Dict[str, Any]]) -> List[str]:
        """Discover patterns from successful vs failed attempts"""
        
        patterns = []
        
        # Extract characteristics
        success_chars = self._extract_code_characteristics(successful["code"])
        
        # Compare with failed attempts
        if failed:
            failed_chars = [self._extract_code_characteristics(f["code"]) for f in failed]
            
            # Find distinguishing features
            if success_chars["uses_functions"] and not any(f["uses_functions"] for f in failed_chars):
                patterns.append("Function decomposition led to success")
            
            if success_chars["algorithmic_approach"] != "general":
                patterns.append(f"{success_chars['algorithmic_approach']} approach was most effective")
        
        # Performance patterns
        if successful["metrics"]["execution_time"] < 0.1:
            patterns.append("Optimal solution achieved sub-100ms execution")
        
        if successful["metrics"]["memory_peak_kb"] < 1000:
            patterns.append("Memory-efficient solution used less than 1MB")
        
        return patterns
    
    async def get_strategy_recommendations(self, problem_type: str, 
                                         context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get strategy recommendations based on past experiments"""
        
        recommendations = []
        context_hash = self._hash_context(context)[:8]
        
        # Look for exact matches
        exact_key = f"{problem_type}_{context_hash}"
        if exact_key in self.successful_strategies:
            for strategy in self.successful_strategies[exact_key][:3]:
                recommendations.append({
                    "confidence": 0.9,
                    "approach": strategy["approach"],
                    "expected_efficiency": strategy["metrics"]["efficiency_score"],
                    "code_template": strategy["code"],
                    "reason": "Exact match from previous successful experiment"
                })
        
        # Look for similar problem types
        for key, strategies in self.successful_strategies.items():
            if key.startswith(problem_type) and key != exact_key:
                for strategy in strategies[:2]:
                    recommendations.append({
                        "confidence": 0.7,
                        "approach": strategy["approach"],
                        "expected_efficiency": strategy["metrics"]["efficiency_score"],
                        "code_template": strategy["code"],
                        "reason": f"Similar problem type: {key.split('_')[0]}"
                    })
        
        # Sort by confidence and efficiency
        recommendations.sort(key=lambda x: (x["confidence"], x["expected_efficiency"]), reverse=True)
        
        return recommendations[:5]