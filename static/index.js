"use strict";
/**
 * @type {HTMLFormElement}
 */
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
const errorCode = document.getElementById("uv-error-code");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await registerSW();
  } catch (err) {
  }

  const url = search(address.value, searchEngine.value);
  const popup = open("about:blank", "_blank")
        if (!popup || popup.closed) {
            alert("Popups are disabled!")
        } else {
            const doc = popup.document
            const iframe = doc.createElement("iframe")
            const style = iframe.style
            const link = doc.createElement("link")
    
            doc.title = "My Drive - Google Drive"
            link.rel = "icon";
            link.href = "https://ssl.gstatic.com/images/branding/product/2x/hh_drive_36dp.png";
            iframe.src = location.href + 'service/' + __uv$config.encodeUrl(url);
            style.position = "fixed"
            style.top = style.bottom = style.left = style.right = 0
            style.border = style.outline = "none"
            style.width = style.height = "100%"
    
            doc.body.appendChild(iframe)
            location.replace("https://google.com")
        }
});