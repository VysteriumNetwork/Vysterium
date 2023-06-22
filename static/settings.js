function base64DecodeUnicode(str) {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}
function base64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

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
    
    let jsonString = base64EncodeUnicode(JSON.stringify(data))
    let blob = new Blob([jsonString], {type: "application/json"});
    let url = URL.createObjectURL(blob);

    let link = document.createElement('a');
    link.href = url;
    link.download = prompt('What do you want to call your save?', 'mycookie') + '.cookies';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function importData(input) {
    let file = input.files[0];
    let reader = new FileReader();

    reader.onload = function(event) {
        let data = JSON.parse(base64DecodeUnicode(event.target.result));

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

function importDatafile() {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = '.cookie';  // Modified line

    input.addEventListener('change', event => {
        let file = event.target.files[0];

        if(file) {
            let reader = new FileReader();

            reader.onload = function(event) {
                try {
                    let data = JSON.parse(base64DecodeUnicode(event.target.result));

                    // Clear cookies
                    document.cookie.split(";").forEach(c => {
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                    });

                    // Set new cookies
                    for(let key in data.cookies) {
                        let value = data.cookies[key];
                        document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                    }

                    // Clear localStorage
                    localStorage.clear();

                    // Set new localStorage items
                    for(let key in data.localStorage) {
                        let value = data.localStorage[key];
                        localStorage.setItem(key, value);
                    }
                } catch(e) {
                    console.error("Error parsing JSON file: ", e);
                }
            };

            reader.readAsText(file);
        }
    });

    input.click();
}
function applyTabCloak() {
    const tabName = document.getElementById('tabName').value;
    const iconUrl = document.getElementById('iconUrl').value;

    if (tabName) {
        document.title = tabName;
        localStorage.setItem('tabName', tabName);
    }

    if (iconUrl) {
        var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = iconUrl;
        document.getElementsByTagName('head')[0].appendChild(link);
        localStorage.setItem('iconUrl', iconUrl);
    }

    // Display the notification
    showNotification();
}

function showNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = "block";
    setTimeout(function(){
        notification.style.opacity = 1;
    }, 100);
    setTimeout(closeNotification, 5000);  // Hide notification after 5 seconds
}

function closeNotification() {
    const notification = document.getElementById('notification');
    notification.style.opacity = 0;
    setTimeout(function(){
        notification.style.display = "none";
    }, 300);
}
function killWorkers() {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
for(let registration of registrations) {
registration.unregister();
}
});
}