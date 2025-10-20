import unittest
#from src.excercise1_fibonacci.fibonacci import f
from .fibonacci import execute

class TestFibonacci(unittest.TestCase):
    
    def test_empty_sequence(self):
        """Test when n=0, should return an empty list"""
        result = execute(n=0)
        self.assertEqual(result, [])
    
    def test_single_element(self):
        """Test when n=1, should return [0]"""
        result = execute(n=1)
        self.assertEqual(result, [0])
    
    def test_two_elements(self):
        """Test when n=2, should return [0, 1]"""
        result = execute(n=2)
        self.assertEqual(result, [0, 1])
    
    def test_standard_fibonacci(self):
        """Test a standard Fibonacci sequence with n=10"""
        result = execute(n=10)
        self.assertEqual(result, [0, 1, 1, 2, 3, 5, 8, 13, 21, 34])
    
    def test_custom_start_values(self):
        """Test with custom starting values a=2, b=3"""
        # Note: The function doesn't actually use a and b parameters in its calculation
        # This test verifies the current behavior
        result = execute(a=2, b=3, n=5)
        self.assertEqual(result, [0, 1, 1, 2, 3])
    
    def test_c_parameter_false(self):
        """Test when c=False, should return None"""
        result = execute(c=False)
        self.assertIsNone(result)
    
    def test_with_provided_x(self):
        """Test with a pre-populated x list"""
        # Note: The function will append to x if n=2, otherwise it will override x
        result = execute(x=[5, 10], n=2)
        self.assertEqual(result, [5, 10, 0, 1])
    
    def test_with_args_kwargs(self):
        """Test with additional args and kwargs"""
        result = execute(1, 2, 5, extra_arg=True, another_kwarg="test")
        self.assertEqual(result, [0, 1, 1, 2, 3])
    
    def test_large_sequence(self):
        """Test a larger Fibonacci sequence"""
        result = execute(n=15)
        self.assertEqual(result, [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377])

if __name__ == '__main__':
    unittest.main()
