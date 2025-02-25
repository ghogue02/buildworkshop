import React from 'react';
import VideoRecorder from './components/VideoRecorder';

function VideoReflection({ sessionId }) {
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
        
        <VideoRecorder 
          sessionId={sessionId} 
          onRecordingComplete={(recordingData) => {
            debugLog('Recording complete', recordingData);
          }}
        />
      </div>
    </div>
  );
}

export default VideoReflection;