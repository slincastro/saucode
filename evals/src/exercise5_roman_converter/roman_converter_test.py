import unittest
import sys
import io
import os

# Try both absolute and relative imports to handle different execution contexts
try:
    # Absolute import for when running from notebook or other directories
    from evals.src.exercise5_roman_converter.roman_converter import execute
except ImportError:
    # Relative import for when running from the same directory
    try:
        from roman_converter import execute
    except ImportError:
        # Add the current directory to sys.path as a fallback
        current_dir = os.path.dirname(os.path.abspath(__file__))
        if current_dir not in sys.path:
            sys.path.insert(0, current_dir)
        from roman_converter import execute


class TestRomanConverter(unittest.TestCase):
    
    def setUp(self):
        # Redirect stdout to capture print statements
        self.held_output = io.StringIO()
        self.original_stdout = sys.stdout
        sys.stdout = self.held_output
    
    def tearDown(self):
        # Restore stdout
        sys.stdout = self.original_stdout
    
    def execute(self, n):
        """Execute the roman converter function with the given input.
        This method uses the execute function imported from roman_converter.py."""
        return execute(n)
    
    def test_execute_with_one(self):
        """Test when input is 1, should return 'I'"""
        # Note: The execute function has a bug (uses 't' instead of 'n')
        # This test will fail until that bug is fixed
        result = self.execute(1)
        self.assertEqual(result, "I")
    
    def test_execute_with_five(self):
        """Test when input is 5, should return 'V'"""
        result = self.execute(5)
        self.assertEqual(result, "V")
    
    def test_execute_with_ten(self):
        """Test when input is 10, should return 'X'"""
        result = self.execute(10)
        self.assertEqual(result, "X")
    
    def test_execute_with_fifty(self):
        """Test when input is 50, should return 'L'"""
        result = self.execute(50)
        self.assertEqual(result, "L")
    
    def test_execute_with_hundred(self):
        """Test when input is 100, should return 'C'"""
        result = self.execute(100)
        self.assertEqual(result, "C")
    
    def test_execute_with_five_hundred(self):
        """Test when input is 500, should return 'D'"""
        result = self.execute(500)
        self.assertEqual(result, "D")
    
    def test_execute_with_thousand(self):
        """Test when input is 1000, should return 'M'"""
        result = self.execute(1000)
        self.assertEqual(result, "M")
    
    def test_execute_with_complex_number(self):
        """Test with a complex number like 1984, should return 'MCMLXXXIV'"""
        result = self.execute(1984)
        self.assertEqual(result, "MCMLXXXIV")
    
    def test_execute_with_zero(self):
        """Test when input is 0, should return 'N' (as per the implementation)"""
        result = self.execute(0)
        self.assertEqual(result, "N")
    
    def test_execute_with_negative(self):
        """Test with negative value, should handle it according to implementation"""
        result = self.execute(-5)
        # The implementation actually returns "-5" based on the useless_helper function
        self.assertEqual(result, "-5")
    
    def test_execute_with_non_integer(self):
        """Test with non-integer input, should handle it according to implementation"""
        # The implementation should try to convert to int
        result = self.execute("9")
        self.assertEqual(result, "IX")
    
    def test_execute_with_invalid_input(self):
        """Test with invalid input that can't be converted to int"""
        # The implementation raises a TypeError for inputs that can't be converted to int
        # We'll test that the exception is raised
        with self.assertRaises(TypeError):
            self.execute("abc")

if __name__ == '__main__':
    unittest.main()
