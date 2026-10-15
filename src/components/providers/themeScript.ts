import { LANGUAGE_STORAGE_KEY, THEME_STORAGE_KEY } from '@/lib/constants';
import { LANGUAGES } from '@/features/preferences/preferencesSlice';

/**
 * Runs synchronously in <head> before first paint, so the saved theme and
 * language apply without a flash (Next.js "preventing flash before hydration"
 * guide). Kept tiny and defensive: storage may be unavailable or corrupt.
 */
export const themeScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var dark=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);d.classList.toggle("dark",dark);var l=localStorage.getItem(${JSON.stringify(
  LANGUAGE_STORAGE_KEY,
)});if(${JSON.stringify(LANGUAGES)}.indexOf(l)>-1)d.lang=l;}catch(e){}})();`;
