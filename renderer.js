const { ipcRenderer } = require('electron')

document.getElementById('resizeButton').addEventListener('click', () => {
  ipcRenderer.send('resize-images')
})


document.getElementById('resizeWebpButton').addEventListener('click', () => {
  ipcRenderer.send('resize-webp-images');
});
