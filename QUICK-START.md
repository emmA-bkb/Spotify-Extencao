# 🚀 Quick Start: Publicar Extensão

## Resumo em 5 passos:

### Passo 1️⃣: Preparar o Manifest.json
Seu manifest está ok! Tem tudo necessário.

### Passo 2️⃣: Hospedar o Backend na Nuvem
**Opção rápida - Render.com (GRÁTIS):**

1. Acesse https://render.com
2. Crie conta com GitHub
3. Clique em "New" → "Web Service"
4. Conecte seu repositório
5. Configure:
   - **Name:** spoti-backend
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app.main:app`

6. Adicione Environment Variables:
   ```
   SPOTIFY_CLIENT_ID=001db0a7a817434f9b38c8505da2a5f4
   SPOTIFY_CLIENT_SECRET=fe00f8b4ee264c8485e1c77cbc846fdf
   SPOTIFY_REDIRECT_URI=https://seu-backend.onrender.com/auth/spotify/callback
   ```

7. Deploy (levará 2-3 min)
8. Copie a URL fornecida (ex: `https://spoti-backend-12345.onrender.com`)

### Passo 3️⃣: Atualizar URLs na Extensão

Edite **popup.js** e **background.js**:

**Antes:**
```javascript
const BACKEND_URL = 'http://127.0.0.1:5000';
```

**Depois:**
```javascript
const BACKEND_URL = 'https://seu-backend.onrender.com';
```

### Passo 4️⃣: Criar arquivo .xpi

Abra PowerShell na pasta da extensão (c:\Visual Studio\spoti\):

```powershell
# Executar script de preparação
.\prepare-release.ps1
```

Isso vai criar:
- `spoti.xpi` ← usar isso para publicar
- `spoti-extension.zip` ← para distribuição manual

### Passo 5️⃣: Publicar

**Opção A - Firefox Add-ons (Recomendado):**
1. Crie conta em https://addons.mozilla.org
2. Vá em "Submit Add-on"
3. Upload do `spoti.xpi`
4. Preencha informações
5. Espere review (5-7 dias)
6. PRONTO! Qualquer um pode instalar

**Opção B - Distribuição Manual:**
1. Compartilhe `spoti.xpi` em link/email
2. Pessoas baixam e instalam manualmente

---

## 💡 Dica Importante

Para que outras pessoas usem a extensão:
- ❌ NÃO pode ser localhost/127.0.0.1
- ✅ SIM precisa estar em servidor em nuvem
- ✅ Render.com, Heroku, Railway, Replit (todos grátis)

---

## ⚠️ Estrutura de Pastas para Upload

Certifique-se que tem:
```
spoti/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── background/
│   └── background.js
├── content/
│   └── content.js
├── icons/
│   └── icon-*.png
├── README.md
└── PUBLICACAO.md
```

Se faltar algo, o script `prepare-release.ps1` vai avisar!

---

Que precisa de ajuda em qual passo? 👇
