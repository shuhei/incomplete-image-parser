module.exports = parseWebp;

// https://developers.google.com/speed/webp/docs/riff_container
function parseWebp(buffer) {
  const chunks = [];
  let pos = 0;
  while (pos < buffer.length) {
    const { chunk, next } = parseChunk(buffer, pos);
    if (chunk) {
      chunks.push(chunk);
    }
    if (next === pos) {
      break;
    }
    pos = next;
  }
  return chunks;
}

function parseChunk(buffer, start) {
  const fourCC = buffer.slice(start, start + 4).toString('utf8');
  const size = buffer.readUInt32LE(start + 4);

  const chunk = {
    fourCC,
    start,
    size,
  };
  if (fourCC === 'VP8X') {
    Object.assign(chunk, parseVP8X(buffer, start + 8));
  } else if (fourCC === 'VP8 ') {
    Object.assign(chunk, parseVP8(buffer, start + 8));
  }

  let next;
  if (fourCC === 'RIFF') {
    // Ignore 0-4: 'WEBP'
    next = start + 8 + 4;
  } else {
    const payloadEnd = start + 8 + size;
    next = payloadEnd + (size % 2 === 0 ? 0 : 1);
  }

  return {
    chunk,
    next,
  };
}

const frameTypes = [
  'key frame',
  'interframe',
];

const scalingSpecs = [
  'no upscaling',
  'upscale by 5/4',
  'upscale by 5/3',
  'upscale by 2',
];

function parseVP8(buffer, start) {
  const num = buffer.readUInt8(start);
  const frameType = frameTypes[num >> 7] || 'unknown';
  const versionNumber = (num & 0b01110000) >> 4;
  const showFrame = (num & 0b00001000) >> 3;
  const firstDataPartitionSize = ((num & 0b111) << 16) + buffer.readUInt16LE(start + 1);
  // Ignore 3-6: 0x9d 0x01 0x2a
  console.log(buffer.slice(start + 3, start + 10));
  const w = buffer.readUInt16LE(start + 6);
  const width = w & 0x3fff;
  const horizontalScale = scalingSpecs[w >> 14];
  const h = buffer.readUInt16LE(start + 8);
  const height = h & 0x3fff;
  const verticalScale = scalingSpecs[h >> 14];
  return {
    frameType,
    versionNumber,
    showFrame,
    firstDataPartitionSize,
    width,
    height,
    horizontalScale,
    verticalScale,
  };
}

function parseVP8X(buffer, start) {
  const num = buffer.readUInt8(start);
  return {
    iccProfile: checkFlag(num, 5),
    alpha: checkFlag(num, 4),
    exif: checkFlag(num, 3),
    xmp: checkFlag(num, 2),
    animation: checkFlag(num, 1),
    canvasWidth: readUInt24LE(buffer, start + 4) + 1,
    canvasHeight: readUInt24LE(buffer, start + 7) + 1,
  };
}

function checkFlag(num, bit) {
  const mask= 1 << bit;
  const flag = (num & mask) >> bit;
  return flag === 1;
}

function readUInt24LE(buffer, start) {
  const first16 = buffer.readUInt16LE(start);
  const last8 = buffer.readUInt8(start + 2);
  return first16 + (last8 << 16);
}
