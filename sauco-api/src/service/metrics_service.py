import ast
import re
from typing import Dict, Any, List, Set

def count_methods(code: str) -> Dict[str, any]:
    """
    Count the number of methods/functions in a given code snippet and collect information about them.
    
    Args:
        code (str): The code snippet to analyze
        
    Returns:
        Dict[str, any]: A dictionary containing the method count and information about each method
    """
    try:
        # Try to parse the code as Python
        tree = ast.parse(code)
        methods = []
        
        # Collect function definitions and their line counts
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                # Calculate the number of lines in the function
                start_line = node.lineno
                end_line = 0
                
                # Find the last line of the function by examining the last node in the body
                for child in node.body:
                    # Get the end line of the child node
                    if hasattr(child, 'end_lineno') and child.end_lineno is not None:
                        end_line = max(end_line, child.end_lineno)
                    else:
                        # If end_lineno is not available, use lineno as a fallback
                        end_line = max(end_line, getattr(child, 'lineno', 0))
                
                # If we couldn't determine the end line, use the start line
                if end_line == 0:
                    end_line = start_line
                
                # Calculate the number of lines
                line_count = end_line - start_line + 1
                
                methods.append({
                    'name': node.name,
                    'start_line': start_line,
                    'end_line': end_line,
                    'line_count': line_count
                })
                
        return {
            'count': len(methods),
            'methods': methods
        }
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
        
        # For non-Python code, we can't easily determine method sizes
        # So we'll just return the count and an empty methods list
        return {
            'count': method_count,
            'methods': []
        }

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

class CyclomaticComplexityVisitor(ast.NodeVisitor):
    """
    AST visitor that calculates the cyclomatic complexity of a Python function.
    Cyclomatic complexity is calculated as:
    CC = E - N + 2P
    where:
    - E is the number of edges in the control flow graph
    - N is the number of nodes in the control flow graph
    - P is the number of connected components (usually 1 for a single function)
    
    For practical purposes, we can calculate it as:
    CC = 1 + <number of decision points>
    
    Decision points include:
    - if/elif statements
    - for/while loops
    - except blocks
    - boolean operations with short-circuit evaluation (and, or)
    """
    
    def __init__(self):
        self.complexity = 1  # Start with 1 (base complexity)
        self.functions: List[Dict[str, any]] = []
        self.current_function = None
    
    def visit_FunctionDef(self, node):
        old_function = self.current_function
        self.current_function = {
            'name': node.name,
            'complexity': 1,  # Start with 1 (base complexity)
            'lineno': node.lineno
        }
        
        # Visit all the statements in the function body
        for child in node.body:
            self.visit(child)
        
        # Save the function data
        self.functions.append(self.current_function)
        self.complexity += self.current_function['complexity'] - 1  # Add to total, subtract the base 1
        
        # Restore previous function context if we were in a nested function
        self.current_function = old_function
    
    def visit_AsyncFunctionDef(self, node):
        # Handle async functions the same way as regular functions
        self.visit_FunctionDef(node)
    
    def visit_If(self, node):
        # Each if/elif adds 1 to complexity
        if self.current_function:
            self.current_function['complexity'] += 1
        else:
            self.complexity += 1
        
        # Visit the test condition for boolean operators
        self.visit(node.test)
        
        # Visit the body and else/elif clauses
        for child in node.body:
            self.visit(child)
        for child in node.orelse:
            self.visit(child)
    
    def visit_For(self, node):
        # Each loop adds 1 to complexity
        if self.current_function:
            self.current_function['complexity'] += 1
        else:
            self.complexity += 1
        
        # Visit the body and else clause
        for child in node.body:
            self.visit(child)
        for child in node.orelse:
            self.visit(child)
    
    def visit_AsyncFor(self, node):
        # Handle async for loops the same way as regular for loops
        self.visit_For(node)
    
    def visit_While(self, node):
        # Each loop adds 1 to complexity
        if self.current_function:
            self.current_function['complexity'] += 1
        else:
            self.complexity += 1
        
        # Visit the test condition for boolean operators
        self.visit(node.test)
        
        # Visit the body and else clause
        for child in node.body:
            self.visit(child)
        for child in node.orelse:
            self.visit(child)
    
    def visit_Try(self, node):
        # Each except handler adds 1 to complexity
        if self.current_function:
            self.current_function['complexity'] += len(node.handlers)
        else:
            self.complexity += len(node.handlers)
        
        # Visit the body, handlers, else, and finally clauses
        for child in node.body:
            self.visit(child)
        for handler in node.handlers:
            self.visit(handler)
        for child in node.orelse:
            self.visit(child)
        for child in node.finalbody:
            self.visit(child)
    
    def visit_BoolOp(self, node):
        # Each boolean operator (and, or) adds 1 to complexity due to short-circuit evaluation
        if isinstance(node.op, (ast.And, ast.Or)):
            if self.current_function:
                self.current_function['complexity'] += len(node.values) - 1
            else:
                self.complexity += len(node.values) - 1
        
        # Visit the values
        for value in node.values:
            self.visit(value)

def calculate_cyclomatic_complexity(code: str) -> Dict[str, any]:
    """
    Calculate the cyclomatic complexity of a given code snippet.
    
    Args:
        code (str): The code snippet to analyze
        
    Returns:
        Dict[str, any]: A dictionary containing the total complexity and per-function complexity
    """
    try:
        # Try to parse the code as Python
        tree = ast.parse(code)
        visitor = CyclomaticComplexityVisitor()
        visitor.visit(tree)
        
        # Return the total complexity and per-function complexity
        return {
            "total": visitor.complexity,
            "functions": visitor.functions
        }
    except SyntaxError:
        # If the code is not valid Python, use regex as a fallback
        # This is less accurate but can work for other languages
        
        # Pattern for decision points in various languages
        patterns = [
            # if statements
            r'if\s*\(',
            r'if\s+[^(]',  # Python style if without parentheses
            # else if, elif variations
            r'else\s+if\s*\(',
            r'elif\s+',
            # loops
            r'for\s*\(',
            r'for\s+[^(]',  # Python style for without parentheses
            r'while\s*\(',
            r'while\s+[^(]',  # Python style while without parentheses
            r'do\s*{',
            # try-catch
            r'catch\s*\(',
            r'except\s+',
            # boolean operators (rough approximation)
            r'\s+&&\s+',
            r'\s+\|\|\s+',
            r'\s+and\s+',
            r'\s+or\s+'
        ]
        
        # Count decision points
        decision_points = 0
        for pattern in patterns:
            decision_points += len(re.findall(pattern, code))
        
        # Cyclomatic complexity = 1 + decision points
        complexity = 1 + decision_points
        
        return {
            "total": complexity,
            "functions": []  # Can't determine per-function complexity with regex
        }

def calculate_average_method_size(code: str) -> float:
    """
    Calculate the average number of lines of code per method in a given code snippet.
    
    Args:
        code (str): The code snippet to analyze
        
    Returns:
        float: The average number of lines of code per method
    """
    methods_info = count_methods(code)
    
    if methods_info['count'] == 0:
        return 0.0
    
    # If we have detailed method information (Python code)
    if methods_info['methods']:
        total_lines = sum(method['line_count'] for method in methods_info['methods'])
        return total_lines / methods_info['count']
    
    # For non-Python code, we can make a rough estimate
    # by counting the total lines and dividing by the number of methods
    lines = code.split('\n')
    non_empty_lines = [line for line in lines if line.strip()]
    
    # Avoid division by zero
    if methods_info['count'] == 0:
        return 0.0
    
    return len(non_empty_lines) / methods_info['count']

class MaxNestingVisitor(ast.NodeVisitor):
    """
    AST visitor that calculates the maximum nesting level in Python code.
    
    Nesting is tracked for:
    - if/elif/else blocks
    - for/while loops
    - try/except blocks
    - function/class definitions
    """
    
    def __init__(self):
        self.current_nesting = 0
        self.max_nesting = 0
    
    def _update_max_nesting(self):
        if self.current_nesting > self.max_nesting:
            self.max_nesting = self.current_nesting
    
    def _visit_nested_block(self, node_body):
        self.current_nesting += 1
        self._update_max_nesting()
        
        for child in node_body:
            self.visit(child)
        
        self.current_nesting -= 1
    
    def visit_FunctionDef(self, node):
        self._visit_nested_block(node.body)
    
    def visit_AsyncFunctionDef(self, node):
        self._visit_nested_block(node.body)
    
    def visit_ClassDef(self, node):
        self._visit_nested_block(node.body)
    
    def visit_If(self, node):
        self._visit_nested_block(node.body)
        if node.orelse:
            self._visit_nested_block(node.orelse)
    
    def visit_For(self, node):
        self._visit_nested_block(node.body)
        if node.orelse:
            self._visit_nested_block(node.orelse)
    
    def visit_AsyncFor(self, node):
        self._visit_nested_block(node.body)
        if node.orelse:
            self._visit_nested_block(node.orelse)
    
    def visit_While(self, node):
        self._visit_nested_block(node.body)
        if node.orelse:
            self._visit_nested_block(node.orelse)
    
    def visit_Try(self, node):
        self._visit_nested_block(node.body)
        
        for handler in node.handlers:
            self._visit_nested_block(handler.body)
        
        if node.orelse:
            self._visit_nested_block(node.orelse)
        
        if node.finalbody:
            self._visit_nested_block(node.finalbody)
    
    def visit_With(self, node):
        self._visit_nested_block(node.body)
    
    def visit_AsyncWith(self, node):
        self._visit_nested_block(node.body)

def calculate_max_nesting(code: str) -> int:
    """
    Calculate the maximum nesting level in a given code snippet.
    
    Nesting is tracked for control structures like:
    - if/elif/else blocks
    - for/while loops
    - try/except blocks
    - function/class definitions
    
    Args:
        code (str): The code snippet to analyze
        
    Returns:
        int: The maximum nesting level found in the code
    """
    try:
        # Try to parse the code as Python
        tree = ast.parse(code)
        visitor = MaxNestingVisitor()
        visitor.visit(tree)
        
        return visitor.max_nesting
    except SyntaxError:
        # If the code is not valid Python, use regex as a fallback
        # This is less accurate but can work for other languages
        
        # We'll count indentation levels as a proxy for nesting
        lines = code.split('\n')
        max_indent = 0
        
        for line in lines:
            if line.strip():  # Skip empty lines
                # Count leading spaces/tabs
                indent = len(line) - len(line.lstrip())
                # Estimate the nesting level based on indentation
                # Assuming 2-4 spaces or 1 tab per level
                estimated_nesting = indent // 2  # Conservative estimate
                max_indent = max(max_indent, estimated_nesting)
        
        return max_indent

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
    methods_info = count_methods(code)
    metrics["method_number"] = methods_info['count']
    
    # Count if statements
    metrics["number_of_ifs"] = count_ifs(code)
    
    # Count loops
    metrics["number_of_loops"] = count_loops(code)
    
    # Calculate cyclomatic complexity
    complexity = calculate_cyclomatic_complexity(code)
    metrics["cyclomatic_complexity"] = complexity["total"]
    
    # Calculate average method size
    metrics["average_method_size"] = calculate_average_method_size(code)
    
    # Calculate maximum nesting level
    metrics["max_nesting"] = calculate_max_nesting(code)
    
    # Additional metrics can be added here in the future
    
    return metrics
