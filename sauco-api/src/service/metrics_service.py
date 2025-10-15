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

def count_ifs(code: str) -> int:
    """
    Count the number of if statements in a given code snippet.
    
    Args:
        code (str): The code snippet to analyze
        
    Returns:
        int: The number of if statements found in the code
    """
    try:
        # Try to parse the code as Python
        tree = ast.parse(code)
        if_count = 0
        
        # Count if statements
        for node in ast.walk(tree):
            if isinstance(node, ast.If):
                if_count += 1
                
        return if_count
    except SyntaxError:
        # If the code is not valid Python, use regex as a fallback
        # This is less accurate but can work for other languages
        
        # Pattern for common if statements in various languages
        # This covers Python, JavaScript, Java, C#, C++, etc.
        patterns = [
            # if statement with condition
            r'if\s*\(',
            r'if\s+[^(]',  # Python style if without parentheses
            # else if, elif variations
            r'else\s+if\s*\(',
            r'elif\s+'
        ]
        
        if_count = 0
        for pattern in patterns:
            if_count += len(re.findall(pattern, code))
            
        return if_count

def count_loops(code: str) -> int:
    """
    Count the number of loops in a given code snippet.
    
    Args:
        code (str): The code snippet to analyze
        
    Returns:
        int: The number of loops found in the code
    """
    try:
        # Try to parse the code as Python
        tree = ast.parse(code)
        loop_count = 0
        
        # Count loop statements (for, while)
        for node in ast.walk(tree):
            if isinstance(node, (ast.For, ast.While)):
                loop_count += 1
                
        return loop_count
    except SyntaxError:
        # If the code is not valid Python, use regex as a fallback
        # This is less accurate but can work for other languages
        
        # Pattern for common loop statements in various languages
        # This covers Python, JavaScript, Java, C#, C++, etc.
        patterns = [
            # for loops
            r'for\s*\(',
            r'for\s+[^(]',  # Python style for without parentheses
            # while loops
            r'while\s*\(',
            r'while\s+[^(]',  # Python style while without parentheses
            # do-while loops
            r'do\s*{',
            # forEach and other iterator methods in JavaScript
            r'\.forEach\s*\(',
            r'\.map\s*\(',
            r'\.filter\s*\(',
            r'\.reduce\s*\('
        ]
        
        loop_count = 0
        for pattern in patterns:
            loop_count += len(re.findall(pattern, code))
            
        return loop_count

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
    
    # Count if statements
    metrics["number_of_ifs"] = count_ifs(code)
    
    # Count loops
    metrics["number_of_loops"] = count_loops(code)
    
    # Additional metrics can be added here in the future
    
    return metrics
