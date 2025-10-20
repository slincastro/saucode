import sys
from src.service.metrics_service import calculate_max_nesting, calculate_metrics

# Test code with different nesting levels
test_code_1 = """
def simple_function():
    print("No nesting")
"""

test_code_2 = """
def nested_function():
    if True:
        if True:
            if True:
                print("Triple nested if")
"""

test_code_3 = """
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

test_code_4 = """
class TestClass:
    def method1(self):
        if True:
            pass
            
    def method2(self):
        for i in range(10):
            if i > 5:
                while i > 0:
                    i -= 1
"""

# Non-Python code example
test_code_5 = """
function nestedJSFunction() {
    if (true) {
        for (let i = 0; i < 10; i++) {
            if (i % 2 === 0) {
                console.log("Nested JS code");
            }
        }
    }
}
"""

# Test each code sample
test_cases = [
    ("Simple function (expected nesting: 1)", test_code_1),
    ("Triple nested if (expected nesting: 3)", test_code_2),
    ("Complex nesting (expected nesting: 5)", test_code_3),
    ("Class with methods (expected nesting: 3)", test_code_4),
    ("JavaScript code (expected nesting via indentation)", test_code_5)
]

print("Testing max_nesting calculation:")
print("-" * 50)

for description, code in test_cases:
    max_nesting = calculate_max_nesting(code)
    print(f"{description}: {max_nesting}")
    
    # Also test the integration with calculate_metrics
    metrics = calculate_metrics(code)
    print(f"  From calculate_metrics: {metrics['max_nesting']}")
    print("-" * 50)

print("Test completed.")
