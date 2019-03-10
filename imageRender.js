const sharp = require('sharp');

const roundedCorners = Buffer.from(
  `<svg width="200" height="200">
  <rect width="180" height="180" x="10" y="10"
        fill="none"
        stroke-width="4"
        stroke="yellowgreen"/>
  <rect width="160" height="160" x="20" y="20"
        fill="none"
        stroke-width="2"
        stroke="yellowgreen"/>
</svg>`
);


module.exports = {
  renderMirrorImage: (buffer) => {
    return sharp(buffer)
      .rotate()
      .flop()
      .toBuffer()
  },
  renderFrameImage: (buffer) => {
    return sharp(buffer)
      .resize(200, 200)
      .overlayWith(roundedCorners)
      .toBuffer()
  }
}