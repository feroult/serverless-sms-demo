#!/usr/bin/env bash
gcloud alpha functions deploy $1 --stage-bucket serverlezz --trigger-http
