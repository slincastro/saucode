# sauco-api-mock.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os

from src.domain.models import ImproveRequest, ImproveResponse, RetrieveContextRequest, RetrieveContextResponse, Metrics, MetricsResponse

app = FastAPI(title="Code Improver API (Mock)", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

# Hardcoded mock responses
MOCK_ANALYSIS = """
Purpose
This code defines a function called 'calculate_factorial' that calculates the factorial of a given number using a recursive approach. The factorial of a number n is the product of all positive integers less than or equal to n.

Public API
The main function is calculate_factorial(n), which takes an integer as input and returns its factorial.

Variables and their roles
- n: The input parameter representing the number for which to calculate the factorial.
- result: Used in the recursive calls to store intermediate factorial values.

Loops/conditionals and data flow
The function uses a conditional to check if n is 0 or 1 (base cases) and returns 1. Otherwise, it recursively calls itself with n-1 and multiplies the result by n.

Obvious smells
- The function lacks input validation for negative numbers or non-integers.
- There's no docstring explaining the function's purpose, parameters, or return value.
- The recursive approach could lead to stack overflow for large inputs.
"""

MOCK_ORIGINAL_CODE = """
def calculate_factorial(n):
    if n == 0 or n == 1:
        return 1
    else:
        return n * calculate_factorial(n - 1)
"""

MOCK_IMPROVED_CODE = """
def calculate_factorial(n):
    '''Calculate the factorial of a non-negative integer.
    
    Args:
        n (int): A non-negative integer
        
    Returns:
        int: The factorial of n
        
    Raises:
        ValueError: If n is negative or not an integer
    '''
    # Validate input
    if not isinstance(n, int):
        raise ValueError("Input must be an integer")
    if n < 0:
        raise ValueError("Input must be non-negative")
    
    # Use iteration instead of recursion to avoid stack overflow
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result
"""

MOCK_RETRIEVED_CONTEXT = [
    {
        "score": 0.85,
        "page": 42,
        "chunk_id": "factorial_pattern_1",
        "text": "When implementing factorial functions, it's best to use an iterative approach rather than recursion to avoid stack overflow for large inputs. Always validate that the input is a non-negative integer before calculation."
    },
    {
        "score": 0.75,
        "page": 103,
        "chunk_id": "python_best_practices_2",
        "text": "Functions should include proper docstrings that explain the purpose, parameters, return values, and any exceptions that might be raised. This improves code readability and maintainability."
    },
    {
        "score": 0.65,
        "page": 78,
        "chunk_id": "error_handling_3",
        "text": "Input validation is crucial for robust code. Always check that function inputs meet the expected types and constraints before processing them."
    }
]

MOCK_METRICS_RESPONSE = MetricsResponse(
    before=Metrics(
        method_number=1,
        number_of_ifs=1,
        number_of_loops=0,
        cyclomatic_complexity=2,
        average_method_size=4.0
    ),
    after=Metrics(
        method_number=1,
        number_of_ifs=2,
        number_of_loops=1,
        cyclomatic_complexity=3,
        average_method_size=12.0
    )
)

@app.get("/health")
def health_check():
    """
    Health check endpoint to verify the API is running correctly.
    Returns a 200 OK status code with basic health information.
    """
    return {
        "status": "healthy",
        "api": "sauco-api-mock",
        "version": "1.0.0"
    }

@app.post("/improve", response_model=ImproveResponse)
async def improve(req: ImproveRequest):
    try:
        # Instead of calling the service, return hardcoded mock responses
        return ImproveResponse(
            Analisis=MOCK_ANALYSIS, 
            Code=MOCK_IMPROVED_CODE,
            RetrievedContext=MOCK_RETRIEVED_CONTEXT,
            metrics=MOCK_METRICS_RESPONSE
        )
    except Exception as e:
        print(f" Error 500 - {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrieve_context", response_model=RetrieveContextResponse)
async def retrieve_context(req: RetrieveContextRequest):
    try:
        # Return hardcoded mock context instead of calling the service
        return RetrieveContextResponse(
            RetrievedContext=MOCK_RETRIEVED_CONTEXT
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
