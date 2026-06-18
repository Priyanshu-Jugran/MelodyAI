/*auth.js — MelodyAI Authentication*/

const USERS_KEY   = 'melody_users';
const SESSION_KEY = 'melody_user';

/*Toast helper*/
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
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

/* Tab switching */
function switchTab(tab) {
  const loginForm  = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  const tabLogin   = document.getElementById('tab-login');
  const tabSignup  = document.getElementById('tab-signup');

  if (tab === 'login') {
    loginForm.style.display  = '';
    signupForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    clearErrors('login');
  } else {
    loginForm.style.display  = 'none';
    signupForm.style.display = '';
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
    clearErrors('signup');
  }
}

function clearErrors(prefix) {
  document.querySelectorAll(`[id^="${prefix}-"][id$="-err"]`)
    .forEach(el => { el.style.display = 'none'; el.textContent = ''; });
  const inputs = document.querySelectorAll(`#form-${prefix} .form-input`);
  inputs.forEach(i => i.classList.remove('error'));
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'block'; el.textContent = msg; }
}

function showGeneralError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'block'; el.textContent = msg; }
}

/*Load users from localStorage */
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* Simple hash (not cryptographic — demo only) */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

/* Persist session*/
function setSession(userObj) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
}

/*  SIGNUP*/
function handleSignup(e) {
  e.preventDefault();
  clearErrors('signup');

  const name     = document.getElementById('signup-name').value.trim();
  const username = document.getElementById('signup-username').value.trim().toLowerCase();
  const password = document.getElementById('signup-password').value;

  let valid = true;
  if (!name)            { showFieldError('signup-name-err', 'Display name is required.');       document.getElementById('signup-name').classList.add('error');     valid = false; }
  if (!username)        { showFieldError('signup-username-err', 'Username is required.');       document.getElementById('signup-username').classList.add('error'); valid = false; }
  if (password.length < 6) { showFieldError('signup-password-err', 'Password must be at least 6 characters.'); document.getElementById('signup-password').classList.add('error'); valid = false; }
  if (!valid) return;

  const users = getUsers();
  if (users[username]) {
    showGeneralError('signup-general-err', 'Username already taken. Please choose another.');
    document.getElementById('signup-username').classList.add('error');
    return;
  }

  users[username] = { name, username, passwordHash: simpleHash(password) };
  saveUsers(users);

  const sessionData = { name, username };
  setSession(sessionData);

  showToast('Account created! Welcome to MelodyAI 🎵', 'success');
  setTimeout(() => { window.location.href = '/onboarding'; }, 700);
}

/*LOGIN*/
function handleLogin(e) {
  e.preventDefault();
  clearErrors('login');

  const username = document.getElementById('login-username').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  let valid = true;
  if (!username) { showFieldError('login-username-err', 'Username is required.'); document.getElementById('login-username').classList.add('error'); valid = false; }
  if (!password) { showFieldError('login-password-err', 'Password is required.'); document.getElementById('login-password').classList.add('error'); valid = false; }
  if (!valid) return;

  const users = getUsers();
  const user  = users[username];

  if (!user || user.passwordHash !== simpleHash(password)) {
    showGeneralError('login-general-err', 'Invalid username or password.');
    document.getElementById('login-username').classList.add('error');
    document.getElementById('login-password').classList.add('error');
    return;
  }

  setSession({ name: user.name, username: user.username });
  showToast(`Welcome back, ${user.name}! 🎵`, 'success');
  setTimeout(() => { window.location.href = '/favorites'; }, 700);
}

/*Init: redirect if already logged in; set active tab from URL*/
(function init() {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) { window.location.href = '/favorites'; return; }

  const params = new URLSearchParams(window.location.search);
  const mode   = params.get('mode') || 'login';
  switchTab(mode);
})();
