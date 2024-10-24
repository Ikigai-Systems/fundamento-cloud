#!/usr/bin/env bash

set -xe

if mc ls minio/fundamento-development > /dev/null 2>&1; then
  echo "Bucket already exists, skipping initialization."
else
  mc alias set minio http://${MINIO_HOST}:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
  mc mb minio/fundamento-development
  mc admin user add minio fundamento IPaWkaUi9Ko1NA
  mc admin policy attach minio readwrite --user fundamento
fi

