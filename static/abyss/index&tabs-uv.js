const form = document.querySelectorAll("form");
const input = document.querySelector("input");
let iframe = document.getElementById("iframe");
let urlbarhomepage = document.querySelector('#urlbarhomepage input');
let urlbartop = document.querySelector('#searchbar');

let userKey = new URLSearchParams(window.location.search).get("userKey")
if (userKey === null) {
  userKey = "Guest"
}
form.forEach(item => {
  item.addEventListener("submit", async (event) => {
    event.preventDefault();

  });
})

function go(value) {
  let iframe = document.querySelector(".iframe.active");
  window.navigator.serviceWorker
    .register("/sw.js", {
      scope: index$config.prefix,
    })
    .then(() => {
      let url = value.trim();
      if (!isUrl(url)) url = "https://www.google.com/search?q=" + url;
      else if (!(url.startsWith("https://") || url.startsWith("http://")))
        url = "https://" + url;
      iframe.style.display = "block"
      iframe.src = index$config.prefix + index$config.encodeUrl(url);
      //var iframeurl = index$config.decodeUrl(iframe.src)
      var iframeurl = iframe.src.substring(iframe.src.indexOf(index$config.prefix) + 9);
      //document.querySelector("#urlbartop input").value = iframeurl.substring(iframeurl.indexOf(index$config.prefix) + 0);
      document.querySelector("#urlbartop input").value = index$config.decodeUrl(iframeurl)

      //getIframeFavicon(iframeurl.substring(iframeurl.indexOf(index$config.prefix) + 0))
      getIframeFavicon(index$config.decodeUrl(iframeurl))
    });
}

async function getIframeFavicon(value) {

  document.querySelector(".tab.active .tabfavicon").src = "https://s2.googleusercontent.com/s2/favicons?domain_url=" + value

}

urlbarhomepage.onkeydown = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault
    go(urlbarhomepage.value.replace("http://", "https://"));
  }
}

urlbartop.onkeydown = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault
    go(urlbartop.value.replace("http://", "https://"));
  }
}


function isUrl(val = "") {
  if (
    /^http(s?):\/\//.test(val) ||
    (val.includes(".") && val.substr(0, 1) !== " ")
  )
    return true;
  return false;
}

// TABS
var nextNumber = 1
var zIndex = 10
let tabsection = document.getElementsByClassName("tabsection")[0]
let body = document.querySelector("body")
var tabOrder = new Array();
var goOrNot = 1

createTabAndIframe();





function openTab(tabNumber) {
  var tab = document.querySelector("#" + tabNumber.replace("iframe", ""))
  var tabimg = document.querySelector("#" + tabNumber.replace("iframe", "") + " .tabclose")

  if (tabimg.getAttribute("listener") !== "true") {
    tabimg.addEventListener("click", () => {
      document.querySelector("#" + tabNumber).outerHTML = ""
      tab.outerHTML = ""
      tabOrder.splice(tabOrder.indexOf(tabNumber), 1);
      openTab(tabOrder.slice(-1)[0])
    })
  }

  tabimg.setAttribute("listener", "true")

  if (tabOrder.indexOf(tabNumber) > -1) {
    tabOrder.splice(tabOrder.indexOf(tabNumber), 1);
  }
  tabOrder[tabOrder.length] = tabNumber;

  if (typeof (document.querySelector(".iframe.active")) != "undefined" && document.querySelector(".iframe.active") != null) {
    document.querySelector(".iframe.active").style.display = "none"
    document.querySelector(".iframe.active").classList.remove("active")
  }

  var iframes = document.querySelectorAll(".iframe")
  iframes.forEach(elmnt => elmnt.style.display = "none")
  var iframe = document.getElementById(tabNumber);
  iframe.classList.add("active");
  iframe.style.zIndex = zIndex
  zIndex = zIndex + 2
  var url = index$config.decodeUrl(iframe.src)
  document.querySelector("#urlbartop input").value = url.substring(url.indexOf("https://") + 0);
  var tabs = document.querySelectorAll(".tab");
  tabs.forEach(elmnt => elmnt.className = "tab");
  if (iframe.src !== "") {
    iframe.style.display = "block"
  } else {
    document.querySelector("#urlbarhomepage input").value = ""
  }
  tab.className += " active";
}

function createTabAndIframe() {
  tabdiv = document.createElement("div");
  tabdiv.classList.add("tab");
  tabdiv.id = "tab" + nextNumber
  tabsection.appendChild(tabdiv);
  tabdiv.setAttribute("onclick", "openTab('tab" + nextNumber + "iframe')")

  tabdivfavicon = document.createElement("img")
  tabdivfavicon.src = "data:image/png;base64,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"
  tabdivfavicon.classList.add("tabfavicon");
  tabdiv.appendChild(tabdivfavicon);

  tabdivp = document.createElement("p");
  tabdivp.innerHTML = "Tab"
  tabdiv.appendChild(tabdivp)

  tabdivclose = document.createElement("img");
  tabdivclose.src = "data:image/png;base64,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"
  tabdivclose.classList.add("invert");
  tabdiv.appendChild(tabdivclose);
  tabdivclose.classList.add("tabclose");
  tabdivclose.setAttribute("listener", "false");

  iframe = document.createElement("iframe");
  iframe.classList.add("iframe");
  iframe.id = "tab" + nextNumber + "iframe"
  body.appendChild(iframe);

  tabdiv.style.width = "100%"

  openTab("tab" + nextNumber + "iframe");

  nextNumber = nextNumber + 1
}
