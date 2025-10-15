import requests
import json

def test_health_endpoint():
    """Test the /health endpoint to verify API health status."""
    url = "http://localhost:8001/health"
    
    # Send the request
    response = requests.get(url)
    
    # Print the response status and content
    print(f"Health Check Status Code: {response.status_code}")
    
    if response.status_code == 200:
        # Get the response data
        response_data = response.json()
        
        # Pretty print the JSON response
        pretty_json = json.dumps(response_data, indent=2)
        print(f"Health Check Response:\n{pretty_json}")
        
        # Verify the health status
        if response_data.get("status") == "healthy":
            print("✅ Health check passed: API is healthy")
        else:
            print("❌ Health check failed: API is not reporting as healthy")
    else:
        print(f"Error: {response.text}")

def test_analyze_endpoint():
    """Test the /analyze/ endpoint with a sample code snippet."""
    url = "http://localhost:8001/analyze/"
    
    # Sample code to analyze
    code = """
def fibonacci(n):
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
    """
    
    # Prepare the request payload
    payload = {"code": code}
    
    # Send the request
    response = requests.post(url, json=payload)
    
    # Print the response status and content
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        # Get the response data
        response_data = response.json()
        
        # Check if the response has the expected structure
        if "Analisis" in response_data and "code" in response_data:
            print("Response has the correct structure with 'Analisis' and 'code' fields.")
            
            # Pretty print the JSON response
            pretty_json = json.dumps(response_data, indent=2)
            print(f"Response:\n{pretty_json}")
            
            # Print the analysis and code separately for clarity
            print("\n--- Analysis ---")
            print(response_data["Analisis"])
            
            print("\n--- Improved Code ---")
            print(response_data["code"])
        else:
            print("Warning: Response does not have the expected structure.")
            pretty_json = json.dumps(response_data, indent=2)
            print(f"Actual Response:\n{pretty_json}")
    else:
        print(f"Error: {response.text}")

def test_explain_endpoint():
    """Test the /explain/ endpoint with a sample code snippet."""
    url = "http://localhost:8001/explain/"
    
    # Sample code to explain
    code = """
def fibonacci(n):
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
    """
    
    # Prepare the request payload
    payload = {"code": code}
    
    # Send the request
    response = requests.post(url, json=payload)
    
    # Print the response status and content
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        # Get the response data
        response_data = response.json()
        
        # Check if the response has the expected structure
        if "explanation" in response_data and "code" in response_data:
            print("Response has the correct structure with 'explanation' and 'code' fields.")
            
            # Pretty print the JSON response
            pretty_json = json.dumps(response_data, indent=2)
            print(f"Response:\n{pretty_json}")
            
            # Print the explanation and code separately for clarity
            print("\n--- Explanation ---")
            print(response_data["explanation"])
            
            print("\n--- Original Code ---")
            print(response_data["code"])
        else:
            print("Warning: Response does not have the expected structure.")
            pretty_json = json.dumps(response_data, indent=2)
            print(f"Actual Response:\n{pretty_json}")
    else:
        print(f"Error: {response.text}")

def test_improve_endpoint():
    """Test the /improve endpoint with a sample code snippet."""
    url = "http://localhost:8001/improve"
    
    # Sample code to improve
    code = """
def fibonacci(n):
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
    """
    
    # Prepare the request payload
    payload = {"Code": code}
    
    # Send the request
    response = requests.post(url, json=payload)
    
    # Print the response status and content
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        # Get the response data
        response_data = response.json()
        
        # Check if the response has the expected structure
        if "Analisis" in response_data and "Code" in response_data and "RetrievedContext" in response_data:
            print("Response has the correct structure with 'Analisis', 'Code', and 'RetrievedContext' fields.")
            
            # Pretty print the JSON response
            pretty_json = json.dumps(response_data, indent=2)
            print(f"Response:\n{pretty_json}")
            
            # Print the analysis, code, and retrieved context separately for clarity
            print("\n--- Analysis ---")
            print(response_data["Analisis"])
            
            print("\n--- Improved Code ---")
            print(response_data["Code"])
            
            print("\n--- Retrieved Context ---")
            for i, chunk in enumerate(response_data["RetrievedContext"]):
                print(f"\nChunk {i+1}:")
                print(f"Score: {chunk['score']}")
                print(f"Page: {chunk['page']}")
                print(f"Chunk ID: {chunk['chunk_id']}")
                print(f"Text: {chunk['text'][:100]}...")  # Print first 100 chars of text
        else:
            print("Warning: Response does not have the expected structure.")
            pretty_json = json.dumps(response_data, indent=2)
            print(f"Actual Response:\n{pretty_json}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    # Test the health endpoint first
    print("\n=== Testing Health Endpoint ===\n")
    test_health_endpoint()
    
    # Then test the analyze endpoint
    print("\n=== Testing Analyze Endpoint ===\n")
    test_analyze_endpoint()
    
    # Test the explain endpoint
    print("\n=== Testing Explain Endpoint ===\n")
    test_explain_endpoint()
    
    # Finally test the improve endpoint
    print("\n=== Testing Improve Endpoint ===\n")
    test_improve_endpoint()
