# Scripts

This directory contains various scripts used for building, deploying, and configuring the application.

## deploy.js

This script builds and deploys the application to GitHub Pages. It:

1. Builds the project with `npm run build`
2. Generates the environment configuration
3. Deploys to GitHub Pages

Usage:
```bash
npm run deploy
```

## generate-env-config.js

This script generates the environment configuration file for the application. It replaces placeholders in the template with actual environment variables.

Usage:
```bash
node scripts/generate-env-config.js
```

## update-env-config.js

This script updates the environment configuration file with the OpenAI API key after deployment. This is necessary to enable transcription functionality without exposing the API key in the git repository.

Usage:
```bash
node scripts/update-env-config.js YOUR_OPENAI_API_KEY [path/to/env-config.js]
```

Parameters:
- `YOUR_OPENAI_API_KEY`: Your OpenAI API key
- `path/to/env-config.js` (optional): Path to the env-config.js file. Defaults to `build/env-config.js`

Example:
```bash
# Update the local build
node scripts/update-env-config.js sk-1234567890abcdef1234567890abcdef

# Update a deployed site (if you have access to the server)
node scripts/update-env-config.js sk-1234567890abcdef1234567890abcdef /path/to/deployed/site/env-config.js
```

## Post-Deployment Steps

After deploying the application with `npm run deploy`, you need to manually update the env-config.js file on the deployed site with the OpenAI API key. This can be done in one of two ways:

1. If you have direct access to the server where the site is deployed:
   ```bash
   node scripts/update-env-config.js YOUR_OPENAI_API_KEY /path/to/deployed/site/env-config.js
   ```

2. If you're using GitHub Pages or another hosting service where you don't have direct access to the server:
   - Download the env-config.js file from the deployed site
   - Update it locally with the update-env-config.js script
   - Upload the updated file back to the server

Alternatively, you can set up a CI/CD pipeline to automatically update the env-config.js file after deployment.