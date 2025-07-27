"""
Task Evolution Tool - Biological evolution-inspired task optimization and strategy development
"""

import asyncio
import random
from typing import Any, Dict, List, Tuple
from loguru import logger
import numpy as np


class TaskEvolutionTool:
    """
    Evolve and optimize task approaches using biological evolution principles
    """
    
    def __init__(self, core_bridge):
        self.core_bridge = core_bridge
        self.name = "guru_task_evolution"
        
        # Evolution parameters
        self.population_size = 8
        self.generations_per_cycle = 5
        self.mutation_rate = 0.2
        self.crossover_rate = 0.7
        self.elite_size = 2
        
        # Strategy gene pool for different domains
        self.strategy_genes = {
            "efficiency": ["batch_processing", "parallel_execution", "caching", "optimization", "automation", "streamline", "eliminate_waste"],
            "quality": ["validation", "testing", "review", "refinement", "standards", "best_practices", "continuous_improvement"],
            "innovation": ["brainstorming", "experimentation", "prototyping", "iteration", "creative_thinking", "disruption", "novel_approaches"],
            "balanced": ["systematic_approach", "risk_management", "stakeholder_input", "iterative_development", "feedback_loops", "adaptive_planning"]
        }
        
        # Fitness evaluation criteria
        self.fitness_criteria = {
            "feasibility": 0.25,
            "effectiveness": 0.35,
            "resource_efficiency": 0.20,
            "innovation_potential": 0.20
        }
        
    async def execute(self, args: Dict[str, Any]) -> str:
        """Execute task evolution to optimize approaches"""
        objective = args.get("objective", "")
        constraints = args.get("constraints", [])
        current_approach = args.get("current_approach", "")
        evolution_pressure = args.get("evolution_pressure", "balanced")
        
        if not objective:
            return "## Error\n\nNo objective provided for task evolution"
            
        try:
            logger.info(f"Evolving task approaches for: {objective[:50]}...")
            
            # Perform evolutionary optimization
            evolution_result = await self._evolve_task_approaches(objective, constraints, current_approach, evolution_pressure)
            
            # Format results
            return self._format_evolution_result(evolution_result, objective, evolution_pressure)
            
        except Exception as e:
            logger.error(f"Task evolution failed: {e}")
            return f"## Error\n\nTask evolution failed: {str(e)}"
    
    async def _evolve_task_approaches(self, objective: str, constraints: List[str], current_approach: str, evolution_pressure: str) -> Dict[str, Any]:
        """Run evolutionary algorithm to optimize task approaches"""
        
        # Initialize population
        population = self._initialize_population(objective, current_approach, evolution_pressure)
        
        evolution_history = []
        best_fitness_history = []
        
        # Evolutionary cycles
        for generation in range(self.generations_per_cycle):
            logger.info(f"Evolution generation {generation + 1}/{self.generations_per_cycle}")
            
            # Evaluate fitness of each individual
            fitness_scores = []
            for individual in population:
                fitness = await self._evaluate_fitness(individual, objective, constraints, evolution_pressure)
                fitness_scores.append(fitness)
                individual["fitness"] = fitness
            
            # Track best fitness
            best_fitness = max(fitness_scores)
            best_fitness_history.append(best_fitness)
            
            # Record generation
            generation_info = {
                "generation": generation + 1,
                "population_size": len(population),
                "best_fitness": best_fitness,
                "average_fitness": np.mean(fitness_scores),
                "diversity_score": self._calculate_diversity(population)
            }
            evolution_history.append(generation_info)
            
            # Selection and reproduction
            if generation < self.generations_per_cycle - 1:  # Don't evolve on last generation
                population = await self._evolve_population(population, fitness_scores, evolution_pressure)
            
            # Small delay to simulate evolution time
            await asyncio.sleep(0.1)
        
        # Select final results
        population.sort(key=lambda x: x["fitness"], reverse=True)
        
        return {
            "final_population": population,
            "best_approaches": population[:3],
            "evolution_history": evolution_history,
            "fitness_progression": best_fitness_history,
            "convergence_analysis": self._analyze_convergence(best_fitness_history),
            "strategy_diversity": self._analyze_strategy_diversity(population),
            "optimization_insights": self._generate_optimization_insights(population, evolution_history)
        }
    
    def _initialize_population(self, objective: str, current_approach: str, evolution_pressure: str) -> List[Dict[str, Any]]:
        """Initialize population of task approaches"""
        population = []
        
        # Include current approach if provided
        if current_approach:
            population.append(self._create_individual_from_approach(current_approach, objective, is_baseline=True))
        
        # Generate diverse initial population
        gene_pool = self.strategy_genes.get(evolution_pressure, self.strategy_genes["balanced"])
        
        for i in range(self.population_size - len(population)):
            individual = self._create_random_individual(objective, gene_pool, evolution_pressure)
            population.append(individual)
        
        return population
    
    def _create_individual_from_approach(self, approach: str, objective: str, is_baseline: bool = False) -> Dict[str, Any]:
        """Create individual from existing approach"""
        # Extract strategy components from approach description
        approach_lower = approach.lower()
        
        strategies = []
        for pressure, genes in self.strategy_genes.items():
            for gene in genes:
                if gene.replace("_", " ") in approach_lower or gene in approach_lower:
                    strategies.append(gene)
        
        # If no strategies detected, assign generic ones
        if not strategies:
            strategies = ["systematic_approach", "iterative_development", "feedback_loops"]
        
        return {
            "id": f"baseline_approach" if is_baseline else f"derived_{random.randint(1000, 9999)}",
            "strategies": strategies[:4],  # Limit to 4 strategies
            "approach_description": approach,
            "implementation_steps": self._generate_implementation_steps(strategies, objective),
            "resource_requirements": self._estimate_resource_requirements(strategies),
            "risk_factors": self._identify_risk_factors(strategies, objective),
            "innovation_score": self._calculate_innovation_score(strategies),
            "is_baseline": is_baseline,
            "fitness": 0.0
        }
    
    def _create_random_individual(self, objective: str, gene_pool: List[str], evolution_pressure: str) -> Dict[str, Any]:
        """Create random individual with genetic diversity"""
        
        # Select 3-5 strategies randomly
        num_strategies = random.randint(3, 5)
        strategies = random.sample(gene_pool, min(num_strategies, len(gene_pool)))
        
        # Add some cross-pollination from other gene pools
        if random.random() < 0.3:
            other_pools = [pool for key, pool in self.strategy_genes.items() if key != evolution_pressure]
            if other_pools:
                other_gene = random.choice(random.choice(other_pools))
                if other_gene not in strategies:
                    strategies.append(other_gene)
        
        individual_id = f"individual_{random.randint(1000, 9999)}"
        
        return {
            "id": individual_id,
            "strategies": strategies,
            "approach_description": self._generate_approach_description(strategies, objective),
            "implementation_steps": self._generate_implementation_steps(strategies, objective),
            "resource_requirements": self._estimate_resource_requirements(strategies),
            "risk_factors": self._identify_risk_factors(strategies, objective),
            "innovation_score": self._calculate_innovation_score(strategies),
            "is_baseline": False,
            "fitness": 0.0
        }
    
    def _generate_approach_description(self, strategies: List[str], objective: str) -> str:
        """Generate human-readable approach description"""
        strategy_descriptions = {
            "batch_processing": "process items in batches for efficiency",
            "parallel_execution": "execute tasks simultaneously",
            "caching": "store and reuse previous results",
            "optimization": "continuously improve performance",
            "automation": "automate repetitive tasks",
            "validation": "validate results at each step",
            "testing": "thoroughly test all components",
            "brainstorming": "generate creative solutions",
            "experimentation": "try different approaches",
            "systematic_approach": "follow structured methodology",
            "iterative_development": "develop through iterations",
            "feedback_loops": "incorporate continuous feedback"
        }
        
        descriptions = [strategy_descriptions.get(s, f"apply {s.replace('_', ' ')}") for s in strategies]
        
        if len(descriptions) <= 2:
            return f"To achieve '{objective}', {' and '.join(descriptions)}"
        else:
            return f"To achieve '{objective}', {', '.join(descriptions[:-1])}, and {descriptions[-1]}"
    
    def _generate_implementation_steps(self, strategies: List[str], objective: str) -> List[str]:
        """Generate implementation steps based on strategies"""
        steps = []
        
        # Strategy-specific step patterns
        step_patterns = {
            "systematic_approach": ["Define clear requirements", "Create detailed plan", "Establish milestones"],
            "iterative_development": ["Create initial prototype", "Gather feedback", "Refine and improve"],
            "automation": ["Identify automation opportunities", "Implement automated processes", "Monitor and optimize"],
            "testing": ["Design test cases", "Execute comprehensive testing", "Validate results"],
            "optimization": ["Baseline current performance", "Identify bottlenecks", "Implement optimizations"],
            "brainstorming": ["Gather diverse perspectives", "Generate multiple ideas", "Evaluate and select best options"]
        }
        
        for strategy in strategies:
            if strategy in step_patterns:
                steps.extend(step_patterns[strategy])
        
        # Add generic steps if too few
        if len(steps) < 3:
            steps.extend([
                "Analyze current situation",
                "Develop solution approach", 
                "Implement and monitor progress"
            ])
        
        # Remove duplicates while preserving order
        seen = set()
        unique_steps = []
        for step in steps:
            if step not in seen:
                seen.add(step)
                unique_steps.append(step)
        
        return unique_steps[:6]  # Limit to 6 steps
    
    def _estimate_resource_requirements(self, strategies: List[str]) -> Dict[str, str]:
        """Estimate resource requirements for strategies"""
        
        # Resource intensity mapping
        resource_intensity = {
            "automation": {"time": "high", "complexity": "high", "expertise": "medium"},
            "testing": {"time": "medium", "complexity": "medium", "expertise": "medium"},
            "optimization": {"time": "medium", "complexity": "high", "expertise": "high"},
            "brainstorming": {"time": "low", "complexity": "low", "expertise": "low"},
            "systematic_approach": {"time": "medium", "complexity": "medium", "expertise": "medium"},
            "experimentation": {"time": "high", "complexity": "medium", "expertise": "medium"}
        }
        
        # Aggregate requirements
        time_levels = []
        complexity_levels = []
        expertise_levels = []
        
        level_values = {"low": 1, "medium": 2, "high": 3}
        
        for strategy in strategies:
            if strategy in resource_intensity:
                reqs = resource_intensity[strategy]
                time_levels.append(level_values[reqs["time"]])
                complexity_levels.append(level_values[reqs["complexity"]])
                expertise_levels.append(level_values[reqs["expertise"]])
        
        # Default to medium if no matches
        if not time_levels:
            return {"time": "medium", "complexity": "medium", "expertise": "medium"}
        
        value_to_level = {1: "low", 2: "medium", 3: "high"}
        
        return {
            "time": value_to_level[round(np.mean(time_levels))],
            "complexity": value_to_level[round(np.mean(complexity_levels))],
            "expertise": value_to_level[round(np.mean(expertise_levels))]
        }
    
    def _identify_risk_factors(self, strategies: List[str], objective: str) -> List[str]:
        """Identify potential risk factors"""
        risks = []
        
        risk_mapping = {
            "automation": ["Technical complexity", "Initial setup time", "Dependency on tools"],
            "experimentation": ["Uncertain outcomes", "Resource consumption", "Time overruns"],
            "optimization": ["Over-engineering", "Premature optimization", "Complexity increase"],
            "brainstorming": ["Analysis paralysis", "Lack of focus", "Too many options"],
            "parallel_execution": ["Coordination overhead", "Resource conflicts", "Synchronization issues"]
        }
        
        for strategy in strategies:
            if strategy in risk_mapping:
                risks.extend(risk_mapping[strategy])
        
        # Add generic risks
        risks.extend(["Scope creep", "Resource constraints", "Timeline pressure"])
        
        # Remove duplicates and limit
        return list(set(risks))[:5]
    
    def _calculate_innovation_score(self, strategies: List[str]) -> float:
        """Calculate innovation potential score"""
        
        innovation_weights = {
            "experimentation": 0.9,
            "brainstorming": 0.8,
            "prototyping": 0.8,
            "creative_thinking": 0.9,
            "disruption": 1.0,
            "novel_approaches": 0.9,
            "automation": 0.6,
            "optimization": 0.5,
            "systematic_approach": 0.3,
            "testing": 0.3,
            "validation": 0.2
        }
        
        scores = [innovation_weights.get(strategy, 0.5) for strategy in strategies]
        
        # Bonus for diverse strategies
        diversity_bonus = min(0.2, len(set(strategies)) * 0.05)
        
        base_score = np.mean(scores) if scores else 0.5
        return min(1.0, base_score + diversity_bonus)
    
    async def _evaluate_fitness(self, individual: Dict[str, Any], objective: str, constraints: List[str], evolution_pressure: str) -> float:
        """Evaluate fitness of an individual approach"""
        
        strategies = individual["strategies"]
        resources = individual["resource_requirements"]
        risks = individual["risk_factors"]
        innovation = individual["innovation_score"]
        
        # Feasibility score (based on resource requirements)
        feasibility = self._calculate_feasibility_score(resources, constraints)
        
        # Effectiveness score (based on strategy alignment with objective)
        effectiveness = self._calculate_effectiveness_score(strategies, objective, evolution_pressure)
        
        # Resource efficiency score
        resource_efficiency = self._calculate_resource_efficiency_score(resources, len(strategies))
        
        # Innovation potential
        innovation_potential = innovation
        
        # Weighted fitness calculation
        fitness = (
            feasibility * self.fitness_criteria["feasibility"] +
            effectiveness * self.fitness_criteria["effectiveness"] +
            resource_efficiency * self.fitness_criteria["resource_efficiency"] +
            innovation_potential * self.fitness_criteria["innovation_potential"]
        )
        
        # Small random factor for diversity
        fitness += 0.02 * random.random() - 0.01
        
        return max(0.0, min(1.0, fitness))
    
    def _calculate_feasibility_score(self, resources: Dict[str, str], constraints: List[str]) -> float:
        """Calculate feasibility based on resource requirements and constraints"""
        
        # Penalty for high resource requirements
        resource_penalty = 0.0
        level_penalties = {"low": 0.0, "medium": 0.1, "high": 0.2}
        
        for resource_type, level in resources.items():
            resource_penalty += level_penalties.get(level, 0.1)
        
        # Additional penalty if constraints mention resource limitations
        constraint_penalty = 0.0
        constraint_text = " ".join(constraints).lower()
        
        if "limited time" in constraint_text or "tight deadline" in constraint_text:
            if resources.get("time") == "high":
                constraint_penalty += 0.2
        
        if "limited budget" in constraint_text or "low cost" in constraint_text:
            if resources.get("complexity") == "high":
                constraint_penalty += 0.15
        
        if "limited expertise" in constraint_text or "simple solution" in constraint_text:
            if resources.get("expertise") == "high":
                constraint_penalty += 0.2
        
        feasibility = 1.0 - (resource_penalty / 3.0) - constraint_penalty
        return max(0.0, min(1.0, feasibility))
    
    def _calculate_effectiveness_score(self, strategies: List[str], objective: str, evolution_pressure: str) -> float:
        """Calculate effectiveness based on strategy-objective alignment"""
        
        objective_lower = objective.lower()
        
        # Strategy-objective alignment scores
        effectiveness_scores = []
        
        for strategy in strategies:
            score = 0.5  # Base score
            
            # Keyword matching
            if "efficiency" in objective_lower or "optimize" in objective_lower:
                if strategy in ["optimization", "automation", "streamline", "batch_processing"]:
                    score += 0.3
            
            if "quality" in objective_lower or "improve" in objective_lower:
                if strategy in ["testing", "validation", "review", "best_practices"]:
                    score += 0.3
            
            if "innovative" in objective_lower or "creative" in objective_lower:
                if strategy in ["brainstorming", "experimentation", "creative_thinking"]:
                    score += 0.3
            
            if "fast" in objective_lower or "quick" in objective_lower:
                if strategy in ["parallel_execution", "automation", "streamline"]:
                    score += 0.2
            
            # Evolution pressure alignment
            pressure_alignment = {
                "efficiency": ["optimization", "automation", "streamline", "batch_processing"],
                "quality": ["testing", "validation", "review", "best_practices"],
                "innovation": ["brainstorming", "experimentation", "creative_thinking", "prototyping"],
                "balanced": ["systematic_approach", "iterative_development", "feedback_loops"]
            }
            
            if strategy in pressure_alignment.get(evolution_pressure, []):
                score += 0.2
            
            effectiveness_scores.append(min(1.0, score))
        
        return np.mean(effectiveness_scores) if effectiveness_scores else 0.5
    
    def _calculate_resource_efficiency_score(self, resources: Dict[str, str], num_strategies: int) -> float:
        """Calculate resource efficiency score"""
        
        # Penalty for resource intensity
        level_values = {"low": 1, "medium": 2, "high": 3}
        resource_intensity = sum(level_values[level] for level in resources.values()) / (3 * len(resources))
        
        # Penalty for too many strategies (complexity)
        strategy_penalty = max(0, (num_strategies - 4) * 0.1)
        
        efficiency = 1.0 - (resource_intensity - 1) / 2 - strategy_penalty
        return max(0.0, min(1.0, efficiency))
    
    async def _evolve_population(self, population: List[Dict[str, Any]], fitness_scores: List[float], evolution_pressure: str) -> List[Dict[str, Any]]:
        """Evolve population through selection, crossover, and mutation"""
        
        # Sort by fitness
        population_with_fitness = list(zip(population, fitness_scores))
        population_with_fitness.sort(key=lambda x: x[1], reverse=True)
        
        new_population = []
        
        # Elitism - keep best individuals
        for i in range(self.elite_size):
            elite = population_with_fitness[i][0].copy()
            elite["id"] = f"elite_{i+1}_{random.randint(100, 999)}"
            new_population.append(elite)
        
        # Fill rest through crossover and mutation
        gene_pool = self.strategy_genes.get(evolution_pressure, self.strategy_genes["balanced"])
        
        while len(new_population) < self.population_size:
            # Selection (tournament selection)
            parent1 = self._tournament_selection(population_with_fitness)
            parent2 = self._tournament_selection(population_with_fitness)
            
            # Crossover
            if random.random() < self.crossover_rate:
                child = self._crossover(parent1, parent2, gene_pool)
            else:
                child = parent1.copy()
            
            # Mutation
            if random.random() < self.mutation_rate:
                child = self._mutate(child, gene_pool)
            
            child["id"] = f"gen_child_{random.randint(1000, 9999)}"
            child["fitness"] = 0.0
            child["is_baseline"] = False
            
            new_population.append(child)
        
        return new_population[:self.population_size]
    
    def _tournament_selection(self, population_with_fitness: List[Tuple], tournament_size: int = 3) -> Dict[str, Any]:
        """Tournament selection for parent selection"""
        tournament = random.sample(population_with_fitness, min(tournament_size, len(population_with_fitness)))
        winner = max(tournament, key=lambda x: x[1])
        return winner[0]
    
    def _crossover(self, parent1: Dict[str, Any], parent2: Dict[str, Any], gene_pool: List[str]) -> Dict[str, Any]:
        """Create offspring through strategy crossover"""
        
        # Combine strategies from both parents
        combined_strategies = list(set(parent1["strategies"] + parent2["strategies"]))
        
        # Select subset for child (3-5 strategies)
        num_strategies = random.randint(3, min(5, len(combined_strategies)))
        child_strategies = random.sample(combined_strategies, num_strategies)
        
        # Create child
        child = {
            "strategies": child_strategies,
            "approach_description": "",  # Will be regenerated
            "implementation_steps": [],
            "resource_requirements": {},
            "risk_factors": [],
            "innovation_score": 0.0,
            "is_baseline": False,
            "fitness": 0.0
        }
        
        # Regenerate derived properties
        objective = "optimization task"  # Generic objective for crossover
        child["approach_description"] = self._generate_approach_description(child_strategies, objective)
        child["implementation_steps"] = self._generate_implementation_steps(child_strategies, objective)
        child["resource_requirements"] = self._estimate_resource_requirements(child_strategies)
        child["risk_factors"] = self._identify_risk_factors(child_strategies, objective)
        child["innovation_score"] = self._calculate_innovation_score(child_strategies)
        
        return child
    
    def _mutate(self, individual: Dict[str, Any], gene_pool: List[str]) -> Dict[str, Any]:
        """Mutate individual by modifying strategies"""
        
        mutated = individual.copy()
        strategies = mutated["strategies"].copy()
        
        # Different types of mutations
        mutation_type = random.choice(["add", "remove", "replace"])
        
        if mutation_type == "add" and len(strategies) < 5:
            # Add new strategy
            available_strategies = [s for s in gene_pool if s not in strategies]
            if available_strategies:
                strategies.append(random.choice(available_strategies))
        
        elif mutation_type == "remove" and len(strategies) > 3:
            # Remove random strategy
            strategies.remove(random.choice(strategies))
        
        elif mutation_type == "replace":
            # Replace random strategy
            if strategies:
                old_strategy = random.choice(strategies)
                available_strategies = [s for s in gene_pool if s not in strategies]
                if available_strategies:
                    strategies[strategies.index(old_strategy)] = random.choice(available_strategies)
        
        # Update mutated individual
        mutated["strategies"] = strategies
        
        # Regenerate derived properties
        objective = "optimization task"
        mutated["approach_description"] = self._generate_approach_description(strategies, objective)
        mutated["implementation_steps"] = self._generate_implementation_steps(strategies, objective)
        mutated["resource_requirements"] = self._estimate_resource_requirements(strategies)
        mutated["risk_factors"] = self._identify_risk_factors(strategies, objective)
        mutated["innovation_score"] = self._calculate_innovation_score(strategies)
        
        return mutated
    
    def _calculate_diversity(self, population: List[Dict[str, Any]]) -> float:
        """Calculate population diversity score"""
        
        all_strategies = []
        for individual in population:
            all_strategies.extend(individual["strategies"])
        
        unique_strategies = set(all_strategies)
        total_strategies = len(all_strategies)
        
        if total_strategies == 0:
            return 0.0
        
        diversity = len(unique_strategies) / total_strategies
        return diversity
    
    def _analyze_convergence(self, fitness_history: List[float]) -> Dict[str, Any]:
        """Analyze convergence characteristics"""
        
        if len(fitness_history) < 2:
            return {"converged": False, "improvement_rate": 0.0, "plateau_detected": False}
        
        # Calculate improvement rate
        total_improvement = fitness_history[-1] - fitness_history[0]
        improvement_rate = total_improvement / len(fitness_history)
        
        # Check for plateau (last 3 generations)
        plateau_detected = False
        if len(fitness_history) >= 3:
            recent_changes = [abs(fitness_history[i] - fitness_history[i-1]) for i in range(-2, 0)]
            plateau_detected = all(change < 0.01 for change in recent_changes)
        
        # Check convergence
        converged = fitness_history[-1] > 0.8 or plateau_detected
        
        return {
            "converged": converged,
            "improvement_rate": improvement_rate,
            "plateau_detected": plateau_detected,
            "total_improvement": total_improvement,
            "final_fitness": fitness_history[-1]
        }
    
    def _analyze_strategy_diversity(self, population: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze strategy diversity in final population"""
        
        strategy_counts = {}
        total_individuals = len(population)
        
        for individual in population:
            for strategy in individual["strategies"]:
                strategy_counts[strategy] = strategy_counts.get(strategy, 0) + 1
        
        # Calculate diversity metrics
        unique_strategies = len(strategy_counts)
        most_common = max(strategy_counts.items(), key=lambda x: x[1]) if strategy_counts else ("none", 0)
        diversity_index = unique_strategies / max(1, sum(strategy_counts.values())) * total_individuals
        
        return {
            "unique_strategies": unique_strategies,
            "most_common_strategy": most_common[0],
            "most_common_frequency": most_common[1],
            "diversity_index": diversity_index,
            "strategy_distribution": strategy_counts
        }
    
    def _generate_optimization_insights(self, population: List[Dict[str, Any]], evolution_history: List[Dict[str, Any]]) -> List[str]:
        """Generate insights from the evolutionary process"""
        
        insights = []
        
        # Fitness insights
        best_fitness = population[0]["fitness"]
        if best_fitness > 0.8:
            insights.append("Evolution converged to high-quality solutions with excellent fitness scores")
        elif best_fitness > 0.6:
            insights.append("Evolution produced good solutions with room for further optimization")
        else:
            insights.append("Evolution showed limited improvement - consider adjusting constraints or objectives")
        
        # Strategy insights
        common_strategies = {}
        for individual in population[:3]:  # Top 3 individuals
            for strategy in individual["strategies"]:
                common_strategies[strategy] = common_strategies.get(strategy, 0) + 1
        
        if common_strategies:
            top_strategy = max(common_strategies.items(), key=lambda x: x[1])
            insights.append(f"Strategy '{top_strategy[0].replace('_', ' ')}' emerged as most successful across top solutions")
        
        # Diversity insights
        if len(evolution_history) > 0:
            final_diversity = evolution_history[-1]["diversity_score"]
            if final_diversity > 0.7:
                insights.append("High population diversity maintained throughout evolution - good exploration")
            elif final_diversity < 0.3:
                insights.append("Population converged to similar solutions - strong selective pressure detected")
        
        # Resource insights
        resource_patterns = {}
        for individual in population[:3]:
            for resource, level in individual["resource_requirements"].items():
                if resource not in resource_patterns:
                    resource_patterns[resource] = []
                resource_patterns[resource].append(level)
        
        for resource, levels in resource_patterns.items():
            if levels.count("low") >= 2:
                insights.append(f"Top solutions favor low {resource} requirements - efficiency-focused evolution")
        
        return insights[:5]  # Limit to 5 insights
    
    def _format_evolution_result(self, evolution: Dict[str, Any], objective: str, evolution_pressure: str) -> str:
        """Format the evolution results for presentation"""
        
        result = f"## 🧬 Guru Task Evolution\n\n"
        result += f"**Objective:** {objective}\n"
        result += f"**Evolution Pressure:** {evolution_pressure}\n"
        result += f"**Generations:** {len(evolution['evolution_history'])}\n"
        result += f"**Final Best Fitness:** {evolution['best_approaches'][0]['fitness']:.2f}/1.0\n\n"
        
        # Best Evolved Approaches
        result += f"### 🏆 Top Evolved Approaches\n"
        for i, approach in enumerate(evolution["best_approaches"], 1):
            fitness_emoji = "🥇" if i == 1 else "🥈" if i == 2 else "🥉"
            result += f"{fitness_emoji} **Approach {i}** (Fitness: {approach['fitness']:.2f})\n"
            result += f"   {approach['approach_description']}\n"
            result += f"   *Strategies: {', '.join(approach['strategies'])}*\n"
            result += f"   *Innovation Score: {approach['innovation_score']:.2f}*\n\n"
        
        # Implementation Plan for Best Approach
        best_approach = evolution["best_approaches"][0]
        result += f"### 📋 Implementation Plan (Best Approach)\n"
        for i, step in enumerate(best_approach["implementation_steps"], 1):
            result += f"{i}. {step}\n"
        result += "\n"
        
        # Resource Requirements
        resources = best_approach["resource_requirements"]
        result += f"### 📊 Resource Requirements\n"
        for resource, level in resources.items():
            level_emoji = "🔴" if level == "high" else "🟡" if level == "medium" else "🟢"
            result += f"- {level_emoji} **{resource.title()}:** {level}\n"
        result += "\n"
        
        # Risk Assessment
        if best_approach["risk_factors"]:
            result += f"### ⚠️ Risk Factors\n"
            for risk in best_approach["risk_factors"]:
                result += f"- {risk}\n"
            result += "\n"
        
        # Evolution Analytics
        convergence = evolution["convergence_analysis"]
        result += f"### 📈 Evolution Analytics\n"
        result += f"- **Convergence:** {'✅ Yes' if convergence['converged'] else '❌ No'}\n"
        result += f"- **Improvement Rate:** {convergence['improvement_rate']:.3f} per generation\n"
        result += f"- **Total Improvement:** {convergence['total_improvement']:.2f}\n"
        result += f"- **Plateau Detected:** {'Yes' if convergence['plateau_detected'] else 'No'}\n\n"
        
        # Strategy Diversity
        diversity = evolution["strategy_diversity"]
        result += f"### 🌈 Strategy Diversity\n"
        result += f"- **Unique Strategies:** {diversity['unique_strategies']}\n"
        result += f"- **Most Successful:** {diversity['most_common_strategy'].replace('_', ' ')}\n"
        result += f"- **Diversity Index:** {diversity['diversity_index']:.2f}\n\n"
        
        # Optimization Insights
        insights = evolution["optimization_insights"]
        if insights:
            result += f"### 💡 Evolution Insights\n"
            for i, insight in enumerate(insights, 1):
                result += f"{i}. {insight}\n"
            result += "\n"
        
        result += f"---\n"
        result += f"*Task evolution uses biological evolution principles to optimize approaches through selection, crossover, and mutation across multiple generations.*"
        
        return result