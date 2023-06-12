"use strict";
/**
 * @type {HTMLFormElement}
 */


const stockSW = "/uv.sw-handler.js";
const swAllowedHostnames = ["localhost", "127.0.0.1"];
async function registerSW() {
  if (
    location.protocol !== "https:" &&
    !swAllowedHostnames.includes(location.hostname)
  )
    throw new Error("Service workers cannot be registered without https.");

  if (!navigator.serviceWorker)
    throw new Error("Your browser doesn't support service workers.");

  // Ultraviolet has a stock `sw.js` script.
  await navigator.serviceWorker.register(stockSW, {
    scope: __uv$config.prefix,
  });
}
const form = document.getElementById("uv-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("uv-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("uv-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("uv-error");
/**
 * @type {HTMLPreElement}
 */
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
  
    try {
      await registerSW();
    } catch (err) {
    }
    const url = search(address.value, searchEngine.value);
    if(!localStorage.getItem('firstVisit')) {
      localStorage.setItem('firstVisit', 'true');
      await registerSW();
      setTimeout(() => {
        alert('We have registered the service worker! You are good to go.');
      
        location.reload();
      }, 1000);
    } else {
    setTimeout(() => {
    location.href = __uv$config.prefix + __uv$config.encodeUrl(url);
    }, 100)}
  });