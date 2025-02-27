import React, { useState } from 'react';

// Voice options with different characteristics
const VOICE_OPTIONS = [
  {
    id: 'default',
    name: 'Default Voice',
    settings: {
      pitch: 1.0,
      rate: 1.0,
      voice: null // Will use system default
    }
  },
  {
    id: 'professional',
    name: 'Professional Voice',
    settings: {
      pitch: 0.9,
      rate: 0.9,
      voice: null
    }
  },
  {
    id: 'friendly',
    name: 'Friendly Voice',
    settings: {
      pitch: 1.1,
      rate: 1.05,
      voice: null
    }
  }
];

// Appearance customization options
const APPEARANCE_OPTIONS = {
  skinTone: [
    { id: 'default', name: 'Default' },
    { id: 'light', name: 'Light' },
    { id: 'medium', name: 'Medium' },
    { id: 'dark', name: 'Dark' }
  ],
  hairStyle: [
    { id: 'default', name: 'Default' },
    { id: 'short', name: 'Short' },
    { id: 'long', name: 'Long' },
    { id: 'tied', name: 'Tied Back' }
  ],
  outfit: [
    { id: 'default', name: 'Default' },
    { id: 'business', name: 'Business' },
    { id: 'casual', name: 'Casual' },
    { id: 'professional', name: 'Professional' }
  ]
};

const AvatarCustomizer = ({
  selectedAvatarId,
  onAvatarChange,
  onVoiceChange,
  onAppearanceChange,
  currentVoice,
  currentAppearance,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('avatar');

  if (!isOpen) return null;

  const renderTabButton = (tabId, label) => (
    <button
      onClick={() => setActiveTab(tabId)}
      style={{
        padding: '8px 16px',
        backgroundColor: activeTab === tabId ? '#4CAF50' : '#333',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        margin: '0 5px'
      }}
    >
      {label}
    </button>
  );

  const renderAvatarTab = () => (
    <div className="avatar-options">
      <h4>Choose Avatar</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[
          { id: 'default', name: 'Default Avatar' },
          { id: 'business', name: 'Business Avatar' },
          { id: 'casual', name: 'Casual Avatar' }
        ].map(avatar => (
          <button
            key={avatar.id}
            onClick={() => onAvatarChange(avatar.id)}
            style={{
              padding: '8px 12px',
              backgroundColor: selectedAvatarId === avatar.id ? '#4CAF50' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {avatar.name}
          </button>
        ))}
      </div>
    </div>
  );

  const renderVoiceTab = () => (
    <div className="voice-options">
      <h4>Choose Voice</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {VOICE_OPTIONS.map(voice => (
          <button
            key={voice.id}
            onClick={() => onVoiceChange(voice)}
            style={{
              padding: '8px 12px',
              backgroundColor: currentVoice?.id === voice.id ? '#4CAF50' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {voice.name}
          </button>
        ))}
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="appearance-options">
      <h4>Customize Appearance</h4>
      {Object.entries(APPEARANCE_OPTIONS).map(([category, options]) => (
        <div key={category} style={{ marginBottom: '15px' }}>
          <h5 style={{ marginBottom: '8px', color: '#888' }}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </h5>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {options.map(option => (
              <button
                key={option.id}
                onClick={() => onAppearanceChange(category, option.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentAppearance?.[category] === option.id ? '#4CAF50' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '20px',
      zIndex: 10,
      border: '1px solid #333',
      minWidth: '250px',
      maxWidth: '300px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Customize Avatar</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
        {renderTabButton('avatar', 'Avatar')}
        {renderTabButton('voice', 'Voice')}
        {renderTabButton('appearance', 'Appearance')}
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {activeTab === 'avatar' && renderAvatarTab()}
        {activeTab === 'voice' && renderVoiceTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
      </div>
    </div>
  );
};

export default AvatarCustomizer;