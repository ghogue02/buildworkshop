import React, { useState, useRef, useEffect } from 'react';
import { videoService } from '../services/videoService';

function VideoRecorder({ sessionId, onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  
  const MAX_RECORDING_TIME = 120; // 2 minutes in seconds
  
  // Debug logging function
  const debugLog = (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[VideoRecorder Debug ${timestamp}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  };

  // Load existing recording if available
  useEffect(() => {
    const loadExistingRecording = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }
      
      try {
        debugLog('Loading existing recording for session', sessionId);
        const recordingData = await videoService.getVideoRecording(sessionId);
        
        if (recordingData) {
          debugLog('Existing recording found', recordingData);
          setVideoUrl(recordingData.video_url);
          setTranscript(recordingData.transcript || '');
        } else {
          debugLog('No existing recording found');
        }
      } catch (error) {
        debugLog('Error loading recording', error);
        console.error('Error loading recording:', error);
        setError('Failed to load existing recording');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExistingRecording();
    
    // Cleanup function
    return () => {
      stopMediaTracks();
    };
  }, [sessionId]);
  
  // Stop media tracks when component unmounts
  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      setRecordingStatus('Requesting camera access...');
      debugLog('Requesting camera and microphone access');
      
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Create media recorder
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = handleRecordingStop;
      
      // Clear previous recording chunks
      chunksRef.current = [];
      
      // Start recording
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingStatus('Recording...');
      debugLog('Recording started');
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          const newTime = prevTime + 1;
          
          // Auto-stop after MAX_RECORDING_TIME
          if (newTime >= MAX_RECORDING_TIME) {
            stopRecording();
          }
          
          return newTime;
        });
      }, 1000);
    } catch (error) {
      debugLog('Error starting recording', error);
      console.error('Error starting recording:', error);
      setError(`Failed to start recording: ${error.message}`);
      setRecordingStatus('');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      debugLog('Stopping recording');
      setRecordingStatus('Processing recording...');
      mediaRecorderRef.current.stop();
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecording(false);
    }
  };
  
  // Handle recording stop event
  const handleRecordingStop = async () => {
    try {
      debugLog('Recording stopped, processing data');
      
      // Create video blob from chunks
      const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
      const videoObjectUrl = URL.createObjectURL(videoBlob);
      setVideoUrl(videoObjectUrl);
      
      // Stop media tracks
      stopMediaTracks();
      
      let dataUrl;
      let transcriptText;
      
      try {
        // Upload video (now returns a data URL)
        setRecordingStatus('Processing video...');
        debugLog('Processing video');
        dataUrl = await videoService.uploadVideo(videoBlob, sessionId);
      } catch (error) {
        debugLog('Error processing video, using object URL instead', error);
        dataUrl = videoObjectUrl;
        setRecordingStatus('Video processing failed, using local version');
      }
      
      try {
        // Transcribe audio
        setRecordingStatus('Generating transcript...');
        debugLog('Transcribing audio');
        transcriptText = await videoService.transcribeAudio(videoBlob);
        setTranscript(transcriptText);
      } catch (error) {
        debugLog('Error transcribing audio', error);
        transcriptText = "Transcription failed. Please try again later.";
        setTranscript(transcriptText);
        setRecordingStatus('Transcription failed');
      }
      
      // Save recording data
      setRecordingStatus('Saving recording data...');
      debugLog('Saving recording data');
      try {
        await videoService.saveVideoRecording(sessionId, dataUrl || videoObjectUrl, transcriptText);
        setRecordingStatus('Recording complete!');
        debugLog('Recording process complete');
      } catch (error) {
        // If saving to database fails, still keep the recording in the UI
        debugLog('Error saving to database, but keeping recording in UI', error);
        setRecordingStatus('Recording saved locally (database save failed)');
      }
      
      // Call the callback if provided
      if (onRecordingComplete) {
        onRecordingComplete({
          videoUrl: dataUrl || videoObjectUrl,
          transcript: transcriptText
        });
      }
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setRecordingStatus('');
      }, 3000);
    } catch (error) {
      debugLog('Error processing recording', error);
      console.error('Error processing recording:', error);
      setError(`Error processing recording: ${error.message}`);
      setRecordingStatus('');
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate remaining time
  const remainingTime = MAX_RECORDING_TIME - recordingTime;
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3>Video Reflection</h3>
      <p style={{ marginBottom: '15px' }}>
        Record a 2-minute video sharing what you did, what you learned, and what you would do next time.
      </p>
      
      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: 'rgba(255, 0, 0, 0.1)', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        marginBottom: '15px',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: '#111'
      }}>
        {/* Video preview */}
        {videoUrl ? (
          <video 
            ref={videoRef}
            src={videoUrl}
            controls
            style={{ 
              width: '100%', 
              maxHeight: '400px', 
              backgroundColor: 'black',
              borderRadius: '4px'
            }}
          />
        ) : (
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            playsInline
            style={{ 
              width: '100%', 
              maxHeight: '400px', 
              backgroundColor: 'black',
              borderRadius: '4px'
            }}
          />
        )}
        
        {/* Recording controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginTop: '15px'
        }}>
          {isRecording ? (
            <>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                color: remainingTime < 10 ? 'red' : 'white'
              }}>
                <span style={{ 
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'red',
                  borderRadius: '50%',
                  marginRight: '8px'
                }}></span>
                {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
              </div>
              
              <button
                onClick={stopRecording}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Stop Recording
              </button>
            </>
          ) : (
            <>
              <div>
                {videoUrl ? 'Recording saved' : 'No recording yet'}
              </div>
              
              <button
                onClick={startRecording}
                disabled={!!recordingStatus && !recordingStatus.includes('complete')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: (!!recordingStatus && !recordingStatus.includes('complete')) ? 0.7 : 1
                }}
              >
                {videoUrl ? 'Record New Video' : 'Start Recording'}
              </button>
            </>
          )}
        </div>
        
        {/* Status message */}
        {recordingStatus && (
          <div style={{ 
            marginTop: '10px',
            color: recordingStatus.includes('Error') ? 'red' : '#4CAF50'
          }}>
            {recordingStatus}
          </div>
        )}
      </div>
      
      {/* Transcript */}
      {transcript && (
        <div style={{ marginTop: '20px' }}>
          <h4>Transcript</h4>
          <div style={{ 
            padding: '15px',
            backgroundColor: '#111',
            border: '1px solid #333',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap'
          }}>
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoRecorder;