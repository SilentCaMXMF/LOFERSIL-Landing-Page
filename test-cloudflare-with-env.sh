#!/bin/bash
set -a
source .env
set +a
echo "CLOUDFLARE_API_TOKEN is set: $(if [ -n "$CLOUDFLARE_API_TOKEN" ]; then echo 'YES'; else echo 'NO'; fi)"
node test-cloudflare-reborn-doll.js