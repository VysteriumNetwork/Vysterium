let icon = document.createElement('img');
icon.src = '/favicon.png'; // replace with your own image URL
icon.style.position = 'fixed';
icon.style.right = '20px';
icon.style.bottom = '20px';
icon.style.cursor = 'move';
icon.style.width = '32px';
icon.style.zIndex = '9999';
document.body.appendChild(icon);
let widget = document.createElement('div');
widget.style.opacity = '0';
widget.style.position = 'fixed';
widget.style.right = '20px';
widget.style.bottom = '80px';
widget.style.padding = '20px';
widget.style.backgroundColor = '#808080'; // set the background color to grey
widget.style.border = '1px solid #000';
widget.style.color = '#000'; // set the text color to black
widget.style.transition = 'opacity 0.5s'; // add a transition effect
document.body.appendChild(widget);

let textArea = document.createElement('textarea');
textArea.style.width = '200px';
textArea.style.height = '100px';
widget.appendChild(textArea);

let button = document.createElement('button');
button.textContent = 'Run Script';
button.style.display = 'block';
button.style.marginTop = '10px';
widget.appendChild(button);
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
document.addEventListener('mousemove', (event) => {
  if (isDragging) {
    icon.style.right = (window.innerWidth - event.pageX - dragOffsetX) + 'px';
    icon.style.bottom = (window.innerHeight - event.pageY - dragOffsetY) + 'px';
    widget.style.right = icon.style.right;
    widget.style.bottom = (parseInt(icon.style.bottom, 10) + 60) + 'px';
  }
});
document.addEventListener('mouseup', () => {
  isDragging = false;
});
icon.addEventListener('mousedown', (event) => {
  isDragging = true;
  dragOffsetX = event.pageX - icon.getBoundingClientRect().left;
  dragOffsetY = event.pageY - icon.getBoundingClientRect().top;
});

icon.addEventListener('click', () => {
  if (widget.style.opacity !== '0') {
    widget.style.opacity = '0';
  } else {
    widget.style.opacity = '1';
  }
});
button.addEventListener('click', () => {
  try {
    eval(textArea.value);
  } catch (error) {
    console.error('Error evaluating script:', error);
  }
});
