#!/bin/bash -e

## Deploy to Cloud Functions
GCLOUD_BIN="${GCLOUD_BIN:-gcloud}"
echo GCLOUD_BIN=$GCLOUD_BIN
echo Deploying function...
$GCLOUD_BIN beta functions deploy api --runtime nodejs8 --trigger-http
echo ...Done
export API_URL=`$GCLOUD_BIN beta functions describe api --format=text | grep 'httpsTrigger.url:' | grep -o 'https://.*'`
echo API_URL=$API_URL