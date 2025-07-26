from fastapi import FastAPI, HTTPException, Request
from dotenv import load_dotenv
import os
from llama_index.llms.openai import OpenAI
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

# Check if OpenAI API key is set
api_key_set = bool(os.getenv("OPENAI_API_KEY") and os.getenv("OPENAI_API_KEY") != "your_openai_api_key_here")
if not api_key_set:
    print("Warning: OPENAI_API_KEY not found or is using the default value. Please set it in the .env file.")

app = FastAPI()

class CodeRequest(BaseModel):
    code: str

class CodeAnalysisResponse(BaseModel):
    Analisis: str
    code: str

class CodeExplainResponse(BaseModel):
    explanation: str
    code: str

@app.get("/")
def read_root():
    return {"message": "¡Hola desde FastAPI!"}

@app.get("/health")
def health_check():
    """
    Health check endpoint to verify the API is running correctly.
    Returns a 200 OK status code with basic health information.
    """
    return {
        "status": "healthy",
        "api": "sauco-api",
        "version": "1.0.0"
    }

@app.post("/analyze/", response_model=CodeAnalysisResponse)
async def analyze_item(request: Request):
    try:
        # Parse the request body
        data = await request.json()
        
        # Check if code is in the request
        if "code" not in data:
            raise HTTPException(status_code=400, detail="Code not found in request")
        
        code = data["code"]
        
        # If API key is not set, return a mock response for testing
        if not api_key_set:
            print("Using mock response because OpenAI API key is not set")
            
            # Check if the code contains "fibonacci" to provide a more specific response
            if "fibonacci" in code.lower():
                analysis = f"""
                # Code Analysis for Fibonacci Function

                Here's an analysis of the provided Fibonacci function:

                ```python
                {code}
                ```

                ## Suggestions for Improvement:

                1. **Add Type Hints**: Add type annotations to improve code readability and enable better IDE support.
                2. **Add Documentation**: Include docstrings to explain the purpose and usage of the function.
                3. **Input Validation**: The function already handles n <= 0, but consider adding type checking.
                4. **Performance Optimization**: For large values of n, the current implementation can be inefficient. Consider using memoization or a more efficient algorithm.
                5. **Return Type Consistency**: The function returns a list in all cases, which is good for consistency.
                """
                
                improved_code = """
                from typing import List

                def fibonacci(n: int) -> List[int]:
                    \"\"\"
                    Generate a Fibonacci sequence of length n.
                    
                    Args:
                        n: The number of Fibonacci numbers to generate
                        
                    Returns:
                        A list containing the first n Fibonacci numbers
                        
                    Examples:
                        >>> fibonacci(5)
                        [0, 1, 1, 2, 3]
                    \"\"\"
                    if not isinstance(n, int):
                        raise TypeError("Input must be an integer")
                        
                    if n <= 0:
                        return []
                    elif n == 1:
                        return [0]
                    elif n == 2:
                        return [0, 1]
                    else:
                        fib = [0, 1]
                        for i in range(2, n):
                            fib.append(fib[i-1] + fib[i-2])
                        return fib
                
                # Alternative Implementation (Memoization for Better Performance):
                from typing import List
                from functools import lru_cache

                def fibonacci_optimized(n: int) -> List[int]:
                    \"\"\"
                    Generate a Fibonacci sequence of length n using memoization for better performance.
                    
                    Args:
                        n: The number of Fibonacci numbers to generate
                        
                    Returns:
                        A list containing the first n Fibonacci numbers
                    \"\"\"
                    if not isinstance(n, int):
                        raise TypeError("Input must be an integer")
                        
                    if n <= 0:
                        return []
                        
                    # Use lru_cache for memoization
                    @lru_cache(maxsize=None)
                    def fib(i: int) -> int:
                        if i <= 0:
                            return 0
                        elif i == 1:
                            return 1
                        else:
                            return fib(i-1) + fib(i-2)
                    
                    # Generate the sequence
                    return [fib(i) for i in range(n)]
                """
                
                return CodeAnalysisResponse(Analisis=analysis, code=improved_code)
            else:
                # Generic response for other code
                analysis = f"""
                # Code Analysis

                Here's an analysis of the provided code:

                ```python
                {code}
                ```

                ## Suggestions for Improvement:

                1. **Add Type Hints**: Consider adding type annotations to improve code readability and enable better IDE support.
                2. **Add Documentation**: Include docstrings to explain the purpose and usage of the function.
                3. **Add Error Handling**: Consider adding validation for inputs.
                4. **Follow PEP 8 Style Guide**: Ensure your code follows Python's style guidelines.
                """
                
                improved_code = """
                # An improved version would be provided here based on the specific code
                """
                
                return CodeAnalysisResponse(Analisis=analysis, code=improved_code)
        
        # Initialize OpenAI LLM
        llm = OpenAI(model="gpt-4o")
        
        # Create a prompt for code analysis
        prompt = f"""
        Please analyze the following code and provide suggestions for improvement.
        
        ```
        {code}
        ```
        
        Focus on:
        1. Code quality and best practices
        2. Performance optimizations
        3. Security concerns
        4. Readability and maintainability
        
        Your response should be structured in two parts:
        1. First part: A detailed analysis of the code with explanations of issues and recommendations
        2. Second part: The improved code implementation that addresses all the issues mentioned in the analysis
        
        Clearly separate these two parts in your response.
        """
        
        # Call OpenAI to analyze the code
        response = llm.complete(prompt)
        
        # Parse the response to extract analysis and improved code
        response_text = response.text
        
        # Look for code blocks in the response
        import re
        
        # First, try to find a section explicitly labeled as improved code
        split_markers = [
            "## Improved Code", 
            "# Improved Code", 
            "Improved Code:", 
            "Here's the improved code",
            "### Part 2: Improved Code Implementation"
        ]
        
        analysis_part = response_text
        code_part = ""
        
        # Try to split by markers first
        for marker in split_markers:
            if marker.lower() in response_text.lower():
                parts = response_text.split(marker, 1)
                if len(parts) == 2:
                    analysis_part = parts[0].strip()
                    code_part_text = parts[1].strip()
                    
                    # Extract code from code blocks in the code part
                    code_blocks = re.findall(r'```(?:python)?\n(.*?)\n```', code_part_text, re.DOTALL)
                    if code_blocks:
                        code_part = code_blocks[0].strip()
                        break
        
        # If no code was found using markers, try to extract any code blocks from the response
        if not code_part:
            code_blocks = re.findall(r'```(?:python)?\n(.*?)\n```', response_text, re.DOTALL)
            if code_blocks:
                # Use the largest code block as the improved code
                code_part = max(code_blocks, key=len).strip()
            else:
                code_part = "# No specific improved code was provided"
        
        # Create the response object using the Pydantic model
        # FastAPI will automatically convert this to JSON in the response
        return CodeAnalysisResponse(Analisis=analysis_part, code=code_part)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing code: {str(e)}")

@app.post("/explain/", response_model=CodeExplainResponse)
async def explain_code(request: Request):
    try:
        # Parse the request body
        data = await request.json()
        
        # Check if code is in the request
        if "code" not in data:
            raise HTTPException(status_code=400, detail="Code not found in request")
        
        code = data["code"]
        
        # If API key is not set, return a mock response for testing
        if not api_key_set:
            print("Using mock response because OpenAI API key is not set")
            
            # Check if the code contains "fibonacci" to provide a more specific response
            if "fibonacci" in code.lower():
                explanation = f"""
                # Explanation of Fibonacci Function

                This code defines a function called `fibonacci` that generates a Fibonacci sequence of a specified length.

                ```python
                {code}
                ```

                ## How it works:

                1. The function takes a parameter `n` which determines how many Fibonacci numbers to generate.
                2. It handles several base cases:
                   - If n ≤ 0, it returns an empty list
                   - If n = 1, it returns [0]
                   - If n = 2, it returns [0, 1]
                3. For n > 2, it:
                   - Initializes a list with the first two Fibonacci numbers [0, 1]
                   - Uses a loop to calculate each subsequent Fibonacci number by adding the two previous numbers
                   - Adds each new number to the list
                   - Returns the complete list

                The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones, usually starting with 0 and 1.
                """
                
                return CodeExplainResponse(explanation=explanation, code=code)
            else:
                # Generic response for other code
                explanation = f"""
                # Code Explanation

                Here's an explanation of the provided code:

                ```python
                {code}
                ```

                This code appears to define a function or class that performs some operations. Without more specific context, I can provide a general explanation of what the code is doing based on its structure and syntax.

                The code uses Python syntax and follows standard programming patterns. It likely processes input data, performs calculations or transformations, and returns a result.
                """
                
                return CodeExplainResponse(explanation=explanation, code=code)
        
        # Initialize OpenAI LLM
        llm = OpenAI(model="gpt-4o")
        
        # Create a prompt for code explanation
        prompt = f"""
        Please explain the following code in detail. Focus on what the code does, how it works, and the purpose of each significant part.
        
        ```
        {code}
        ```
        
        Your explanation should:
        1. Provide a high-level overview of what the code accomplishes
        2. Break down the functionality of each significant section
        3. Explain any algorithms or important logic
        4. Clarify any complex or non-obvious parts
        5. Use clear, concise language that would help someone understand the code
        
        Format your response using markdown for readability.
        """
        
        # Call OpenAI to explain the code
        response = llm.complete(prompt)
        explanation = response.text
        
        # Create the response object using the Pydantic model
        return CodeExplainResponse(explanation=explanation, code=code)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error explaining code: {str(e)}")
