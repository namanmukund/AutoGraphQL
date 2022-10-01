#!/usr/bin/env bash

APP="$0"
APPNAME=$1

if [ "$1" = "" ]; then
    echo "
    To deploy, run:
    ./deploy appname

    appname can be 
    1. tekie-backend-staging
    2. tekie-backend-preprod
    3. tekie-backend-scheduler 
    "
    exit
fi

echo "- Verifying Login"
porter auth login

TAG="$(git rev-parse --short HEAD)"
echo "- Setting Github Commit Tag : $TAG"

echo "- Updating porter"
porter update --app $APPNAME --tag $TAG 