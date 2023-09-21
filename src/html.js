import { config } from '../config.js'
export let adminscript = `
<script>
  function logoutUsers() {
    fetch(location.href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageType: 'logoutUsers'}),
    })
    .then(response => response.text())
    .then(data => {
      const url = window.location.origin;
      alert(data);
      window.location.replace(\"${config.logouturl}\");
    });
  }
</script>
`;
export let pagescript = `
<style>
body {
  font-family: Arial, sans-serif;
}
      .panel {
      opacity: 0;
      position: fixed;
      width: 300px;
      height: 200px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #404040;
      border-radius: 25px;
      padding: 20px;
      color: black;
      z-index: 0;
      transition: opacity 0.7s ease;
  }

  .panel.show {
      opacity: 1;
      z-index: 99999;
  }

  .panel a {
      display: block;
      text-decoration: none;
      color: white;
      background: #007BFF; /* dark gray */
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 10px;
      text-align: center;
  }
</style>
<div class="panel" id="myPanel">
<a href=${config.adminpanelurl}>Admin</a>
<a href=${config.userpanelurl}>User Panel</a>
<a href=${config.terminalurl}>Admin Terminal</a>
<a href=${config.logouturl}>Logout</a>
</div>

<script>
if (document.referrer == location.origin + \"${config.logouturl}\") {
location.reload(true);
}
document.body.addEventListener('keydown', function(e) {
var panel = document.getElementById('myPanel');
if (e.code === 'ShiftRight') {
  panel.classList.add('show');
} else if (e.code === 'Escape') {
  panel.classList.remove('show');
}
});
</script>
</body>`