import React from 'react';
import { exportBuildersToCSV } from '../../utils/csvExport';

function BuilderList({ builders, selectedBuilder, onSelectBuilder }) {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Export Button */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={() => exportBuildersToCSV(builders)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
        >
          Export to CSV
        </button>
      </div>

      {builders.map((builder) => (
        <div
          key={builder.sessionId}
          onClick={() => onSelectBuilder(builder.sessionId)}
          style={{
            padding: '15px',
            backgroundColor: selectedBuilder === builder.sessionId ? '#1a1a1a' : 'transparent',
            border: '1px solid #333',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            ':hover': {
              backgroundColor: '#1a1a1a'
            }
          }}
        >
          {/* Builder Info */}
          <div style={{ marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#4CAF50' }}>
              {builder.userInfo.name}
            </h3>
            <p style={{ 
              margin: '5px 0 0 0',
              fontSize: '14px',
              color: '#888'
            }}>
              {builder.userInfo.email}
            </p>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#333',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(builder.progress.completed / builder.progress.total) * 100}%`,
                height: '100%',
                backgroundColor: '#4CAF50',
                transition: 'width 0.3s'
              }} />
            </div>
            <p style={{ 
              margin: '5px 0 0 0',
              fontSize: '12px',
              color: '#888'
            }}>
              {builder.progress.completed} of {builder.progress.total} sections complete
            </p>
          </div>

          {/* Last Update */}
          <div style={{
            fontSize: '12px',
            color: '#666'
          }}>
            Last update: {new Date(builder.lastUpdate).toLocaleTimeString()}
          </div>

          {/* Active Indicator */}
          {Date.now() - builder.lastUpdate < 300000 && ( // Active in last 5 minutes
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '8px',
              height: '8px',
              backgroundColor: '#4CAF50',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }} />
          )}
        </div>
      ))}

      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
            }
            
            70% {
              transform: scale(1);
              box-shadow: 0 0 0 5px rgba(76, 175, 80, 0);
            }
            
            100% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
            }
          }
        `}
      </style>
    </div>
  );
}

export default BuilderList;