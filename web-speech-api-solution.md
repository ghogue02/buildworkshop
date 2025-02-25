# Web Speech API Solution for Video Transcription

## Overview

Instead of relying on the OpenAI API for transcription, we can implement a client-side solution using the Web Speech API, which is built into modern browsers. This approach eliminates the need for API keys and external services, making deployment much simpler.

## Benefits

- No API keys required
- Works entirely client-side
- No external service dependencies
- Privacy-friendly (audio data stays in the browser)
- Free to use with no usage limits

## Implementation Plan

### 1. Update the VideoRecorder Component

We'll modify the VideoRecorder component to use the SpeechRecognition interface while recording:

```javascript
// Add speech recognition to VideoRecorder.js
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// Configure recognition
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

// Store transcription results
const [transcription, setTranscription] = useState('');

// Start recognition when recording starts
const startRecording = () => {
  // Existing recording code...
  
  // Start speech recognition
  recognition.start();
  
  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }
    
    setTranscription(finalTranscript);
  };
};

// Stop recognition when recording stops
const stopRecording = () => {
  // Existing stop recording code...
  
  recognition.stop();
  
  // Pass the transcription to the parent component
  onTranscriptionComplete(transcription);
};
```

### 2. Update the VideoService

We'll modify the videoService.js file to use the Web Speech API transcription instead of OpenAI:

```javascript
// Update videoService.js
class VideoService {
  // Existing methods...
  
  async transcribeAudio(audioBlob) {
    // If transcription is already provided by the Web Speech API
    if (this.transcription) {
      return this.transcription;
    }
    
    // Fallback message if no transcription is available
    return "Transcription not available. Please try recording again or enter transcription manually.";
  }
  
  setTranscription(text) {
    this.transcription = text;
  }
}
```

### 3. Add Manual Transcription Option

We'll add a textarea to allow users to manually edit or enter transcriptions:

```javascript
// Add to VideoReflection.js
const [manualTranscription, setManualTranscription] = useState('');
const [isEditing, setIsEditing] = useState(false);

// In the render function
{transcript && (
  <div className="transcription-container">
    <h3>Transcription</h3>
    {isEditing ? (
      <>
        <textarea
          value={manualTranscription}
          onChange={(e) => setManualTranscription(e.target.value)}
          rows={10}
          className="transcription-editor"
        />
        <button onClick={() => {
          setTranscript(manualTranscription);
          setIsEditing(false);
        }}>Save</button>
        <button onClick={() => {
          setManualTranscription(transcript);
          setIsEditing(false);
        }}>Cancel</button>
      </>
    ) : (
      <>
        <p className="transcription-text">{transcript}</p>
        <button onClick={() => {
          setManualTranscription(transcript);
          setIsEditing(true);
        }}>Edit Transcription</button>
      </>
    )}
  </div>
)}
```

### 4. Handle Browser Compatibility

Not all browsers support the Web Speech API, so we'll add a fallback:

```javascript
// Add to VideoRecorder.js
const isSpeechRecognitionSupported = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

// In the component
useEffect(() => {
  if (!isSpeechRecognitionSupported()) {
    console.warn('Speech recognition is not supported in this browser');
    // Show a message to the user
  }
}, []);
```

## Deployment Steps

1. Implement the changes to VideoRecorder.js and VideoService.js
2. Add the manual transcription UI to VideoReflection.js
3. Test the solution locally
4. Deploy to GitHub Pages using the existing deployment process

## Limitations

- Speech recognition accuracy varies by browser and user's microphone quality
- Only works in browsers that support the Web Speech API (Chrome, Edge, Safari)
- May not work well in noisy environments
- Limited language support compared to OpenAI's Whisper

## Future Enhancements

- Add support for multiple languages
- Improve the UI for editing transcriptions
- Implement a hybrid approach that uses Web Speech API for real-time feedback and a server-side solution for final processing