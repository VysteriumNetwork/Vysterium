let apps = document.querySelector('.apps');
let appsTwo = document.querySelector('#pageTwo');
let pageThree = document.querySelector('#pageThree');
let sliderOne = document.querySelector('#sliderOne');
let sliderTwo = document.querySelector('#sliderTwo');

fetch('json/default.json').then(response => response.json()).then(games => {
    let counter = 0;
    games.forEach(game => {
        if (counter < 22) {
            counter++;
            document.getElementById('apps').innerHTML += `<div class="item" style="background: url('${game[2]}') 0% 0% / cover;" onclick="play('${game[3]}')" alt="${game[0]}"></div>`;
        } else {
            appsTwo.innerHTML += `<div class="item" style="background: url('${game[2]}') 0% 0% / cover;" onclick="play('${game[3]}')" alt="${game[0]}"></div>`;
        }
    });
});

if (localStorage.getItem('apps') === '[]') {
  localStorage.removeItem('apps');
}

function downloads() {
    if (localStorage.getItem('apps')) {
      var downloads = JSON.parse(localStorage.getItem("apps"));
      downloads.forEach(game => {
          let existingItems = document.querySelectorAll("#pageTwo .item");
          let newItem = `<div class="item" style="background: url('${game[2]}') 0% 0% / cover;" onclick="play('${game[3]}')"></div>`;
          let itemExists = false;
          existingItems.forEach(item => {
              if (item.outerHTML === newItem) {
                  itemExists = true;
              }
          });
          if (itemExists) {
              console.log('This item already exists');
          } else {
              document.getElementById("pageTwo").innerHTML += newItem;
          }
      });
    }
}

downloads();

function play(game) {
    var play = document.getElementById('play');
    var screen = document.querySelector('iframe');
    if (play.style.display == "block") {
        play.style.display = "none";
        screen.src = "";
    } else {
        play.style.display = "block";
        screen.src = game;
    }
}

const dots = document.querySelector('.dots');
const active = 'active';

const switchSlider = (newSlider, newApps, newActiveDot) => {
  const oldSlider = newSlider === sliderOne ? sliderTwo : sliderOne;
  const oldApps = newApps === apps ? appsTwo : apps;
  oldSlider.style.display = 'none';
  newSlider.style.display = 'flex';
  oldApps.style.animation = 'slideOutRight 0.5s ease-in-out';
  newApps.style.animation = 'slideInRight 0.2s ease-in-out';
  setTimeout(() => {
    oldApps.style.display = 'none';
    newApps.style.display = 'grid';
  }, 300);
  document.querySelector('.dot.one').classList.remove(active);
  document.querySelector('.dot.two').classList.remove(active);
  newActiveDot.classList.add(active);
}

document.querySelectorAll('.dot').forEach((dot, index) => {
  dot.addEventListener('click', () => {
    const newSlider = index === 0 ? sliderOne : sliderTwo;
    const newApps = index === 0 ? apps : appsTwo;
    const newActiveDot = dot;
    switchSlider(newSlider, newApps, newActiveDot);
  });
});

let currentPage = 1;
const totalPages = 3;

document.addEventListener('mousemove', (event) => {
  setTimeout(() => {
    const windowWidth = window.innerWidth;
    const threshold = 220;
    if (event.pageX > windowWidth - threshold && currentPage < totalPages) {
      currentPage++;
      const newSlider = sliderOne;
      const newApps = appsTwo;
      const newActiveDot = document.querySelector('.dot.two');
      switchSlider(newSlider, newApps, newActiveDot);
    } else if (event.pageX < threshold && currentPage > 1) {
      currentPage--;
      const newSlider = sliderTwo;
      const newApps = apps;
      const newActiveDot = document.querySelector('.dot.one');
      switchSlider(newSlider, newApps, newActiveDot);
    }
  }, 100);
});

document.addEventListener('keydown', (event) => {
  const keyCode = event.keyCode || event.which;
  if (keyCode === 37 || keyCode === 219 || keyCode === 188) { // left arrow key
    if (currentPage > 1) {
      currentPage--;
      const newSlider = sliderTwo;
      const newApps = apps;
      const newActiveDot = document.querySelector('.dot.one');
      switchSlider(newSlider, newApps, newActiveDot);
    }
  } else if (keyCode === 39 || keyCode === 221 || keyCode === 190) { // right arrow key
    if (currentPage < totalPages) {
      currentPage++;
      const newSlider = sliderOne;
      const newApps = appsTwo;
      const newActiveDot = document.querySelector('.dot.two');
      switchSlider(newSlider, newApps, newActiveDot);
    }
  } else if (keyCode === 38) { // up arrow key
    document.getElementById('bar').style.bottom = '1vw';
    dots.style.display = 'flex';
    dots.style.animation = 'dots .7s ease';
  } else if (keyCode === 40) { // down arrow key
    document.getElementById('bar').style.bottom = '-50vw';
    dots.style.display = 'none';
  } else if (keyCode === 27) { // enter key
    document.getElementById('play').style.display = 'none'; 
    document.getElementById('iframe').src = "";
  } else if (keyCode === 91) { // enter key
    console.log("Command key / chromebook search key pressed");
  }
});

if (!localStorage.getItem("youtube")) {
    document.querySelector('#popup').style.display = "block";
    document.getElementById('clickbox').style.display = "block";
  
    document.querySelector('.go').addEventListener('click', function() {
        document.querySelector('#popup').style.display = "none";
        document.getElementById('clickbox').style.display = "none";
        localStorage.setItem("youtube", "true");
    });
} else {
    document.querySelector('#popup').style.display = "none";
    document.getElementById('clickbox').style.display = "none";
}

/*function updateLocalStorage(key, newValue) {
    let savedata = localStorage.getItem("RetroBowl.0.savedata.ini");
    let lines = savedata.split("\n");
  
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.startsWith(`${key}=`)) {
        lines[i] = `${key}="${newValue}"`;
        break;
      }
    }
  
    savedata = lines.join("\n");
    localStorage.setItem("RetroBowl.0.savedata.ini", savedata);
}

function graham() {
    let tokens = prompt("Enter your coach credit token amount:");
    updateLocalStorage("coach_credit", tokens);
}
  
function salary() {
    let tokens = prompt("Enter salary cap amount:");
    updateLocalStorage("salary_cap", tokens);
}

if (!localStorage.getItem("intro")) {
    document.querySelector('#popup').style.display = "block";
    document.getElementById('clickbox').style.display = "block";

    document.querySelector('.close').addEventListener('click', function() {
        document.querySelector('#popup').style.display = "none";
        document.getElementById('clickbox').style.display = "none";
    });

    document.querySelector('.go').addEventListener('click', function() {
        document.querySelector('#popup').style.display = "none";
        document.getElementById('clickbox').style.display = "none";
    });

    document.getElementById('clickbox').addEventListener('click', function() {
        document.querySelector('#popup').style.display = "none";
        document.getElementById('clickbox').style.display = "none";
    });
    localStorage.setItem("intro", "true");
} else {
    document.querySelector('#popup').style.display = "none";
    document.getElementById('clickbox').style.display = "none";
}*/