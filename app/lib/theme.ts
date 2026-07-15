export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'meka-theme';

export function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function storeTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==='dark'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`;
