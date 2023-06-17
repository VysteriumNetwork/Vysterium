var secretNav = document.querySelector('.secret-nav');
var isKeyEnabled = false;

document.addEventListener('mousemove', function(event) {
  if (isKeyEnabled) {
    var distanceFromRight = document.documentElement.clientWidth - event.clientX;
    
    if (distanceFromRight <= 100) {
      secretNav.classList.add('expand');
    } else {
      secretNav.classList.remove('expand');
    }
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === "'") {
    isKeyEnabled = !isKeyEnabled;
  }
});