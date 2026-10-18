import { THEME_DARK_SOLID_BG } from './theme-anti-fouc';
import { COLOR_SCHEME_COOKIE_NAME, THEME_COOKIE_NAME } from './theme-cookies';

/**
 * Синхронно выставляет класс темы и data-атрибуты на <html> до первой отрисовки.
 * Порядок: cookie → localStorage → светлая тема / violet.
 * Нужен при strategy="beforeInteractive", чтобы не было вспышки светлой темы.
 */
export const THEME_BEFORE_INTERACTIVE_SCRIPT = `(function(){
var c=document.cookie.split(';');
function gc(n){
for(var i=0;i<c.length;i++){
var p=c[i].trim();
if(p.indexOf(n+'=')===0)return decodeURIComponent(p.slice(n.length+1));
}
return '';
}
var CK=${JSON.stringify(THEME_COOKIE_NAME)};
var CSK=${JSON.stringify(COLOR_SCHEME_COOKIE_NAME)};
var t=gc(CK);
if(t!=='light'&&t!=='dark'&&t!=='system'){
try{t=localStorage.getItem(CK)||'';}catch(e){t='';}
}
if(t!=='light'&&t!=='dark'&&t!=='system')t='light';
var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;
var e=document.documentElement;
e.classList.remove('light','dark');
e.classList.add(r);
e.setAttribute('data-theme',r);
e.style.colorScheme=r==='dark'?'dark':'light';
if(r==='dark'){e.style.backgroundColor=${JSON.stringify(THEME_DARK_SOLID_BG)};}
else{e.style.removeProperty('background-color');}
var s=gc(CSK);
var V=['violet','blue','green','orange','slate','yellow','pink','teal','indigo'];
if(!V.includes(s)){
try{s=localStorage.getItem(CSK)||'';}catch(e){s='';}
}
if(!V.includes(s))s='violet';
e.setAttribute('data-color-scheme',s);
})();`;
