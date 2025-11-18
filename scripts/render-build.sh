#!/usr/bin/env bash
set -e

# Build the client
cd client
npm ci
npm run build

# Copy the client build to server/public
rm -rf ../server/public || true
mkdir -p ../server/public
cp -r dist/* ../server/public/

# Install server deps
cd ../server
npm ci
