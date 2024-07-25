document.addEventListener('DOMContentLoaded', () => {
  const buttons = {
    'resizeSingleImageButton': 'resize-single-image',
    'resizeAllImagesButton': 'resize-all-images',
    'resizeLargeImagesButton': 'resize-large-images',
    'resizeWebpButton': 'resize-webp-images',
    'resizeImagesOver1200pxButton': 'resize-images-over-1200px',
    'convertSingleImageToWebPButton': 'convert-single-image-to-webp',
    'convertAllImagesToWebPButton': 'convert-all-images-to-webp',
    'convertImageToPNGButton': 'convert-image-to-png',
    'convertAllImagesToPNGButton': 'convert-all-images-to-png',
    'makeSquare700Button': 'make-image-square-700',
    'makeSquareButton': 'make-image-square',
    'createFaviconButton': 'create-favicon',
    'optimizeImagesButton': 'optimize-images'
  };

  for (const [buttonId, channel] of Object.entries(buttons)) {
    document.getElementById(buttonId).addEventListener('click', () => {
      window.electronAPI.sendMessage(channel);
    });
  }
});