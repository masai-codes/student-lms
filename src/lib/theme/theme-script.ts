import { DARK_THEME_IDS } from './apply'
import { DEFAULT_THEME_ID, STORAGE_KEY, THEME_IDS } from './themes'

/**
 * A tiny, self-contained script string injected into <head> BEFORE first paint
 * (see `__root.tsx`). It reads the persisted theme from localStorage and sets
 * `data-theme` + `.dark` on <html> synchronously, so the correct theme is
 * present on the very first frame — no flash of the default theme on reload.
 *
 * It must not reference any module scope (it runs as a raw <script>), so the
 * theme lists are interpolated in at build time.
 */
export function buildThemeInitScript(): string {
  const valid = JSON.stringify(THEME_IDS)
  const dark = JSON.stringify(DARK_THEME_IDS)
  return `(function(){try{
var KEY=${JSON.stringify(STORAGE_KEY)};
var DEFAULT=${JSON.stringify(DEFAULT_THEME_ID)};
var VALID=${valid};
var DARK=${dark};
var t=null;
try{t=localStorage.getItem(KEY);}catch(e){}
if(VALID.indexOf(t)===-1){t=DEFAULT;}
var r=document.documentElement;
r.setAttribute('data-theme',t);
if(DARK.indexOf(t)!==-1){r.classList.add('dark');}else{r.classList.remove('dark');}
}catch(e){}})();`
}
