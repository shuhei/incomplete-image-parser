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
