var appsContainer = document.getElementById("apps");
var excessContainer = document.getElementById("excess");
let appCount = 0;
let maxAppCount = 45;

// ["", "", "images/", "./game/"],

if (localStorage.getItem('apps') === '[]') {
  localStorage.removeItem('apps');
} 


fetch('json/apps.json').then(response => response.json()).then(apps => {
  let appObjects = [];

  apps.forEach(app => {
      let appObject = document.createElement('div');
      appObject.className = 'app';
      appObject.setAttribute('data-name', app[0]);
      appObject.innerHTML = `
              <div class="img" style="background: url('${app[2]}') 0% 0% / cover;" alt="${app[0]}"></div>
              <h1>${app[0]}</h1>
              <p>${app[0]}</p>
              <button class="actual" data-text="Download" data-a-text="Remove" data-active="true"><i class="fa-solid fa-trash"></i></button>
      `;

      if (app[4] === "app") {
        appObject.innerHTML += `<span class="tag">app</span>`;
      } else if (app[4] === "movie") {
        appObject.innerHTML += `<span class="tag">movie</span>`;
      } else {
        appObject.innerHTML += `<span class="tag">game</span>`;
      }

      appObjects.push(appObject);

      if (!localStorage.getItem('apps')) {
        if (appCount < maxAppCount) {
          document.getElementById('apps').appendChild(appObject)
        } else {
          excessContainer.appendChild(appObject);
        }
        appCount++;
      } else {
        document.getElementById('apps').appendChild(appObject)
      }

      let button = appObject.querySelector('.actual');
      if (localStorage.getItem('apps') && JSON.parse(localStorage.getItem('apps')).some(a => a[0] === app[0])) {
        button.classList.add("active"); 
      }

      button.addEventListener('click', function() {
        let apps = JSON.parse(localStorage.getItem('apps')) || [];
        if (button.classList.contains("active")) {
            button.classList.remove("active");
            let deleteMe = document.getElementById("installations").querySelector(`[data-name="${app[0]}"]`);
            deleteMe.remove();
            apps = apps.filter(a => a[0] !== app[0])
            localStorage.setItem('apps', JSON.stringify(apps));
        } else {
            if (apps.some(a => a[0] === app[0])) {
                alert('This app is already downloaded');
                button.classList.add("active");
            } else {
                button.classList.add("active");
                apps.push(app);
                localStorage.setItem('apps', JSON.stringify(apps));
                let clonedObject = appObject.cloneNode(true);
                clonedObject.innerHTML = `<div class="img" style="background: url('${app[2]}') 0% 0% / cover;" alt="${app[0]}"></div><h1>${app[0]}</h1><p>${app[0]}</p><a href="${app[3]}" target="_blank"><button class="actual two" data-text="Play" data-a-text="Playing" data-active="true"><i class="fa-solid fa-play"></i></button></a>`
                document.getElementById("installations").appendChild(clonedObject);
            }
        }
      });
  });
});

if (!localStorage.getItem('apps')) {
  document.querySelector('.downloads').style.display = 'none';
  excessContainer.style.display = 'block';
  document.querySelector('.app-store').style.borderRadius = '1vw 0 0 1vw'
}

function searchFunction() {
  var searchValue = document.getElementById('search').value;
  var app = document.getElementsByClassName('app');

  for (var i = 0; i < app.length; i++) {
    var appDiv = app[i];
    var appName = appDiv.getAttribute('data-name');
    var appTag = appDiv.getElementsByClassName('tag')[0].innerHTML;
    if (appName.toLowerCase().indexOf(searchValue.toLowerCase()) === -1 && appTag.toLowerCase().indexOf(searchValue.toLowerCase()) === -1) {
        appDiv.style.display = "none";
    } else {
        var eCount = 0;
        if (appDiv.parentNode.id === "excess") {
          if (eCount < 10) {
            eCount++;
            console.log(eCount);
            appsContainer.appendChild(appDiv);
          } else {
            excessContainer.appendChild(appDiv);
          }
        }
        appDiv.style.display = "flex";
    }
  }
}

/*function searchFunction() {
  var searchValue = document.getElementById('search').value;
  var app = document.getElementsByClassName('app');

  for (var i = 0; i < app.length; i++) {
    var appDiv = app[i];
    var appName = appDiv.getAttribute('data-name');
    var appTag = appDiv.getElementsByClassName('tag')[0].innerHTML;
    if (appName.toLowerCase().indexOf(searchValue.toLowerCase()) === -1 && appTag.toLowerCase().indexOf(searchValue.toLowerCase()) === -1) {
      appDiv.style.display = 'none';
    } else {
      appDiv.style.display = 'flex';
    }
  }
}*/
window.onload = function() {
  let apps = JSON.parse(localStorage.getItem('apps')) || []
  apps.forEach(app => {
      let appObject = document.createElement('div');
      appObject.className = 'app';
      appObject.setAttribute('data-name', app[0]);
      appObject.innerHTML = `
              <div class="img" style="background: url('${app[2]}') 0% 0% / cover;" alt="${app[0]}"></div>
              <h1>${app[0]}</h1>
              <p>${app[0]}</p>
              <a href="${app[3]}" target="_blank"><button class="actual two" data-text="Play" data-a-text="Playing" data-active="true"><i class="fa-solid fa-play"></i></button></a>
      `;
      document.getElementById("installations").appendChild(appObject);
  });
}

function theme(name) {
  let root = document.querySelector(':root');
  if (name === 'light') {
    root.classList = '';
  } else {
    root.classList.toggle(name);
  }
}

document.querySelector('.app-store').addEventListener("scroll", function() {
  excessContainer.scrollTop = document.querySelector('.app-store').scrollTop;
});

excessContainer.addEventListener("scroll", function() {
  document.querySelector('.app-store').scrollTop = excessContainer.scrollTop;
});

if (!localStorage.getItem("youtube")) {
  document.querySelector('#popup').style.display = "block";
  document.getElementById('clickbox').style.display = "block";

  document.querySelector('.go').addEventListener('click', function() {
      document.querySelector('#popup').style.display = "none";
      document.getElementById('clickbox').style.display = "none";
  });
  
  localStorage.setItem("youtube", "true");
} else {
  document.querySelector('#popup').style.display = "none";
  document.getElementById('clickbox').style.display = "none";
}