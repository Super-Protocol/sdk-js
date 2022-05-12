# Super Protocol SDK JavaScript

## Installation

```
yarn add github:Super-Protocol/sp-sdk-js#v0.0.5
```

Replace `v0.0.1` to current version (can be found in package.json file)

IMPORTANT: you should have access to this repo from your local machine via github SSH

## Local Dev Setup

This repo doesn't have code to test new functionality during development, so you will need to install this module in test repo (where you plan to use this module) using yarn link (for hot reloading)

1. Login to private npm registry using your GitHub login and personal token (see [Authenticating to GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages))

   ```
   npm login --scope=@super-protocol --registry=https://npm.pkg.github.com
   ```

1. Install dependencies:

    ```
    yarn
    ```
1. Follow instructions to setup Decentralized Cloud Storage providers: [StorJ](https://github.com/storj-thirdparty/uplink-nodejs)
1. Create yarn link:

    ```
    yarn link
    ```
1. Connect yarn link to test repository:

   IMPORTANT: run this command in test repository (where you plan to use this module)
   ```
   yarn link sp-sdk-js
   ```

## Deploy

1. Update version in `package.json` file to your new version:
   ```
   "version": "v0.0.6"
   ```
1. Commit your changes:
   ```
   git add .
   git commit -m"deploy v0.0.6"
   ```
1. Create git tag:
   ```
   git tag v0.0.6
   ```
   Replace `v0.0.6` to your new version
1. Push your changes:
   ```
   git push origin v0.0.6
   ```
   Replace `v0.0.6` to your new version

## Update DTO

1. Fetch DTO submodule changes from github
   ```
   git submodule foreach git pull
   ```

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
