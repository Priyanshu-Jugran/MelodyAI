//app.js — MelodyAI Core App Logic
 
const SESSION_KEY   = 'melody_user';
const FAVORITES_KEY = 'melody_favorites';
const PLACEHOLDER   = '/static/assets/placeholder.png';

/*Shared Helpers*/

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = '/';
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `<span style="font-size:1rem;">${icons[type] || 'ℹ'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function showLoading(visible, text = 'Finding recommendations…') {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  const p = overlay.querySelector('p');
  if (p && text) p.textContent = text;
  overlay.classList.toggle('visible', visible);
}

function guardAuth() {
  const user = getSession();
  if (!user) { window.location.href = '/auth'; return null; }
  return user;
}

/*Build a song card DOM element*/
function buildSongCard(song, onClick) {
  const card = document.createElement('div');
  card.className = 'song-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Play recommendations for ${song.name}`);

  const searchQuery  = encodeURIComponent(`${song.name} ${song.artist || ''}`);
  const spotifyUrl   = `https://open.spotify.com/search/${searchQuery}`;
  const youtubeUrl   = `https://www.youtube.com/results?search_query=${searchQuery}`;

  card.innerHTML = `
    <div class="card-img-wrap">
      <img class="card-img" src="${PLACEHOLDER}" alt="${escHtml(song.name)} cover" loading="lazy" />
      <div class="play-overlay">
        <div class="play-icon">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
    </div>
    <div class="card-info">
      <div class="card-title">${escHtml(song.name)}</div>
      <div class="card-artist">${escHtml(song.artist || 'Unknown Artist')}</div>
    </div>
    <div class="stream-links">
      <a class="stream-btn spotify"
         href="${spotifyUrl}"
         target="_blank"
         rel="noopener noreferrer"
         title="Listen on Spotify"
         aria-label="Listen to ${escHtml(song.name)} on Spotify">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.759-8.785-.964a.623.623 0 1 1-.277-1.215c3.809-.87 7.076-.496 9.712 1.115.293.18.387.563.207.857zm1.223-2.722a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.779.779 0 0 1-.973-.519.78.78 0 0 1 .52-.973c3.632-1.102 8.147-.568 11.233 1.328a.78.78 0 0 1 .257 1.073zm.105-2.835C14.692 8.95 9.376 8.775 6.227 9.71a.935.935 0 1 1-.542-1.79c3.632-1.102 9.68-.89 13.498 1.313a.934.934 0 0 1-.269 1.834z"/>
        </svg>
        Spotify
      </a>
      <a class="stream-btn youtube"
         href="${youtubeUrl}"
         target="_blank"
         rel="noopener noreferrer"
         title="Watch on YouTube"
         aria-label="Watch ${escHtml(song.name)} on YouTube">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        YouTube
      </a>
    </div>
  `;

  /*Stop stream-link clicks from bubbling up to the card's onClick*/
  card.querySelectorAll('.stream-btn').forEach(btn => {
    btn.addEventListener('click', e => e.stopPropagation());
  });

  card.addEventListener('click', () => onClick(song));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(song); }
  });

  return card;
}

/*Build skeleton cards for loading state*/
function buildSkeletonCards(count, container) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'card-skeleton';
    el.innerHTML = `
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line w70"></div>
        <div class="skeleton skeleton-line w50"></div>
      </div>
    `;
    container.appendChild(el);
  }
}

/*Call the Flask recommend API*/
async function fetchRecommendations(songName) {
  const res = await fetch('/api/recommend', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ song: songName })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unknown error');
  return data;
}

/*Favorites Page*/
function initFavoritesPage() {
  const user = guardAuth();
  if (!user) return;

  // Set nav username
  const navEl = document.getElementById('nav-username');
  if (navEl) navEl.textContent = `Hi, ${user.name}`;

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    hour < 21 ? 'Good evening' : 'Good night';
  const headEl = document.getElementById('greeting-heading');
  if (headEl) headEl.textContent = `${greeting}, ${user.name} 👋`;

  // Load favorites
  let favorites = [];
  try {
    const all = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || {};
    favorites = all[user.username] || [];
  } catch { /* empty */ }

  const grid = document.getElementById('favorites-grid');
  if (!grid) return;

  if (!favorites || favorites.length === 0) {
    grid.innerHTML = '';
    grid.insertAdjacentHTML('afterend', `
      <div class="state-box">
        <div class="state-icon">🎵</div>
        <h3>No favorites yet</h3>
        <p>Pick your top 5 songs to get started.</p>
        <a href="/onboarding" class="btn btn-primary" style="margin-top:8px;">Choose Songs</a>
      </div>
    `);
    return;
  }

  grid.innerHTML = '';
  favorites.forEach(song => {
    const card = buildSongCard(song, handleFavoriteClick);
    grid.appendChild(card);
  });
}

async function handleFavoriteClick(song) {
  // Store the selected song in sessionStorage and navigate to recommendations
  sessionStorage.setItem('melody_current_song', JSON.stringify(song));
  sessionStorage.setItem('melody_hop_count', '1');
  sessionStorage.setItem('melody_chain', JSON.stringify([song]));
  window.location.href = '/recommendations';
}

/*Recommendations Page*/

let currentSong  = null;
let hopCount     = 1;
let chain        = [];   // array of {name, artist}

function initRecommendationsPage() {
  const user = guardAuth();
  if (!user) return;

  // Set nav username
  const navEl = document.getElementById('nav-username');
  if (navEl) navEl.textContent = `Hi, ${user.name}`;

  // Restore state from sessionStorage
  try {
    currentSong = JSON.parse(sessionStorage.getItem('melody_current_song'));
    hopCount    = parseInt(sessionStorage.getItem('melody_hop_count') || '1', 10);
    chain       = JSON.parse(sessionStorage.getItem('melody_chain') || '[]');
  } catch { /* empty */ }

  if (!currentSong) {
    // Nothing to show — go back to favorites
    window.location.href = '/favorites';
    return;
  }

  updateNowPlaying(currentSong);
  updateChain();
  updateHopCounter();
  loadRecommendations(currentSong.name);
}

/*Update "Now Playing" banner*/
function updateNowPlaying(song) {
  const title  = document.getElementById('np-title');
  const artist = document.getElementById('np-artist');
  if (title)  title.textContent  = song.name;
  if (artist) artist.textContent = song.artist || '';
}

/*Update hop counter*/
function updateHopCounter() {
  const el = document.getElementById('hop-counter');
  if (el) el.textContent = hopCount;
}

/*Update chain breadcrumb*/
function updateChain() {
  const wrap = document.getElementById('chain-wrap');
  const list = document.getElementById('chain-list');
  if (!wrap || !list) return;

  if (chain.length <= 1) {
    wrap.style.display = 'none';
    return;
  }

  wrap.style.display = '';
  list.innerHTML = '';

  // Show last 5 items at most
  const visible = chain.slice(-5);
  visible.forEach((item, i) => {
    const isLast = i === visible.length - 1;

    const crumb = document.createElement('span');
    crumb.className = 'chain-item' + (isLast ? ' active' : '');
    crumb.textContent = item.name;
    crumb.title = `${item.name} — ${item.artist}`;
    list.appendChild(crumb);

    if (!isLast) {
      const arrow = document.createElement('span');
      arrow.className = 'chain-arrow';
      arrow.textContent = '›';
      list.appendChild(arrow);
    }
  });
}

/*Load recommendations and render grid */
async function loadRecommendations(songName) {
  const grid      = document.getElementById('recs-grid');
  const errorBox  = document.getElementById('error-state');
  if (!grid) return;

  // Show skeleton cards
  errorBox && (errorBox.style.display = 'none');
  buildSkeletonCards(5, grid);

  try {
    const data = await fetchRecommendations(songName);
    renderRecommendationCards(data.recommendations, grid);
  } catch (err) {
    grid.innerHTML = '';
    if (errorBox) {
      const errMsg = document.getElementById('error-message');
      if (errMsg) errMsg.textContent = err.message || 'Could not find recommendations. Try another song.';
      errorBox.style.display = '';
    }
    showToast(err.message || 'Song not found in dataset.', 'error');
  }
}

/* Render the 5 recommendation cards */
function renderRecommendationCards(recs, grid) {
  // Fade out → replace → fade in
  grid.classList.add('transitioning');
  grid.classList.remove('visible');

  setTimeout(() => {
    grid.innerHTML = '';
    recs.forEach(song => {
      const card = buildSongCard(song, handleRecClick);
      grid.appendChild(card);
    });
    // trigger reflow
    void grid.offsetWidth;
    grid.classList.remove('transitioning');
    grid.classList.add('visible');
  }, 260);
}

/* Handle clicking a recommendation (infinite loop) */
async function handleRecClick(song) {
  // Update state
  currentSong = song;
  hopCount   += 1;
  chain.push(song);

  // Persist for this session
  sessionStorage.setItem('melody_current_song', JSON.stringify(currentSong));
  sessionStorage.setItem('melody_hop_count',    String(hopCount));
  sessionStorage.setItem('melody_chain',        JSON.stringify(chain));

  // Update UI
  updateNowPlaying(currentSong);
  updateHopCounter();
  updateChain();

  // Scroll to top of grid smoothly
  document.getElementById('recs-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Fetch new recommendations
  await loadRecommendations(song.name);
}
