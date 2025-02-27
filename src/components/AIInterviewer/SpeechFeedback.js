import React from 'react';

const SpeechFeedback = ({ isListening, transcript, isSpeaking }) => {
  // Animation for the listening indicator
  const pulseAnimation = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 0.5; }
    }
  `;

  // Animation for the sound wave effect
  const waveAnimation = `
    @keyframes wave {
      0% { height: 5px; }
      50% { height: 20px; }
      100% { height: 5px; }
    }
  `;

  // Generate random heights for wave bars
  const getRandomHeight = () => Math.floor(Math.random() * 15) + 5;

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      padding: '15px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '12px',
      zIndex: 10
    }}>
      <style>
        {pulseAnimation}
        {waveAnimation}
      </style>

      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isListening && (
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#ff4444',
            borderRadius: '50%',
            animation: 'pulse 1.5s infinite',
          }} />
        )}
        {isSpeaking && (
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#4CAF50',
            borderRadius: '50%',
            animation: 'pulse 1.5s infinite',
          }} />
        )}
        <span style={{ color: 'white', fontSize: '14px' }}>
          {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Ready'}
        </span>
      </div>

      {/* Sound wave visualization */}
      {(isListening || isSpeaking) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          height: '30px',
        }}>
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              style={{
                width: '3px',
                height: `${getRandomHeight()}px`,
                backgroundColor: isListening ? '#ff4444' : '#4CAF50',
                animation: 'wave 0.5s infinite',
                animationDelay: `${index * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Live transcription */}
      {isListening && transcript && (
        <div style={{
          maxWidth: '300px',
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          marginTop: '10px',
        }}>
          <p style={{
            color: 'white',
            fontSize: '14px',
            margin: 0,
            textAlign: 'center',
            opacity: 0.8,
          }}>
            {transcript}
          </p>
        </div>
      )}
    </div>
  );
};

export default SpeechFeedback;