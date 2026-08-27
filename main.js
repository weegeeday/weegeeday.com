document.addEventListener('DOMContentLoaded', () => {
  const starfield = document.getElementById('starfield');
  const starCount = 800; 
  let shadowString = '';

  for (let i = 0; i < starCount; i++) {
    // Distribute stars horizontally across the screen width
    const x = Math.floor(Math.random() * window.innerWidth);
    // Distribute stars vertically across a fixed 2000px canvas
    const y = Math.floor(Math.random() * 2000); 
    
    shadowString += `${x}px ${y}px #fff`;
    if (i < starCount - 1) shadowString += ', ';
  }

  starfield.style.boxShadow = shadowString;
});

let modPlayer;

document.querySelector('.transparent-overlay').addEventListener('click', () => {
  if (modPlayer) {
    return;
  }

  modPlayer = new ScripTracker();
  modPlayer.on(ScripTracker.Events.playerReady, (player) => {
    player.play();
  });
  modPlayer.loadModule("./music/pow_-_wonderful_life.mod");
});
