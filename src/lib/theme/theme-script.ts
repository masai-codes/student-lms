import { STORAGE_KEY } from './themes'

/**
 * A tiny, self-contained script string injected into <head> BEFORE first paint
 * (see `__root.tsx`). It reads the persisted preference from localStorage,
 * resolves `system` against `prefers-color-scheme`, and sets `data-theme` +
 * `.dark` + `color-scheme` on <html> synchronously, so the correct theme is
 * present on the very first frame — no flash of the wrong theme on reload.
 *
 * It must not reference any module scope (it runs as a raw <script>), so the
 * storage key is interpolated in at build time. Keep the logic in lockstep
 * with `applyThemeToDocument` / `readStoredPreference` in `apply.ts`.
 */
export function buildThemeInitScript(): string {
  return `(function(){try{
var KEY=${JSON.stringify(STORAGE_KEY)};
var p=null;
try{p=localStorage.getItem(KEY);}catch(e){}
if(p!=='light'&&p!=='dark'){p='system';}
var t=p;
if(t==='system'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
var r=document.documentElement;
r.setAttribute('data-theme',t);
r.classList.toggle('dark',t==='dark');
r.style.colorScheme=t;
}catch(e){}})();`
}
