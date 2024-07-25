const { ipcRenderer } = require('electron')

document.getElementById('resizeButton').addEventListener('click', () => {
  ipcRenderer.send('resize-images')
})
 document
        .getElementById("create-favicon-button")
        .addEventListener("click", () => {
          ipcRenderer.send("create-favicon");
        });

document.getElementById('resizeWebpButton').addEventListener('click', () => {
  ipcRenderer.send('resize-webp-images');
});



