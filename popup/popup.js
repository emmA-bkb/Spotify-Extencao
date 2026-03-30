// BACKEND_URL é carregado de config.js
let nowPlayingInterval = null;

// Auto-add Settings (sincronizados com background)
let selectedPlaylist = null;
let thresholdPercentage = 70;

// Elementos do DOM
const authSection = document.getElementById('auth-section');
const userSection = document.getElementById('user-section');
const userContent = document.getElementById('user-content');
const loadingDiv = document.getElementById('loading');
const spotifyLoginBtn = document.getElementById('spotify-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const nowPlayingDiv = document.getElementById('now-playing');
const notPlayingDiv = document.getElementById('not-playing');
const selectedPlaylistCard = document.getElementById('selected-playlist-card');
const selectedPlaylistCover = document.getElementById('selected-playlist-cover');
const selectedPlaylistName = document.getElementById('selected-playlist-name');
const selectedPlaylistTrackCount = document.getElementById('selected-playlist-track-count');

// Modal elements
const playlistModal = document.getElementById('playlist-modal');
const createPlaylistBtn = document.getElementById('create-playlist-btn');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalCreate = document.getElementById('modal-create');
const playlistNameInput = document.getElementById('playlist-name');

// Choose Playlist Modal
const choosePlaylistModal = document.getElementById('choose-playlist-modal');
const choosePlaylistBtn = document.getElementById('choose-playlist-btn');
const choosePlaylistClose = document.getElementById('choose-playlist-close');
const choosePlaylistCancel = document.getElementById('choose-playlist-cancel');
const playlistsList = document.getElementById('playlists-list');

// Settings Modal
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const settingsClose = document.getElementById('settings-close');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const thresholdInput = document.getElementById('threshold-input');
const thresholdDisplay = document.getElementById('threshold-display');
const selectedPlaylistInfo = document.getElementById('selected-playlist-info');

// Event listeners
spotifyLoginBtn.addEventListener('click', initiateSpotifyLogin);
logoutBtn.addEventListener('click', handleLogout);
createPlaylistBtn.addEventListener('click', openPlaylistModal);
modalClose.addEventListener('click', closePlaylistModal);
modalCancel.addEventListener('click', closePlaylistModal);
modalCreate.addEventListener('click', createPlaylist);

// Choose Playlist Modal
choosePlaylistBtn.addEventListener('click', openChoosePlaylistModal);
choosePlaylistClose.addEventListener('click', closeChoosePlaylistModal);
choosePlaylistCancel.addEventListener('click', closeChoosePlaylistModal);

// Settings Modal
settingsBtn.addEventListener('click', openSettingsModal);
settingsClose.addEventListener('click', closeSettingsModal);
settingsCloseBtn.addEventListener('click', closeSettingsModal);
thresholdInput.addEventListener('input', updateThresholdDisplay);

// Ouvir mensagens da aba de callback
window.addEventListener('message', (event) => {
    if (event.data.type === 'SPOTIFY_AUTH_SUCCESS') {
        const { access_token, refresh_token } = event.data.data;
        // Salvar tokens
        chrome.storage.local.set({
            spotify_access_token: access_token,
            spotify_refresh_token: refresh_token,
            spotify_auth_state: 'logged_in'
        });
        // Verificar após salvar
        setTimeout(checkUserStatus, 500);
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup carregado');
    checkUserStatus();
});

/**
 * Verifica se o usuário já está autenticado
 */
async function checkUserStatus() {
    try {
        // Tentar pegar token do storage
        const storage = await new Promise((resolve) => {
            chrome.storage.local.get(['spotify_access_token', 'spotify_user_data', 'spotify_auth_state'], resolve);
        });
        
        const token = storage.spotify_access_token;
        const authState = storage.spotify_auth_state;
        const userData = storage.spotify_user_data;
        
        console.log('Auth state:', authState);
        console.log('Token:', token ? 'Exists' : 'Not found');
        console.log('User data:', userData ? 'Cached' : 'Not cached');
        
        // Se tem token e estado é 'logged_in' e temos dados cacheados
        if (token && authState === 'logged_in' && userData) {
            console.log('Usando dados cacheados');
            showUserSection(userData);
            // Verificar com backend em background para validar token
            validateTokenInBackground(token);
        } else if (token) {
            console.log('Validando token com backend...');
            showLoading(true);
            
            // Enviar token via POST
            const response = await fetch(`${BACKEND_URL}/auth/spotify/user`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ access_token: token })
            });
            
            if (response.ok) {
                const user = await response.json();
                console.log('User data received:', user.display_name);
                
                // Salvar dados do usuário para cache
                chrome.storage.local.set({
                    spotify_user_data: user,
                    spotify_auth_state: 'logged_in'
                });
                
                showUserSection(user);
            } else {
                console.log('Token inválido ou expirado');
                // Token inválido
                chrome.storage.local.set({ spotify_auth_state: 'logged_out' });
                showAuthSection();
            }
        } else {
            console.log('Nenhum token encontrado');
            showLoading(false);
            showAuthSection();
        }
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        showLoading(false);
        showAuthSection();
    }
}

/**
 * Valida token em background sem bloquear UI
 */
async function validateTokenInBackground(token) {
    try {
        const response = await fetch(`${BACKEND_URL}/auth/spotify/user`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ access_token: token })
        });
        
        if (!response.ok) {
            console.log('Token expirou em background');
            chrome.storage.local.set({ spotify_auth_state: 'logged_out' });
        }
    } catch (error) {
        console.error('Erro na validação em background:', error);
    }
}

/**
 * Inicia o fluxo de login do Spotify
 */
async function initiateSpotifyLogin() {
    try {
        showLoading(true);
        
        console.log('Iniciando login do Spotify...');
        console.log('Backend URL:', BACKEND_URL);
        
        // Obter URL de autenticação do backend
        const response = await fetch(`${BACKEND_URL}/auth/spotify/login`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
    
    // Salvar estado
    chrome.storage.local.set({ spotify_auth_state: 'logged_in' });
        console.log('Auth URL received:', data.auth_url ? 'Yes' : 'No');
        
        if (data.auth_url) {
            // Abrir URL de autenticação em nova aba
            chrome.tabs.create({ url: data.auth_url });
        } else {
            console.error('No auth_url in response:', data);
            alert('Erro ao obter URL de autenticação');
            showLoading(false);
        }
    } catch (error) {
        console.error('Erro ao iniciar login:', error);
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        alert(`Erro ao conectar ao Spotify: ${error.message}\n\nVerifique se o servidor está rodando em http://127.0.0.1:5000`);
        showLoading(false);
    }
}

/**
 * Exibe a seção de autenticação
 */
function showAuthSection() {
    authSection.style.display = 'flex';
    userSection.style.display = 'none';
    userContent.style.display = 'none';
    selectedPlaylistCard.style.display = 'none';
    loadingDiv.style.display = 'none';
    
    // Parar atualizações de música
    if (nowPlayingInterval) {
        clearInterval(nowPlayingInterval);
        nowPlayingInterval = null;
    }
    
    // Salvar estado
    chrome.storage.local.set({ spotify_auth_state: 'logged_out' });
}

/**
 * Exibe a seção de usuário
 */
function showUserSection(user) {
    authSection.style.display = 'none';
    userSection.style.display = 'flex';
    userContent.style.display = 'flex';
    loadingDiv.style.display = 'none';
    
    // Atualizar informações do usuário
    document.getElementById('user-name').textContent = user.display_name || user.email;
    
    // Exibir avatar se disponível
    if (user.images && user.images.length > 0) {
        document.getElementById('user-avatar').src = user.images[0].url;
    }
    
    // Salvar estado
    chrome.storage.local.set({ spotify_auth_state: 'logged_in' });
    
    // Carregar configurações de auto-add
    chrome.storage.local.get(['selected_playlist', 'threshold_percentage'], (storage) => {
        selectedPlaylist = storage.selected_playlist || null;
        thresholdPercentage = storage.threshold_percentage || 70;
        
        // Atualizar card da playlist selecionada
        updateSelectedPlaylistCard();
    });
    
    // Começar a atualizar música a cada 2 segundos
    if (nowPlayingInterval) clearInterval(nowPlayingInterval);
    updateCurrentTrack();
    nowPlayingInterval = setInterval(updateCurrentTrack, 2000);
}

/**
 * Exibe/oculta a seção de loading
 */
function showLoading(show) {
    loadingDiv.style.display = show ? 'flex' : 'none';
}

/**
 * Faz logout do usuário
 */
async function handleLogout() {
    try {
        // Parar atualizações de música
        if (nowPlayingInterval) {
            clearInterval(nowPlayingInterval);
            nowPlayingInterval = null;
        }
        
        // Limpar tudo do storage
        chrome.storage.local.remove([
            'spotify_access_token', 
            'spotify_refresh_token',
            'spotify_user_data',
            'spotify_auth_state'
        ]);
        
        // Chamar logout no backend (optional)
        fetch(`${BACKEND_URL}/auth/logout`, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => {});
        
        showAuthSection();
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

/**
 * Atualiza a música atualmente tocando
 */
async function updateCurrentTrack() {
    try {
        const storage = await new Promise((resolve) => {
            chrome.storage.local.get(['spotify_access_token'], resolve);
        });
        
        const token = storage.spotify_access_token;
        
        if (!token) return;
        
        const response = await fetch(`${BACKEND_URL}/auth/spotify/current_track`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ access_token: token })
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.is_playing && data.item) {
            // Música está tocando
            const item = data.item;
            
            // Atualizar HTML
            document.getElementById('track-name').textContent = item.name;
            document.getElementById('track-artist').textContent = item.artists.join(', ');
            
            if (item.cover) {
                document.getElementById('track-cover').src = item.cover;
            }
            
            // Atualizar barra de progresso
            const progress = (item.progress_ms / item.duration_ms) * 100;
            document.getElementById('progress').style.width = progress + '%';
            
            // Atualizar tempo
            document.getElementById('current-time').textContent = formatTime(item.progress_ms);
            document.getElementById('duration').textContent = formatTime(item.duration_ms);
            
            // Mostrar seção de música
            nowPlayingDiv.style.display = 'block';
            notPlayingDiv.style.display = 'none';
        } else {
            // Nenhuma música tocando
            nowPlayingDiv.style.display = 'none';
            notPlayingDiv.style.display = 'block';
            currentTrackId = null;
        }
    } catch (error) {
        console.error('Erro ao atualizar música:', error);
    }
}

/**
 * Formata tempo em ms para mm:ss
 */
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Abre o modal de criar playlist
 */
function openPlaylistModal() {
    playlistModal.style.display = 'flex';
    playlistNameInput.focus();
}

/**
 * Fecha o modal de criar playlist
 */
function closePlaylistModal() {
    playlistModal.style.display = 'none';
    playlistNameInput.value = '';
    document.querySelector('input[name="playlist-type"][value="public"]').checked = true;
}

/**
 * Cria uma nova playlist
 */
async function createPlaylist() {
    try {
        const playlistName = playlistNameInput.value.trim();
        const isPublic = document.querySelector('input[name="playlist-type"]:checked').value === 'public';
        
        if (!playlistName) {
            alert('Digite um nome para a playlist');
            return;
        }
        
        // Obter token
        const storage = await new Promise((resolve) => {
            chrome.storage.local.get(['spotify_access_token'], resolve);
        });
        
        const token = storage.spotify_access_token;
        
        if (!token) {
            alert('Você não está autenticado');
            return;
        }
        
        // Criar playlist via backend
        const response = await fetch(`${BACKEND_URL}/auth/spotify/create_playlist`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                access_token: token,
                playlist_name: playlistName,
                is_public: isPublic
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`Playlist "${playlistName}" criada com sucesso`);
            closePlaylistModal();
        } else {
            alert(`Erro: ${data.error || 'Não foi possível criar a playlist'}`);
        }
    } catch (error) {
        console.error('Erro ao criar playlist:', error);
        alert(`Erro: ${error.message}`);
    }
}

/**
 * Abre o modal de escolher playlist
 */
async function openChoosePlaylistModal() {
    try {
        choosePlaylistModal.style.display = 'flex';
        playlistsList.innerHTML = '<p>Carregando playlists...</p>';
        
        // Obter token
        const storage = await new Promise((resolve) => {
            chrome.storage.local.get(['spotify_access_token'], resolve);
        });
        
        const token = storage.spotify_access_token;
        
        if (!token) {
            playlistsList.innerHTML = '<p>❌ Você não está autenticado</p>';
            return;
        }
        
        // Buscar playlists
        const response = await fetch(`${BACKEND_URL}/auth/spotify/user_playlists`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ access_token: token })
        });
        
        if (!response.ok) {
            playlistsList.innerHTML = '<p>❌ Erro ao carregar playlists</p>';
            return;
        }
        
        const data = await response.json();
        const playlists = data.playlists || [];
        
        if (playlists.length === 0) {
            playlistsList.textContent = 'Nenhuma playlist encontrada. Crie uma primeira!';
            return;
        }
        
        // Limpar conteúdo anterior
        playlistsList.innerHTML = '';
        
        // Renderizar playlists com segurança
        playlists.forEach(pl => {
            const playlistItem = document.createElement('div');
            playlistItem.className = `playlist-item ${selectedPlaylist && selectedPlaylist.id === pl.id ? 'selected' : ''}`;
            playlistItem.dataset.playlistId = pl.id;
            playlistItem.dataset.playlistName = pl.name;
            playlistItem.dataset.playlistPublic = pl.public;
            
            // Adicionar imagem da playlist
            const playlistImage = document.createElement('img');
            playlistImage.className = 'playlist-cover';
            playlistImage.crossOrigin = 'anonymous';
            if (pl.images && pl.images.length > 0) {
                playlistImage.src = pl.images[0].url;
            } else {
                // Imagem padrão se não tiver capa
                playlistImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"%3E%3Crect fill="%231DB954" width="300" height="300"/%3E%3C/svg%3E';
            }
            playlistImage.alt = pl.name;
            
            const playlistInfo = document.createElement('div');
            playlistInfo.className = 'playlist-info';
            
            const playlistNameP = document.createElement('p');
            playlistNameP.className = 'playlist-name';
            playlistNameP.textContent = pl.name;
            
            const playlistCountP = document.createElement('p');
            playlistCountP.className = 'playlist-count';
            playlistCountP.textContent = `${pl.tracks.total} músicas`;
            
            const playlistTypeSpan = document.createElement('span');
            playlistTypeSpan.className = 'playlist-type';
            playlistTypeSpan.textContent = pl.public ? 'Pública' : 'Privada';
            
            playlistInfo.appendChild(playlistNameP);
            playlistInfo.appendChild(playlistCountP);
            playlistInfo.appendChild(playlistTypeSpan);
            
            playlistItem.appendChild(playlistImage);
            playlistItem.appendChild(playlistInfo);
            playlistItem.addEventListener('click', selectPlaylist);
            
            playlistsList.appendChild(playlistItem);
        });
    } catch (error) {
        console.error('Erro ao abrir modal de playlists:', error);
        playlistsList.innerHTML = '<p>❌ Erro ao carregar playlists</p>';
    }
}

/**
 * Fecha o modal de escolher playlist
 */
function closeChoosePlaylistModal() {
    choosePlaylistModal.style.display = 'none';
}

/**
 * Seleciona uma playlist
 */
async function selectPlaylist(event) {
    const item = event.currentTarget;
    const playlistId = item.dataset.playlistId;
    const playlistName = item.dataset.playlistName;
    const isPublic = item.dataset.playlistPublic === 'true';
    
    // Remover seleção anterior
    document.querySelectorAll('.playlist-item').forEach(el => el.classList.remove('selected'));
    
    // Marcar como selecionada
    item.classList.add('selected');
    
    // Coletar informações detalhadas da playlist
    const playlistCover = item.querySelector('.playlist-cover')?.src || '';
    const trackCount = item.querySelector('.playlist-count')?.textContent || '0 músicas';
    
    // Salvar no storage
    selectedPlaylist = { 
        id: playlistId, 
        name: playlistName, 
        public: isPublic,
        cover: playlistCover,
        trackCount: trackCount
    };
    chrome.storage.local.set({ selected_playlist: selectedPlaylist });
    
    // Atualizar o card de playlist selecionada
    updateSelectedPlaylistCard();
    
    // Atualizar info no modal de settings
    updateSelectedPlaylistInfo();
    
    // Fechar modal
    closeChoosePlaylistModal();
    
    console.log(`Playlist selecionada: ${playlistName}`);
}

/**
 * Atualiza o card da playlist selecionada
 */
function updateSelectedPlaylistCard() {
    if (selectedPlaylist && selectedPlaylist.id) {
        selectedPlaylistName.textContent = selectedPlaylist.name;
        selectedPlaylistTrackCount.textContent = selectedPlaylist.trackCount || '0 músicas';
        
        if (selectedPlaylist.cover) {
            selectedPlaylistCover.src = selectedPlaylist.cover;
        }
        
        selectedPlaylistCard.style.display = 'block';
    } else {
        selectedPlaylistCard.style.display = 'none';
    }
}

/**
 * Abre o modal de configurações
 */
async function openSettingsModal() {
    try {
        settingsModal.style.display = 'flex';
        
        // Carregar configurações
        const storage = await new Promise((resolve) => {
            chrome.storage.local.get(['selected_playlist', 'threshold_percentage'], resolve);
        });
        
        selectedPlaylist = storage.selected_playlist || null;
        thresholdPercentage = storage.threshold_percentage || 70;
        
        // Atualizar inputs
        thresholdInput.value = thresholdPercentage;
        thresholdDisplay.textContent = `${thresholdPercentage}%`;
        
        // Atualizar info da playlist selecionada
        updateSelectedPlaylistInfo();
    } catch (error) {
        console.error('Erro ao abrir settings:', error);
    }
}

/**
 * Fecha o modal de configurações
 */
function closeSettingsModal() {
    settingsModal.style.display = 'none';
}

/**
 * Atualiza o display de percentual
 */
function updateThresholdDisplay() {
    const value = thresholdInput.value;
    thresholdDisplay.textContent = `${value}%`;
    thresholdPercentage = parseInt(value);
    
    // Salvar no storage
    chrome.storage.local.set({ threshold_percentage: thresholdPercentage });
}

/**
 * Atualiza a informação da playlist selecionada
 */
function updateSelectedPlaylistInfo() {
    selectedPlaylistInfo.innerHTML = ''; // Limpar antes
    
    if (selectedPlaylist) {
        const div = document.createElement('div');
        
        const nameP = document.createElement('p');
        nameP.className = 'selected-playlist-detail name';
        nameP.textContent = selectedPlaylist.name;
        
        const typeP = document.createElement('p');
        typeP.className = 'selected-playlist-detail type';
        typeP.textContent = selectedPlaylist.public ? 'Pública' : 'Privada';
        
        div.appendChild(nameP);
        div.appendChild(typeP);
        selectedPlaylistInfo.appendChild(div);
    } else {
        const p = document.createElement('p');
        p.textContent = 'Nenhuma playlist selecionada';
        selectedPlaylistInfo.appendChild(p);
    }
}
