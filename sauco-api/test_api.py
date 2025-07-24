import requests
import json

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

if __name__ == "__main__":
    test_analyze_endpoint()
