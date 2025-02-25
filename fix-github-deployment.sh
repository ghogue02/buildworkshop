#!/bin/bash

# Fix GitHub Pages deployment issue script
echo "Starting GitHub Pages deployment fix..."

# Step 1: Remove the workflow file from Git tracking (without deleting it)
echo "Removing .github/workflows/deploy.yml from Git tracking..."
git rm --cached .github/workflows/deploy.yml

# Step 2: Commit the changes to .gitignore
echo "Committing changes to .gitignore..."
git add .gitignore
git commit -m "Remove GitHub workflow from Git tracking"

# Step 3: Push the changes to GitHub
echo "Pushing changes to GitHub..."
git push origin main

# Step 4: Now that the workflow file is no longer tracked, commit your original changes
echo "Now you can commit your original changes..."
git add .
git commit -m "Remove video component and OpenAI API key references"
git push origin main

echo ""
echo "Fix completed! The workflow file is now ignored by Git."
echo ""
echo "For future deployments, use: npm run deploy"
echo "This will use the local deployment script instead of GitHub Actions."