from flask import Blueprint, render_template, jsonify
import secrets, app.utils.models

from .events import rooms

api = Blueprint("api", __name__, url_prefix="/api")

@api.get("/room")
def room():
    return render_template("room.html")

@api.post("/room")
def create_room():
    roomId = secrets.token_hex(3)
    newRoom = app.utils.models.Room(id=roomId)
    rooms[newRoom.id] = newRoom
    return jsonify({
        "code": newRoom.id
    })