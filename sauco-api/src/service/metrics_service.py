import ast
import re
from typing import Dict, Any

def count_methods(code: str) -> int:
    """
    Count the number of methods/functions in a given code snippet.
    
    Args:
        code (str): The code snippet to analyze
        
    Returns:
        int: The number of methods/functions found in the code
    """
    try:
        # Try to parse the code as Python
        tree = ast.parse(code)
        method_count = 0
        
        # Count function definitions
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                method_count += 1
                
        return method_count
    except SyntaxError:
        # If the code is not valid Python, use regex as a fallback
        # This is less accurate but can work for other languages
        
        # Pattern for common method/function definitions in various languages
        # This covers Python, JavaScript, Java, C#, C++, etc.
        patterns = [
            # Python, JavaScript, etc.: def function_name or function function_name
            r'(def|function)\s+\w+\s*\(',
            # Java, C#, C++, etc.: return_type function_name
            r'(\w+\s+)+\w+\s*\([^)]*\)\s*{',
            # Arrow functions in JavaScript
            r'(const|let|var)?\s*\w+\s*=\s*(\([^)]*\)|[^=]*)\s*=>\s*[{(]'
        ]
        
        method_count = 0
        for pattern in patterns:
            method_count += len(re.findall(pattern, code))
            
        return method_count

def calculate_metrics(code: str) -> Dict[str, Any]:
    """
    Calculate various metrics for a given code snippet.
    
    Args:
        code (str): The code snippet to analyze
        
    Returns:
        Dict[str, Any]: A dictionary containing the calculated metrics
    """
    metrics = {}
    
    # Count methods
    metrics["method_number"] = count_methods(code)
    
    # Additional metrics can be added here in the future
    
    return metrics
