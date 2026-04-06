#!/bin/bash

# TherapyAI Appwrite Deployment Script
# This script deploys the project to Appwrite Cloud

set -e

echo "🚀 Starting TherapyAI Deployment to Appwrite..."
echo ""

# Check if appwrite CLI is installed
if ! command -v appwrite &> /dev/null; then
    echo "❌ Appwrite CLI is not installed"
    echo "Install it with: npm install -g appwrite-cli"
    exit 1
fi

# Check if user is logged in
echo "📝 Checking Appwrite authentication..."
appwrite client --endpoint https://fra.cloud.appwrite.io/v1 || {
    echo ""
    echo "⚠️  Authentication required. Please log in:"
    echo "Run: appwrite login"
    echo "Then run this script again."
    exit 1
}

# Build frontend
echo ""
echo "🔨 Building frontend..."
npm run build

# Create deployment directory
mkdir -p .appwrite

# Deploy to Appwrite
echo ""
echo "📦 Deploying to Appwrite..."
echo ""
echo "Note: You may be prompted to select organization and resources."
echo "Default selections should work fine."
echo ""

appwrite push

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Your app is now deployed on Appwrite!"
echo "Frontend: Check your Appwrite Console > Settings > Domains for the site URL"
echo "Backend API: https://fra.cloud.appwrite.io/v1/functions/therapy-api"
echo ""
echo "Dashboard: https://cloud.appwrite.io"
