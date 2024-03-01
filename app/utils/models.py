from pydantic import BaseModel

from app.utils.tictactoe import check_win_combo


class Player(BaseModel):
    id: str = ""
    grid: list = [False]*9


class Room(BaseModel):
    id: str
    player1: Player = Player()
    player2: Player = Player()
    turn: bool = False
    rematch_request_by: str | None = None

    def joinRoom(self, playerId: str):
        if not self.isHasSpaceForPlayer():
            return False
        
        if self.player1.id == "":
            self.player1.id = playerId
        elif self.player2.id == "":
            self.player2.id = playerId

        return True

    def isPlayerTurn(self, playerId):
        return (not self.turn and self.player1.id == playerId) or (self.turn and self.player2.id == playerId)
    
    def checkWin(self):
        if check_win_combo(self.player1.grid):
            return self.player1.id
        if check_win_combo(self.player2.grid):
            return self.player2.id
        return False

    def selectGrid(self, playerId, selectIdx):
        if not self.isReadyToPlay():
            return False
        if self.checkWin():
            return False
        selectIdx = int(selectIdx)
        if selectIdx < 0 and selectIdx > 8:
            return False
        if not self.isPlayerTurn(playerId):
            return False
        if self.player1.id == playerId:
            self.player1.grid[selectIdx] = True
        else:
            self.player2.grid[selectIdx] = True

        self.turn = not self.turn

        return True

    def isReadyToPlay(self):
        return not self.isHasSpaceForPlayer()

    def isHasSpaceForPlayer(self):
        return self.player1.id == "" or self.player2.id == ""

    def isPlayerInRoom(self, playerId):
        return self.player1.id == playerId or self.player2.id == playerId
    
    def isEnd(self):
        if self.checkWin():
            return True
        if sum([1 if x else 0 for x in self.player1.grid + self.player2.grid]) >= 9:
            return True
        return False