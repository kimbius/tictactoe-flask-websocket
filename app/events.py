import secrets
from typing import Any

from .extensions import sock
import json, app.utils.models

rooms: dict[str, app.utils.models.Room] = {}
clients = []

def whichRoomForPlayer(playerId) -> app.utils.models.Room | Any:
    for room in dict.values(rooms):
        if room.isPlayerInRoom(playerId):
            return room
    return

@sock.route("/")
def echo(sock):
    sock._id = secrets.token_hex(8)
    clients.append(sock)

    while True: 
        try:
            data = json.loads(sock.receive())
            if data["t"] == "join":
                room_code = data["d"]["code"]
                isRoomExists = room_code in rooms
                if isRoomExists:
                    room = rooms[room_code]
                    if room:
                        if room.joinRoom(sock._id):
                            sock.send(
                                json.dumps({
                                    "t": "hello",
                                    "d": {
                                        "player_id": sock._id,
                                        "room_code": room.id
                                    }
                                })
                            )
                            for client in clients:
                                if room.isPlayerInRoom(client._id):
                                    client.send(
                                        json.dumps({
                                            "t": "update",
                                            "d": room.dict()
                                        })
                                    )
                                    if room.isReadyToPlay():
                                        client.send(
                                            json.dumps({
                                                "t": "ready",
                                                "d": room.dict()
                                            })
                                        )

                    else:
                        sock.send(
                            json.dumps({
                                "t": "update",
                                "d": False
                            })
                        )
                else:
                    sock.send(
                        json.dumps({
                            "t": "update",
                            "d": False
                        })
                    )
            elif data["t"] == "heartbeat":
                sock.send(
                    json.dumps({
                        "t": "heartbeat",
                        "d": "pong"
                    })
                )
            elif data["t"] == "select":
                select_idx = int(data["d"])
                if select_idx >= 0 and select_idx <= 8:
                    room = whichRoomForPlayer(sock._id)
                    if room:
                        selected = room.selectGrid(sock._id, select_idx)
                        if selected:
                            whoWin = room.checkWin()
                            for client in clients:
                                if room.isPlayerInRoom(client._id):
                                    client.send(
                                        json.dumps({
                                            "t": "update",
                                            "d": room.dict()
                                        })
                                    )
                                    if not whoWin and room.isEnd():
                                        client.send(
                                            json.dumps({
                                                "t": "draw",
                                                "d": None
                                            })
                                        )
                                    elif whoWin:
                                        client.send(
                                            json.dumps({
                                                "t": "win",
                                                "d": str(whoWin)
                                            })
                                        )
            elif data["t"] == "rematch":
                room = whichRoomForPlayer(sock._id)
                if room:
                    room.rematch_request_by = sock._id
                    for client in clients:
                        if client._id != sock._id and room.isPlayerInRoom(client._id):
                            client.send(
                                json.dumps({
                                    "t": "rematch",
                                    "d": None
                                })
                            )
            elif data["t"] == "accept_rematch":
                room = whichRoomForPlayer(sock._id)
                if room:
                    if room.rematch_request_by and room.rematch_request_by != sock._id:
                        roomId = secrets.token_hex(3)
                        newRoom = app.utils.models.Room(id=roomId)
                        rooms[newRoom.id] = newRoom
                        for client in clients:
                            if room.isPlayerInRoom(client._id):
                                client.send(
                                    json.dumps({
                                        "t": "rematch_accepted",
                                        "d": newRoom.id
                                    })
                                )
                        del rooms[room.id]

        except Exception as inst:
            break
    
    clients.remove(sock)
    
    room = whichRoomForPlayer(sock._id)
    if not room.isEnd():
        for client in clients:
            if room.isPlayerInRoom(client._id):
                client.send(
                    json.dumps({
                        "t": "force_end",
                        "d": None
                    })
                )
    del rooms[room.id]