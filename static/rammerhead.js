!function(){var e,t,O=window["%hammerhead%"];if(!O)throw new Error("hammerhead not loaded yet");if(O.settings._settings.sessionId)console.warn("unexpected task.js to load before rammerhead.js. url shuffling cannot be used"),i();else{e=i,t=O.__proto__.start,O.__proto__.start=function(){t.apply(this,arguments),O.__proto__.start=t,e()};{const a=new XMLHttpRequest,l=(location.pathname.slice(1).match(/^[a-z0-9]+/i)||[])[0];if(l)if(a.open("GET","/api/shuffleDict?id="+l,!1),a.send(),200!==a.status)console.warn(`received a non 200 status code while trying to fetch shuffleDict:
status: ${a.status}
response: `+a.responseText);else{var r=JSON.parse(a.responseText);if(r){const c=(e,t)=>(e%t+t)%t,u="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~-",d="_rhs";const f=(e,n)=>(e||"").replace(/^((?:[a-z0-9]+:\/\/[^/]+)?(?:\/[^/]+\/))([^]+)/i,function(e,t,r){return t+n(r)}),p=new class{constructor(e=function(){let e="";const t=u.split("");for(;0<t.length;)e+=t.splice(Math.floor(Math.random()*t.length),1)[0];return e}()){this.dictionary=e}shuffle(t){if(t.startsWith(d))return t;let r="";for(let e=0;e<t.length;e++){var n=t.charAt(e),o=u.indexOf(n);"%"===n&&3<=t.length-e?r=(r=(r+=n)+t.charAt(++e))+t.charAt(++e):r+=-1===o?n:this.dictionary.charAt(c(o+e,u.length))}return d+r}unshuffle(t){if(!t.startsWith(d))return t;t=t.slice(d.length);let r="";for(let e=0;e<t.length;e++){var n=t.charAt(e),o=this.dictionary.indexOf(n);"%"===n&&3<=t.length-e?r=(r=(r+=n)+t.charAt(++e))+t.charAt(++e):r+=-1===o?n:u.charAt(c(o-e,u.length))}return r}}(r);var r=location.href,n=f(location.href,e=>p.shuffle(e));r!==n&&history.replaceState(null,null,n);const h=O.utils.url.getProxyUrl,m=O.utils.url.parseProxyUrl;function o(e){return e.replace(/(^.*?:\/)\//,"$1")}function s(e){return e.replace(/^.*?:\/(?!\/)/,"$&/")}O.utils.url.overrideGetProxyUrl(function(e,t){return I?h(e,t):f(h(e,t),e=>o(p.shuffle(e)))}),O.utils.url.overrideParseProxyUrl(function(e){return m(f(e,e=>p.unshuffle(s(e))))}),window.overrideGetProxyUrl(r=>function(e,t){return I?r(e,t):f(r(e,t),e=>o(p.shuffle(e)))}),window.overrideParseProxyUrl(t=>function(e){return t(f(e,e=>p.unshuffle(s(e))))})}}else console.warn("cannot get session id from url")}}function i(){{const h=location.port||("https:"===location.protocol?"443":"80"),m=O.utils.url.getProxyUrl;O.utils.url.overrideGetProxyUrl(function(e,t={}){return t.proxyPort||(t.proxyPort=h),m(e,t)}),window.overrideParseProxyUrl(r=>function(e){const t=r(e);return t&&t.proxy&&(t.proxy.port||(t.proxy.port=h)),t})}{const w={HTMLAnchorElement:["href"],HTMLAreaElement:["href"],HTMLBaseElement:["href"],HTMLEmbedElement:["src"],HTMLFormElement:["action"],HTMLFrameElement:["src"],HTMLIFrameElement:["src"],HTMLImageElement:["src"],HTMLInputElement:["src"],HTMLLinkElement:["href"],HTMLMediaElement:["src"],HTMLModElement:["cite"],HTMLObjectElement:["data"],HTMLQuoteElement:["cite"],HTMLScriptElement:["src"],HTMLSourceElement:["src"],HTMLTrackElement:["src"]};for(const g in w)for(const y of w[g])if(window[g]){const v=Object.getOwnPropertyDescriptor(window[g].prototype,y),x=v.get;if(v.get=function(){return e=x.call(this),(O.utils.url.parseProxyUrl(e)||{}).destUrl||e;var e},"action"===y){const P=v.set;v.set=function(e){I=!0;try{var t=P.call(this,e)}catch(e){throw I=!1,e}return I=!1,t}}Object.defineProperty(window[g].prototype,y,v)}else console.warn("unexpected unsupported element class "+g)}{const S=`rammerhead|storage-wrapper|${O.settings._settings.sessionId}|${window.__get$(window,"location").host}|`,b=(e="")=>S+e,T=(e="")=>e.startsWith(S)?e.slice(S.length):null,E=(e,o)=>{const s=["internal","clear","key","getItem","setItem","removeItem","length"];Object.defineProperty(window,e,{configurable:!0,writable:!0,value:new Proxy(window[e],{get(e,t,r){if(s.includes(t)&&"length"!==t)return Reflect.get(e,t,r);if("length"!==t)return o[b(t)];{let e=0;for(var[n]of Object.entries(o))T(n)&&e++;return e}},set(e,t,r){return s.includes(t)||(o[b(t)]=r),!0},deleteProperty(e,t){return delete o[b(t)],!0},has(e,t){return b(t)in o||t in e},ownKeys(){const e=[];for(var[t]of Object.entries(o)){t=T(t);t&&!s.includes(t)&&e.push(t)}return e},getOwnPropertyDescriptor(e,t){return Object.getOwnPropertyDescriptor(o,b(t))},defineProperty(e,t,r){return s.includes(t)||Object.defineProperty(o,b(t),r),!0}})})},L=(e,n)=>{Storage.prototype[e]=new Proxy(Storage.prototype[e],{apply(e,t,r){return n.apply(t,r)}})};E("localStorage",O.storages.localStorageProxy.internal.nativeStorage),E("sessionStorage",O.storages.sessionStorageProxy.internal.nativeStorage),L("clear",function(){for(var[e]of Object.entries(this))delete this[e]}),L("key",function(e){return(Object.entries(this)[e]||[])[0]||null}),L("getItem",function(e){return this.internal.nativeStorage[b(e)]||null}),L("setItem",function(e,t){e&&(this.internal.nativeStorage[b(e)]=t)}),L("removeItem",function(e){delete this.internal.nativeStorage[b(e)]})}if(delete window.overrideGetProxyUrl,delete window.overrideParseProxyUrl,delete window.overrideIsCrossDomainWindows,window.rammerheadStartListeners){for(const M of window.rammerheadStartListeners)try{M()}catch(e){console.error(e)}delete window.rammerheadStartListeners}if(window.rammerheadDisableLocalStorageImplementation)delete window.rammerheadDisableLocalStorageImplementation;else{var r="rammerhead_synctimestamp",t=!1,n=localStorage,o=n.internal.nativeStorage,e=O.settings._settings.sessionId,s=window.__get$(window,"location").origin,i=[];try{t=!0;var a,l=function(){var e=o[r],t=parseInt(e);if(isNaN(t))return e&&console.warn("invalid timestamp retrieved from storage: "+e),null;return t}();function c(e){if(!e||"object"!=typeof e)throw new TypeError("data must be an object");for(var t in n.clear(),e)n[t]=e[t]}l?(a=f({type:"sync",timestamp:l,data:n})).timestamp&&(u(a.timestamp),c(a.data)):(a=f({type:"sync",fetch:!0})).timestamp&&(u(a.timestamp),c(a.data)),t=!1}catch(e){if("server wants to disable localStorage syncing"!==e.message)throw e;return}n.addChangeEventListener(function(e){t||-1===i.indexOf(e.key)&&i.push(e.key)}),setInterval(function(){var e=p();e&&(f({type:"update",updateData:e},function(e){u(e.timestamp)}),i=[])},5e3),document.addEventListener("visibilitychange",function(){var e;"hidden"===document.visibilityState&&(e=p())&&O.nativeMethods.sendBeacon.call(window.navigator,d(),JSON.stringify({type:"update",updateData:e}))})}function u(e){if(!e)throw new TypeError("timestamp must be defined");if(isNaN(parseInt(e)))throw new TypeError("timestamp must be a number. received"+e);o[r]=e}function d(){return"/syncLocalStorage?sessionId="+encodeURIComponent(e)+"&origin="+encodeURIComponent(s)}function f(e,t){if(!e||"object"!=typeof e)throw new TypeError("data must be an object");var r=O.createNativeXHR();function n(){if(404===r.status)throw new Error("server wants to disable localStorage syncing");if(200!==r.status)throw new Error("server sent a non 200 code. got "+r.status+". Response: "+r.responseText)}if(r.open("POST",d(),!!t),r.setRequestHeader("content-type","application/json"),r.send(JSON.stringify(e)),!t)return n(),JSON.parse(r.responseText);r.onload=function(){n(),t(JSON.parse(r.responseText))}}function p(){if(!i.length)return null;for(var e={},t=0;t<i.length;t++)e[i[t]]=n[i[t]];return i=[],e}}var I=!1}();