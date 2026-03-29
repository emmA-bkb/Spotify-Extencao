from flask import Blueprint, request, jsonify, session, redirect
import requests
import base64
import secrets
from urllib.parse import urlencode
from app.config.settings import Config

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# Scopes do Spotify
SPOTIFY_SCOPES = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
    'user-read-playback-state',  # Necessário para /me/player/currently-playing
    'playlist-modify-public',     # Necessário para criar e editar playlists públicas
    'playlist-modify-private'     # Necessário para criar e editar playlists privadas
]

@auth_bp.route('/spotify/login', methods=['GET'])
def spotify_login():
    """
    Inicia o fluxo de autenticação do Spotify
    Gera um state para proteção CSRF
    """
    # Gerar state aleatório para segurança
    state = secrets.token_urlsafe(32)
    session['spotify_state'] = state
    
    params = {
        'client_id': Config.SPOTIFY_CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': Config.SPOTIFY_REDIRECT_URI,
        'scope': ' '.join(SPOTIFY_SCOPES),
        'state': state,
        'show_dialog': 'true'
    }
    
    auth_url = f"{Config.SPOTIFY_AUTH_URL}?{urlencode(params)}"
    return jsonify({'auth_url': auth_url})


@auth_bp.route('/spotify/callback', methods=['GET'])
def spotify_callback():
    """
    Callback do Spotify após autenticação
    Segue RFC-6749 - Authorization Code Flow
    """
    code = request.args.get('code')
    error = request.args.get('error')
    state = request.args.get('state')
    
    # Validar state para proteção CSRF
    stored_state = session.get('spotify_state')
    if state != stored_state:
        return f"""
        <html>
        <head><title>Erro de Segurança</title></head>
        <body>
            <h2>❌ Erro de Segurança</h2>
            <p>State mismatch - requisição inválida</p>
            <p>Você pode fechar esta aba.</p>
            <script>setTimeout(() => window.close(), 2000);</script>
        </body>
        </html>
        """
    
    if error:
        return f"""
        <html>
        <head><title>Erro de Autenticação</title></head>
        <body>
            <h2>❌ Erro de Autenticação</h2>
            <p>{error}</p>
            <p>Você pode fechar esta aba.</p>
            <script>setTimeout(() => window.close(), 2000);</script>
        </body>
        </html>
        """
    
    if not code:
        return jsonify({'error': 'Código de autorização não recebido'}), 400
    
    # Trocar código por token (RFC-6749)
    # Authorization Header deve usar Basic Auth: base64(client_id:client_secret)
    auth_string = base64.b64encode(
        f"{Config.SPOTIFY_CLIENT_ID}:{Config.SPOTIFY_CLIENT_SECRET}".encode()
    ).decode()
    
    token_data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': Config.SPOTIFY_REDIRECT_URI
    }
    
    headers = {
        'Authorization': f'Basic {auth_string}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    try:
        response = requests.post(Config.SPOTIFY_TOKEN_URL, data=token_data, headers=headers)
        response.raise_for_status()
        token_info = response.json()
        
        access_token = token_info.get('access_token')
        refresh_token = token_info.get('refresh_token')
        expires_in = token_info.get('expires_in')
        
        # Guardar token na sessão
        session['access_token'] = access_token
        session['refresh_token'] = refresh_token
        session['spotify_state'] = None  # Limpar state após usar
        
        # Retornar página HTML que salva token em localStorage
        return f"""
        <html>
        <head><title>Autenticação Bem-sucedida</title></head>
        <body>
            <h2>✅ Autenticação Bem-sucedida!</h2>
            <p>Você será redirecionado em breve...</p>
            <script>
                // Salvar tokens em localStorage
                localStorage.setItem('spotify_access_token', '{access_token}');
                localStorage.setItem('spotify_refresh_token', '{refresh_token}');
                localStorage.setItem('spotify_token_expires', Date.now() + {expires_in * 1000});
                
                // Notificar a extensão
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'SPOTIFY_AUTH_SUCCESS',
                        data: {{
                            access_token: '{access_token}',
                            refresh_token: '{refresh_token}'
                        }}
                    }}, '*');
                }}
                
                setTimeout(() => window.close(), 1000);
            </script>
        </body>
        </html>
        """
        
    except requests.exceptions.RequestException as e:
        return f"""
        <html>
        <head><title>Erro ao Obter Token</title></head>
        <body>
            <h2>❌ Erro ao Obter Token</h2>
            <p>{str(e)}</p>
            <p>Você pode fechar esta aba.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
        </body>
        </html>
        """, 500


@auth_bp.route('/spotify/token', methods=['GET'])
def get_token():
    """
    Retorna o token de acesso do usuário logado
    """
    auth_header = request.headers.get('Authorization', '')
    
    if auth_header.startswith('Bearer '):
        return jsonify({'access_token': auth_header.replace('Bearer ', '')})
    
    access_token = session.get('access_token')
    
    if not access_token:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    return jsonify({'access_token': access_token})


@auth_bp.route('/spotify/user', methods=['GET', 'POST'])
def get_user():
    """
    Retorna informações do usuário logado (/me endpoint)
    Aceita token via Authorization header ou POST body
    """
    access_token = None
    
    # 1. Tentar pegar do header Authorization
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        access_token = auth_header.replace('Bearer ', '')
    
    # 2. Tentar pegar do JSON body (POST)
    if not access_token and request.method == 'POST':
        data = request.get_json() or {}
        access_token = data.get('access_token')
    
    # 3. Fallback para sessão
    if not access_token:
        access_token = session.get('access_token')
    
    if not access_token:
        return jsonify({'error': 'Token não autenticado'}), 401
    
    headers = {'Authorization': f'Bearer {access_token}'}
    
    try:
        response = requests.get(f'{Config.SPOTIFY_API_URL}/me', headers=headers)
        response.raise_for_status()
        user_info = response.json()
        
        return jsonify(user_info)
        
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if '401' in error_msg or 'Unauthorized' in error_msg:
            return jsonify({'error': 'Token expirado ou inválido'}), 401
        return jsonify({'error': f'Erro ao obter usuário: {error_msg}'}), 500


@auth_bp.route('/spotify/logout', methods=['POST'])
def logout():
    """
    Faz logout do usuário
    """
    session.clear()
    return jsonify({'message': 'Logout realizado com sucesso'})


@auth_bp.route('/spotify/current_track', methods=['GET', 'POST'])
def get_current_track():
    """
    Retorna a música atualmente tocando
    """
    access_token = None
    
    # 1. Tentar pegar do header Authorization
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        access_token = auth_header.replace('Bearer ', '')
    
    # 2. Tentar pegar do JSON body (POST)
    if not access_token and request.method == 'POST':
        data = request.get_json() or {}
        access_token = data.get('access_token')
    
    # 3. Fallback para sessão
    if not access_token:
        access_token = session.get('access_token')
    
    if not access_token:
        return jsonify({'error': 'Token não autenticado'}), 401
    
    headers = {'Authorization': f'Bearer {access_token}'}
    
    try:
        response = requests.get(f'{Config.SPOTIFY_API_URL}/me/player/currently-playing', headers=headers)
        
        if response.status_code == 204:
            # Nenhuma música tocando
            return jsonify({'is_playing': False, 'item': None})
        
        response.raise_for_status()
        data = response.json()
        
        if not data.get('item'):
            return jsonify({'is_playing': False, 'item': None})
        
        # Formatar resposta
        item = data.get('item', {})
        result = {
            'is_playing': data.get('is_playing', False),
            'item': {
                'name': item.get('name'),
                'artists': [artist.get('name') for artist in item.get('artists', [])],
                'cover': item.get('album', {}).get('images', [{}])[0].get('url'),
                'progress_ms': data.get('progress_ms', 0),
                'duration_ms': item.get('duration_ms', 0),
                'external_urls': item.get('external_urls', {}).get('spotify', ''),
                'id': item.get('id')
            }
        }
        
        return jsonify(result)
        
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if '401' in error_msg or 'Unauthorized' in error_msg:
            return jsonify({'error': 'Token expirado ou inválido'}), 401
        return jsonify({'error': f'Erro ao obter música: {error_msg}'}), 500


@auth_bp.route('/spotify/create_playlist', methods=['POST'])
def create_playlist():
    """
    Cria uma nova playlist para o usuário
    Endpoint: POST /me/playlists
    """
    access_token = None
    
    # 1. Tentar pegar do header Authorization
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        access_token = auth_header.replace('Bearer ', '')
    
    # 2. Tentar pegar do JSON body (POST)
    if not access_token and request.method == 'POST':
        data = request.get_json() or {}
        access_token = data.get('access_token')
    
    # 3. Fallback para sessão
    if not access_token:
        access_token = session.get('access_token')
    
    if not access_token:
        return jsonify({'error': 'Token não autenticado'}), 401
    
    # Obter dados da request
    data = request.get_json() or {}
    playlist_name = data.get('playlist_name', '').strip()
    is_public = data.get('is_public', True)
    
    if not playlist_name:
        return jsonify({'error': 'Nome da playlist é obrigatório'}), 400
    
    headers = {'Authorization': f'Bearer {access_token}'}
    
    try:
        # Criar playlist direto em /me/playlists (não precisa de user_id)
        playlist_data = {
            'name': playlist_name,
            'public': is_public,
            'description': f'Criada pela extensão Spoti'
        }
        
        response = requests.post(
            f'{Config.SPOTIFY_API_URL}/me/playlists',
            headers=headers,
            json=playlist_data
        )
        
        response.raise_for_status()
        result = response.json()
        
        return jsonify({
            'success': True,
            'playlist_id': result.get('id'),
            'playlist_name': result.get('name'),
            'playlist_url': result.get('external_urls', {}).get('spotify', ''),
            'is_public': result.get('public')
        }), 201
        
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if '401' in error_msg or 'Unauthorized' in error_msg:
            return jsonify({'error': 'Token expirado ou inválido'}), 401
        if '403' in error_msg or 'Forbidden' in error_msg:
            return jsonify({'error': 'Permissão negada. Faça logout e login novamente para dar permissão de criar playlists'}), 403
        if '400' in error_msg or 'Bad Request' in error_msg:
            return jsonify({'error': 'Dados inválidos para criar a playlist'}), 400
        return jsonify({'error': f'Erro ao criar playlist: {error_msg}'}), 500


@auth_bp.route('/spotify/user_playlists', methods=['POST'])
def user_playlists():
    """
    Retorna as playlists do usuário
    Endpoint: GET /me/playlists
    """
    access_token = None
    
    # 1. Tentar pegar do header Authorization
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        access_token = auth_header.replace('Bearer ', '')
    
    # 2. Tentar pegar do JSON body (POST)
    if not access_token and request.method == 'POST':
        data = request.get_json() or {}
        access_token = data.get('access_token')
    
    # 3. Fallback para sessão
    if not access_token:
        access_token = session.get('access_token')
    
    if not access_token:
        return jsonify({'error': 'Token não autenticado'}), 401
    
    headers = {'Authorization': f'Bearer {access_token}'}
    
    try:
        response = requests.get(
            f'{Config.SPOTIFY_API_URL}/me/playlists?limit=50',
            headers=headers
        )
        
        response.raise_for_status()
        result = response.json()
        
        playlists = result.get('items', [])
        
        return jsonify({
            'playlists': [
                {
                    'id': pl.get('id'),
                    'name': pl.get('name'),
                    'public': pl.get('public'),
                    'tracks': {
                        'total': pl.get('tracks', {}).get('total', 0)
                    }
                }
                for pl in playlists
            ]
        })
        
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if '401' in error_msg or 'Unauthorized' in error_msg:
            return jsonify({'error': 'Token expirado ou inválido'}), 401
        return jsonify({'error': f'Erro ao obter playlists: {error_msg}'}), 500


@auth_bp.route('/spotify/add_track_to_playlist', methods=['POST'])
def add_track_to_playlist():
    """
    Adiciona uma ou mais tracks a uma playlist
    Endpoint: POST /playlists/{playlist_id}/items
    """
    access_token = None
    
    # 1. Tentar pegar do header Authorization
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        access_token = auth_header.replace('Bearer ', '')
    
    # 2. Tentar pegar do JSON body (POST)
    if not access_token and request.method == 'POST':
        data = request.get_json() or {}
        access_token = data.get('access_token')
    
    # 3. Fallback para sessão
    if not access_token:
        access_token = session.get('access_token')
    
    if not access_token:
        return jsonify({'error': 'Token não autenticado'}), 401
    
    # Obter dados
    data = request.get_json() or {}
    playlist_id = data.get('playlist_id')
    track_uri = data.get('track_uri')
    position = data.get('position')
    
    if not playlist_id or not track_uri:
        return jsonify({'error': 'playlist_id e track_uri são obrigatórios'}), 400
    
    headers = {'Authorization': f'Bearer {access_token}'}
    
    try:
        # Preparar payload
        payload = {
            'uris': [track_uri] if isinstance(track_uri, str) else track_uri
        }
        
        if position is not None:
            payload['position'] = position
        
        # Adicionar items à playlist
        response = requests.post(
            f'{Config.SPOTIFY_API_URL}/playlists/{playlist_id}/items',
            headers=headers,
            json=payload
        )
        
        response.raise_for_status()
        result = response.json()
        
        return jsonify({
            'success': True,
            'snapshot_id': result.get('snapshot_id'),
            'message': 'Track adicionada com sucesso'
        }), 201
        
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if '401' in error_msg or 'Unauthorized' in error_msg:
            return jsonify({'error': 'Token expirado ou inválido'}), 401
        if '403' in error_msg or 'Forbidden' in error_msg:
            return jsonify({'error': 'Você não tem permissão para adicionar tracks a esta playlist'}), 403
        if '404' in error_msg or 'Not Found' in error_msg:
            return jsonify({'error': 'Playlist ou track não encontrada'}), 404
        return jsonify({'error': f'Erro ao adicionar track: {error_msg}'}), 500
