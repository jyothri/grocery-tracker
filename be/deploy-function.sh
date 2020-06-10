#!/bin/bash -e

## Deploy to Cloud Functions
GCLOUD_BIN="${GCLOUD_BIN:-gcloud}"
echo GCLOUD_BIN=$GCLOUD_BIN
echo Deploying function...
$GCLOUD_BIN beta functions deploy api --runtime nodejs10 --trigger-http
echo ...Done
export API_URL=`$GCLOUD_BIN beta functions describe api --format=text | grep 'httpsTrigger.url:' | grep -o 'https://.*'`
export API_URL=$API_URL/v1
echo API_URL=$API_URL

## Smoke test API endpoint
curl --silent $API_URL/ping
echo

## Run Postman tests against API deployed to cloud
echo "Using newman runner located at: ["`which newman`"]"
newman run ./api-tests.postman.json --global-var "apiUrl=$API_URL" --delay-request 1000 --bail || true