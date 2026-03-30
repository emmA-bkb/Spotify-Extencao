import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configurações da aplicação"""
    
    # Spotify OAuth
    SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
    SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
    
    # Validar se credenciais existem
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        raise ValueError('SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET devem ser configurados em .env')
    
    # URLs de redirect aceitas (local e Render)
    SPOTIFY_REDIRECT_URIS = [
        'http://127.0.0.1:5000/auth/spotify/callback',
        'https://spotify-extencao.onrender.com/auth/spotify/callback'
    ]
    SPOTIFY_REDIRECT_URI = os.getenv('SPOTIFY_REDIRECT_URI', 'https://spotify-extencao.onrender.com/auth/spotify/callback')
    SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
    SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
    SPOTIFY_API_URL = 'https://api.spotify.com/v1'
    
    # Flask - Segurança
    SECRET_KEY = os.getenv('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError('SECRET_KEY deve ser configurada em .env - gere uma com: python -c "import secrets; print(secrets.token_hex(32))"')
    
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # CORS - Apenas extensão Firefox (mais seguro)
    CORS_ORIGINS = [
        'moz-extension://*'  # Apenas extensões Firefox
    ]
