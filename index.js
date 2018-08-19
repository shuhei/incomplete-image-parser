const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');

const parseJpeg = require('./jpeg');
const parseWebp = require('./webp');
const parsePNG = require('./png');
const parseGIF = require('./gif');

const clients = {
  'http:': http,
  'https:': https,
};

const ext2parser = {
  jpg: parseJpeg,
  jpeg: parseJpeg,
  webp: parseWebp,
  png: parsePNG,
  gif: parseGIF,
};

const imageUrl = process.argv[2];
const { protocol, hostname, path } = url.parse(imageUrl);
const client = clients[protocol];
if (client) {
  fetchImage({ client, hostname, path });
} else {
  readImage({ path });
}

function readImage({ path }) {
  const ext = path.split('.').pop();
  const parser = ext2parser[ext];
  if (!parser) {
      throw new Error(`Unsupported extension: ${ext}`);
  }

  const body = fs.readFileSync(path);
  console.log(parser(body));
}

function fetchImage({ client, hostname, path }) {
  const options = {
    hostname,
    path,
    method: 'GET',
    headers: {
      // 'Range': 'bytes=0-1023',
      // Akamai Image Manager sends image/webp for Chrome UA.
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
    },
  };
  const req = client.request(options, (res) => {
    console.log({ statusCode: res.statusCode, headers: res.headers });
    if (res.statusCode >= 300) {
      console.error(`Failed to get ${imageUrl}`);
      res.resume();
      return;
    }
    const chunks = [];
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    res.on('end', () => {
      const body = Buffer.concat(chunks);
      const contentType = res.headers['content-type'] || '';
      if (contentType.startsWith('image/jpeg')) {
        console.log(parseJpeg(body));
      } else if (contentType.startsWith('image/webp')) {
        console.log(parseWebp(body));
      } else if (contentType.startsWith('image/png')) {
        console.log(parsePNG(body));
      } else if (contentType.startsWith('image/gif')) {
        console.log(parseGIF(body));
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
    });
  });
  req.on('error', (err) => {
    console.error(err);
  });
  req.end();
}
