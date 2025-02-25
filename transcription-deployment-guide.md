# Video Transcription Deployment Guide

This guide explains how to deploy the video transcription solution for the workshop application.

## Overview

We've implemented a client-side solution for video transcription using the OpenAI API. This approach:

1. Uses a placeholder for the API key in the repository to avoid exposing it
2. Requires a post-deployment step to set the actual API key
3. Provides a consistent user experience

## Deployment Steps

### 1. Deploy the Application

Deploy the application code:

```bash
# Commit your changes
git add .
git commit -m "Implement video transcription with OpenAI API"

# Push to your repository
git push

# Deploy the application
npm run deploy
```

### 2. Update the Environment Configuration

After deployment, you need to update the environment configuration with your OpenAI API key:

```bash
node scripts/update-env-config.js YOUR_OPENAI_API_KEY
```

Replace `YOUR_OPENAI_API_KEY` with your actual OpenAI API key.

If you're using GitHub Pages or another hosting service where you don't have direct access to the server:
1. Download the env-config.js file from the deployed site
2. Update it locally with the update-env-config.js script
3. Upload the updated file back to the server

## Verification

After deployment and updating the environment configuration, verify that the transcription feature works correctly:

1. Navigate to the Video Reflection page in the application
2. Record a short video
3. Verify that the transcription is generated without prompting for an API key
4. Check the browser console for any errors

## Troubleshooting

If you encounter issues with the transcription feature:

### API Key Not Found

If you see "API key missing" errors:
- Verify that you've updated the env-config.js file with your OpenAI API key
- Check that the env-config.js file is being loaded correctly

### Transcription Fails

If transcription fails:
- Check that your OpenAI API key is valid and has access to the Whisper API
- Verify that the audio format is supported (should be webm)
- Check the browser console for errors

## Maintenance

### Updating the OpenAI API Key

If you need to update the OpenAI API key, run the update-env-config.js script again with the new key:

```bash
node scripts/update-env-config.js YOUR_NEW_OPENAI_API_KEY
```

### Monitoring Usage

Monitor your OpenAI API usage to ensure you stay within your plan limits. The Whisper API charges based on the duration of audio processed.

## Security Considerations

- The OpenAI API key is not stored in the git repository, which improves security
- The API key is stored in the deployed env-config.js file, which is accessible to users
- Consider implementing additional security measures if needed, such as:
  - Rate limiting
  - User authentication
  - Server-side proxying of API requests