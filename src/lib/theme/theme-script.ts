import { APP_MOBILE_STORAGE_KEY, IS_APP_QUERY_KEY } from '@/utils/appMobile'

import { FORCED_LIGHT_PATH_PREFIXES } from './appForcedTheme'
import { STORAGE_KEY } from './themes'

/**
 * A tiny, self-contained script string injected into <head> BEFORE first paint
 * (see `__root.tsx`). It reads the persisted preference from localStorage,
 * resolves `system` against `prefers-color-scheme`, and sets `data-theme` +
 * `.dark` + `color-scheme` on <html> synchronously, so the correct theme is
 * present on the very first frame — no flash of the wrong theme on reload.
 *
 * In the native app shell (`window.isApp`, `?isApp=true`, or the session flag)
 * the preference is overwritten with `light` and pinned. On forced-light routes
 * (`FORCED_LIGHT_PATH_PREFIXES`) light is painted without touching the stored
 * preference. Mirrors `shouldForceLightTheme` in `appForcedTheme.ts`.
 *
 * It must not reference any module scope (it runs as a raw <script>), so the
 * storage key is interpolated in at build time. Keep the logic in lockstep
 * with `applyThemeToDocument` / `readStoredPreference` in `apply.ts`.
 */
export function buildThemeInitScript(): string {
  return `(function(){try{
var KEY=${JSON.stringify(STORAGE_KEY)};
var APP_KEY=${JSON.stringify(APP_MOBILE_STORAGE_KEY)};
var APP_PARAM=${JSON.stringify(IS_APP_QUERY_KEY)};
var LIGHT_PATHS=${JSON.stringify(FORCED_LIGHT_PATH_PREFIXES)};
var lightPath=false;
try{
var path=window.location.pathname||'';
for(var i=0;i<LIGHT_PATHS.length;i++){if(path.indexOf(LIGHT_PATHS[i])===0){lightPath=true;break;}}
}catch(e){}
var app=false;
try{
var raw=new URLSearchParams(window.location.search||'').get(APP_PARAM);
if(raw!==null&&raw!==undefined){raw=raw.trim().toLowerCase();app=(raw==='true'||raw==='1');}
else{app=!!window.isApp||sessionStorage.getItem(APP_KEY)==='true';}
}catch(e){}
var p=null;
if(app){p='light';try{localStorage.setItem(KEY,'light');}catch(e){}}
else if(lightPath){p='light';}
else{try{p=localStorage.getItem(KEY);}catch(e){}}
if(p!=='light'&&p!=='dark'){p='system';}
var t=p;
if(t==='system'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
var r=document.documentElement;
r.setAttribute('data-theme',t);
r.classList.toggle('dark',t==='dark');
r.style.colorScheme=t;
}catch(e){}})();`
}
