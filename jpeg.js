module.exports = parseJpeg;

// https://en.wikipedia.org/wiki/JPEG_File_Interchange_Format
function parseJpeg(buffer) {
  const segments = [];
  // Ignore 0-2: SOI
  let pos = 2;
  while (pos < buffer.length) {
    const { segment, next } = parseSegment(buffer, pos);
    if (segment) {
      segments.push(segment);
    }
    if (pos === next) {
      break;
    } else {
      pos = next;
    }
  }
  return segments;
}

function parseSegment(buffer, start) {
  const marker = buffer.slice(start, start + 2);
  if (marker[0] === 0xff) {
    switch (marker[1]) {
      case 0xda:
        return parseSOS(buffer, start);
      case 0xe0:
        return parseApp0(buffer, start);
      case 0xc0:
      case 0xc2:
        return parseSOF(buffer, start);
      default:
        return parseOtherSegment(buffer, start);
    }
  }
  return {
    segment: {
      marker: 'unknown',
      start,
      data: buffer.slice(start),
    },
    next: start,
  };
}

// http://lad.dsc.ufcg.edu.br/multimidia/jpegmarker.pdf
function parseSOS(buffer, start) {
  const headerLength = buffer.readUInt16BE(start + 2);
  const numberOfComponents = buffer.readUInt8(start + 4);
  const components = [];
  for (let i = 0; i < numberOfComponents; i++) {
    const offset = start + 5 + i * 2;
    const [dcSelector, acSelector] = readUInt4BE(buffer, offset + 1);
    const component = {
      selector: buffer.readUInt8(offset),
      dcSelector,
      acSelector,
    };
    components.push(JSON.stringify(component));
  }
  const offset = start + 5 + numberOfComponents * 2;
  const spectralStart = buffer.readUInt8(offset);
  const spectralEnd = buffer.readUInt8(offset + 1);
  const [successiveHigh, successiveLow] = readUInt4BE(buffer, offset + 2);
  return {
    segment: {
      marker: segmentName(buffer.readUInt8(start + 1)),
      start,
      headerLength,
      numberOfComponents,
      components,
      spectralStart,
      spectralEnd,
      successiveHigh,
      successiveLow,
    },
    next: start,
  };
}

function parseApp0(buffer, start) {
  const length = buffer.readUInt16BE(start + 2);
  const identifier = buffer.slice(start + 4, start + 9).toString('utf8');
  const jfifVersionMajor = buffer.readUInt8(start + 9);
  const jfifVersionMinor = buffer.readUInt8(start + 10);
  const densityUnits = ['no units', 'pixels per inch', 'pixels per cm'][buffer.readUInt8(start + 11)] || 'unknown';
  const xDensity = buffer.readUInt16BE(start + 12);
  const yDensity = buffer.readUInt16BE(start + 14);
  const xThumbnail = buffer.readUInt8(start + 16);
  const yThumbnail = buffer.readUInt8(start + 17);
  const next = start + 2 + length;
  const thumbnailData = buffer.slice(start + 18, next);

  const segment = {
    marker: 'app0',
    start,
    length,
    identifier,
    jfifVersionMajor,
    jfifVersionMinor,
    densityUnits,
    xDensity,
    yDensity,
    xThumbnail,
    yThumbnail,
    thumbnailData,
  };

  return {
    segment,
    next,
  };
}

function parseSOF(buffer, start) {
  const marker = buffer.slice(start, start + 2);
  const length = buffer.readUInt16BE(start + 2);
  const precision = buffer.readUInt8(start + 4);
  const lines = buffer.readUInt16BE(start + 5);
  const samplesPerLine = buffer.readUInt16BE(start + 7);
  const componentsInFrame = buffer.readUInt8(start + 9);
  const components = [];
  for (let i = 0; i < componentsInFrame; i++) {
    const offset = start + 10 + i * 3;
    const [v, h] = readUInt4BE(buffer, offset + 1);
    const samplingFactors = { v, h };
    const component = {
      id: [, 'Y', 'Cb', 'Cr', 'I', 'Q'][buffer.readUInt8(offset)] || 'unknown',
      samplingFactors,
      quantizationTableNumber: buffer.readUInt8(offset + 2),
    };
    // `JSON.stringify` to show all the fields with `console.log`...
    components.push(JSON.stringify(component));
  }

  const segment = {
    marker: segmentName(marker[1]),
    start,
    length,
    precision,
    lines,
    samplesPerLine,
    componentsInFrame,
    components,
  };
  return {
    segment,
    next: start + 2 + length,
  };
}

function parseOtherSegment(buffer, start) {
  const marker = buffer.slice(start, start + 2);
  const length = buffer.readUInt16BE(start + 2);
  const segment = {
    marker: segmentName(marker[1]),
    start,
    length,
  };
  return {
    segment,
    next: start + 2 + length,
  };
}

// http://dev.exiv2.org/projects/exiv2/wiki/The_Metadata_in_JPEG_files<Paste>
function segmentName(marker) {
  switch (marker) {
  case 0xc0:
    return 'Start of Frame (Baseline DCT)';
  case 0xc2:
    return 'Start of Frame (Progressive DCT)';
  case 0xc4:
    return 'Define Huffman Table(s)';
  case 0xda:
    return 'Start of Scan';
  case 0xdb:
    return 'Define Quantization Table(s)';
  case 0xdd:
    return 'Define restart interval';
  case 0xfe:
    return 'Comment';
  default:
    if (0xe0 <= marker && marker < 0xf0) {
      const n = marker - 0xe0;
      return `app${n}`;
    } else {
      return `unknown 0x${marker.toString(16)}`;
    }
  }
}

function readUInt4BE(buffer, start) {
  const num = buffer.readUInt8(start);
  return [
    num >> 4,
    num & 0b1111,
  ];
}
