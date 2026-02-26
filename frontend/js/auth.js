/**
 * Mrbo Ads E-Learning — Authentication Module
 */
const Auth = {
  TOKEN_KEY: 'mrbo_token',
  USER_KEY:  'mrbo_user',

  setToken(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY)); }
    catch { return null; }
  },

  updateUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout(redirect = true) {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    if (redirect) window.location.href = '/';
  },
};

/**
 * Initialize navigation auth state on every page
 */
document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.getUser();
  const btnLogin    = document.getElementById('btnLogin');
  const btnRegister = document.getElementById('btnRegister');
  const userMenu    = document.getElementById('userMenu');
  const userInitial = document.getElementById('userInitial');
  const userNameEl  = document.getElementById('userName');

  if (Auth.isLoggedIn() && user) {
    if (btnLogin)    btnLogin.classList.add('hidden');
    if (btnRegister) btnRegister.classList.add('hidden');
    if (userMenu)    userMenu.classList.remove('hidden');
    if (userInitial) userInitial.textContent = user.name?.charAt(0).toUpperCase() || 'U';
    if (userNameEl)  userNameEl.textContent  = user.name?.split(' ').pop() || '';
  } else {
    if (userMenu) userMenu.classList.add('hidden');
  }

  // User dropdown toggle
  const userMenuBtn  = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => userDropdown.classList.add('hidden'));
  }

  // Logout button
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => Auth.logout());
  }

  // Mobile menu
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu       = document.getElementById('navMenu');
  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = mobileMenuBtn.querySelector('i');
      icon.className = navMenu.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
    });
  }
});
