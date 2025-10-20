#!/usr/bin/env python3
"""
Code Improvement + Test Runner Workflow

This script implements a complete workflow in Python to:
1) Back up code files, read their content, and send them to an improvement API.
2) Run associated unittest tests and add the results to the same row of the DataFrame.

Expected input:
A list of objects with the form:
```python
items = [
    {"file": "path/to/file.py", "test": "path/to/test_module_without_extension", "iterations": 3},
    {"file": "another/file.py", "test": "another/test_module", "iterations": 1},
]
```

- **file**: path to the code file to improve (includes `.py`).
- **test**: path to the *test module* **without** the `.py` extension.
- **iterations** *(optional)*: number of times to send the same file to the API. Each send generates **one row** in the DataFrame.

Output:
A DataFrame with one row per (file, test, iteration) including:
- File metadata, backup, and original content.
- Improved code and analysis returned by the API.
- Before/after metrics if provided by the API.
- Test results (tests passed/total, % success, time, etc.).
"""

import sys
import os
import shutil
import json
from pathlib import Path
from datetime import datetime
import requests
import pandas as pd
import unittest
import time
import importlib
import importlib.util
from io import StringIO
import contextlib
import inspect
import uuid

# Configuration
API_URL = 'http://127.0.0.1:8000/improve'  # Change if your API lives at a different URL
BACKUP_DIR = Path('backups')
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

# Get the absolute path to the 'src' directory
project_root = os.path.abspath("src")

# Add it to sys.path if not already there
if project_root not in sys.path:
    sys.path.append(project_root)

print("PYTHONPATH updated with:", project_root)

# Utilities: file backup and helpers

def backup_file(src_path: str | Path, backup_root: Path = BACKUP_DIR) -> Path:
    """Creates a timestamped backup of the file and returns the backup path."""
    src_path = Path(src_path)
    if not src_path.exists():
        raise FileNotFoundError(f"File does not exist: {src_path}")
    ts = datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    dst_name = f"{src_path.stem}__{ts}{src_path.suffix}"
    dst_path = backup_root / dst_name
    shutil.copy2(src_path, dst_path)
    return dst_path

def read_text_file(path: str | Path) -> str:
    """Reads and returns the content of a text file."""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def restore_from_backup(backup_path: str, original_path: str) -> None:
    """Restores an original file from a specific backup."""
    bkp = Path(backup_path)
    orig = Path(original_path)
    if not bkp.exists():
        print(f"[WARN] Backup not found: {bkp}")
        return
    try:
        shutil.copy2(bkp, orig)
    except Exception as e:
        print(f"[WARN] Could not restore {orig} from {bkp}: {e}")

def get_test_file_path(file_path: str) -> str:
    """
    Convert a file path to its corresponding test file path by inserting '_test' 
    before the file extension.
    
    Example:
    - Input: '/path/to/module.py'
    - Output: '/path/to/module_test.py'
    
    Args:
        file_path: The original file path
        
    Returns:
        The path to the corresponding test file
    """
    if not file_path:
        return ""
        
    # Split the path into directory, filename, and extension
    directory, filename = os.path.split(file_path)
    name, ext = os.path.splitext(filename)
    
    # Create the test filename by adding '_test' before the extension
    test_filename = f"{name}_test{ext}"
    
    # Rejoin the directory with the new test filename
    test_file_path = os.path.join(directory, test_filename)
    
    return test_file_path

# Step 1: Send to improvement API and build DataFrame (per iteration)

def improve_one_file(file_path: str, test_module: str, iteration: int, api_url: str = API_URL) -> dict:
    """
    Back up, read, and send a file to the improvement API.
    ⚠️ Now REPLACES the original file with the `improved_code` returned by the API.
    Returns a dictionary ready to be converted to a DataFrame row.
    """
    # 1) Backup and read
    backup_path = backup_file(file_path)
    code_content = read_text_file(file_path)
    filename = os.path.basename(file_path)

    test_content = None
    test_path = get_test_file_path(file_path)
    if test_module and os.path.exists(test_path):
        test_content = read_text_file(test_path)

    # 2) Send to API
    headers = {'Content-Type': 'application/json'}
    payload = {'Code': code_content}

    if test_content:
        payload['Tests'] = test_content
        
    resp = requests.post(api_url, headers=headers, json=payload)

    # 3) Process response according to your contract
    if resp.status_code == 200:
        data = resp.json()
        improved_code = data.get('Code')

        # === NEW: write the improved code to the original file ===
        if isinstance(improved_code, str) and improved_code.strip():
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(improved_code)

        row = {
            'code_file': filename,
            'code_file_path': file_path,
            'test_file': test_module,
            'iteration': iteration,
            'backup_path': str(backup_path),
            'original_code': code_content,
            'improved_code': improved_code,
            'analysis': data.get('Analisis'),
        }
        # Optional metrics
        metrics = data.get('metrics')
        if metrics and isinstance(metrics, dict):
            before = metrics.get('before') or {}
            after = metrics.get('after') or {}
            row.update({
                'before_method_number': before.get('method_number'),
                'before_ifs': before.get('number_of_ifs'),
                'before_loops': before.get('number_of_loops'),
                'before_cyclomatic_complexity': before.get('cyclomatic_complexity'),
                'before_avg_method_size': before.get('average_method_size'),
                'after_method_number': after.get('method_number'),
                'after_ifs': after.get('number_of_ifs'),
                'after_loops': after.get('number_of_loops'),
                'after_cyclomatic_complexity': after.get('cyclomatic_complexity'),
                'after_avg_method_size': after.get('average_method_size'),
            })
        if 'RetrievedContext' in data:
            row['retrieved_context'] = json.dumps(data['RetrievedContext'])
    else:
        row = {
            'code_file': filename,
            'code_file_path': file_path,
            'test_file': test_module,
            'iteration': iteration,
            'backup_path': str(backup_path),
            'error': f"API Error: {resp.status_code}",
            'error_details': resp.text,
        }

    return row

# Step 2: Run `unittest` tests and add results to rows (same (file, test, iteration))

def _load_module_from_path(path: str):
    """Load a python module from an absolute or relative file path."""
    path = os.path.abspath(path)
    if not os.path.isfile(path):
        raise FileNotFoundError(f"No test file found at: {path}")
    
    # Get the directory containing the module
    module_dir = os.path.dirname(path)
    
    # Add the directory to sys.path if it's not already there
    if module_dir not in sys.path:
        sys.path.insert(0, module_dir)
    
    # Generate a unique module name
    mod_name = f"__testmod_{uuid.uuid4().hex}"
    
    # Create the spec with the package parameter
    spec = importlib.util.spec_from_file_location(
        mod_name, 
        path,
        # Add the package parameter for handling relative imports
        submodule_search_locations=[module_dir]
    )
    
    module = importlib.util.module_from_spec(spec)
    
    # Add the module to sys.modules to handle relative imports
    sys.modules[mod_name] = module
    
    spec.loader.exec_module(module)  # type: ignore[attr-defined]
    return module, path

def _guess_test_file(candidate: str) -> str:
    """
    Accepts diverse inputs:
      - a path to a test file (endswith .py) -> return as-is if exists
      - a directory path -> try to find *test*.py inside
      - a module path (dotted) -> resolve to file via __file__
    """
    # If it's an existing file, return it
    p = Path(candidate)
    if p.suffix == ".py" and p.exists():
        return str(p)

    # If it's a directory, try to find a typical unittest file
    if p.exists() and p.is_dir():
        # prefer *_test.py then test_*.py
        patterns = ["*test*.py"]
        for pattern in patterns:
            matches = sorted(p.glob(pattern))
            for m in matches:
                return str(m)
        raise FileNotFoundError(f"No test file (*.py) found under directory: {candidate}")

    # If looks like a path without .py, try adding .py
    if p.suffix == "" and p.exists():
        alt = str(p) + ".py"
        if Path(alt).exists():
            return alt

    # Try to import as module and resolve __file__
    try:
        mod = importlib.import_module(candidate)
        f = getattr(mod, "__file__", None)
        if f and os.path.isfile(f):
            return f
    except Exception:
        pass

    # Finally, if it's something like 'src/dir/name' try appending .py
    if p.suffix == "" and not p.exists():
        alt = candidate + ".py"
        if Path(alt).exists():
            return alt

    raise FileNotFoundError(f"Could not resolve a test file from: {candidate}")

def _import_test_target(file_or_module: str):
    """
    Import a test module from either a path (preferred for dirs with hyphens)
    or a dotted module path.
    """
    # Try resolve to a concrete file first (supports dirs with hyphens)
    try:
        file_path = _guess_test_file(file_or_module)
        return _load_module_from_path(file_path)
    except Exception:
        # Fallback: treat as module name (requires importable path without hyphens)
        # Also ensure 'src' is in sys.path as a convenience
        src_dir = os.path.abspath("src")
        if os.path.isdir(src_dir) and src_dir not in sys.path:
            sys.path.insert(0, src_dir)
        mod = importlib.import_module(file_or_module)
        path = getattr(mod, "__file__", file_or_module)
        return mod, path

class _ResultCollector(unittest.TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.test_results = []  # list[dict]

    def addSuccess(self, test):
        super().addSuccess(test)
        self.test_results.append({
            "test_name": str(test),
            "status": "PASS",
            "error_message": None
        })

    def addFailure(self, test, err):
        super().addFailure(test, err)
        from traceback import format_exception
        msg = "".join(format_exception(*err))
        self.test_results.append({
            "test_name": str(test),
            "status": "FAIL",
            "error_message": msg
        })

    def addError(self, test, err):
        super().addError(test, err)
        from traceback import format_exception
        msg = "".join(format_exception(*err))
        self.test_results.append({
            "test_name": str(test),
            "status": "ERROR",
            "error_message": msg
        })

def run_tests_for_file(file_or_module: str, iteration: int = 1) -> pd.DataFrame:
    """
    Load a unittest module and run it, returning a DataFrame with per-test results
    and a summary row.
    """
    try:
        test_module, resolved_path = _import_test_target(file_or_module)

        # Collect TestCase subclasses
        test_classes = [
            obj for _, obj in inspect.getmembers(test_module)
            if inspect.isclass(obj) and issubclass(obj, unittest.TestCase)
        ]

        # Build a suite from discovered classes
        suite = unittest.TestSuite()
        loader = unittest.TestLoader()
        for cls in test_classes:
            suite.addTests(loader.loadTestsFromTestCase(cls))

        # Run and capture stdout
        stream = StringIO()
        runner = unittest.TextTestRunner(stream=stream, verbosity=2, resultclass=_ResultCollector)
        start = time.time()
        with contextlib.redirect_stdout(stream):
            result = runner.run(suite)
        duration = time.time() - start

        # Build per-test dataframe
        rows = []
        for r in result.test_results:
            rows.append({
                "test_file": resolved_path,
                "iteration": iteration,
                "test_name": r["test_name"],
                "status": r["status"],
                "execution_time": duration,  # total; fine-grained split omitted
                "error_message": r["error_message"],
            })

        total = max(len(rows), 1)
        passed = sum(1 for r in rows if r["status"] == "PASS")
        success_rate = passed / total

        summary = {
            "test_file": resolved_path,
            "iteration": iteration,
            "tests": f"{passed}/{total} ({success_rate:.2%})",
            "percentage_of_success": round(success_rate * 100, 2),
            "execution_time": duration,
            "error": None,
            "error_details": None
        }

        df = pd.DataFrame(rows) if rows else pd.DataFrame([{
            "test_file": resolved_path, "iteration": iteration,
            "test_name": "(no tests found)", "status": "ERROR",
            "execution_time": duration, "error_message": "No unittest.TestCase classes found"
        }])
        # Return summary merged with per-test results (like previous notebook)
        summary_df = pd.DataFrame([summary])
        return df, summary_df

    except Exception as e:
        err = f"{type(e).__name__}: {e}"
        print(err)

        print()
        summary = pd.DataFrame([{
            "test_file": file_or_module,
            "iteration": iteration,
            "tests": "ERROR",
            "percentage_of_success": 0.0,
            "execution_time": 0.0,
            "error": err,
            "error_details": None
        }])
        details = pd.DataFrame([{
            "test_file": file_or_module, "iteration": iteration,
            "test_name": "(setup failure)", "status": "ERROR",
            "execution_time": 0.0, "error_message": err
        }])
        return details, summary

def _run_tests_for_file(file_or_module: str, iteration: int) -> pd.DataFrame:
    """Compatibility shim to return only the summary dataframe like the original workflow assumed."""
    _, summary_df = run_tests_for_file(file_or_module, iteration)
    return summary_df

def run_tests_for_multiple_files(file_paths, iterations: int = 1) -> pd.DataFrame:
    """Run multiple files over several iterations and combine summaries."""
    all_summaries = []
    for file_or_module in file_paths:
        for i in range(1, iterations + 1):
            _, summary_df = run_tests_for_file(file_or_module, i)
            all_summaries.append(summary_df)
    return pd.concat(all_summaries, ignore_index=True) if all_summaries else pd.DataFrame(
        columns=['test_file', 'iteration', 'tests', 'percentage_of_success', 'execution_time', 'error', 'error_details']
    )

# Orchestrator: combines Step 1 + Step 2 into a single DataFrame

def run_full_workflow(items: list[dict], api_url: str = API_URL) -> pd.DataFrame:
    """
    Executes the workflow by **iteration**: improve + write, run tests, MERGE results,
    and **restore the original file at the end of each iteration** using the backup from that iteration.
    """
    merged_rows = []
    for it in items:
        file_path = it['file']
        test_module = it['test']
        iterations = int(it.get('iterations', 1))
        for k in range(1, iterations + 1):
            # Step 1 (iteration k): improve and write code
            improve_row = improve_one_file(file_path, test_module, k, api_url)

            # Step 2 (iteration k): run tests for this test_module/k
            tests_df = _run_tests_for_file(test_module, k)

            print("-"*10)
            print(test_module)
            print(tests_df)
            print("-"*10)

            # Merge into a single row
            import pandas as _pd
            improve_df_k = _pd.DataFrame([improve_row])

            if 'test_file' not in improve_df_k.columns:
                improve_df_k['test_file'] = test_module

            merged_k = improve_df_k.merge(
                tests_df,
                on=['test_file', 'iteration'],
                how='left',
                suffixes=('', '_test')
            )

            merged_k['tests'] = tests_df['tests']
            merged_k['percentage_of_success'] = tests_df['percentage_of_success']
            merged_k['execution_time'] = tests_df['execution_time']
            merged_rows.append(merged_k)

            # Restore immediately after finishing the iteration
            try:
                if 'backup_path' in improve_row and improve_row.get('backup_path'):
                    restore_from_backup(improve_row['backup_path'], improve_row['code_file_path'])
            except Exception as e:
                print('[WARN] Failed to restore by iteration:', e)

    # Concatenate all rows and sort columns
    if not merged_rows:
        return pd.DataFrame()
    out = pd.concat(merged_rows, ignore_index=True)
    preferred_cols = [
        'code_file', 'code_file_path', 'backup_path', 'test_file', 'iteration',
        'tests', 'percentage_of_success', 'execution_time',
        'original_code', 'improved_code', 'analysis', 'retrieved_context',
        'before_method_number', 'before_ifs', 'before_loops', 'before_cyclomatic_complexity', 'before_avg_method_size',
        'after_method_number', 'after_ifs', 'after_loops', 'after_cyclomatic_complexity', 'after_avg_method_size',
        'error', 'error_details'
    ]
    for col in preferred_cols:
        if col not in out.columns:
            out[col] = None
    return out[preferred_cols]

# Example usage
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Code Improvement + Test Runner Workflow')
    parser.add_argument('--api-url', type=str, default=API_URL,
                        help=f'URL of the improvement API (default: {API_URL})')
    parser.add_argument('--output', type=str, default=None,
                        help='Output CSV file path (default: None, no file is saved)')
    parser.add_argument('--items', type=str, required=True,
                        help='JSON file containing the items to process')
    
    args = parser.parse_args()
    
    try:
        with open(args.items, 'r') as f:
            items = json.load(f)
        
        print(f"Processing {len(items)} items...")
        df = run_full_workflow(items, api_url=args.api_url)
        
        # Display summary
        print("\nSummary:")
        print(f"Processed {len(items)} items with {len(df)} total iterations.")
        
        # Save to CSV if requested
        if args.output:
            df.to_csv(args.output, index=False)
            print(f"Results saved to {args.output}")
        
        # Display the DataFrame
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', 1000)
        print("\nResults DataFrame:")
        print(df[['code_file', 'test_file', 'iteration', 'tests', 'percentage_of_success']])
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
