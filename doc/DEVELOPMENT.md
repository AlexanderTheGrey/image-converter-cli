## Build for production

```
npm run build
```

## Run production build

```
npm run converter:prod -- -i '<glob to search image files>' -c '<glob to search code files>' <options...>
```

## Run development build

```
npm run converter:dev -- -i '<glob to search image files>' -c '<glob to search code files>' <options...>
```

## Run production tests

```
npm run test:prod
```

## Run development tests

```
npm run test:dev
```

## Run lint

```
npm run lint
```

## Mirror push to GitLab

```
npm run mirror-push
```

(GitLab token required)

## Mirror pull from GitLab

```
npm run mirror-pull
```

(GitLab token required)

## Publish new version to npm

```
npm publish
```

(npm publish access token required)

## Example run

```
npm run converter:dev -- -i './public/**/*.(jpeg|jpg|png|gif|tiff|tif|bmp|webp)' -c './public/**/*.(vue|html)'
```
