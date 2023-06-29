function proxy(url) {
	worker().then(e=>{
		if (!url.startsWith('http')) url = 'https://' + url;
	
		location.assign(window.index$config.prefix + window.index$config.encodeUrl(url));
	});
}

async function worker() {
	var a = await navigator.serviceWorker.register('/sw.js', {scope:  index$config.prefix });
	return a;
}

if (window.location.pathname === '/irepel/proxy.html') {
	console.log('proxy.html');
	document.querySelector('.uvform').addEventListener('submit', (e) => {
		e.preventDefault();

		worker().then(e=>{
			var val = document.querySelector('.uvinput').value;
			if (!val.startsWith('http')) val = 'https://' + val;
		
			location.assign(window.index$config.prefix + window.index$config.encodeUrl(val));
		});
	});
	const queryParams = new URLSearchParams(window.location.search);
	const url = queryParams.get('url');

	if (url) {
		proxy(url);
	}
}