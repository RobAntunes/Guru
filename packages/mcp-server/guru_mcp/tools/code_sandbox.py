"""
Code Execution Sandbox Tool - Safe execution environment for AI experimentation
"""

import asyncio
import tempfile
import subprocess
import sys
import os
import json
import time
import resource
import signal
import platform
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
import ast
import traceback
from loguru import logger
import docker
from contextlib import contextmanager
import psutil


class CodeSandboxTool:
    """
    Provides a secure sandbox environment for AI models to execute code experiments
    """
    
    def __init__(self, core_bridge):
        self.core_bridge = core_bridge
        self.name = "guru_code_sandbox"
        
        # Sandbox configuration
        self.config = {
            "max_execution_time": 30,  # seconds
            "max_memory_mb": 512,
            "max_cpu_percent": 50,
            "allowed_modules": [
                "math", "statistics", "itertools", "collections", 
                "json", "re", "datetime", "random", "functools",
                "typing", "dataclasses", "enum", "abc"
            ],
            "forbidden_modules": [
                "os", "sys", "subprocess", "socket", "requests",
                "urllib", "__builtins__", "eval", "exec", "compile",
                "open", "file", "input", "__import__"
            ]
        }
        
        # Docker client for containerized execution
        self.docker_available = self._check_docker_availability()
        if self.docker_available:
            try:
                self.docker_client = docker.from_env()
                logger.info("Docker available for sandboxed execution")
            except Exception as e:
                logger.warning(f"Docker not accessible: {e}")
                self.docker_available = False
        
        # Execution history for learning
        self.execution_history = []
        
    def _check_docker_availability(self) -> bool:
        """Check if Docker is available on the system"""
        try:
            result = subprocess.run(
                ["docker", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except Exception:
            return False
    
    async def execute(self, args: Dict[str, Any]) -> str:
        """Execute code in a secure sandbox"""
        code = args.get("code", "")
        language = args.get("language", "python")
        experiment_type = args.get("experiment_type", "general")
        context = args.get("context", {})
        use_docker = args.get("use_docker", True) and self.docker_available
        
        if not code:
            return "## Error\n\nNo code provided for execution"
        
        try:
            logger.info(f"Executing {language} code in sandbox (docker={use_docker})")
            
            # Validate code before execution
            validation_result = self._validate_code(code, language)
            if not validation_result["safe"]:
                return self._format_validation_error(validation_result)
            
            # Execute code in appropriate sandbox
            if language == "python":
                if use_docker:
                    result = await self._execute_python_docker(code, context)
                else:
                    result = await self._execute_python_process(code, context)
            elif language == "javascript":
                if use_docker:
                    result = await self._execute_javascript_docker(code, context)
                else:
                    result = await self._execute_javascript_process(code, context)
            else:
                return f"## Error\n\nLanguage '{language}' not supported. Supported: python, javascript"
            
            # Record execution for learning
            self._record_execution(code, language, experiment_type, result)
            
            # Format and return results
            return self._format_execution_result(result, language, experiment_type)
            
        except Exception as e:
            logger.error(f"Sandbox execution failed: {e}")
            return f"## Error\n\nSandbox execution failed: {str(e)}"
    
    def _validate_code(self, code: str, language: str) -> Dict[str, Any]:
        """Validate code for safety before execution"""
        
        if language == "python":
            return self._validate_python_code(code)
        elif language == "javascript":
            return self._validate_javascript_code(code)
        else:
            return {"safe": False, "reason": f"Unknown language: {language}"}
    
    def _validate_python_code(self, code: str) -> Dict[str, Any]:
        """Validate Python code for safety"""
        
        try:
            # Parse the code into AST
            tree = ast.parse(code)
            
            # Check for forbidden constructs
            for node in ast.walk(tree):
                # Check imports
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        module_name = alias.name.split('.')[0]
                        if module_name in self.config["forbidden_modules"]:
                            return {
                                "safe": False,
                                "reason": f"Forbidden module import: {module_name}"
                            }
                
                # Check from imports
                elif isinstance(node, ast.ImportFrom):
                    module = node.module or ""
                    base_module = module.split('.')[0]
                    if base_module in self.config["forbidden_modules"]:
                        return {
                            "safe": False,
                            "reason": f"Forbidden module import: {base_module}"
                        }
                
                # Check for eval/exec calls
                elif isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Name):
                        if node.func.id in ["eval", "exec", "compile", "__import__"]:
                            return {
                                "safe": False,
                                "reason": f"Forbidden function call: {node.func.id}"
                            }
                
                # Check for file operations
                elif isinstance(node, ast.Name):
                    if node.id in ["open", "file"]:
                        return {
                            "safe": False,
                            "reason": f"File operations not allowed: {node.id}"
                        }
            
            return {"safe": True, "ast": tree}
            
        except SyntaxError as e:
            return {
                "safe": False,
                "reason": f"Syntax error: {str(e)}",
                "line": e.lineno,
                "offset": e.offset
            }
        except Exception as e:
            return {
                "safe": False,
                "reason": f"Validation error: {str(e)}"
            }
    
    def _validate_javascript_code(self, code: str) -> Dict[str, Any]:
        """Validate JavaScript code for safety"""
        
        # Basic pattern matching for dangerous constructs
        dangerous_patterns = [
            r'require\s*\(',
            r'import\s+.*from',
            r'eval\s*\(',
            r'Function\s*\(',
            r'setTimeout\s*\(',
            r'setInterval\s*\(',
            r'fs\.',
            r'child_process',
            r'process\.',
            r'__dirname',
            r'__filename'
        ]
        
        import re
        for pattern in dangerous_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                return {
                    "safe": False,
                    "reason": f"Forbidden pattern detected: {pattern}"
                }
        
        return {"safe": True}
    
    async def _execute_python_docker(self, code: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Python code in Docker container"""
        
        start_time = time.time()
        
        try:
            # Create temporary directory for code
            with tempfile.TemporaryDirectory() as tmpdir:
                code_file = Path(tmpdir) / "experiment.py"
                
                # Prepare code with context
                full_code = self._prepare_python_code(code, context)
                code_file.write_text(full_code)
                
                # Run in Docker container
                container = self.docker_client.containers.run(
                    "python:3.9-slim",
                    command=f"python /code/experiment.py",
                    volumes={tmpdir: {"bind": "/code", "mode": "ro"}},
                    mem_limit=f"{self.config['max_memory_mb']}m",
                    cpu_percent=self.config['max_cpu_percent'],
                    network_mode="none",  # No network access
                    remove=True,
                    stdout=True,
                    stderr=True,
                    detach=False,
                    timeout=self.config['max_execution_time']
                )
                
                execution_time = time.time() - start_time
                
                # Decode output
                if isinstance(container, bytes):
                    output = container.decode('utf-8')
                else:
                    output = str(container)
                
                return {
                    "success": True,
                    "output": output,
                    "error": None,
                    "execution_time": execution_time,
                    "sandbox_type": "docker"
                }
                
        except docker.errors.ContainerError as e:
            return {
                "success": False,
                "output": e.stdout.decode('utf-8') if e.stdout else "",
                "error": e.stderr.decode('utf-8') if e.stderr else str(e),
                "execution_time": time.time() - start_time,
                "sandbox_type": "docker"
            }
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "execution_time": time.time() - start_time,
                "sandbox_type": "docker"
            }
    
    async def _execute_python_process(self, code: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Python code in restricted subprocess"""
        
        start_time = time.time()
        
        try:
            # Create temporary file for code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                full_code = self._prepare_python_code(code, context)
                f.write(full_code)
                f.flush()
                
                # Set up restricted environment
                env = os.environ.copy()
                env['PYTHONPATH'] = ''  # Clear Python path
                
                # Run in subprocess with restrictions
                if platform.system() != 'Windows':
                    # Unix-like systems: use resource limits
                    def limit_resources():
                        # Set memory limit
                        resource.setrlimit(
                            resource.RLIMIT_AS,
                            (self.config['max_memory_mb'] * 1024 * 1024,
                             self.config['max_memory_mb'] * 1024 * 1024)
                        )
                        # Set CPU time limit
                        resource.setrlimit(
                            resource.RLIMIT_CPU,
                            (self.config['max_execution_time'],
                             self.config['max_execution_time'])
                        )
                    
                    process = await asyncio.create_subprocess_exec(
                        sys.executable, '-u', f.name,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        env=env,
                        preexec_fn=limit_resources
                    )
                else:
                    # Windows: basic subprocess without resource limits
                    process = await asyncio.create_subprocess_exec(
                        sys.executable, '-u', f.name,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        env=env
                    )
                
                # Wait for completion with timeout
                try:
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(),
                        timeout=self.config['max_execution_time']
                    )
                    
                    execution_time = time.time() - start_time
                    
                    return {
                        "success": process.returncode == 0,
                        "output": stdout.decode('utf-8'),
                        "error": stderr.decode('utf-8') if stderr else None,
                        "execution_time": execution_time,
                        "sandbox_type": "process"
                    }
                    
                except asyncio.TimeoutError:
                    process.terminate()
                    await process.wait()
                    
                    return {
                        "success": False,
                        "output": "",
                        "error": f"Execution timeout ({self.config['max_execution_time']}s)",
                        "execution_time": self.config['max_execution_time'],
                        "sandbox_type": "process"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "execution_time": time.time() - start_time,
                "sandbox_type": "process"
            }
        finally:
            # Clean up temp file
            if 'f' in locals():
                try:
                    os.unlink(f.name)
                except:
                    pass
    
    async def _execute_javascript_docker(self, code: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute JavaScript code in Docker container"""
        
        start_time = time.time()
        
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                code_file = Path(tmpdir) / "experiment.js"
                
                # Prepare code with context
                full_code = self._prepare_javascript_code(code, context)
                code_file.write_text(full_code)
                
                # Run in Docker container
                container = self.docker_client.containers.run(
                    "node:16-slim",
                    command=f"node /code/experiment.js",
                    volumes={tmpdir: {"bind": "/code", "mode": "ro"}},
                    mem_limit=f"{self.config['max_memory_mb']}m",
                    cpu_percent=self.config['max_cpu_percent'],
                    network_mode="none",
                    remove=True,
                    stdout=True,
                    stderr=True,
                    detach=False,
                    timeout=self.config['max_execution_time']
                )
                
                execution_time = time.time() - start_time
                
                if isinstance(container, bytes):
                    output = container.decode('utf-8')
                else:
                    output = str(container)
                
                return {
                    "success": True,
                    "output": output,
                    "error": None,
                    "execution_time": execution_time,
                    "sandbox_type": "docker"
                }
                
        except docker.errors.ContainerError as e:
            return {
                "success": False,
                "output": e.stdout.decode('utf-8') if e.stdout else "",
                "error": e.stderr.decode('utf-8') if e.stderr else str(e),
                "execution_time": time.time() - start_time,
                "sandbox_type": "docker"
            }
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "execution_time": time.time() - start_time,
                "sandbox_type": "docker"
            }
    
    async def _execute_javascript_process(self, code: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute JavaScript code in restricted subprocess"""
        
        start_time = time.time()
        
        try:
            # Check if node is available
            node_check = subprocess.run(["node", "--version"], capture_output=True)
            if node_check.returncode != 0:
                return {
                    "success": False,
                    "output": "",
                    "error": "Node.js not available on system",
                    "execution_time": 0,
                    "sandbox_type": "process"
                }
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                full_code = self._prepare_javascript_code(code, context)
                f.write(full_code)
                f.flush()
                
                # Run in subprocess
                process = await asyncio.create_subprocess_exec(
                    'node', f.name,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                
                try:
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(),
                        timeout=self.config['max_execution_time']
                    )
                    
                    execution_time = time.time() - start_time
                    
                    return {
                        "success": process.returncode == 0,
                        "output": stdout.decode('utf-8'),
                        "error": stderr.decode('utf-8') if stderr else None,
                        "execution_time": execution_time,
                        "sandbox_type": "process"
                    }
                    
                except asyncio.TimeoutError:
                    process.terminate()
                    await process.wait()
                    
                    return {
                        "success": False,
                        "output": "",
                        "error": f"Execution timeout ({self.config['max_execution_time']}s)",
                        "execution_time": self.config['max_execution_time'],
                        "sandbox_type": "process"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "execution_time": time.time() - start_time,
                "sandbox_type": "process"
            }
        finally:
            if 'f' in locals():
                try:
                    os.unlink(f.name)
                except:
                    pass
    
    def _prepare_python_code(self, code: str, context: Dict[str, Any]) -> str:
        """Prepare Python code with context and safety wrapper"""
        
        # Build allowed imports
        allowed_imports = "\n".join([
            f"import {module}" for module in self.config["allowed_modules"]
        ])
        
        # Build context variables
        context_setup = ""
        if context:
            context_setup = "# Context variables\n"
            for key, value in context.items():
                if isinstance(value, str):
                    context_setup += f"{key} = {repr(value)}\n"
                else:
                    context_setup += f"{key} = {value}\n"
        
        # Wrap code with safety measures
        wrapped_code = f"""
# Sandbox environment - limited imports
{allowed_imports}

# Disable dangerous built-ins
__builtins__['eval'] = None
__builtins__['exec'] = None
__builtins__['compile'] = None
__builtins__['open'] = None
__builtins__['__import__'] = None

{context_setup}

# User code
{code}
"""
        
        return wrapped_code
    
    def _prepare_javascript_code(self, code: str, context: Dict[str, Any]) -> str:
        """Prepare JavaScript code with context and safety wrapper"""
        
        # Build context variables
        context_setup = ""
        if context:
            context_setup = "// Context variables\n"
            for key, value in context.items():
                if isinstance(value, str):
                    context_setup += f"const {key} = {json.dumps(value)};\n"
                else:
                    context_setup += f"const {key} = {json.dumps(value)};\n"
        
        # Wrap code with safety measures
        wrapped_code = f"""
// Sandbox environment - restricted execution
'use strict';

// Disable dangerous globals
global.require = undefined;
global.process = undefined;
global.eval = undefined;
global.Function = undefined;

{context_setup}

// User code
{code}
"""
        
        return wrapped_code
    
    def _record_execution(self, code: str, language: str, experiment_type: str, result: Dict[str, Any]):
        """Record execution for learning purposes"""
        
        execution_record = {
            "timestamp": time.time(),
            "code": code,
            "language": language,
            "experiment_type": experiment_type,
            "success": result["success"],
            "execution_time": result["execution_time"],
            "sandbox_type": result["sandbox_type"],
            "error_type": self._classify_error(result["error"]) if result["error"] else None
        }
        
        self.execution_history.append(execution_record)
        
        # Keep only recent history
        max_history = 1000
        if len(self.execution_history) > max_history:
            self.execution_history = self.execution_history[-max_history:]
    
    def _classify_error(self, error: str) -> str:
        """Classify error type for learning"""
        
        if "SyntaxError" in error:
            return "syntax_error"
        elif "NameError" in error:
            return "name_error"
        elif "TypeError" in error:
            return "type_error"
        elif "ValueError" in error:
            return "value_error"
        elif "timeout" in error.lower():
            return "timeout"
        elif "memory" in error.lower():
            return "memory_limit"
        else:
            return "other"
    
    def _format_validation_error(self, validation_result: Dict[str, Any]) -> str:
        """Format validation error for display"""
        
        result = "## ❌ Code Validation Failed\n\n"
        result += f"**Reason:** {validation_result['reason']}\n\n"
        
        if "line" in validation_result:
            result += f"**Location:** Line {validation_result['line']}"
            if "offset" in validation_result:
                result += f", Column {validation_result['offset']}"
            result += "\n\n"
        
        result += "### Safety Guidelines\n\n"
        result += "The sandbox enforces these restrictions:\n"
        result += "- No file system access\n"
        result += "- No network operations\n"
        result += "- No system calls or process spawning\n"
        result += "- Limited memory and CPU usage\n"
        result += f"- Maximum execution time: {self.config['max_execution_time']}s\n\n"
        
        result += "### Allowed Modules\n"
        result += ", ".join(self.config["allowed_modules"])
        
        return result
    
    def _format_execution_result(self, result: Dict[str, Any], language: str, experiment_type: str) -> str:
        """Format execution result for display"""
        
        if result["success"]:
            output = f"## ✅ Code Execution Successful\n\n"
        else:
            output = f"## ❌ Code Execution Failed\n\n"
        
        output += f"**Language:** {language}\n"
        output += f"**Experiment Type:** {experiment_type}\n"
        output += f"**Sandbox Type:** {result['sandbox_type']}\n"
        output += f"**Execution Time:** {result['execution_time']:.3f}s\n\n"
        
        if result["output"]:
            output += "### Output\n```\n"
            output += result["output"]
            if not result["output"].endswith('\n'):
                output += '\n'
            output += "```\n\n"
        
        if result["error"]:
            output += "### Error\n```\n"
            output += result["error"]
            if not result["error"].endswith('\n'):
                output += '\n'
            output += "```\n\n"
        
        # Add execution statistics
        output += self._get_execution_statistics()
        
        return output
    
    def _get_execution_statistics(self) -> str:
        """Get execution statistics for learning insights"""
        
        if not self.execution_history:
            return ""
        
        stats = "### Execution Statistics\n\n"
        
        # Success rate
        successful = sum(1 for e in self.execution_history if e["success"])
        total = len(self.execution_history)
        success_rate = (successful / total * 100) if total > 0 else 0
        
        stats += f"- **Total Executions:** {total}\n"
        stats += f"- **Success Rate:** {success_rate:.1f}%\n"
        
        # Average execution time
        exec_times = [e["execution_time"] for e in self.execution_history if e["success"]]
        if exec_times:
            avg_time = sum(exec_times) / len(exec_times)
            stats += f"- **Avg Execution Time:** {avg_time:.3f}s\n"
        
        # Common error types
        errors = [e["error_type"] for e in self.execution_history if e["error_type"]]
        if errors:
            from collections import Counter
            error_counts = Counter(errors)
            stats += f"- **Common Errors:** {', '.join(f'{k} ({v})' for k, v in error_counts.most_common(3))}\n"
        
        # Language distribution
        lang_counts = Counter(e["language"] for e in self.execution_history)
        if lang_counts:
            stats += f"- **Languages Used:** {', '.join(f'{k} ({v})' for k, v in lang_counts.items())}\n"
        
        return stats
    
    async def get_learning_insights(self) -> Dict[str, Any]:
        """Get insights from execution history for adaptive learning"""
        
        if not self.execution_history:
            return {
                "total_executions": 0,
                "insights": []
            }
        
        # Analyze execution patterns
        insights = []
        
        # Success patterns by experiment type
        experiment_types = {}
        for exec in self.execution_history:
            exp_type = exec["experiment_type"]
            if exp_type not in experiment_types:
                experiment_types[exp_type] = {"success": 0, "total": 0}
            
            experiment_types[exp_type]["total"] += 1
            if exec["success"]:
                experiment_types[exp_type]["success"] += 1
        
        for exp_type, stats in experiment_types.items():
            success_rate = stats["success"] / stats["total"] * 100
            insights.append({
                "type": "experiment_success_rate",
                "experiment_type": exp_type,
                "success_rate": success_rate,
                "total_experiments": stats["total"]
            })
        
        # Error patterns
        error_patterns = {}
        for exec in self.execution_history:
            if exec["error_type"]:
                error_type = exec["error_type"]
                if error_type not in error_patterns:
                    error_patterns[error_type] = 0
                error_patterns[error_type] += 1
        
        if error_patterns:
            insights.append({
                "type": "common_errors",
                "errors": error_patterns,
                "recommendation": "Focus on avoiding " + max(error_patterns, key=error_patterns.get)
            })
        
        # Performance insights
        exec_times = [e["execution_time"] for e in self.execution_history[-100:]]
        if exec_times:
            insights.append({
                "type": "performance",
                "avg_execution_time": sum(exec_times) / len(exec_times),
                "min_time": min(exec_times),
                "max_time": max(exec_times)
            })
        
        return {
            "total_executions": len(self.execution_history),
            "recent_success_rate": sum(1 for e in self.execution_history[-20:] if e["success"]) / min(20, len(self.execution_history)) * 100,
            "insights": insights
        }