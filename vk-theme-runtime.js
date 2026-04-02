
(function () {
  const STORAGE_KEY = 'nri_theme';
  const root = document.documentElement;

  function normalizeTheme(value) {
    return value === 'theme-light' ? 'theme-light' : 'theme-dark';
  }

  function applyTheme(theme) {
    const next = normalizeTheme(theme);
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(next);
    root.style.colorScheme = next === 'theme-light' ? 'light' : 'dark';
    const toggle = document.getElementById('themeToggleBtn');
    if (toggle) {
      toggle.textContent = next === 'theme-light' ? '☾' : '☀';
      toggle.setAttribute('aria-label', next === 'theme-light' ? 'Включить тёмную тему' : 'Включить светлую тему');
      toggle.setAttribute('title', next === 'theme-light' ? 'Включить тёмную тему' : 'Включить светлую тему');
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, normalizeTheme(theme));
    } catch (e) {}
  }

  function loadTheme() {
    try {
      return normalizeTheme(localStorage.getItem(STORAGE_KEY) || 'theme-dark');
    } catch (e) {
      return 'theme-dark';
    }
  }

  function appearanceToTheme(appearance) {
    const value = String(appearance || '').toLowerCase();
    return value === 'light' ? 'theme-light' : 'theme-dark';
  }

  function initToggle() {
    const toggle = document.getElementById('themeToggleBtn');
    if (!toggle || toggle.dataset.bound === '1') return;
    toggle.addEventListener('click', function () {
      const next = document.body.classList.contains('theme-light') ? 'theme-dark' : 'theme-light';
      applyTheme(next);
      saveTheme(next);
    });
    toggle.dataset.bound = '1';
  }

  function initVkThemeSync() {
    if (!window.vkBridge || typeof window.vkBridge.subscribe !== 'function') return;

    window.vkBridge.subscribe(function (event) {
      const detail = event && event.detail;
      if (!detail || detail.type !== 'VKWebAppUpdateConfig') return;

      const appearance = detail.data && (detail.data.appearance || detail.data.scheme);
      if (!appearance) return;

      const next = appearanceToTheme(appearance);
      applyTheme(next);
      saveTheme(next);
    });

    if (typeof window.vkBridge.send === 'function') {
      window.vkBridge.send('VKWebAppGetConfig').then(function (config) {
        const appearance = config && (config.appearance || config.scheme);
        if (!appearance) return;
        const next = appearanceToTheme(appearance);
        applyTheme(next);
        saveTheme(next);
      }).catch(function () {});
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(loadTheme());
    initToggle();
    initVkThemeSync();
  });
})();
