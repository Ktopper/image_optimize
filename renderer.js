const { ipcRenderer } = require('electron')

document.getElementById('resizeButton').addEventListener('click', () => {
  ipcRenderer.send('resize-images')
})
