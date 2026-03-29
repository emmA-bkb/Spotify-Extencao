// Content Script - Roda em todas as abas

console.log('🎵 Content script carregado');

// Ouvir mudanças no localStorage (para a aba de callback do Spotify)
window.addEventListener('storage', (event) => {
    console.log('Storage changed:', event.key);
    
    if (event.key === 'spotify_access_token') {
        const token = event.newValue;
        const refreshToken = localStorage.getItem('spotify_refresh_token');
        
        console.log('Tokens encontrados no localStorage!');
        
        // Salvar em chrome.storage para a extensão
        chrome.storage.local.set({
            spotify_access_token: token,
            spotify_refresh_token: refreshToken,
            spotify_auth_state: 'logged_in'
        }, () => {
            console.log('✅ Tokens salvos em chrome.storage!');
            
            // Notificar popup
            chrome.runtime.sendMessage({
                type: 'AUTH_SUCCESS',
                data: { access_token: token, refresh_token: refreshToken }
            }).catch(() => {});
        });
    }
});

// Também verificar localStorage na aba de callback quando carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkLocalStorage);
} else {
    checkLocalStorage();
}

function checkLocalStorage() {
    const token = localStorage.getItem('spotify_access_token');
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    
    if (token) {
        console.log('✅ Tokens encontrados no localStorage ao carregar!');
        
        chrome.storage.local.set({
            spotify_access_token: token,
            spotify_refresh_token: refreshToken,
            spotify_auth_state: 'logged_in'
        }, () => {
            console.log('✅ Tokens salvos em chrome.storage!');
            
            // Fechar aba após 1 segundo
            setTimeout(() => window.close(), 1000);
        });
    }
}

