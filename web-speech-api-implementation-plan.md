# Web Speech API Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for integrating the Web Speech API into the workshop application for video transcription. This approach eliminates the need for the OpenAI API key while providing a client-side transcription solution.

## Implementation Steps

### 1. Update VideoRecorder Component

First, we need to modify the `src/components/VideoRecorder.js` file to integrate the Web Speech API:

```javascript
// src/components/VideoRecorder.js

import React, { useState, useRef, useEffect } from 'react';
import { videoService } from '../services/videoService';

const VideoRecorder = ({ onRecordingComplete, onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [transcription, setTranscription] = useState('');
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  
  // Check if Speech Recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechRecognitionSupported(false);
      videoService.debugLog('Speech recognition is not supported in this browser');
    }
  }, []);
  
  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onresult = (event) => {
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
      
      const currentTranscription = finalTranscript || interimTranscript;
      setTranscription(currentTranscription);
      videoService.debugLog('Transcription updated', { transcription: currentTranscription });
    };
    
    recognitionRef.current.onerror = (event) => {
      videoService.debugLog('Speech recognition error', event.error);
    };
  };
  
  const startRecording = async () => {
    try {
      setRecordingStatus('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);
        
        if (onRecordingComplete) {
          onRecordingComplete(blob);
        }
        
        // Store the transcription in the videoService
        videoService.setTranscription(transcription);
        
        if (onTranscriptionComplete) {
          onTranscriptionComplete(transcription);
        }
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      // Start recording
      chunksRef.current = [];
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus('Recording...');
      
      // Start speech recognition
      if (speechRecognitionSupported) {
        setupSpeechRecognition();
        recognitionRef.current.start();
        videoService.debugLog('Speech recognition started');
      }
      
    } catch (error) {
      videoService.debugLog('Error starting recording', error);
      setRecordingStatus(`Error: ${error.message}`);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingStatus('Processing recording...');
      
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        videoService.debugLog('Speech recognition stopped');
      }
    }
  };
  
  return (
    <div className="video-recorder">
      <div className="video-container">
        {!recordedVideo ? (
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            style={{ width: '100%', height: 'auto' }}
          />
        ) : (
          <video 
            src={recordedVideo} 
            controls 
            style={{ width: '100%', height: 'auto' }}
          />
        )}
      </div>
      
      <div className="controls">
        {!isRecording && !recordedVideo && (
          <button onClick={startRecording} className="start-recording">
            Start Recording
          </button>
        )}
        
        {isRecording && (
          <button onClick={stopRecording} className="stop-recording">
            Stop Recording
          </button>
        )}
        
        {recordingStatus && <p>{recordingStatus}</p>}
        
        {!speechRecognitionSupported && (
          <p className="warning">
            Speech recognition is not supported in this browser. 
            Transcription will not be available.
          </p>
        )}
        
        {transcription && (
          <div className="transcription-preview">
            <h4>Transcription Preview:</h4>
            <p>{transcription}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoRecorder;
```

### 2. Update VideoService

Next, modify the `src/services/videoService.js` file to support the Web Speech API transcription:

```javascript
// src/services/videoService.js

// Add a new method to store and retrieve transcriptions
class VideoService {
  constructor() {
    this.debug = true;
    this.transcription = null;
  }

  // Existing methods...

  /**
   * Set the transcription from Web Speech API
   * @param {string} text - The transcription text
   */
  setTranscription(text) {
    this.debugLog('Setting transcription', { text });
    this.transcription = text;
  }

  /**
   * Get video transcription
   * @param {Blob} audioBlob - The audio blob (not used with Web Speech API)
   * @returns {Promise<string>} - The transcription text
   */
  async transcribeAudio(audioBlob) {
    this.debugLog('Transcribing audio', { size: audioBlob?.size });
    
    // If we already have a transcription from Web Speech API, use it
    if (this.transcription) {
      this.debugLog('Using existing transcription from Web Speech API');
      return this.transcription;
    }
    
    // Fallback message if Web Speech API didn't provide a transcription
    this.debugLog('No transcription available from Web Speech API');
    return "Transcription not available. Your browser may not support speech recognition, or no speech was detected.";
  }

  // Existing debug method...
}

export const videoService = new VideoService();
```

### 3. Update VideoReflection Component

Finally, update the `src/VideoReflection.js` file to add manual transcription editing:

```javascript
// src/VideoReflection.js

import React, { useState, useEffect } from 'react';
import VideoRecorder from './components/VideoRecorder';
import { videoService } from './services/videoService';
import { config } from './config';

function VideoReflection({ sessionId }) {
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [manualTranscription, setManualTranscription] = useState('');

  // Debug logging function
  const debugLog = (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[VideoReflection Debug ${timestamp}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  };

  // Check browser compatibility
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      debugLog('Speech recognition is not supported in this browser');
    } else {
      debugLog('Speech recognition is supported in this browser');
    }
  }, []);

  // Load existing recording
  useEffect(() => {
    const loadExistingRecording = async () => {
      if (!sessionId) return;
      
      try {
        debugLog('Loading existing recording for session', sessionId);
        const recording = await videoService.getRecordingBySessionId(sessionId);
        
        if (recording) {
          debugLog('Found existing recording', recording);
          setRecordedVideo(recording.videoUrl);
          setTranscript(recording.transcript || '');
          setManualTranscription(recording.transcript || '');
        } else {
          debugLog('No existing recording found');
        }
      } catch (error) {
        debugLog('Error loading recording', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExistingRecording();
  }, [sessionId]);

  // Handle recording complete
  const handleRecordingComplete = async (videoBlob) => {
    debugLog('Recording completed', { size: videoBlob.size });
    
    try {
      const videoUrl = URL.createObjectURL(videoBlob);
      setRecordedVideo(videoUrl);
      
      // Save the recording
      if (sessionId) {
        await videoService.saveRecording(sessionId, videoBlob);
        debugLog('Recording saved for session', sessionId);
      }
    } catch (error) {
      debugLog('Error handling recording', error);
    }
  };

  // Handle transcription complete
  const handleTranscriptionComplete = async (transcriptionText) => {
    debugLog('Transcription completed', { text: transcriptionText });
    
    try {
      setTranscript(transcriptionText);
      setManualTranscription(transcriptionText);
      
      // Save the transcription
      if (sessionId) {
        await videoService.saveTranscription(sessionId, transcriptionText);
        debugLog('Transcription saved for session', sessionId);
      }
    } catch (error) {
      debugLog('Error handling transcription', error);
    }
  };

  // Handle manual transcription save
  const handleSaveManualTranscription = async () => {
    debugLog('Saving manual transcription', { text: manualTranscription });
    
    try {
      setTranscript(manualTranscription);
      setIsEditing(false);
      
      // Save the transcription
      if (sessionId) {
        await videoService.saveTranscription(sessionId, manualTranscription);
        debugLog('Manual transcription saved for session', sessionId);
      }
    } catch (error) {
      debugLog('Error saving manual transcription', error);
    }
  };

  return (
    <div className="video-reflection">
      <h2>Video Reflection</h2>
      
      <p>Record a 2-minute video sharing what you did, what you learned, and what you would do next time. This video will be saved and can be viewed by workshop administrators.</p>
      
      {!recordedVideo ? (
        <VideoRecorder 
          onRecordingComplete={handleRecordingComplete}
          onTranscriptionComplete={handleTranscriptionComplete}
        />
      ) : (
        <div className="recorded-video-container">
          <video 
            src={recordedVideo} 
            controls 
            style={{ width: '100%', maxWidth: '640px', height: 'auto' }}
          />
        </div>
      )}
      
      {transcript && (
        <div className="transcription-container">
          <h3>Transcription</h3>
          
          {isEditing ? (
            <div className="transcription-editor">
              <textarea
                value={manualTranscription}
                onChange={(e) => setManualTranscription(e.target.value)}
                rows={10}
                style={{ width: '100%', padding: '8px' }}
              />
              <div className="editor-buttons">
                <button onClick={handleSaveManualTranscription}>Save</button>
                <button onClick={() => {
                  setManualTranscription(transcript);
                  setIsEditing(false);
                }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="transcription-display">
              <p className="transcription-text">{transcript}</p>
              <button onClick={() => setIsEditing(true)}>
                Edit Transcription
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoReflection;
```

### 4. Remove OpenAI API Key References

Remove OpenAI API key references from the following files:

1. `.env.production`
2. `.env.template`
3. `public/env-config.js`
4. `scripts/generate-env-config.js`

For example, update `public/env-config.js`:

```javascript
window._env_ = {
  REACT_APP_SUPABASE_URL: "%REACT_APP_SUPABASE_URL%",
  REACT_APP_SUPABASE_ANON_KEY: "%REACT_APP_SUPABASE_ANON_KEY%"
  // OpenAI API key no longer needed with Web Speech API
};
```

### 5. Update Config.js

Update `src/config.js` to remove OpenAI API key references:

```javascript
// src/config.js

const config = {
  supabase: {
    url: window._env_?.REACT_APP_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
    anonKey: window._env_?.REACT_APP_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY,
  },
  // OpenAI section removed as it's no longer needed
};

export { config };
```

## Testing Plan

1. **Browser Compatibility Testing**
   - Test in Chrome, Firefox, Safari, and Edge
   - Note that Firefox and Safari may have limited support for Web Speech API

2. **Functionality Testing**
   - Test recording a video
   - Verify that speech is transcribed in real-time
   - Test saving and loading recordings
   - Test manual transcription editing

3. **Error Handling**
   - Test behavior when speech recognition is not supported
   - Test behavior when no speech is detected
   - Test behavior when permission for microphone is denied

## Deployment Steps

1. Implement all the changes described above
2. Test locally to ensure everything works as expected
3. Commit the changes to the repository
4. Deploy to GitHub Pages using the existing deployment process:

```bash
npm run deploy
```

## Advantages of This Approach

1. No API keys required
2. Works entirely client-side
3. No external service dependencies
4. Privacy-friendly (audio data stays in the browser)
5. Simple deployment process

## Limitations

1. Speech recognition accuracy varies by browser
2. Limited language support compared to OpenAI's Whisper
3. May not work well in noisy environments
4. Not all browsers support the Web Speech API

## Future Enhancements

1. Add support for multiple languages
2. Improve the UI for editing transcriptions
3. Add a fallback option to upload audio to a server for processing if needed
4. Implement caching to improve performance