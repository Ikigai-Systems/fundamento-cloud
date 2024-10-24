#!/usr/bin/env bash

set -xe

sleep 5

mc alias set minio http://${MINIO_HOST}:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
mc mb minio/fundamento-development
mc admin user add minio fundamento IPaWkaUi9Ko1NA
mc admin policy attach minio readwrite --user fundamento
