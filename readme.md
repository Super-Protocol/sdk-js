# Super Protocol SDK JavaScript

## Installation

```
yarn add @super-protocol/sdk-js
```

## Prepare protobuf
1. git submodule init
   git submodule update

2. Install protobuf (http://google.github.io/proto-lens/installing-protoc.html)

3. yarn dto::update

## Local Dev Setup
1. npm install uplink-nodejs

2. Just run ```yarn```

## Scripts

`yarn prettier` - run auto code style fixing

`yarn build` - create production build (in build folder)

`yarn dto:update` - generate TypeScript classes based on DTO submodule

## Dependencies
- NodeJS v16.8.0
- NPM v7.21.0
- yarn v1.22.11
