# Deploy script for execution controllers

Download, install, configure and run using PM2 sp-execution-controller

## Usage

### Preparaion

Install Node.JS if needed:

```shell
sh deploy.sh install_node
```

### Install app

Script will clone latest sp-execution-controller into `~/.superprotocol/execution-controller` and install dependencies

Note: this will install globaly several npm packages: `typescript`, `yarn`, `pm2`

```shell
sh deploy.sh install
```

### Configure

Edit env using default editor

```shell
sh deploy.sh configure
```

### Run

Start app using pm2

```shell
sh deploy.sh run
```

### Update

Pull and restart

```shell
sh deploy.sh update
```

### Stop

```shell
sh deploy.sh stop
```

### Remove

```shell
sh deploy.sh remove
```
