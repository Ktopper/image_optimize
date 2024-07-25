const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const prompt = require('electron-prompt');

function createWindow() {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });
  
    win.loadFile('index.html');
  }

app.whenReady().then(createWindow);

async function processImage(filePath, outputPath, percentage, format) {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    const outputFormat = format || metadata.format;

    const options = {
      webp: { quality: 80 },
      png: { compressionLevel: 9 },
      jpeg: { quality: 80 },
    };

    await image
      .resize({ width: Math.round(metadata.width * percentage / 100) })
      .toFormat(outputFormat, options[outputFormat])
      .toFile(outputPath);
  } catch (error) {
    console.error("Error processing image:", error);
  }
}

async function processImagesInDirectory(dirPath, callback) {
  try {
    const files = await fs.readdir(dirPath);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    for (const file of files) {
      if (imageExtensions.includes(path.extname(file).toLowerCase())) {
        const filePath = path.join(dirPath, file);
        await callback(filePath);
      }
    }
  } catch (error) {
    console.error('Error processing directory:', error);
  }
}

async function promptForValue(options) {
  return prompt({
    title: options.title,
    label: options.label,
    value: options.defaultValue,
    inputAttrs: { type: 'number' },
    type: 'input'
  });
}



async function resizeImages(event, { isMultiple = true, percentage = null, sizeThreshold = null, dimensionThreshold = null }) {
    try {
      const directoryPaths = await dialog.showOpenDialog({
        properties: [isMultiple ? 'openDirectory' : 'openFile'],
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }],
      });
  
      if (!directoryPaths.filePaths.length) return;
  
      percentage = percentage || await promptForValue({
        title: 'Enter percentage',
        label: 'Enter the percentage (in %) to resize the images to:',
        defaultValue: '75'
      });
  
      if (isNaN(percentage)) throw new Error("Invalid percentage value");
  
      const processImage = async (filePath) => {
        const stats = await fs.stat(filePath);
        const metadata = await sharp(filePath).metadata();
  
        if (!sizeThreshold || !dimensionThreshold || 
            (stats.size > sizeThreshold * 1024 && 
             (metadata.width > dimensionThreshold || metadata.height > dimensionThreshold))) {
          const dir = path.dirname(filePath);
          const ext = path.extname(filePath);
          const baseName = path.basename(filePath, ext);
          const bigFilePath = path.join(dir, `big_${baseName}${ext}`);
          
          // Rename original file to big_filename
          await fs.rename(filePath, bigFilePath);
  
          // Create resized image with original filename
          await sharp(bigFilePath)
            .resize({ width: Math.round(metadata.width * percentage / 100) })
            .toFile(filePath);
  
          console.log(`Resized image saved as ${filePath}, original saved as ${bigFilePath}`);
        }
      };
  
      if (isMultiple) {
        for (const dirPath of directoryPaths.filePaths) {
          await processImagesInDirectory(dirPath, processImage);
        }
      } else {
        await processImage(directoryPaths.filePaths[0]);
      }
    } catch (error) {
      console.error("Error resizing images:", error);
    }
  }
  


async function makeImageSquare(filePath, size = null) {
  try {
    const metadata = await sharp(filePath).metadata();
    const squareSize = size || Math.min(metadata.width, metadata.height);

    const outputPath = path.join(path.dirname(filePath), `square_${path.basename(filePath)}`);
    
    await sharp(filePath)
      .extract({
        width: squareSize,
        height: squareSize,
        left: Math.round((metadata.width - squareSize) / 2),
        top: Math.round((metadata.height - squareSize) / 2),
      })
      .resize(size, size)
      .toFile(outputPath);

    console.log(`Square image created at ${outputPath}`);
  } catch (error) {
    console.error('Error making image square:', error);
  }
}

async function selectAndMakeImageSquare() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    await makeImageSquare(filePaths[0]);
  }
}

async function selectAndMakeImageSquare700() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    await makeImageSquare(filePaths[0], 700);
  }
}

async function createFavicon(filePath) {
  try {
    const outputPath = path.join(path.dirname(filePath), `favicon_${path.basename(filePath, path.extname(filePath))}.png`);

    await sharp(filePath)
      .resize(32, 32)
      .toFormat('png')
      .toFile(outputPath);

    console.log(`Favicon created at ${outputPath}`);
  } catch (error) {
    console.error('Error creating favicon:', error);
  }
}

async function selectAndCreateFavicon() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    await createFavicon(filePaths[0]);
  }
}

async function resizeWebpImages() {
  try {
    const { filePaths: directoryPaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (!directoryPaths) return;

    const percentage = await promptForValue({
      title: 'Enter percentage',
      label: 'Enter the percentage (in %) to resize the webp images to:',
      defaultValue: '80'
    });

    if (isNaN(percentage)) throw new Error("Invalid percentage value");

    for (const dirPath of directoryPaths) {
      await processImagesInDirectory(dirPath, async (filePath) => {
        if (path.extname(filePath).toLowerCase() === '.webp') {
          const oldFilePath = path.join(path.dirname(filePath), 'old_' + path.basename(filePath));
          await fs.rename(filePath, oldFilePath);
          await processImage(oldFilePath, filePath, percentage, 'webp');
          await fs.unlink(oldFilePath);
        }
      });
    }
  } catch (error) {
    console.error("Error resizing webp images:", error);
  }
}

async function convertToFormat(isMultiple, targetFormat) {
  try {
    const options = {
      properties: isMultiple ? ['openDirectory'] : ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }]
    };

    const { filePaths } = await dialog.showOpenDialog(options);

    if (!filePaths.length) return;

    const processFile = async (filePath) => {
      const outputPath = path.join(
        path.dirname(filePath), 
        `${path.basename(filePath, path.extname(filePath))}.${targetFormat}`
      );
      await processImage(filePath, outputPath, 100, targetFormat);
    };

    if (isMultiple) {
      for (const dirPath of filePaths) {
        await processImagesInDirectory(dirPath, processFile);
      }
    } else {
      await processFile(filePaths[0]);
    }
  } catch (error) {
    console.error(`Error converting images to ${targetFormat}:`, error);
  }
}

async function convertToWebp(isMultiple) {
  await convertToFormat(isMultiple, 'webp');
}

async function convertToPng(isMultiple) {
  await convertToFormat(isMultiple, 'png');
}

async function resizeImagesOver1200px() {
  try {
    const { filePaths: directoryPaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    for (const dirPath of directoryPaths) {
      await processImagesInDirectory(dirPath, async (filePath) => {
        const metadata = await sharp(filePath).metadata();

        if (metadata.width > 1200 || metadata.height > 800) {
          const tempFilePath = path.join(path.dirname(filePath), 'temp_' + path.basename(filePath));
          await fs.rename(filePath, tempFilePath);

          try {
            await sharp(tempFilePath)
              .resize({
                width: metadata.width > 1200 ? 1200 : undefined,
                height: metadata.height > 800 ? 800 : undefined,
                fit: 'inside'
              })
              .toFile(filePath);

            await fs.unlink(tempFilePath);
          } catch (error) {
            console.error('Error processing image:', error);
            await fs.rename(tempFilePath, filePath);
          }
        }
      });
    }
  } catch (error) {
    console.error('Error resizing images over 1200px:', error);
  }
}

async function optimizeImagesInFolder() {
  try {
    const { filePaths: directoryPaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    for (const dirPath of directoryPaths) {
      await processImagesInDirectory(dirPath, async (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (['.png', '.webp'].includes(ext)) {
          const tempFilePath = path.join(path.dirname(filePath), 'temp_' + path.basename(filePath));
          await fs.rename(filePath, tempFilePath);

          try {
            await processImage(tempFilePath, filePath, 100, ext.slice(1));
            await fs.unlink(tempFilePath);
          } catch (error) {
            console.error('Error optimizing image:', error);
            await fs.rename(tempFilePath, filePath);
          }
        }
      });
    }
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

// IPC Handlers
ipcMain.handle('optimize-images', () => optimizeImagesInFolder());
ipcMain.handle('make-image-square-700', () => selectAndMakeImageSquare700());
ipcMain.handle('make-image-square', () => selectAndMakeImageSquare());
ipcMain.handle('create-favicon', () => selectAndCreateFavicon());
ipcMain.handle('resize-webp-images', () => resizeWebpImages());
ipcMain.handle('resize-single-image', (event) => resizeImages(event, { isMultiple: false }));
ipcMain.handle('resize-all-images', (event) => resizeImages(event, { isMultiple: true }));
ipcMain.handle('resize-large-images', (event) => resizeImages(event, { isMultiple: true, sizeThreshold: 200, dimensionThreshold: 800 }));
ipcMain.handle('convert-single-image-to-webp', () => convertToWebp(false));
ipcMain.handle('convert-all-images-to-webp', () => convertToWebp(true));
ipcMain.handle('convert-image-to-png', () => convertToPng(false));
ipcMain.handle('convert-all-images-to-png', () => convertToPng(true));
ipcMain.handle('resize-images-over-1200px', () => resizeImagesOver1200px());

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