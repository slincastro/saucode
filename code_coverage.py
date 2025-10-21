#!/usr/bin/env python3
"""
Code Coverage Generator for Exercises

This script generates code coverage reports for the exercises in the "evals/src" directory.
It uses pytest and pytest-cov to run tests and generate coverage reports.

Usage:
    python code_coverage.py

Output:
    - Prints coverage percentage for each exercise
    - Generates HTML reports in the "coverage_html" directory (optional)
"""

import os
import subprocess
import json
import pandas as pd
from pathlib import Path
import sys

# Configuration
EVALS_DIR = Path("evals")
COVERAGE_HTML_DIR = Path("coverage_html")
# Create the coverage HTML directory at the start
os.makedirs(COVERAGE_HTML_DIR, exist_ok=True)

# Exercise files and tests as provided by the user
EXERCISES = [
    {
        'file': 'src/exercise1_fibonacci/fibonacci.py',
        'test': './src/exercise1_fibonacci/fibonacci_test.py',
        'name': 'exercise1_fibonacci'
    },
    {
        'file': 'src/exercise2_factorial/factorial.py',
        'test': './src/exercise2_factorial/factorial_test.py',
        'name': 'exercise2_factorial'
    },
    {
        'file': 'src/exercise3_calculate_pi/calculate_pi.py',
        'test': './src/exercise3_calculate_pi/calculate_pi_test.py',
        'name': 'exercise3_calculate_pi'
    },
    {
        'file': 'src/exercise4_hanoi/hanoi_towers.py',
        'test': './src/exercise4_hanoi/hanoi_towers_test.py',
        'name': 'exercise4_hanoi'
    },
    {
        'file': 'src/exercise5_roman_converter/roman_converter.py',
        'test': './src/exercise5_roman_converter/roman_converter_test.py',
        'name': 'exercise5_roman_converter'
    }
]

def run_coverage_for_exercise(exercise):
    """Run pytest with coverage for a specific exercise."""
    exercise_name = exercise['name']
    impl_file = exercise['file']
    test_file = exercise['test']
    
    # Get the module name from the implementation file
    impl_path = Path(impl_file)
    module_name = impl_path.stem
    
    # Create HTML directory for this exercise
    html_dir = COVERAGE_HTML_DIR / exercise_name
    os.makedirs(html_dir, exist_ok=True)
    
    # Run coverage directly with pytest
    cmd = [
        "coverage", "run", 
        "-m", "pytest", 
        test_file.replace('./', ''),  # Remove the ./ prefix if present
        "-v"
    ]
    
    # Change to the evals directory to run the tests
    cwd = os.getcwd()
    os.chdir(EVALS_DIR)
    
    try:
        # Run the command and capture output
        result = subprocess.run(cmd, capture_output=True, text=True)
        print(f"Command output: {result.stdout}")
        print(f"Command error: {result.stderr}")
        
        # Generate coverage report
        coverage_cmd = ["coverage", "json"]
        coverage_result = subprocess.run(coverage_cmd, capture_output=True, text=True)
        
        # Check if coverage.json was generated
        if os.path.exists("coverage.json"):
            with open("coverage.json", "r") as f:
                coverage_data = json.load(f)
            
            # Extract coverage percentage
            total_coverage = coverage_data.get("totals", {}).get("percent_covered", 0)
            
            # Generate HTML report
            html_cmd = ["coverage", "html", "-d", str(html_dir)]
            subprocess.run(html_cmd, capture_output=True, text=True)
            
            # Clean up
            os.remove("coverage.json")
            
            return {
                "exercise": exercise_name,
                "implementation": Path(impl_file).name,
                "test": Path(test_file).name,
                "coverage_percentage": total_coverage,
                "html_report": str(html_dir)
            }
        else:
            print(f"Error: No coverage data generated for {exercise_name}")
            return {
                "exercise": exercise_name,
                "implementation": Path(impl_file).name,
                "test": Path(test_file).name,
                "coverage_percentage": 0,
                "error": "No coverage data generated"
            }
    
    finally:
        # Change back to the original directory
        os.chdir(cwd)

def main():
    """Main function to run coverage for all exercises."""
    if not EXERCISES:
        print("No exercises defined")
        return
    
    results = []
    
    for exercise in EXERCISES:
        print(f"\nProcessing {exercise['name']}...")
        result = run_coverage_for_exercise(exercise)
        if result:
            results.append(result)
    
    # Create a DataFrame with the results
    if results:
        df = pd.DataFrame(results)
        
        # Print the results
        print("\n=== Code Coverage Results ===\n")
        
        # Format the coverage percentage with 2 decimal places
        df["coverage_percentage"] = df["coverage_percentage"].apply(lambda x: f"{x:.2f}%")
        
        # Print a simplified table
        print(df[["exercise", "implementation", "coverage_percentage"]].to_string(index=False))
        
        # Save the results to a CSV file
        df.to_csv("code_coverage_results.csv", index=False)
        print("\nResults saved to code_coverage_results.csv")
        
        # Print the path to the HTML reports
        print(f"\nHTML reports are available in the {COVERAGE_HTML_DIR} directory")
    else:
        print("No coverage results generated")

if __name__ == "__main__":
    main()
