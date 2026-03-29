# Spoti Backend - Python

Backend para autenticação OAuth2 com Spotify.

## Configuração

### 1. Instalar dependências

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

O arquivo `.env` já está configurado com suas credenciais do Spotify:

```
SPOTIFY_CLIENT_ID=001db0a7a817434f9b38c8505da2a5f4
SPOTIFY_CLIENT_SECRET=fe00f8b4ee264c8485e1c77cbc846fdf
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/auth/spotify/callback
```

### 3. Executar o servidor

```bash
python main.py
```

O servidor estará disponível em `http://127.0.0.1:5000`

## Endpoints

### GET `/auth/spotify/login`
Retorna a URL de autenticação do Spotify

**Response:**
```json
{
  "auth_url": "https://accounts.spotify.com/authorize?..."
}
```

### GET `/auth/spotify/callback`
Callback após autenticação (usado automaticamente)

### GET `/auth/spotify/user`
Retorna informações do usuário autenticado

**Response:**
```json
{
  "display_name": "User Name",
  "email": "user@email.com",
  "images": [...]
}
```

### GET `/auth/spotify/token`
Retorna o access token do usuário

### POST `/auth/logout`
Faz logout do usuário e limpa a sessão

## Estrutura

```
backend/
├── main.py              # Entry point
├── requirements.txt     # Dependências Python
├── .env                 # Variáveis de ambiente
└── app/
    ├── __init__.py      # Factory da aplicação
    ├── routes/
    │   ├── __init__.py
    │   └── auth.py      # Rotas de autenticação
    └── config/
        ├── __init__.py
        └── settings.py  # Configurações
```

## Desenvolvimento

- O servidor roda em modo debug por padrão
- CORS está configurado para localhost:3000 e localhost:5500
- Sessions são salvas em memória (não persiste entre restarts)

## Notas Importantes

- A extensão Firefox se comunicará com este servidor
- O callback do Spotify redireciona para `http://localhost:3000/auth/success`
- Os tokens são armazenados em sessão no servidor
