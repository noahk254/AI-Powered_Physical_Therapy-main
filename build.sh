#!/bin/bash
set -e

echo "Building frontend..."
cd sites/ai-therapy
npm install
npm run build
cd ../..

echo "Installing Python dependencies..."
cd backend
pip install -r requirements.txt
cd ..
