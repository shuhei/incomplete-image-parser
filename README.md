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

```sh
# Given you have Node.js
npm install -g @shuhei/incomplete-image-parser
```

Via HTTP(S) with `User-Agent` header of Chrome 68 (for now) - Image format is chosen by the `Content-Type` header:

```sh
iip https://foo.com/bar.jpg
```

Via file system - Image format is chosen by the file extension:

```sh
iip ./foo.webp
```
