# Super Protocol SDK JavaScript

## Installation

```
npm install @super-protocol/sdk-js
```

## Prepare protobuf
1. git submodule init
   git submodule update

2. Install protobuf (http://google.github.io/proto-lens/installing-protoc.html)

3. npm run dto::update

## Local Dev Setup
1. npm install

2. Just run ```npm run build```

## Scripts

`npm run prettier` - run auto code style fixing

`npm run build` - create production build (in build folder)

`npm run dto:update` - generate TypeScript classes based on DTO submodule

## Dependencies
- NodeJS v16.8.0
- NPM v7.21.0

## Apple M1 instructions
Some dependencies is not supported arm64 architecture. You can face with error like `dyld[12398]: missing symbol called`. To install everything correctly, do next:

1. [Install Rosetta2](https://support.apple.com/en-us/HT211861)
2. Run your shell for x86_64 architecture `arch -x86_64 /bin/bash` (or any shell in your `/bin` folder).
3. Install NodeJS in this shell `nvm install 16` (if you have Node with same version already installed but for arm64, you have to uninstall it `npm uninstall 16`)
4. `nvm use 16 && yarn install`

