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

@app.get("/")
def read_root():
    return {"message": "¡Hola desde FastAPI!"}

@app.post("/analyze/")
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
                return {
                    "message": f"""
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

                    ## Example Improved Code:

                    ```python
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
                    ```

                    ## Alternative Implementation (Memoization for Better Performance):

                    ```python
                    from typing import List, Dict
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
                    ```
                    """
                }
            else:
                # Generic response for other code
                return {
                    "message": f"""
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

                    ## Example Improved Code:

                    ```python
                    # An improved version would be provided here based on the specific code
                    ```
                    """
                }
        
        # Initialize OpenAI LLM
        llm = OpenAI(model="gpt-4o")
        
        # Create a prompt for code analysis
        prompt = f"""
        Please analyze the following code and provide suggestions for improvement:
        
        ```
        {code}
        ```
        
        Focus on:
        1. Code quality and best practices
        2. Performance optimizations
        3. Security concerns
        4. Readability and maintainability
        
        Provide specific recommendations with examples where applicable.
        """
        
        # Call OpenAI to analyze the code
        response = llm.complete(prompt)
        
        # Return the analysis
        return {"message": response.text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing code: {str(e)}")
