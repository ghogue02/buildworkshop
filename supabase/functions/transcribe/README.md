# Transcription Edge Function

This Supabase Edge Function handles audio transcription using OpenAI's Whisper API. It provides a secure way to transcribe audio without exposing API keys to the client.

## Deployment

To deploy this function to your Supabase project:

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project (if not already linked):
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Set the OpenAI API key as a secret:
   ```bash
   supabase secrets set OPENAI_API_KEY=your_openai_api_key
   ```

5. Deploy the function:
   ```bash
   supabase functions deploy transcribe --no-verify-jwt
   ```

## Usage

The function accepts POST requests with form data containing an audio file. The audio file should be provided in the `file` field.

Example usage from the client:

```javascript
const formData = new FormData();
formData.append('file', audioBlob, 'audio.webm');

const response = await fetch(
  'https://your-project-ref.supabase.co/functions/v1/transcribe',
  {
    method: 'POST',
    body: formData,
    headers: {
      'apikey': 'your-supabase-anon-key'
    }
  }
);

const data = await response.json();
console.log(data.text); // The transcription text
```

## Response Format

The function returns a JSON response with the following structure:

```json
{
  "text": "The transcribed text from the audio file"
}
```

If an error occurs, the response will have this structure:

```json
{
  "error": "Error message describing what went wrong"
}
```

## Security Considerations

- The function does not verify JWT tokens by default (`--no-verify-jwt` flag), which allows unauthenticated access.
- If you want to restrict access to authenticated users, remove the `--no-verify-jwt` flag when deploying.
- The OpenAI API key is stored as a secret and is not exposed to clients.