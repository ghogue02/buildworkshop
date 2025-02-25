import React, { useState, useEffect } from 'react';
import VideoRecorder from './components/VideoRecorder';
import { videoService } from './services/videoService';
import { setOpenAIKey } from './config';

function VideoReflection({ sessionId }) {
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  // Set a default OpenAI API key for transcription
  useEffect(() => {
    // This is just a placeholder - in a real app, you would use a server-side API key
    // or implement a secure way to handle API keys
    setOpenAIKey('sk-yourapikeyhere');
  }, []);

  // Load existing recording if available
  useEffect(() => {
    const loadExistingRecording = async () => {
      if (!sessionId) return;
      
      try {
        setIsLoading(true);
        const recordingData = await videoService.getVideoRecording(sessionId);
        
        if (recordingData) {
          setRecordedVideo(recordingData.video_url);
          setTranscript(recordingData.transcript || '');
          debugLog('Loaded existing recording', recordingData);
        }
      } catch (error) {
        debugLog('Error loading recording', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExistingRecording();
  }, [sessionId]);

  const handleRecordingComplete = (recordingData) => {
    debugLog('Recording complete', recordingData);
    setRecordedVideo(recordingData.videoUrl);
    setTranscript(recordingData.transcript || '');
  };

  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid white', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>Video Reflection</h2>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <p style={{ marginBottom: '20px' }}>
          Record a 2-minute video sharing what you did, what you learned, and what you would do next time.
          This video will be saved and can be viewed by workshop administrators.
        </p>
        
        {/* Show existing recording if available */}
        {recordedVideo && (
          <div style={{ marginBottom: '20px' }}>
            <h3>Your Recording</h3>
            <video
              src={recordedVideo}
              controls
              style={{
                width: '100%',
                maxHeight: '400px',
                backgroundColor: 'black',
                borderRadius: '4px',
                marginBottom: '15px'
              }}
            />
            
            {transcript && (
              <div>
                <h4 style={{ marginBottom: '5px' }}>Transcript</h4>
                <div style={{
                  padding: '15px',
                  backgroundColor: '#111',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  marginBottom: '20px'
                }}>
                  {transcript}
                </div>
              </div>
            )}
          </div>
        )}
        
        <VideoRecorder
          sessionId={sessionId}
          onRecordingComplete={handleRecordingComplete}
        />
      </div>
    </div>
  );
}

export default VideoReflection;