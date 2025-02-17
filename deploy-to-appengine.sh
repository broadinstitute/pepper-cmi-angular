#!/usr/bin/env bash
set -e

ENV=$1
PROJECT=$2
STUDY_GUID=$3
VAULT_PATH=$4
if [ "$ENV" == "" ]  ||  [ "$PROJECT" == "" ]  ||  [ "$STUDY_GUID" == "" ] ||  [ "$VAULT_PATH" == "" ] ;
then
    echo "usage: deploy-to-appengine.sh environment project study_guid vault_path"
    exit 0
fi
./build-study.sh v1 "$ENV" "$PROJECT" "$STUDY_GUID" "$VAULT_PATH" --config

ANGULAR_PROJECT_DIR_NAME="ddp-${PROJECT}"
ANGULAR_PROJECT_DIR_PATH="projects/${ANGULAR_PROJECT_DIR_NAME}"
GCLOUD_PROJECT_ID="broad-ddp-${ENV}"

pushd ddp-workspace
ng build "$ANGULAR_PROJECT_DIR_NAME" --prod --aot --outputPath="${ANGULAR_PROJECT_DIR_PATH}/dist"

gcloud app deploy "${ANGULAR_PROJECT_DIR_PATH}/app.yaml" --project="${GCLOUD_PROJECT_ID}"
