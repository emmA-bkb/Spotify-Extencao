# Segurança - Spoti Extension

## Checklist de Segurança em Produção

### Backend (Python/Flask)

- [ ] **Variáveis de Ambiente**
  - Criar arquivo `.env` (NÃO commitar!)
  - Gerar `SECRET_KEY` forte: `python -c "import secrets; print(secrets.token_hex(32))"`
  - Configurar credenciais Spotify reais

- [ ] **CORS (Cross-Origin Resource Sharing)**
  - Apenas `moz-extension://*` para extensões Firefox
  - NÃO usar `['*']` em produção

- [ ] **Debug Mode**
  - Sempre `DEBUG=False` em produção
  - Protege contra stack trace exposure

- [ ] **HTTPS**
  - Usar em todas as URLs (https://spotify-extencao.onrender.com)
  - Render fornece certificado SSL automático

- [ ] **Token Handling**
  - Tokens salvos na sessão (servidor-side)
  - Nunca retornar tokens em resposta não-criptografada

- [ ] **Rate Limiting** (futuro)
  - Implementar limite de requisições por usuário
  - Prevenir brute-force e DoS

### Frontend (JavaScript)

- [ ] **Storage Local**
  - Usar `chrome.storage.local` (isolado por extensão)
  - NÃO usar `localStorage` (acessível de scripts maliciosos)

- [ ] **Token Expiration**
  - Sempre validar token antes de usar
  - Renovar com refresh_token quando expirar

- [ ] **Content Security Policy (CSP)**
  - Adicionar ao manifest.json se necessário
  - Bloquear inline scripts maliciosos

- [ ] **Permissões Mínimas**
  - Solicitar apenas permissões necessárias
  - Revisar manifest.json regularmente

### OAuth 2.0 Security

- [ ] **State Token**
  - Spotify gera e valida automaticamente
  - Protege contra CSRF attacks

- [ ] **Redirect URI Whitelist**
  - Spotify valida redirect_uri
  - Configurado em settings.py

- [ ] **Scope Limitation**
  - Apenas scopes necessários:
    - `playlist-modify-private` (adicionar à playlist)
    - `user-read-playback-state` (ver música atual)
    - `playlist-read-private` (ler playlists)

### Credenciais Spotify

⚠️ **CRÍTICO**: Seus Client ID/Secret NUNCA devem ser expostos!

- [ ] NÃO commitar .env com credenciais reais
- [ ] NÃO compartilhar screenshots com credenciais visíveis
- [ ] Rotacionar credenciais se comprometidas
- [ ] Usar diferentes credenciais para dev/prod

### Dependências

- [ ] Manter Flask e bibliotecas atualizadas
- [ ] Usar `pip install -r requirements.txt` (versões fixas)
- [ ] Revisar regularmente por vulnerabilidades: `pip audit`

### Monitoramento

- [ ] Logs em produção (sem dados sensíveis)
- [ ] Monitorar erros 401/403
- [ ] Alertas para múltiplas tentativas falhas

## Como Fazer Deploy Seguro

1. **Gerar SECRET_KEY**
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **Criar .env em Render**
   - Não fazer upload do arquivo
   - Usar Render Dashboard → Environment

3. **Variáveis Necessárias em Render**
   ```
   SPOTIFY_CLIENT_ID=xxx
   SPOTIFY_CLIENT_SECRET=yyy
   SPOTIFY_REDIRECT_URI=https://seu-backend.onrender.com/auth/spotify/callback
   SECRET_KEY=zzz
   FLASK_DEBUG=False
   ```

4. **Verificar HTTPS**
   - Render fornece SSL automático
   - Sempre usar `https://`

## Referências

- [Spotify Web API Security](https://developer.spotify.com/documentation/web-api)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Flask Security Best Practices](https://flask.palletsprojects.com/security/)
- [Mozilla Extension Security](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Security_best_practices)
