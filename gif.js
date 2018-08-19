module.exports = parseGIF;

function parseGIF(buffer) {
  const header = buffer.slice(0, 6).toString('utf8');
  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  // TODO: Read 10th byte.
  const backgroundColor = buffer.readUInt8(10);
  const aspectRatio = buffer.readUInt8(11);

  const colorTable = [];
  for (let i = 0; i < 256; i++) {
    const pos = 12 + i;
    const r = buffer.readUInt8(pos);
    const g = buffer.readUInt8(pos + 1);
    const b = buffer.readUInt8(pos + 2);
    colorTable[i] = { r, g, b };
  }

  // TODO: Read Global Color Table.
  // TODO: Read segments.
  const segments = [];
  return {
    header,
    width,
    height,
    backgroundColor,
    aspectRatio,
    colorTable,
    segments,
  };
}
