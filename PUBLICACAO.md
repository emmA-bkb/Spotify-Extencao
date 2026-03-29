# 📱 Guia de Publicação - Spoti Extension

## ⚠️ Importante: Backend Precisa Estar Sempre Rodando

A extensão depende de um backend rodando em `http://127.0.0.1:5000`. Para publicar para outras pessoas, você tem 3 opções:

---

## Opção 1: Cloud Backend (Recomendado) ⭐

Hospedar o backend em uma nuvem para que QUALQUER pessoa use, de QUALQUER lugar.

### Passo 1: Deploy do Backend (Heroku, Render, Railway, etc)

**Exemplo com Render.com (Grátis):**

1. Crie conta em [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Crie um novo "Web Service"
4. Selecione Python como ambiente
5. Configure:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn app.main:app`
   - **Environment Variables:**
     - `SPOTIFY_CLIENT_ID=001db0a7a817434f9b38c8505da2a5f4`
     - `SPOTIFY_CLIENT_SECRET=fe00f8b4ee264c8485e1c77cbc846fdf`
     - `SPOTIFY_REDIRECT_URI=https://SEU-BACKEND.onrender.com/auth/spotify/callback`

6. Deploy e pegue a URL (ex: `https://spoti-backend-xyz.onrender.com`)

### Passo 2: Atualizar URLs na Extensão

Atualize `popup.js` e `background.js`:

**Antes:**
```javascript
const BACKEND_URL = 'http://127.0.0.1:5000';
```

**Depois:**
```javascript
const BACKEND_URL = 'https://spoti-backend-xyz.onrender.com';
```

### Passo 3: Publicar na Firefox Add-ons

1. Crie conta em [addons.mozilla.org](https://addons.mozilla.org)
2. Vá em **Submit Your Add-on**
3. Envie um arquivo `.zip` da extensão
4. Preencha informações:
   - Nome: `Spoti - Auto-Add Playlist`
   - Descrição: `Adicione automaticamente músicas à sua playlist do Spotify quando atingir 70% (configurável)`
   - Ícones (128x128, 256x256, 512x512)
5. Espere review (5-7 dias)
6. Assim que aprovado, qualquer um pode instalar!

---

## Opção 2: Distribuição Manual (.xpi)

Compartilhar arquivo para outros usarem sem publicar na store.

### Passo 1: Criar arquivo .xpi

**Windows (PowerShell):**
```powershell
cd c:\Visual Studio\spoti
Compress-Archive -Path * -DestinationPath spoti.zip
```

Renomeie `spoti.zip` para `spoti.xpi`

**Linux/Mac:**
```bash
cd /caminho/do/spoti
zip -r spoti.xpi * -x "*.git*" "backend/*" "node_modules/*"
```

### Passo 2: Compartilhar

1. Faça upload para site seu ou GitHub Releases
2. Pessoas baixam `spoti.xpi`
3. Abrem Firefox → `about:addons`
4. Clicam no ⚙️ → "Install Add-on From File"
5. Selecionam `spoti.xpi`

**Desvantagem:** Sem atualizações automáticas

---

## Opção 3: Modo Desenvolvimento (Testing)

Para você testar com outras pessoas na sua rede local.

1. Ambos na mesma rede WiFi
2. Backend rodando em `0.0.0.0:5000` (não localhost)
3. Atualize URLs para IP do computador: `http://192.168.1.X:5000`
4. Compartilhe arquivo `.xpi`

---

## ✅ Checklist Antes de Publicar

- [ ] Backend testado e funcional
- [ ] Manifest.json completo com versão
- [ ] Ícones 128x128, 256x256, 512x512
- [ ] README em português/inglês
- [ ] Descrição clara da extensão
- [ ] YouTube/screenshot mostrando funcionamento
- [ ] Changelog atualizado

---

## 🚀 Passos Rápidos (Cloud + Store)

1. **Deploy Backend:**
   ```bash
   # Fazer upload para Render/Heroku/Railway
   # Pegar URL do backend
   ```

2. **Atualizar URLs:**
   ```bash
   # Editar popup.js e background.js
   # Trocar localhost pela URL do backend
   ```

3. **Criar arquivo:**
   ```bash
   zip -r spoti.xpi * -x "*.git*" "backend/*"
   ```

4. **Publicar:**
   - Ir para addons.mozilla.org
   - Submeter `.xpi`
   - Aguardar review
   - Profit! 🎉

---

## 📝 Notas Importantes

- **A extensão não funciona sem backend rodando**
- **Localhost (127.0.0.1) só funciona no seu PC**
- **Para outros usarem, backend deve estar em Cloud**
- **Atualizações exigem nova submissão na Store**
- **Gratuito publicar na Mozilla!**

---

## 🆘 Problemas Comuns

**Q: "Conexão recusada ao servidor"**
- A: Backend não está rodando ou URL está errada

**Q: "CORS error"**
- A: Backend precisa estar com CORS configurado corretamente

**Q: "Permissão negada na playlist"**
- A: Usuário precisa fazer logout/login para atualizar escopos

---

Quer ajuda com alguma das opções?
