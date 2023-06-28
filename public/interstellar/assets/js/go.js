function go(value) {
  let iframe = document.querySelector(".iframe.active");
  window.navigator.serviceWorker
    .register("/sw.js", {
      scope: selfindex$config.prefix,
    })
    .then(() => {
      let url = value.trim();
      if (!isUrl(url)) url = "https://www.google.com/search?q=" + url;
      else if (!(url.startsWith("https://") || url.startsWith("http://")))
        url = "https://" + url;
      //pass the encoded url to the second page
      sessionStorage.setItem("encodedUrl", selfindex$config.encodeUrl(url));
      location.href = "./go.html";
    });
}
