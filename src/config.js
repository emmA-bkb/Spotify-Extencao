/**
 * Arquivo de configuração centralizado
 * Backend rodando no Render
 */

// Usar sempre o servidor do Render
const BACKEND_URL = 'https://spotify-extencao.onrender.com';

console.log('🎵 BACKEND_URL definido como:', BACKEND_URL);

// Função para permitir mudança manual (para debugging)
function setBackendUrl(url) {
    window.BACKEND_URL = url;
    localStorage.setItem('backend_url', url);
    console.log('🔧 BACKEND_URL alterado para:', url);
}

// Função para resetar
function resetBackendUrl() {
    localStorage.removeItem('backend_url');
    console.log('🔄 BACKEND_URL resetado para Render');
}
