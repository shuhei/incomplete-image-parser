module.exports = parseGIF;

function parseGIF(buffer) {
  const header = buffer.slice(0, 6).toString('utf8');
  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  // TODO: Read [10].
  const backgroundColor = buffer.readUInt8(11);
  const aspectRatio = buffer.readUInt8(12);

  const colorTable = [];
  for (let i = 0; i < 256; i++) {
    colorTable[i] = parseColorTableItem(buffer, 13 + i * 3);
  }

  // TODO: Read segments.
  const segments = [];
  let pos = 13 + 256 * 3;
  while (pos < buffer.length) {
    const { segment, next } = parseSegment(buffer, pos);
    if (segment) {
      segments.push(segment);
    }
    if (pos === next) {
      break;
    }
    pos = next;
  }

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

function parseColorTableItem(buffer, start) {
  const r = buffer.readUInt8(start);
  const g = buffer.readUInt8(start + 1);
  const b = buffer.readUInt8(start + 2);
  return { r, g, b };
}

function parseSegment(buffer, start) {
  const sentinel = buffer.readUInt8(start);
  const segment = {
    sentinel,
  };
  let next = start;
  switch (sentinel) {
    // image
    case 0x2c: {
      Object.assign(segment, {
        name: 'Image',
      });
      break;
    }
    case 0x21: {
      const extensionCode = buffer.readUInt8(start + 1);
      const length = buffer.readUInt8(start + 2);
      Object.assign(segment, {
        extensionCode,
        start,
        length,
      });

      next = start + 3 + length + 1;

      if (extensionCode === 0xff) {
        const applicationId = buffer.slice(start + 3, start + 3 + length).toString('utf8');
        const { blocks, next: pos } = parseExtensionBlocks(buffer, start + 3 + length);
        Object.assign(segment, {
          name: 'Application Extension Block',
          applicationId,
          blocks,
        });
        next = pos;
      } else if (extensionCode === 0xf9) {
        // TODO: Parse flags.
        const flags = buffer.readUInt8(start + 3);
        const delayTime = buffer.readUInt16LE(start + 4);
        const transparentColorIndex = buffer.readUInt8(start + 6);
        Object.assign(segment, {
          name: 'Graphic Control Extension Block',
          flags,
          transparentColorIndex,
        });
      } else {
        // TODO: Support more extension blocks.
      }
      break;
    }
    case 0x3b: {
      Object.assign(segment, {
        name: 'Trailer',
      });
      next = start + 1;
      break;
    }
  }
  return {
    segment,
    next,
  };
}

function parseExtensionBlocks(buffer, start) {
  const blocks = [];
  let pos = start;
  while (pos < buffer.length) {
    const { block, next } = parseExtensionBlock(buffer, pos);
    if (block) {
      blocks.push(block);
    }
    if (next === pos) {
      break;
    }
    // Terminator
    if (next === pos + 1) {
      pos = next;
      break;
    }
    pos = next;
  }
  return {
    blocks,
    next: pos,
  };
}

function parseExtensionBlock(buffer, start) {
  const size = buffer.readUInt8(start);
  return {
    block: buffer.slice(start + 1, start + 1 + size),
    next: start + 1 + size,
  };
}
