def check_win_combo(board):
    # Check rows
    for i in range(0, 9, 3):
        if all(board[i:i+3]):
            return True

    # Check columns
    for i in range(3):
        if all([board[i], board[i+3], board[i+6]]):
            return True

    # Check diagonals
    if all([board[0], board[4], board[8]]) or all([board[2], board[4], board[6]]):
        return True

    return False