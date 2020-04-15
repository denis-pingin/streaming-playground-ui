#!/bin/bash

aws s3 sync build s3://streaming-playground --region eu-central-1
aws cloudfront create-invalidation --distribution-id=E1RGB3RUNH16F7 --paths /