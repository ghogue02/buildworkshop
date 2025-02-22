import React from 'react';

function BuilderDetails({ builder }) {
  if (!builder) return null;

  const sectionOrder = [
    'User Info',
    'Problem Definition',
    'MVP Planner',
    'Give & Get Feedback',
    'Refine Your MVP',
    'Start Build',
    'Presentations & Retro'
  ];

  const formatSectionData = (sectionName, data) => {
    if (!data) return <p style={{ color: '#666' }}>No data yet</p>;

    switch (sectionName) {
      case 'User Info':
        return (
          <div>
            <p><strong>Name:</strong> {data.name}</p>
            <p><strong>Email:</strong> {data.email}</p>
          </div>
        );
      case 'Problem Definition':
        return (
          <div>
            <p><strong>Summary:</strong> {data.summary}</p>
            <p><strong>Context:</strong> {data.context}</p>
            <p><strong>Impact:</strong> {data.impact}</p>
            <p><strong>Root Causes:</strong> {data.rootCauses}</p>
            <p><strong>Outcome:</strong> {data.outcome}</p>
          </div>
        );
      case 'MVP Planner':
        return (
          <div>
            <p><strong>Ideas:</strong></p>
            <ul>
              {data.aiOptions?.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
            <p><strong>How It Works:</strong> {data.howItWorks}</p>
            <p><strong>Data Needs:</strong> {data.dataNeeds}</p>
            <p><strong>User Experience:</strong> {data.userExperience}</p>
            <p><strong>Value Proposition:</strong> {data.valueProposition}</p>
          </div>
        );
      case 'Give & Get Feedback':
        return (
          <div>
            <p><strong>Share:</strong> {data.share}</p>
            <p><strong>Request Feedback:</strong> {data.requestFeedback}</p>
            <p><strong>Give Feedback:</strong> {data.giveFeedback}</p>
            <p><strong>Capture:</strong> {data.capture}</p>
          </div>
        );
      case 'Refine Your MVP':
        return (
          <div>
            <p><strong>Feedback Integration:</strong> {data.feedbackIntegration}</p>
            <p><strong>AI Enhancement:</strong> {data.aiEnhancement}</p>
            <p><strong>Product Refinement:</strong> {data.productRefinement}</p>
            <p><strong>Key Improvements:</strong> {data.keyImprovements}</p>
          </div>
        );
      case 'Start Build':
        return (
          <div>
            <p><strong>What was built:</strong> {data.whatBuilt}</p>
            <p><strong>Functionality achieved:</strong> {data.functionality}</p>
            <p><strong>Future additions:</strong> {data.futureAdditions}</p>
            <p><strong>How AI helped:</strong> {data.aiHelp}</p>
          </div>
        );
      case 'Presentations & Retro':
        return (
          <div>
            <p><strong>Problem (20 sec):</strong> {data.problem}</p>
            <p><strong>Solution (25 sec):</strong> {data.solution}</p>
            <p><strong>Demo (50 sec):</strong> {data.demo}</p>
            <p><strong>Journey (25 sec):</strong> {data.journey}</p>
            <p><strong>Impact (10 sec):</strong> {data.impact}</p>
          </div>
        );
      default:
        return <pre>{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>{builder.userInfo.name}</h2>
          <p style={{ margin: '5px 0 0 0', color: '#888' }}>{builder.userInfo.email}</p>
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#1a1a1a',
          borderRadius: '20px',
          fontSize: '14px'
        }}>
          {builder.progress.completed} of {builder.progress.total} sections complete
        </div>
      </div>

      {/* Sections */}
      <div style={{
        display: 'grid',
        gap: '20px'
      }}>
        {sectionOrder.map((sectionName) => {
          const sectionData = builder.sections[sectionName];
          const isComplete = !!sectionData;

          return (
            <div
              key={sectionName}
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '20px'
              }}
            >
              {/* Section Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h3 style={{ margin: 0 }}>{sectionName}</h3>
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: isComplete ? '#4CAF50' : '#333',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  {isComplete ? 'Complete' : 'Pending'}
                </div>
              </div>

              {/* Section Content */}
              <div style={{ color: isComplete ? 'white' : '#666' }}>
                {formatSectionData(sectionName, sectionData)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BuilderDetails;