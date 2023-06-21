function exportData() {
    let cookies = document.cookie.split('; ')
        .reduce((result, c) => {
            let [key, value] = c.split('=').map(decodeURIComponent);
            result[key] = value;
            return result;
        }, {});

    let localStorageData = {};
    for(let i=0; i<localStorage.length; i++) {
        let key = localStorage.key(i);
        let value = localStorage.getItem(key);
        localStorageData[key] = value;
    }

    let data = {
        cookies: cookies,
        localStorage: localStorageData
    };
    
    let jsonString = JSON.stringify(data);
    let blob = new Blob([jsonString], {type: "application/json"});
    let url = URL.createObjectURL(blob);

    let link = document.createElement('a');
    link.href = url;
    link.download = prompt('What do you want to call your save?', 'cookies') + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function importData(input) {
    let file = input.files[0];
    let reader = new FileReader();

    reader.onload = function(event) {
        let data = JSON.parse(event.target.result);

        document.cookie.split(";").forEach(c => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        for(let key in data.cookies) {
            let value = data.cookies[key];
            document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }

        localStorage.clear();

        for(let key in data.localStorage) {
            let value = data.localStorage[key];
            localStorage.setItem(key, value);
        }
    };

    reader.readAsText(file);
    alert('Imported cookies and localStorage data.');
    window.location.replace('/');
}

