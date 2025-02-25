# Video Transcription Deployment Guide

This guide explains how to deploy the server-side transcription solution for the workshop application.

## Overview

We've implemented a server-side solution for video transcription using Supabase Edge Functions. This approach:

1. Removes the need for users to provide their own OpenAI API keys
2. Improves security by keeping API keys on the server
3. Provides a consistent user experience

## Deployment Steps

### 1. Deploy the Supabase Edge Function

First, you need to deploy the transcription Edge Function to your Supabase project:

```bash
# Navigate to the Supabase functions directory
cd supabase/functions

# Deploy the function
supabase functions deploy transcribe --no-verify-jwt
```

### 2. Set the OpenAI API Key in Supabase

Set your OpenAI API key as a secret in your Supabase project:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

Replace `your_openai_api_key` with your actual OpenAI API key.

### 3. Deploy the Updated Application

Deploy the updated application code:

```bash
# Commit your changes
git add .
git commit -m "Implement server-side transcription with Supabase Edge Function"

# Push to your repository
git push

# Deploy the application
npm run deploy
```

## Verification

After deployment, verify that the transcription feature works correctly:

1. Navigate to the Video Reflection page in the application
2. Record a short video
3. Verify that the transcription is generated without prompting for an API key
4. Check the browser console for any errors

## Troubleshooting

If you encounter issues with the transcription feature:

### Function Not Found

If you see "Function not found" errors:
- Verify that the function was deployed correctly
- Check the function URL in the videoService.js file

### Transcription Fails

If transcription fails:
- Check that the OpenAI API key is set correctly in Supabase secrets
- Verify that the audio format is supported (should be webm)
- Check the Supabase Edge Function logs for errors

### CORS Issues

If you see CORS errors:
- Verify that the corsHeaders are set correctly in the Edge Function
- Check that the function is being called with the correct headers

## Maintenance

### Updating the OpenAI API Key

If you need to update the OpenAI API key:

```bash
supabase secrets set OPENAI_API_KEY=your_new_openai_api_key
```

### Monitoring Usage

Monitor your OpenAI API usage to ensure you stay within your plan limits. The Whisper API charges based on the duration of audio processed.

## Security Considerations

- The Edge Function is deployed with `--no-verify-jwt`, which means it can be called without authentication. This is acceptable for this use case since:
  - The function only performs transcription and doesn't expose sensitive data
  - The OpenAI API key is kept secure on the server
  - The function is rate-limited by Supabase

- If you want to restrict access to authenticated users only, remove the `--no-verify-jwt` flag when deploying the function and update the videoService.js file to include authentication headers.