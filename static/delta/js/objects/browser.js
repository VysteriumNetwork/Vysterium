import ChromeTabs from "../chrome-tabs.js";



var chromeTabs = new ChromeTabs();
chromeTabs.init(document.querySelector(".chrome-tabs"));

var _browser_ = {
  tabs: new Map(),
  chromeTabs: chromeTabs,
  encodeUrl: index$config.encodeUrl,
  decodeUrl: index$config.decodeUrl
}

export default _browser_;