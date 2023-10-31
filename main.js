const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const prompt = require('electron-prompt');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

async function processImage(filePath, outputPath, percentage, format) {
  try {
    const imageMetadata = await sharp(filePath).metadata();
    const outputFormat = format || imageMetadata.format;

    const options = {};
    if (['png', 'webp'].includes(outputFormat)) {
      options.alphaQuality = 100;
    }

    await sharp(filePath)
      .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
      .toFormat(outputFormat, options)
      .toFile(outputPath);
  } catch (error) {
    console.error("Error processing image:", error);
  }
}
async function selectAndResizeImages() {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  const percentage = await prompt({
    title: 'Enter percentage',
    label: 'Enter the percentage (in %) to resize the images to:',
    value: '50',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  })

  if (isNaN(percentage)) {
    // TODO: Handle invalid input
    return
  }

  for (let dirPath of directoryPaths) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        // TODO: Handle error
        console.log('Unable to scan directory: ' + err)
        return
      } 

      files.forEach(async (file) => {
        if (['.jpg', '.png', '.gif'].includes(path.extname(file).toLowerCase())) {
          const filePath = path.join(dirPath, file)
          const imageMetadata = await sharp(filePath).metadata()

          const outputPath = path.join(dirPath, 'big_' + file)
          fs.renameSync(filePath, outputPath)

          await sharp(outputPath)
            .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
            .toFormat('jpeg')
            .toFile(filePath)
        }
      })
    })
  }
}

async function selectAndResizeSingleImage() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }]
  })

  const percentage = await prompt({
    title: 'Enter percentage',
    label: 'Enter the percentage (in %) to resize the image to:',
    value: '75',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  })

  if (isNaN(percentage)) {
    // TODO: Handle invalid input
    return
  }

  for (let filePath of filePaths) {
    const imageMetadata = await sharp(filePath).metadata()
    const outputPath = path.join(path.dirname(filePath), 'big_' + path.basename(filePath))
    
    fs.renameSync(filePath, outputPath)
    
    await sharp(outputPath)
      .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
      .toFormat('jpeg')
      .toFile(filePath)
  }
}


async function selectAndResizeLargeImages() {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  const percentage = await prompt({
    title: 'Enter percentage',
    label: 'Enter the percentage (in %) to resize the images to:',
    value: '75',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  })

  const sizeThreshold = await prompt({
    title: 'Enter size threshold',
    label: 'Enter the file size threshold (in KB) to resize images above:',
    value: '200',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  })

  const dimensionThreshold = await prompt({
    title: 'Enter dimension threshold',
    label: 'Enter the dimension threshold (in px) to resize images above:',
    value: '800',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  })

  if (isNaN(percentage) || isNaN(sizeThreshold) || isNaN(dimensionThreshold)) {
    // TODO: Handle invalid input
    return
  }

  // Convert size threshold from KB to bytes for comparison
  const sizeThresholdInBytes = sizeThreshold * 1024;

  for (let dirPath of directoryPaths) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        // TODO: Handle error
        console.log('Unable to scan directory: ' + err)
        return
      } 

      files.forEach(async (file) => {
        if (['.jpg', '.png', '.gif'].includes(path.extname(file).toLowerCase())) {
          const filePath = path.join(dirPath, file)
          const stats = fs.statSync(filePath);

          const imageMetadata = await sharp(filePath).metadata()

          // Only process files larger than the threshold
          if(stats.size > sizeThresholdInBytes && (imageMetadata.width > dimensionThreshold || imageMetadata.height > dimensionThreshold)) {
            const outputPath = path.join(dirPath, 'big_' + file)
            fs.renameSync(filePath, outputPath)

            await sharp(outputPath)
              .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
              .toFormat('jpeg')
              .toFile(filePath)
          }
        }
      })
    })
  }
}
async function resizeWebpImages() {
  try {
    const { filePaths: directoryPaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (!directoryPaths) return;  // Handle case where the user closes the dialog

    const percentage = await prompt({
      title: 'Enter percentage',
      label: 'Enter the percentage (in %) to resize the webp images to:',
      value: '80',
      inputAttrs: {
        type: 'number'
      },
      type: 'input'
    });

    if (isNaN(percentage)) {
      // Handle invalid input, maybe show a dialog or log it
      console.error("Invalid percentage value provided");
      return;
    }

    for (let dirPath of directoryPaths) {
      fs.readdir(dirPath, (err, files) => {
        if (err) {
          console.error('Unable to scan directory: ' + err);
          return;
        }

        files.forEach(async (file) => {
          if (path.extname(file).toLowerCase() === '.webp') {
            const filePath = path.join(dirPath, file);
            
            // Rename the original file to have "old_" prefix
            const oldFilePath = path.join(dirPath, 'old_' + file);
            fs.renameSync(filePath, oldFilePath);

            // Get image metadata
            const imageMetadata = await sharp(oldFilePath).metadata();

            // Resize the image and save it with its original name
            await sharp(oldFilePath)
              .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
              .toFormat('webp')
              .toFile(filePath);
          }
        });
      });
    }
  } catch (error) {
    console.error("Error resizing webp images:", error);
  }
}



ipcMain.on('resize-webp-images', (event) => {
  resizeWebpImages();
});

ipcMain.on('resize-single-image', (event) => {
  selectAndResizeSingleImage();
});

ipcMain.on('resize-all-images', (event) => {
  selectAndResizeImages();
});

ipcMain.on('resize-large-images', (event) => {
  selectAndResizeLargeImages();
});

ipcMain.on('convert-single-image-to-webp', async (event) => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }],
  });

  filePaths.forEach(async filePath => {
    const outputPath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '.webp');
    await processImage(filePath, outputPath, 100, 'webp');
  });
});

ipcMain.on('convert-all-images-to-webp', async (event) => {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  for (let dirPath of directoryPaths) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        console.log('Unable to scan directory: ' + err);
        return;
      }

      
      files.forEach(async file => {
        if (['.jpg', '.png', '.gif'].includes(path.extname(file).toLowerCase())) {
          const filePath = path.join(dirPath, file);
          const outputPath = path.join(dirPath, path.basename(file, path.extname(file)) + '.webp');
          await processImage(filePath, outputPath, 100, 'webp');
        }
      });
    });
  }
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});