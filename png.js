module.exports = parsePNG;

// https://www.w3.org/TR/PNG/
function parsePNG(buffer) {
  // Ignore the 8 byte header.
  let pos = 8;
  const chunks = [];
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
  const length = buffer.readUInt32BE(start);
  const type = buffer.slice(start + 4, start + 8).toString('utf8');
  const crc = buffer.readUInt32BE(start + 8 + length).toString(16);

  const chunk = {
    length,
    type,
    crc,
  };
  if (type === 'IHDR') {
    Object.assign(chunk, parseIhdr(buffer, start + 8));
  }

  return {
    chunk,
    next: start + 12 + length,
  };
}

const colorTypes = [
  'greyscale',
  ,
  'truecolor',
  'indexed-color',
  'greyscale with alpha',
  ,
  'truecolor with alpha',
];

function parseIhdr(buffer, start) {
  const width = buffer.readUInt32BE(start);
  const height = buffer.readUInt32BE(start + 4);
  const bitDepth = buffer.readUInt8(start + 8);
  const colorType = colorTypes[buffer.readUInt8(start + 9)] || 'unknown';
  const compressionMethod = buffer.readUInt8(start + 10);
  const filterMethod = buffer.readUInt8(start + 11);
  const interlaceMethod = buffer.readUInt8(start + 12);
  return {
    width,
    height,
    bitDepth,
    colorType,
    compressionMethod,
    filterMethod,
    interlaceMethod,
  };
}
