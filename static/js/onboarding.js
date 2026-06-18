/*onboarding.js — Pick Top 5 Songs*/

const SESSION_KEY   = 'melody_user';
const FAVORITES_KEY = 'melody_favorites';
const MAX_SONGS     = 5;

let selectedSongs = [];   // [{name, artist}, ...]
let debounceTimer = null;
let activeIdx     = -1;
let dropItems     = [];

/*Guard: must be logged in */
const userRaw = localStorage.getItem(SESSION_KEY);
if (!userRaw) { window.location.href = '/auth'; }
const currentUser = JSON.parse(userRaw);

/*Toast */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type]}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* Logout */
function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = '/';
}

/*Update navbar username */
document.getElementById('nav-username').textContent = `Hi, ${currentUser.name}`;

/*Load previous selections for this user */
function loadPreviousFavorites() {
  try {
    const all = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || {};
    const prev = all[currentUser.username];
    if (prev && Array.isArray(prev) && prev.length > 0) {
      selectedSongs = prev.slice(0, MAX_SONGS);
      renderPills();
      showToast('Your previous selections have been pre-filled.', 'info');
    }
  } catch { /* ignore */ }
}

/*Render selected pills*/
function renderPills() {
  const list   = document.getElementById('pill-list');
  const hint   = document.getElementById('no-selection-hint');
  const badge  = document.getElementById('counter-badge');
  const cText  = document.getElementById('counter-text');
  const contBtn = document.getElementById('continue-btn');

  list.innerHTML = '';

  if (selectedSongs.length === 0) {
    hint.style.display = '';
  } else {
    hint.style.display = 'none';
    selectedSongs.forEach((song, i) => {
      const row = document.createElement('div');
      row.className = 'pill-row';
      row.innerHTML = `
        <div class="pill-num">${i + 1}</div>
        <div class="pill-row-name">${escHtml(song.name)}</div>
        <div class="pill-row-artist">${escHtml(song.artist)}</div>
        <button class="pill-row-remove" title="Remove" onclick="removeSong(${i})">×</button>
      `;
      list.appendChild(row);
    });
  }

  const count = selectedSongs.length;
  cText.textContent = `${count} / ${MAX_SONGS} selected`;

  if (count === MAX_SONGS) {
    badge.classList.add('complete');
    contBtn.disabled = false;
  } else {
    badge.classList.remove('complete');
    contBtn.disabled = true;
  }
}

/*Remove a song */
function removeSong(idx) {
  selectedSongs.splice(idx, 1);
  renderPills();
}

/*Escape HTML */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Autocomplete search */
const searchInput = document.getElementById('song-search');
const drop        = document.getElementById('autocomplete-drop');

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const q = searchInput.value.trim();
  if (q.length < 1) { closeDrop(); return; }
  debounceTimer = setTimeout(() => fetchSuggestions(q), 200);
});

searchInput.addEventListener('keydown', (e) => {
  if (!drop.classList.contains('open')) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIdx = Math.min(activeIdx + 1, dropItems.length - 1);
    highlightItem();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIdx = Math.max(activeIdx - 1, 0);
    highlightItem();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeIdx >= 0 && dropItems[activeIdx]) {
      selectSong(dropItems[activeIdx]);
    }
  } else if (e.key === 'Escape') {
    closeDrop();
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrap')) closeDrop();
});

async function fetchSuggestions(q) {
  try {
    const res  = await fetch(`/api/songs?q=${encodeURIComponent(q)}&limit=10`);
    const data = await res.json();
    renderDrop(data);
  } catch {
    closeDrop();
  }
}

function renderDrop(items) {
  drop.innerHTML = '';
  activeIdx = -1;
  dropItems = items;

  if (!items || items.length === 0) {
    drop.innerHTML = '<div class="autocomplete-item" style="color:var(--text-muted);cursor:default;">No songs found</div>';
    drop.classList.add('open');
    return;
  }

  items.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'autocomplete-item';
    el.dataset.idx = i;
    el.innerHTML = `
      <span class="item-name">${escHtml(item.name)}</span>
      <span class="item-artist">${escHtml(item.artist)}</span>
    `;
    el.addEventListener('click', () => selectSong(item));
    el.addEventListener('mouseenter', () => { activeIdx = i; highlightItem(); });
    drop.appendChild(el);
  });

  drop.classList.add('open');
}

function highlightItem() {
  drop.querySelectorAll('.autocomplete-item').forEach((el, i) => {
    el.classList.toggle('active', i === activeIdx);
  });
}

function closeDrop() {
  drop.classList.remove('open');
  drop.innerHTML = '';
  activeIdx = -1;
  dropItems = [];
}

/* Select a song */
function selectSong(song) {
  closeDrop();
  searchInput.value = '';

  // Already selected?
  const already = selectedSongs.find(s => s.name.toLowerCase() === song.name.toLowerCase());
  if (already) {
    showToast(`"${song.name}" is already selected.`, 'info');
    return;
  }

  // Max reached?
  if (selectedSongs.length >= MAX_SONGS) {
    showToast('You\'ve already selected 5 songs. Remove one to add another.', 'error');
    return;
  }

  selectedSongs.push({ name: song.name, artist: song.artist });
  renderPills();

  if (selectedSongs.length === MAX_SONGS) {
    showToast('5 songs selected! You\'re ready to continue 🎉', 'success');
  }
}

/*  Save & Continue  */
function saveAndContinue() {
  if (selectedSongs.length < MAX_SONGS) return;

  document.getElementById('loading-overlay').classList.add('visible');

  // Save to localStorage keyed by username
  try {
    const all = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || {};
    all[currentUser.username] = selectedSongs;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(all));
  } catch {
    showToast('Could not save preferences. Please try again.', 'error');
    document.getElementById('loading-overlay').classList.remove('visible');
    return;
  }

  setTimeout(() => { window.location.href = '/favorites'; }, 600);
}

/* Init */
(function init() {
  loadPreviousFavorites();
  renderPills();
})();
