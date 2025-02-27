import React, { useState, useEffect, useCallback } from 'react';
import AvatarRenderer from './AvatarRenderer';
import AvatarCustomizer from './AvatarCustomizer';
import SpeechFeedback from './SpeechFeedback';
import { useSpeechHandler } from './SpeechHandler';
import { useInterviewManager } from './InterviewManager';

// Default avatar options using local models
const AVATAR_OPTIONS = [
  {
    id: 'default',
    url: '/avatars/default-avatar.glb',
    name: 'Default Avatar'
  },
  {
    id: 'business',
    url: '/avatars/business-avatar.glb',
    name: 'Business Avatar'
  },
  {
    id: 'casual',
    url: '/avatars/casual-avatar.glb',
    name: 'Casual Avatar'
  }
];

// Default appearance settings
const DEFAULT_APPEARANCE = {
  skinTone: 'default',
  hairStyle: 'default',
  outfit: 'default'
};

/**
 * AIInterviewer component
 * This component integrates the avatar, speech, and interview management
 * to create an interactive AI-driven interview experience
 */
const AIInterviewer = ({ sessionId, onComplete }) => {
  const [visemeData, setVisemeData] = useState(null);
  const [emotion, setEmotion] = useState('neutral');
  const [interviewData, setInterviewData] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_OPTIONS[0].url);
  const [selectedAvatarId, setSelectedAvatarId] = useState('default');
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [currentVoice, setCurrentVoice] = useState(null);
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  
  // Initialize speech handler
  const {
    isListening,
    isSpeaking,
    transcript,
    error: speechError,
    speechSupported,
    startListening,
    stopListening,
    speak
  } = useSpeechHandler({
    onTranscript: (text) => console.log('Transcript update:', text),
    onSpeechEnd: handleUserSpeechEnd,
    onVisemeData: setVisemeData
  });
  
  // Initialize interview manager
  const {
    currentQuestion,
    interviewState,
    error: interviewError,
    startInterview,
    processAnswer,
    getNextQuestion,
    progress
  } = useInterviewManager({
    sessionId,
    onQuestion: handleNewQuestion,
    onInterviewComplete: handleInterviewComplete
  });
  
  // Handle new question from interview manager
  function handleNewQuestion(question) {
    setEmotion('interested');
    setWaitingForAnswer(false);
    
    // Add a small delay before speaking to make it feel more natural
    setTimeout(() => {
      speak(question);
    }, 500);
  }
  
  // Handle when user finishes speaking
  async function handleUserSpeechEnd(finalTranscript) {
    if (interviewState === 'active' && finalTranscript && waitingForAnswer) {
      // Process the answer
      await processAnswer(finalTranscript);
      setWaitingForAnswer(false);
    }
  }
  
  // Handle interview completion
  function handleInterviewComplete(answers, summary) {
    setInterviewData({ answers, summary });
    
    // Thank the user
    setEmotion('happy');
    speak("Thank you for completing this interview. Your responses have been recorded.");
    
    // Notify parent component if needed
    if (onComplete) {
      onComplete({ answers, summary });
    }
  }
  
  // Start listening for user's answer
  function handleStartAnswering() {
    if (isSpeaking) return; // Don't start listening while AI is speaking
    
    setWaitingForAnswer(true);
    setEmotion('listening');
    startListening();
  }
  
  // Stop listening and process the answer
  function handleStopAnswering() {
    stopListening();
    
    if (transcript) {
      processAnswer(transcript);
      setWaitingForAnswer(false);
    }
  }
  
  // Effect to handle speech completion
  useEffect(() => {
    if (interviewState === 'active' && !isSpeaking && currentQuestion && !waitingForAnswer) {
      // When the AI finishes speaking the question, start listening for the answer
      setWaitingForAnswer(true);
      setEmotion('listening');
      
      // Add a small delay before starting to listen
      setTimeout(() => {
        startListening();
      }, 500);
    }
  }, [isSpeaking, interviewState, currentQuestion, waitingForAnswer, startListening]);
  
  // Render different UI based on interview state
  const renderInterviewContent = () => {
    switch (interviewState) {
      case 'idle':
        return (
          <div className="interview-start">
            <h3>AI Interview</h3>
            <p>
              This AI interviewer will ask you questions about your project and provide a summary of your responses.
            </p>
            <button 
              onClick={startInterview}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Start Interview
            </button>
          </div>
        );
        
      case 'preparing':
        return (
          <div className="interview-preparing">
            <h3>Preparing Interview</h3>
            <p>Generating questions based on your project...</p>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #4CAF50',
              borderRadius: '50%',
              margin: '20px auto',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        );
        
      case 'active':
        return (
          <div className="interview-active">
            <div className="question-container" style={{ marginBottom: '20px' }}>
              <h3>Question {progress.current} of {progress.total}</h3>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#1a1a1a', 
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                {currentQuestion}
              </div>
            </div>
            
            <div className="speech-controls" style={{ marginBottom: '20px' }}>
              {waitingForAnswer ? (
                <button
                  onClick={handleStopAnswering}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Stop Speaking
                </button>
              ) : (
                <button
                  onClick={handleStartAnswering}
                  disabled={isSpeaking}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: isSpeaking ? '#666' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    cursor: isSpeaking ? 'default' : 'pointer',
                    opacity: isSpeaking ? 0.7 : 1
                  }}
                >
                  {isSpeaking ? "AI is speaking..." : "Start Speaking"}
                </button>
              )}
              
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '1px solid white',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginLeft: '10px'
                }}
              >
                {showTranscript ? "Hide Transcript" : "Show Transcript"}
              </button>
            </div>
            
            {showTranscript && (
              <div className="transcript" style={{ 
                padding: '15px',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                marginBottom: '15px',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                <h4 style={{ marginTop: 0 }}>Your Response:</h4>
                <p style={{ whiteSpace: 'pre-wrap' }}>{transcript || "(Waiting for you to speak...)"}</p>
              </div>
            )}
            
            {(speechError || interviewError) && (
              <div style={{ 
                color: 'red', 
                backgroundColor: 'rgba(255, 0, 0, 0.1)', 
                padding: '10px', 
                borderRadius: '4px',
                marginTop: '15px'
              }}>
                {speechError || interviewError}
              </div>
            )}
            
            {!speechSupported && (
              <div style={{ 
                color: 'orange', 
                backgroundColor: 'rgba(255, 165, 0, 0.1)', 
                padding: '10px', 
                borderRadius: '4px',
                marginTop: '15px'
              }}>
                Speech recognition is not supported in this browser. Please try using Chrome, Edge, or Safari.
              </div>
            )}
          </div>
        );
        
      case 'processing':
        return (
          <div className="interview-processing">
            <h3>Processing Interview</h3>
            <p>Analyzing your responses and generating a summary...</p>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #4CAF50',
              borderRadius: '50%',
              margin: '20px auto',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        );
        
      case 'complete':
        return (
          <div className="interview-complete">
            <h3>Interview Complete</h3>
            
            {interviewData && interviewData.summary && (
              <div className="summary" style={{ 
                padding: '20px',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{ color: '#4CAF50', marginTop: 0 }}>Summary</h4>
                <p>{interviewData.summary.conclusion}</p>
                
                <h4>Key Points</h4>
                <ul>
                  {interviewData.summary.key_points?.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
                
                <h4>Strengths</h4>
                <ul>
                  {interviewData.summary.strengths?.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
                
                <h4>Areas for Improvement</h4>
                <ul>
                  {interviewData.summary.areas_for_improvement?.map((area, index) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
                
                <h4>Next Steps</h4>
                <ul>
                  {interviewData.summary.next_steps?.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              onClick={() => startInterview()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Start New Interview
            </button>
            
            {onComplete && (
              <button
                onClick={() => onComplete(interviewData)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Continue
              </button>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Handle customization changes
  const handleAvatarChange = useCallback((avatarId) => {
    const selectedAvatar = AVATAR_OPTIONS.find(avatar => avatar.id === avatarId);
    if (selectedAvatar) {
      setSelectedAvatarId(avatarId);
      setAvatarUrl(selectedAvatar.url);
    }
  }, []);

  const handleVoiceChange = useCallback((voice) => {
    setCurrentVoice(voice);
    if (speak && voice.settings) {
      speak.updateVoiceSettings(voice.settings);
    }
  }, [speak]);

  const handleAppearanceChange = useCallback((category, value) => {
    setAppearance(prev => ({
      ...prev,
      [category]: value
    }));
  }, []);

  return (
    <div className="ai-interviewer-container" style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <div className="avatar-container" style={{
        marginBottom: '30px',
        position: 'relative'
      }}>
        {/* Customize button */}
        <button
          onClick={() => setShowCustomizer(!showCustomizer)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span role="img" aria-label="customize">⚙️</span>
          Customize
        </button>
        
        {/* Avatar customizer */}
        <AvatarCustomizer
          selectedAvatarId={selectedAvatarId}
          onAvatarChange={handleAvatarChange}
          onVoiceChange={handleVoiceChange}
          onAppearanceChange={handleAppearanceChange}
          currentVoice={currentVoice}
          currentAppearance={appearance}
          isOpen={showCustomizer}
          onClose={() => setShowCustomizer(false)}
        />
        
        {/* Avatar renderer */}
        <AvatarRenderer
          avatarUrl={avatarUrl}
          visemeData={visemeData}
          emotion={emotion}
          appearance={appearance}
        />

        {/* Speech feedback overlay */}
        <SpeechFeedback
          isListening={isListening}
          isSpeaking={isSpeaking}
          transcript={transcript}
        />
      </div>
      
      <div className="interview-controls">
        {renderInterviewContent()}
      </div>
    </div>
  );
};

export default AIInterviewer;