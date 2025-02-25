# Serverless Function Solution for Video Transcription

## Overview

This solution uses a serverless function as a proxy between the client application and the OpenAI API. The serverless function securely stores the API key as an environment variable and handles all communication with OpenAI, eliminating the need to expose the API key in the client-side code.

## Benefits

- Maintains high-quality transcription using OpenAI's Whisper API
- API key is securely stored as an environment variable in the serverless platform
- No API keys in client-side code or git repository
- Scalable and cost-effective (most platforms have generous free tiers)
- Works with the existing application architecture

## Implementation Options

### Option 1: Netlify Functions

Netlify provides a simple way to deploy serverless functions alongside your static site.

#### Setup Steps:

1. Create a Netlify account and connect it to your GitHub repository
2. Create a `netlify.toml` file in the root of your project:

```toml
[build]
  command = "npm run build"
  publish = "build"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

3. Create a function to handle transcription:

```javascript
// netlify/functions/transcribe.js
const axios = require('axios');
const FormData = require('form-data');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the multipart form data
    const formData = new FormData();
    const audioBuffer = Buffer.from(event.body, 'base64');
    formData.append('file', audioBuffer, { filename: 'audio.webm' });
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    // Make request to OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    // Return the transcription
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to transcribe audio',
        details: error.message
      })
    };
  }
};
```

4. Set the OpenAI API key as an environment variable in Netlify:
   - Go to Site settings > Build & deploy > Environment
   - Add a new variable: `OPENAI_API_KEY` with your API key

### Option 2: Vercel Serverless Functions

Vercel is another excellent platform for serverless functions.

#### Setup Steps:

1. Create a Vercel account and connect it to your GitHub repository
2. Create an `api` directory in the root of your project
3. Create a function to handle transcription:

```javascript
// api/transcribe.js
import formidable from 'formidable-serverless';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to parse form' });
      }

      const audioFile = files.file;
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioFile.path), { filename: 'audio.webm' });
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      try {
        const response = await axios.post(
          'https://api.openai.com/v1/audio/transcriptions',
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
          }
        );

        return res.status(200).json(response.data);
      } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
          error: 'Failed to transcribe audio',
          details: error.message
        });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
}
```

4. Set the OpenAI API key as an environment variable in Vercel:
   - Go to Project settings > Environment Variables
   - Add a new variable: `OPENAI_API_KEY` with your API key

## Client-Side Integration

Update the videoService.js file to use the serverless function instead of calling OpenAI directly:

```javascript
// Update videoService.js
async transcribeAudio(audioBlob) {
  this.debugLog('Transcribing audio', { size: audioBlob.size });
  
  if (!audioBlob) {
    throw new Error('Audio blob is required');
  }

  try {
    // Create a form data object with the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    
    // Call the serverless function
    const functionUrl = '/api/transcribe'; // For Vercel
    // const functionUrl = '/.netlify/functions/transcribe'; // For Netlify
    
    this.debugLog('Calling transcription function', { url: functionUrl });
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
      }
      throw new Error(`Transcription API error: ${errorMessage}`);
    }
    
    const data = await response.json();
    this.debugLog('Transcription successful', data);
    
    return data.text;
  } catch (error) {
    this.debugLog('Error in transcribeAudio', error);
    console.error('Error transcribing audio:', error);
    return `Transcription failed: ${error.message}`;
  }
}
```

## Deployment Steps

1. Choose a serverless platform (Netlify or Vercel)
2. Set up the project with the platform
3. Create the serverless function
4. Set the OpenAI API key as an environment variable
5. Update the client-side code to use the serverless function
6. Deploy the application

## Cost Considerations

- Netlify and Vercel both offer generous free tiers (125K function invocations per month on Netlify, 100GB-hours per month on Vercel)
- OpenAI's Whisper API costs $0.006 per minute of audio
- For a typical usage pattern, this solution should stay within free tiers or have minimal costs

## Security Considerations

- API key is stored securely as an environment variable
- No sensitive information is exposed in client-side code
- CORS headers can be configured to restrict access to specific domains
- Rate limiting can be implemented to prevent abuse

## Future Enhancements

- Add caching to reduce API calls for repeated transcriptions
- Implement user authentication to restrict access to the transcription function
- Add support for multiple languages
- Implement a fallback to Web Speech API if the serverless function is unavailable