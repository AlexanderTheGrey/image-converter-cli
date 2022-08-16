# Image Converter CLI

A command-line based image converter used to convert JPEG, PNG, GIF, TIFF, and BMP images to the web-optimized WebP format. It's primarily designed for use in pre-commit hooks.

## Exmaple run

```
image-converter -i './{src,public}/**/*.(jpeg|jpg|jpe|jif|jfif|jfi|png|gif|tiff|tif|bmp|webp|heif|heifs|heic|heics|avci|avcs|avif|avifs)' -c './{src,public}/**/*.(js|vue|html)'
```
