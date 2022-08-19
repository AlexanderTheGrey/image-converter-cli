# Image Converter CLI

A TypeScript command-line based image converter used to convert JPEG, PNG, GIF, TIFF, BMP, and SVG images to the web-optimized WebP format. It's primarily designed for use in pre-commit hooks.

## CLI Options

### `-v, --version`

Output the version number.

### `-i, --image-glob <value>`

Glob to search image files.

### `-c, --code-glob <value>`

Glob to search code files.

### `--process-svg-files`

Process SVG files.

### `--override-staged-files`

Don't exclude unstaged files.

### `--override-excluded-files`

Don't exclude files from exclusions list.

### `--create-fallback-image`

Create a PNG/GIF file if a JPEG, PNG, GIF, TIFF, or BMP file doesn't exist.

### `-h, --help`

Display help for command.

## Example run

```
image-converter -i './{src,public}/**/*.(jpeg|jpg|jpe|jif|jfif|jfi|png|gif|tiff|tif|bmp|webp|heif|heifs|heic|heics|avci|avcs|avif|avifs)' -c './{src,public}/**/*.(js|vue|html)'
```

#### Note: Glob options must be single quoted to avoid interpretation by the shell
