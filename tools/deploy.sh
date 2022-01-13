#!/bin/bash

APP_PATH=~/.superprotocol/execution-controller
ECOSYSTEM_FILE=ecosystem.config.js

goto_app() {
    if [ ! -d $APP_PATH ]
        then echo "$APP_PATH not found"
        exit 1
    fi
    cd $APP_PATH || exit 1
}

install_node() {
    if ! [ -x "$(command -v curl)" ]; then
        sudo apt install curl
    fi
    echo "Installing NodeJS 16.x"
    sudo curl -o- https://deb.nodesource.com/setup_16.x | sudo bash && \
        sudo apt install nodejs git build-essential -y && \
        sudo npm install -g yarn pm2
}

configure() {
    goto_app
    if [ ! -f ".env" ]
        then cp .env{.example,}
    fi
    editor .env
}

install() {
    if ! [ -x "$(command -v node)" ]; then
        install_node
    fi

    npm login --scope=@super-protocol --registry=https://npm.pkg.github.com

    TASK_SYSTEM=""
    PS3="Select provider type: "
    select type in Data Solution Storage; do
        case $type in
            Data)
                TASK_SYSTEM="DATA_PROVIDER_TASK_SYSTEM"
                ;;
            Solution)
                TASK_SYSTEM="SOLUTION_PROVIDER_TASK_SYSTEM"
                ;;
            Storage)
                TASK_SYSTEM="STORAGE_PROVIDER_TASK_SYSTEM"
                ;;
            *)
                exit 2
                ;;
        esac
        break;
    done

    git clone git@github.com:Super-Protocol/sp-execution-controller.git $APP_PATH
    goto_app
    cp .env{.example,}
    sed -i "s/DEFAULT_TASK_SYSTEM/$TASK_SYSTEM/" .env
    # TODO: uncomment then tags will be available
    # TAG=$(git tag -n1)
    # git checkout "$TAG"
    yarn install && \
        yarn build && \
        echo "Please edit config at \"$APP_PATH/.env\" and then run app using \"$0 run\""
}

update() {
    goto_app
    git pull
    yarn install && \
        yarn build
}

run() {
    goto_app
    npx pm2 start $ECOSYSTEM_FILE
}

status() {
    goto_app
    npx pm2 list
}

stop() {
    goto_app
    npx pm2 stop $ECOSYSTEM_FILE --watch
}

remove() {
    goto_app
    npx pm2 delete $ECOSYSTEM_FILE --watch
    cd -- || cd ~ || exit
    rm -rf $APP_PATH
}

pm2() {
    goto_app
    npx pm2 $1
}

case $1 in
    "install_node")
        install_node
        ;;
    "install")
        install
        ;;
    "configure")
        configure
        ;;
    "update")
        update
        ;;
    "run")
        run
        ;;
    "stop")
        stop
        ;;
    "remove")
        remove
        ;;
    "pm2")
        pm2 "$2"
        ;;
esac
