#!/bin/bash

# Fix GitHub Pages Deployment Script
echo "Starting GitHub Pages deployment fix and redeployment..."

# Step 1: Make the fix-paths.js script executable
echo "Making fix-paths.js executable..."
chmod +x scripts/fix-paths.js

# Step 2: Run the deployment script
echo "Running deployment script..."
npm run deploy

echo ""
echo "Deployment completed!"
echo ""
echo "Note: GitHub Pages may take a few minutes to update."
echo "Your site should be available at: https://ghogue02.github.io/builderworkshop/"
echo ""
echo "If you still see 404 errors after a few minutes, try clearing your browser cache or opening in an incognito window."