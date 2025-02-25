# Video Recording and Transcription Solution Plan

After analyzing the codebase, I've identified the issue with video recording and transcription. Currently, the application is prompting each user for an OpenAI API key when they access the VideoReflection component, which is not a good user experience and creates security concerns.

## Current Implementation Analysis

1. **User Experience Issue**: 
   - Users are prompted for an OpenAI API key they likely don't have
   - This creates confusion and prevents proper transcription functionality

2. **Technical Implementation**:
   - The VideoReflection component directly prompts users for the API key
   - The key is stored in the client-side config using `setOpenAIKey()`
   - The videoService uses this key to call the OpenAI API directly from the browser

3. **Environment Configuration**:
   - The .env.production file has REACT_APP_OPENAI_API_KEY commented out
   - The public/env-config.js template doesn't include the OpenAI API key
   - The generate-env-config.js script is looking for this key in environment variables

## Proposed Solutions

I recommend implementing one of the following solutions, in order of preference:

### 1. Server-Side Transcription API (Recommended)

Create a backend service that handles transcription requests, keeping the API key secure on the server.

**Implementation Steps**:
1. Create a Supabase Edge Function or serverless function that:
   - Accepts audio uploads
   - Uses a server-side OpenAI API key to perform transcription
   - Returns the transcription text

2. Update the videoService.js to:
   - Remove direct OpenAI API calls
   - Send audio to the new backend endpoint
   - Process the transcription response

3. Remove the API key prompt from VideoReflection.js

**Benefits**:
- Keeps API key secure (not exposed to clients)
- Provides consistent experience for all users
- Centralizes transcription logic for easier maintenance

### 2. Admin Configuration Solution

Allow administrators to set an OpenAI API key that all users will use for transcription.

**Implementation Steps**:
1. Create an admin settings page with a form to input the OpenAI API key
2. Store this key securely in Supabase (with proper RLS policies)
3. Update videoService.js to fetch this key from Supabase before transcription
4. Remove the API key prompt from VideoReflection.js

**Benefits**:
- Improves user experience (no prompts)
- Provides admin control over transcription functionality
- More secure than individual user keys

### 3. Environment Variable Solution

Set the OpenAI API key as an environment variable during deployment.

**Implementation Steps**:
1. Update public/env-config.js to include REACT_APP_OPENAI_API_KEY
2. Set the actual key in .env.production or deployment environment
3. Remove the API key prompt from VideoReflection.js

**Benefits**:
- Simplest implementation
- Works with existing code structure
- No additional backend required

## Detailed Implementation Plan for Server-Side Solution

### 1. Create Supabase Edge Function

Create a new Supabase Edge Function for transcription:

```javascript
// supabase/functions/transcribe/index.js
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const formData = await req.formData()
    const audioFile = formData.get('file')
    
    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create a FormData object for the OpenAI API request
    const openaiFormData = new FormData()
    openaiFormData.append('file', audioFile)
    openaiFormData.append('model', 'whisper-1')
    openaiFormData.append('language', 'en')

    // Get the OpenAI API key from environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured on server' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: openaiFormData
    })

    const result = await response.json()

    // Return the transcription result
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

### 2. Deploy the Edge Function

```bash
# Navigate to the Supabase functions directory
cd supabase/functions

# Deploy the function
supabase functions deploy transcribe --no-verify-jwt
```

### 3. Set the OpenAI API Key in Supabase

```bash
# Set the OpenAI API key as a secret
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

### 4. Update videoService.js

```javascript
// src/services/videoService.js - Update the transcribeAudio method

async transcribeAudio(audioBlob) {
  this.debugLog('Transcribing audio', { size: audioBlob.size });
  
  if (!audioBlob) {
    throw new Error('Audio blob is required');
  }

  try {
    // Create a form data object with the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    
    // Call the Supabase Edge Function
    const response = await fetch(
      'https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/functions/v1/transcribe',
      {
        method: 'POST',
        body: formData,
        headers: {
          // Include Supabase anon key if needed
          'apikey': config.supabase.anonKey
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Transcription API error: ${errorData.error || response.statusText}`);
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

### 5. Update VideoReflection.js

Remove the API key prompt from VideoReflection.js:

```javascript
// src/VideoReflection.js - Remove the useEffect that prompts for API key

// Remove this useEffect block
useEffect(() => {
  // For security reasons, we'll use a prompt to get the API key
  // In a production environment, this would be handled server-side
  const apiKey = prompt("Please enter your OpenAI API key for transcription (or cancel to skip transcription):");
  if (apiKey) {
    setOpenAIKey(apiKey);
    debugLog('OpenAI API key set');
  } else {
    debugLog('No OpenAI API key provided, transcription will be limited');
  }
}, []);
```

## Alternative Implementation: Admin Configuration

If the server-side solution is too complex for immediate implementation, here's a detailed plan for the admin configuration approach:

### 1. Create an API Settings Table in Supabase

```sql
-- supabase/migrations/20240228_api_settings.sql
CREATE TABLE api_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default row for OpenAI API key (empty value)
INSERT INTO api_settings (key, value) 
VALUES ('openai_api_key', '');

-- Create RLS policies
ALTER TABLE api_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read API settings
CREATE POLICY "Admins can read API settings" 
ON api_settings FOR SELECT 
TO authenticated
USING (auth.jwt() ->> 'app_metadata' ? 'admin');

-- Only admins can update API settings
CREATE POLICY "Admins can update API settings" 
ON api_settings FOR UPDATE 
TO authenticated
USING (auth.jwt() ->> 'app_metadata' ? 'admin')
WITH CHECK (auth.jwt() ->> 'app_metadata' ? 'admin');
```

### 2. Create an Admin Settings Component

```jsx
// src/components/admin/ApiSettings.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

function ApiSettings() {
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadApiSettings();
  }, []);

  const loadApiSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('api_settings')
        .select('*')
        .eq('key', 'openai_api_key')
        .single();

      if (error) throw error;
      
      if (data) {
        setOpenaiApiKey(data.value);
      }
    } catch (error) {
      console.error('Error loading API settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiSettings = async () => {
    try {
      setIsSaving(true);
      setMessage('');

      const { data, error } = await supabase
        .from('api_settings')
        .update({ value: openaiApiKey, updated_at: new Date() })
        .eq('key', 'openai_api_key');

      if (error) throw error;
      
      setMessage('API key saved successfully');
    } catch (error) {
      console.error('Error saving API settings:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading API settings...</div>;
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3>API Settings</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="openai-api-key" style={{ display: 'block', marginBottom: '5px' }}>
          OpenAI API Key
        </label>
        <input
          id="openai-api-key"
          type="password"
          value={openaiApiKey}
          onChange={(e) => setOpenaiApiKey(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #333'
          }}
        />
        <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
          This key will be used for video transcription and AI analysis features.
        </p>
      </div>
      
      <button
        onClick={saveApiSettings}
        disabled={isSaving}
        style={{
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          opacity: isSaving ? 0.7 : 1
        }}
      >
        {isSaving ? 'Saving...' : 'Save API Key'}
      </button>
      
      {message && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          backgroundColor: message.includes('Error') ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
          borderRadius: '4px',
          color: message.includes('Error') ? '#d32f2f' : '#388e3c'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default ApiSettings;
```

### 3. Add the ApiSettings Component to the Admin Dashboard

```jsx
// Update src/components/admin/AdminDashboard.js to include the ApiSettings component
import ApiSettings from './ApiSettings';

// Add this to the AdminDashboard component's render method
<ApiSettings />
```

### 4. Update videoService.js to Fetch the API Key from Supabase

```javascript
// src/services/videoService.js - Update the transcribeAudio method

async transcribeAudio(audioBlob) {
  this.debugLog('Transcribing audio', { size: audioBlob.size });
  
  if (!audioBlob) {
    throw new Error('Audio blob is required');
  }

  try {
    // Fetch the OpenAI API key from Supabase
    const { data, error } = await supabase
      .from('api_settings')
      .select('value')
      .eq('key', 'openai_api_key')
      .single();
      
    if (error) throw error;
    
    const apiKey = data?.value;
    if (!apiKey) {
      this.debugLog('OpenAI API key is not available, skipping transcription');
      return "Transcription not available (API key not configured)";
    }
    
    // Initialize OpenAI with the fetched API key
    openaiService.initializeOpenAI(apiKey);
    
    // Create a form data object with the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    
    // Make a direct fetch request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
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

### 5. Remove the API Key Prompt from VideoReflection.js

Same as in the server-side solution, remove the useEffect that prompts for the API key.

## Conclusion

The server-side solution provides the best security and user experience, but requires more setup. The admin configuration solution is a good middle ground that improves security while being relatively easy to implement. The environment variable solution is the simplest but less secure for client-side applications.

I recommend starting with the admin configuration solution as a quick win, then moving to the server-side solution for a more robust long-term approach.