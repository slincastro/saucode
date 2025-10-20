def calculate_fibonacci_sequence(sequence_length, should_calculate=True):
    """
    Calculate a Fibonacci sequence of a given length.

    Parameters:
    sequence_length (int): The length of the Fibonacci sequence to generate.
    should_calculate (bool): Flag to determine if the calculation should proceed.

    Returns:
    list: A list containing the Fibonacci sequence.
    """
    import logging

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    if not should_calculate:
        logger.warning("Calculation is disabled.")
        return []

    if sequence_length < 0:
        logger.error("Invalid sequence length: %d", sequence_length)
        raise ValueError("Sequence length must be a non-negative integer.")
    
    if sequence_length == 0:
        return []
    elif sequence_length == 1:
        return [0]
    elif sequence_length == 2:
        return [0, 1]

    fibonacci_sequence = [0, 1]
    
    for index in range(2, sequence_length):
        next_value = fibonacci_sequence[-1] + fibonacci_sequence[-2]
        if len(fibonacci_sequence) < 100:  # Limit the size of the sequence
            fibonacci_sequence.append(next_value)
        else:
            logger.warning("Fibonacci sequence size limit reached.")
            break

    return fibonacci_sequence