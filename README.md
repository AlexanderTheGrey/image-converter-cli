# CLI Image Converter

A pre-commit hook tool for easily converting images to WebP.

## Run development build

```
npm run converter:dev -- -i '<glob to search image files>' -c '<glob to search code files>' <options...>
```

## Build for production

```
npm run build-ts
```

## Run production build

```
npm run converter:prod -- -i '<glob to search image files>' -c '<glob to search code files>' <options...>
```

## Run development tests

```
npm run test-ts:dev
```

## Run production tests

```
npm run test-ts:prod
```

## Run lint

```
npm run lint-ts
```

## Example run

```
npm run converter:dev -- -i './public/**/*.(jpeg|jpg|png|gif|tiff|tif|bmp|webp)' -c './public/**/*.(vue|html)'
```

#### Note: Glob options must be single quoted to avoid interpretation by the shell
