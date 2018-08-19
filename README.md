# Incomplete Image Metadata Parsers

Incomplete image metadata parsers that I wrote to learn how metadata is stored in image files

## Formats

- [x] JPEG
- [x] PNG
- [x] GIF
- [x] WebP
- [ ] JPEG 2000

Note that implementations are incomplete even if they have checkmarks here!

## Usage

Via HTTP(S) - Image format is chosen by the `Content-Type` header:

```sh
node index.js https://foo.com/bar.jpg
```

Via file system - Image format is chosen by the file extension:

```sh
node index.js ./foo.webp
```
