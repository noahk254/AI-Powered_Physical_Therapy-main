#!/bin/bash

# One-Click Appwrite Deployment for TherapyAI
# This script handles the entire deployment process

set -e

PROJECT_ID="69cbd0c14ee4ee5de252"
ENDPOINT="https://fra.cloud.appwrite.io/v1"
ORGANIZATION="69cbb712000a5ee981db"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         TherapyAI - Appwrite Deployment Initialization         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check dependencies
echo "✓ Checking dependencies..."
if ! command -v appwrite &> /dev/null; then
    echo "  Installing Appwrite CLI..."
    npm install -g appwrite-cli
fi

# Step 2: Ensure logged in
echo "✓ Verifying Appwrite authentication..."
if ! appwrite client --endpoint "$ENDPOINT" &> /dev/null; then
    echo ""
    echo "⚠️  ACTION REQUIRED: Please authenticate with Appwrite"
    echo " "
    echo "Run this command and follow the prompts:"
    echo "  appwrite login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Step 3: Build frontend
echo "✓ Building frontend..."
cd "$(dirname "$0")"
npm run build
if [ ! -d "dist" ]; then
    echo "❌ Build failed: dist folder not created"
    exit 1
fi

# Step 4: Ensure 200.html exists for SPA routing
echo "✓ Setting up SPA routing..."
if [ ! -f "dist/200.html" ]; then
    cp dist/index.html dist/200.html
fi

# Step 5: Initialize project directory
echo "✓ Initializing Appwrite project configuration..."
mkdir -p .appwrite

# Create config files
cat > .appwrite/config.json << EOF
{
  "projectId": "$PROJECT_ID",
  "endpoint": "$ENDPOINT"
}
EOF

# Step 6: Deploy
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Starting Deployment...                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Use appwrite push
echo "Deploying to Appwrite..."
appwrite push

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ Deployment Successful!                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Your Appwrite Project:"
echo "   Project ID: $PROJECT_ID"
echo "   Endpoint: $ENDPOINT"
echo ""
echo "🌐 Frontend:"
echo "   View your site at: https://cloud.appwrite.io > Settings > Domains"
echo ""
echo "⚙️  Backend API:"
echo "   Endpoint: $ENDPOINT/functions/therapy-api"
echo "   Update your app config to use this endpoint"
echo ""
echo "📚 Next Steps:"
echo "   1. Set up environment variables in Appwrite console"
echo "   2. Configure CORS for your frontend domain"
echo "   3. Test the API endpoints"
echo ""
echo "🔗 Dashboard: https://cloud.appwrite.io"
echo ""
