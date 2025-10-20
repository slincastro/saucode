import asyncio
import json
from src.service.metrics_service import calculate_metrics

# Test code with different nesting levels
test_code = """
def complex_function():
    for i in range(10):
        if i % 2 == 0:
            for j in range(i):
                if j > 0:
                    try:
                        print(f"Complex nesting: {i}, {j}")
                    except Exception as e:
                        print(f"Error: {e}")
"""

async def test_metrics():
    # Calculate metrics directly
    metrics = calculate_metrics(test_code)
    
    # Print the metrics
    print("Metrics calculated directly:")
    print(f"  method_number: {metrics['method_number']}")
    print(f"  number_of_ifs: {metrics['number_of_ifs']}")
    print(f"  number_of_loops: {metrics['number_of_loops']}")
    print(f"  cyclomatic_complexity: {metrics['cyclomatic_complexity']}")
    print(f"  average_method_size: {metrics['average_method_size']}")
    print(f"  max_nesting: {metrics['max_nesting']}")
    
    # Verify max_nesting is included
    if 'max_nesting' in metrics:
        print("\n✅ max_nesting metric is successfully included in the metrics calculation")
    else:
        print("\n❌ max_nesting metric is NOT included in the metrics calculation")

if __name__ == "__main__":
    asyncio.run(test_metrics())
