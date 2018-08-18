module.exports = parsePNG;

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
  return {
    chunk,
    next: start + 12 + length,
  };
}
