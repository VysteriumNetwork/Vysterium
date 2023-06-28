import ChromeTabs from "../chrome-tabs.js";



var chromeTabs = new ChromeTabs();
chromeTabs.init(document.querySelector(".chrome-tabs"));

var _browser_ = {
  tabs: new Map(),
  chromeTabs: chromeTabs,
  encodeUrl: selfindex$config.encodeUrl,
  decodeUrl: selfindex$config.decodeUrl
}

export default _browser_;