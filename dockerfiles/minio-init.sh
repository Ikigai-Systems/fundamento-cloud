#!/usr/bin/env bash

set -xe

# Set up MinIO alias first
mc alias set minio http://${MINIO_HOST}:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD

# Ensure service user exists (idempotent)
mc admin user add minio ${MINIO_ACCESS_KEY:-fundamento} ${MINIO_SECRET_KEY:-IPaWkaUi9Ko1NA} 2>/dev/null || true
mc admin policy attach minio readwrite --user ${MINIO_ACCESS_KEY:-fundamento} 2>/dev/null || true

# Create buckets if they don't exist
for bucket in fundamento-development fundamento-e2e; do
  if mc ls minio/$bucket > /dev/null 2>&1; then
    echo "Bucket $bucket already exists, skipping."
  else
    mc mb minio/$bucket
  fi
done
