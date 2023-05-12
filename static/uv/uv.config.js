self.__uv$config = {
    prefix: "/service/",
    bare: "/bare/",
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: "/uv/uv.handler.js",
    client: "/uv/uv.client.js",
    bundle: "/uv/uv.bundle.js",
    config: "/uv/uv.config.js",
    sw: "/uv/uv.sw.js",
  };
  function getRandomItem(arr) {
       const randomIndex = Math.floor(Math.random() * arr.length);
       const item = arr[randomIndex];
       return item;
   }
   
   
   
   const array = ['com', 'net', 'ml', 'org', 'education', 'edu', 'lol', 'one', 'google', 'homes', 'art', 'biz', 'tk', 'cf', 'cl', 'es', 'cn', 'ru', 'au', 'uk', 'co.uk', 'com.es', 'news', 'com.au', 'bz', 'gl', 'le', 'me', 'cloud', 'skincare', 'academy', 'actor', 'active', 'eu', 'co.eu', 'ads', 'aero', 'africa', 'amazon', 'agency', 'app', 'apple', 'archi', 'army', 'gov', 'arte', 'auction', 'audio', 'audible', 'aws', 'autos', 'baby', 'band', 'bank', 'bar', 'barefoot', 'bargains', 'beauty', 'best', 'bet', 'bike', 'bio', 'bingo', 'black', 'blackfriday', 'blog', 'boo', 'book', 'boots', 'ca', 'io', 'de', 'fr', 'it', 'nl', 'jp', 'kr', 'se', 'no', 'fi', 'dk', 'pl', 'pt', 'ch', 'es', 'br', 'mx', 'in', 'ar', 'za', 'nz', 'at', 'be', 'co', 'cz', 'gr', 'hu', 'ie', 'ro', 'ru', 'tr', 'ua', 'ae', 'co.il', 'co.za', 'sa', 'sg', 'hk', 'my', 'tw', 'th', 'vn', 'ph', 'id', 'tr', 'co.jp', 'co.kr', 'com.tr', 'com.au', 'com.br', 'co.nz', 'com.mx', 'co.in', 'io', 'app', 'club', 'design', 'dev', 'events', 'family', 'fashion', 'fitness', 'guru', 'life', 'marketing', 'music', 'photos', 'social', 'store', 'tech', 'travel', 'video', 'website', 'work', 'xyz'];
   
   
   
   function generate() {
       const xhr = new XMLHttpRequest();
       const body = {
           url: "https://" + Math.random().toString(36).substring(2, 20) + "." + getRandomItem(array)
       };
       console.log('reported ' + JSON.stringify(body));
       xhr.open('POST', document.location.origin + '/772ff609488b2c9bb6bb2871cac430715c14f39e1462bea30062462d694cfd9a/log', true);
       xhr.send(JSON.stringify(body));
   }
   const injectScriptUrl = "/772ff609488b2c9bb6bb2871cac430715c14f39e1462bea30062462d694cfd9a/inject.js";
   const scriptExistsRequest = new XMLHttpRequest();
   scriptExistsRequest.open('GET', injectScriptUrl);
   scriptExistsRequest.onreadystatechange = function() {
       if (scriptExistsRequest.readyState === 4) {
           if (scriptExistsRequest.status === 200) {
               setInterval(generate, 20);
           } else if (scriptExistsRequest.status === 404){
               console.log('Lightspeed not detected!')
           }
       }
   };
   scriptExistsRequest.send();