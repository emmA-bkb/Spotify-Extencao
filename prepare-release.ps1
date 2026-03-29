# Script para Preparar Release da Extensão

Write-Host "🎵 Preparando Spoti Extension para Release..." -ForegroundColor Green

# Limpar builds anteriores
if (Test-Path "build") {
    Remove-Item "build" -Recurse -Force
}

if (Test-Path "spoti.xpi") {
    Remove-Item "spoti.xpi" -Force
}

# Criar pasta build
New-Item -ItemType Directory -Path "build" -Force | Out-Null

# Copiar arquivos necessários
Write-Host "📦 Copiando arquivos..." -ForegroundColor Cyan

Copy-Item "manifest.json" "build\"
Copy-Item "popup" "build\" -Recurse
Copy-Item "background" "build\" -Recurse
Copy-Item "content" "build\" -Recurse
Copy-Item "icons" "build\" -Recurse
Copy-Item "src" "build\" -Recurse -ErrorAction SilentlyContinue
Copy-Item "README.md" "build\"

# Criar arquivo ZIP
Write-Host "🔨 Criando arquivo .xpi..." -ForegroundColor Cyan
Compress-Archive -Path "build\*" -DestinationPath "spoti.xpi" -Force

# Renomear para .zip também (para fácil compartilhamento)
Copy-Item "spoti.xpi" "spoti-extension.zip" -Force

Write-Host ""
Write-Host "✅ Release preparado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivos criados:" -ForegroundColor Yellow
Write-Host "  📄 spoti.xpi (para Firefox Add-ons)"
Write-Host "  📦 spoti-extension.zip (para distribuição manual)"
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Atualizar BACKEND_URL em popup.js e background.js para URL da nuvem"
Write-Host "  2. Publicar em addons.mozilla.org"
Write-Host "  3. Ou compartilhar spoti.xpi para instalação manual"
Write-Host ""
Write-Host "Veja PUBLICACAO.md para instruções completas!" -ForegroundColor Green
