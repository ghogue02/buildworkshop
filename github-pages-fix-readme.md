# Fixing GitHub Pages Deployment Issues

This guide provides solutions to the GitHub Pages deployment issue you're experiencing:

```
! [remote rejected] main -> main (refusing to allow a Personal Access Token to create or update workflow `.github/workflows/deploy.yml` without `workflow` scope)
```

## Option 1: Use the Fix Script (Recommended)

We've created a script that automates the process of removing the workflow file from Git tracking:

1. Run the script:
   ```bash
   ./fix-github-deployment.sh
   ```

2. For future deployments, use:
   ```bash
   npm run deploy
   ```

This script:
- Removes the workflow file from Git tracking (without deleting it)
- Updates .gitignore to exclude the workflow directory
- Commits and pushes these changes
- Commits and pushes your original changes

## Option 2: Manual Steps

If you prefer to run the commands manually:

1. Remove the workflow file from Git tracking:
   ```bash
   git rm --cached .github/workflows/deploy.yml
   ```

2. Commit the .gitignore changes:
   ```bash
   git add .gitignore
   git commit -m "Remove GitHub workflow from Git tracking"
   git push origin main
   ```

3. Commit your original changes:
   ```bash
   git add .
   git commit -m "Remove video component and OpenAI API key references"
   git push origin main
   ```

4. For future deployments, use:
   ```bash
   npm run deploy
   ```

## Option 3: Update Your Personal Access Token

If you want to keep using GitHub Actions for automatic deployments:

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate a new token with the `workflow` scope included
3. Update your local Git credentials to use this new token

## Option 4: Delete the Workflow File

If you want to simplify your deployment process:

1. Delete the workflow file:
   ```bash
   rm -rf .github/workflows/
   ```

2. Commit and push these changes:
   ```bash
   git add .
   git commit -m "Remove GitHub Actions workflow"
   git push origin main
   ```

3. For future deployments, use:
   ```bash
   npm run deploy
   ```

## Understanding Your Deployment Options

### GitHub Actions Workflow (Automatic)
- Automatically deploys when you push to main
- Requires a Personal Access Token with the `workflow` scope
- Configured in `.github/workflows/deploy.yml`

### Local Deployment Script (Manual)
- Manually run `npm run deploy` when you want to deploy
- Uses the gh-pages npm package
- Configured in `scripts/deploy.js`
- Does not require special GitHub permissions

## Troubleshooting

If you encounter issues with the local deployment:

1. Make sure you have the gh-pages package installed:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Check your .env.production file has the required environment variables:
   - REACT_APP_SUPABASE_URL
   - REACT_APP_SUPABASE_ANON_KEY

3. Run the deployment with verbose logging:
   ```bash
   NODE_DEBUG=gh-pages npm run deploy