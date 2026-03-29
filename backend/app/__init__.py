from flask import Flask
from flask_cors import CORS
from app.config.settings import Config
from app.routes.auth import auth_bp

def create_app():
    """Factory para criar a aplicação Flask"""
    app = Flask(__name__)
    
    # Configurações
    app.config.from_object(Config)
    
    # CORS - Aceita qualquer origem (desenvolvimento)
    CORS(app, 
         origins=['*'],
         allow_headers=['*'],
         methods=['GET', 'POST', 'OPTIONS'],
         supports_credentials=True)
    
    # Blueprints
    app.register_blueprint(auth_bp)
    
    # Health check
    @app.route('/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200
    
    return app
