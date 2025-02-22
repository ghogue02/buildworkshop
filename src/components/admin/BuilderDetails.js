import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

function BuilderDetails({ builder }) {
  const [adminNotes, setAdminNotes] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (builder) {
      fetchAdminNotes();
    }
  }, [builder]);

  const fetchAdminNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notes')
        .select('notes, updated_at')
        .eq('session_id', builder.sessionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setAdminNotes(data.notes || '');
        setLastUpdated(data.updated_at);
      } else {
        setAdminNotes('');
        setLastUpdated(null);
      }
    } catch (error) {
      console.error('Error fetching admin notes:', error);
    }
  };

  const saveAdminNotes = async () => {
    if (!builder) return;

    setIsSaving(true);
    setSaveStatus('');

    try {
      // First try to update
      const { data: existingData, error: fetchError } = await supabase
        .from('admin_notes')
        .select('id')
        .eq('session_id', builder.sessionId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let error;
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('admin_notes')
          .update({
            notes: adminNotes,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', builder.sessionId);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('admin_notes')
          .insert({
            session_id: builder.sessionId,
            notes: adminNotes
          });
        error = insertError;
      }

      if (error) throw error;

      // Update lastUpdated timestamp
      const now = new Date().toISOString();
      setLastUpdated(now);
      setSaveStatus('Notes saved successfully');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving admin notes:', error);
      setSaveStatus('Error saving notes');
    } finally {
      setIsSaving(false);
    }
  };

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

      {/* Admin Notes Section */}
      <div style={{
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h3 style={{ margin: 0, color: '#4CAF50' }}>Admin Notes</h3>
          {lastUpdated && (
            <span style={{ fontSize: '12px', color: '#888' }}>
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </span>
          )}
        </div>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Add notes about this builder..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            backgroundColor: 'black',
            color: 'white',
            border: '1px solid #333',
            borderRadius: '4px',
            marginBottom: '10px',
            resize: 'vertical'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={saveAdminNotes}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Notes'}
          </button>
          {saveStatus && (
            <span style={{ 
              color: saveStatus.includes('Error') ? '#ff4444' : '#4CAF50',
              marginLeft: '10px'
            }}>
              {saveStatus}
            </span>
          )}
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