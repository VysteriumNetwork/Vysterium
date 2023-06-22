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

    
  await navigator.serviceWorker.register(stockSW, {
    scope: __uv$config.prefix,
  });
}
registerSW();
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
  
    const url = search(address.value, searchEngine.value);
    const iframe = document.getElementById('myIframe');
    iframe.style.display = 'block'
    const iframeDoc = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;

    iframeDoc.document.open();
    iframe.src = location.origin + '/irepel/proxy.html?url=' + (url)
    doc.body.appendChild(iframe)
    if (localStorage.getItem('customjs') !== null) {
      var customjsValue = localStorage.getItem('customjs');
      iframeDoc.document.write('<script>' + customjsValue + '</script>');
      document.body.style.overflow = 'hidden';
  }  
  });