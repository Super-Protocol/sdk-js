# Super Protocol SDK JavaScript

## Installation

```
yarn add @super-protocol/sdk-js
```

## Local Dev Setup

1. Follow instructions to setup Decentralized Cloud Storage providers: 
   * [StorJ](https://github.com/storj-thirdparty/uplink-nodejs)
2. Just run ```yarn```

## Update DTO

1. Fetch DTO submodule changes from github
   ```
   git submodule foreach git pull
   ```

1. Install protobuf library for your OS

1. Update TypeScript classes based on updated DTO
   ```
   yarn dto:update
   ```

## Scripts

`yarn prettier` - run auto code style fixing

`yarn build` - create production build (in build folder)

`yarn dto:update` - generate TypeScript classes based on DTO submodule

## Dependencies
- NodeJS v16.8.0
- NPM v7.21.0
- yarn v1.22.11
