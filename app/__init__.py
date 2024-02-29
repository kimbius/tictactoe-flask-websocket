from flask import Flask
import os, secrets

from .events import sock
from .routes import main
from .apis import api

def create_app():
    app = Flask(
                __name__,
                static_url_path='/static', 
                static_folder='web/static',
                template_folder='web/templates'
        )
    app.config["DEBUG"] = bool(os.getenv("DEBUG", "True"))
    app.config["SECRET_KEY"] = secrets.token_hex(32)
    
    app.register_blueprint(main)
    app.register_blueprint(api)
    
    sock.init_app(app)
    
    return app