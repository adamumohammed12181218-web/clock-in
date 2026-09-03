const bwipjs = require('bwip-js');

/**
 * Generates a QR code as a base64 PNG string.
 * @param {string} text - The content to encode in the QR code
 * @returns {Promise<string>} Base64-encoded PNG image (data URL ready)
 */
async function generateQRCode(text) {
  const png = await bwipjs.toBuffer({
    bcid: 'qrcode',
    text: text,
    scale: 4,
    includetext: false,
    eclevel: 'M'
  });

  return `data:image/png;base64,${png.toString('base64')}`;
}

module.exports = { generateQRCode };
