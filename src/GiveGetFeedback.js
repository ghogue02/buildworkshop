import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, withRetry } from './supabaseClient';

function GiveGetFeedback({ onSave, sessionId }) {
  const [share, setShare] = useState('');
  const [requestFeedback, setRequestFeedback] = useState('');
  const [giveFeedback, setGiveFeedback] = useState('');
  const [capture, setCapture] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const isMounted = useRef(true);
  const lastSaveTime = useRef(null);
  const saveAttempts = useRef(0);

  // Debug logging function
  const debugLog = (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[GiveGetFeedback Debug ${timestamp}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  };

  // Load existing data
  useEffect(() => {
    const loadExistingData = async () => {
      if (!sessionId) {
        debugLog('No sessionId provided, skipping data load');
        return;
      }

      debugLog(`Loading existing data for session ${sessionId}`);
      try {
        // Use withRetry for better reliability
        const { data, error } = await withRetry(async () => {
          debugLog('Fetching Give & Get Feedback data from Supabase');
          return await supabase
            .from('user_inputs')
            .select('input_data')
            .eq('session_id', sessionId)
            .eq('section_name', 'Give & Get Feedback')
            .maybeSingle();
        }, 3, 2000);

        if (error) {
          if (error.code !== 'PGRST116') {
            debugLog(`Error fetching data: ${error.code}`, error);
            throw error;
          } else {
            debugLog('No existing data found (PGRST116)');
          }
        }

        if (data?.input_data) {
          debugLog('Data loaded successfully', data.input_data);
          setShare(data.input_data.share || '');
          setRequestFeedback(data.input_data.requestFeedback || '');
          setGiveFeedback(data.input_data.giveFeedback || '');
          setCapture(data.input_data.capture || '');
        } else {
          debugLog('No data or empty data returned');
        }
      } catch (error) {
        debugLog('Error loading data:', error);
        console.error('Error loading data:', error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          debugLog('Loading state set to false');
        }
      }
    };

    loadExistingData();
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      debugLog('Component unmounting, isMounted set to false');
    };
  }, [sessionId]);

  const validate = () => {
    debugLog('Validating form data');
    let newErrors = {};
    if (!share.trim()) newErrors.share = 'Share is required';
    if (!requestFeedback.trim()) newErrors.requestFeedback = 'Request Feedback is required';
    if (!giveFeedback.trim()) newErrors.giveFeedback = 'Give Feedback is required';
    if (!capture.trim()) newErrors.capture = 'Capture is required';
    
    const isValid = Object.keys(newErrors).length === 0;
    debugLog(`Validation result: ${isValid ? 'Valid' : 'Invalid'}`, newErrors);
    
    setErrors(newErrors);
    return isValid;
  };

  const saveData = useCallback(async () => {
    const currentTime = new Date();
    saveAttempts.current += 1;
    const attemptNumber = saveAttempts.current;
    
    debugLog(`Save attempt #${attemptNumber} started`);
    
    if (!sessionId) {
      debugLog('No sessionId available, cannot save');
      return;
    }
    
    // Run validation but don't block saving
    const isValid = validate();
    if (!isValid) {
      debugLog('Validation failed, but continuing with save to preserve partial progress');
    }

    // Only save if at least one field has content
    if (!share.trim() && !requestFeedback.trim() && !giveFeedback.trim() && !capture.trim()) {
      debugLog('No content to save, all fields are empty');
      return;
    }

    // Track time since last save
    const timeSinceLastSave = lastSaveTime.current
      ? currentTime - lastSaveTime.current
      : null;
    
    debugLog(`Time since last save: ${timeSinceLastSave ? `${timeSinceLastSave}ms` : 'First save'}`);
    
    setSaveStatus('Saving...');
    try {
      debugLog('Preparing data for save', {
        session_id: sessionId,
        section_name: 'Give & Get Feedback',
        data: { share, requestFeedback, giveFeedback, capture }
      });

      // First check if a record already exists
      debugLog('Checking if record exists');
      const { data: existingData, error: fetchError } = await withRetry(async () => {
        return await supabase
          .from('user_inputs')
          .select('id')
          .eq('session_id', sessionId)
          .eq('section_name', 'Give & Get Feedback')
          .maybeSingle();
      }, 3, 2000);

      if (fetchError) {
        debugLog('Error checking for existing data:', fetchError);
        throw fetchError;
      }

      let error;
      if (existingData) {
        debugLog(`Updating existing record ID: ${existingData.id}`);
        // Update existing record
        const { error: updateError } = await withRetry(async () => {
          return await supabase
            .from('user_inputs')
            .update({
              input_data: {
                share,
                requestFeedback,
                giveFeedback,
                capture
              },
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('section_name', 'Give & Get Feedback');
        }, 3, 2000);
        
        error = updateError;
      } else {
        debugLog('Creating new record');
        // Insert new record
        const { error: insertError } = await withRetry(async () => {
          return await supabase
            .from('user_inputs')
            .insert({
              session_id: sessionId,
              section_name: 'Give & Get Feedback',
              input_data: {
                share,
                requestFeedback,
                giveFeedback,
                capture
              }
            });
        }, 3, 2000);
        
        error = insertError;
      }

      if (error) {
        debugLog('Database operation failed:', error);
        throw error;
      }

      lastSaveTime.current = new Date();
      const saveTime = lastSaveTime.current - currentTime;
      debugLog(`Save successful, took ${saveTime}ms`);
      setSaveStatus('Saved');
      
      // Clear save status after 3 seconds
      setTimeout(() => {
        if (isMounted.current) {
          setSaveStatus(null);
        }
      }, 3000);
      
      // Call onSave if provided
      if (onSave) {
        debugLog('Calling onSave callback');
        onSave('Give & Get Feedback', {
          share,
          requestFeedback,
          giveFeedback,
          capture
        });
      }
    } catch (error) {
      debugLog('Error saving data:', error);
      console.error('Error saving data:', error);
      setSaveStatus(`Error: ${error.message || 'Failed to save'}`);
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        if (isMounted.current) {
          setSaveStatus(null);
        }
      }, 5000);
    }
  }, [sessionId, share, requestFeedback, giveFeedback, capture, onSave]);

  // Debounce save after 1 second of no changes
  useEffect(() => {
    if (loading) {
      debugLog('Skip auto-save: Component is still loading');
      return; // Don't save while initial data is loading
    }
    
    debugLog('Auto-save timer started (1000ms delay)');
    const timer = setTimeout(() => {
      debugLog('Auto-save timer triggered, calling saveData()');
      saveData();
    }, 1000);

    return () => {
      debugLog('Auto-save timer cleared due to dependency change');
      clearTimeout(timer);
    };
  }, [share, requestFeedback, giveFeedback, capture, saveData, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: '20px',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Left Panel - Instructions and Example Questions */}
      <div style={{ 
        flex: '0 0 300px',
        padding: '20px',
        border: '1px solid white',
        borderRadius: '8px',
        backgroundColor: '#1a1a1a',
        height: 'fit-content'
      }}>
        <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Group Exercise</h3>
        
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          In your group, go around and share:
        </p>
        <ul style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          <li>Your problem statement and why you chose to solve this</li>
          <li>Your product MVP and why you chose this idea</li>
          <li>Ask about clarity, confusion, weaknesses, alternatives</li>
        </ul>

        <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
          <strong style={{ color: '#4CAF50' }}>Give Feedback:</strong> Start positive, ask questions about users, challenges, specific situations
        </p>

        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          <strong style={{ color: '#4CAF50' }}>Capture:</strong> Note best suggestions, new ideas, improvements
        </p>

        <p style={{ marginBottom: '20px', lineHeight: '1.6', fontStyle: 'italic' }}>
          Remember: Goal is making ideas stronger through different perspectives and work as a team!
        </p>

        <h4 style={{ color: '#4CAF50', marginTop: '30px' }}>Example Questions</h4>
        <ul style={{ lineHeight: '1.6' }}>
          <li>Does this solution truly address the root cause of the problem?</li>
          <li>How exactly would AI solve this problem?</li>
          <li>What data or inputs would it need?</li>
          <li>What would a user's experience look like?</li>
          <li>Are there any unintended consequences of implementing this AI solution?</li>
          <li>How well does this idea integrate with existing workflows?</li>
          <li>How might this idea scale to handle larger or more complex problems?</li>
          <li>What additional features or improvements could make this solution more impactful?</li>
        </ul>
      </div>

      {/* Right Panel - Form */}
      <div style={{ 
        flex: 1,
        marginBottom: '20px', 
        padding: '20px', 
        border: '1px solid white', 
        borderRadius: '8px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>Give & Get Feedback</h2>
          {saveStatus && (
            <div style={{
              padding: '5px 10px',
              borderRadius: '4px',
              backgroundColor: saveStatus.includes('Error') ? '#ff4444' : '#4CAF50',
              color: 'white',
              fontSize: '14px'
            }}>
              {saveStatus}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {errors.share && <p style={{ color: 'red' }}>{errors.share}</p>}
          <label htmlFor="share">Share Your Solution</label>
          <textarea
            id="share"
            value={share}
            onChange={(e) => setShare(e.target.value)}
            placeholder="Explain your problem statement and chosen solution"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.requestFeedback && <p style={{ color: 'red' }}>{errors.requestFeedback}</p>}
          <label htmlFor="requestFeedback">Request Feedback</label>
          <textarea
            id="requestFeedback"
            value={requestFeedback}
            onChange={(e) => setRequestFeedback(e.target.value)}
            placeholder="What specific aspects would you like feedback on?"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.giveFeedback && <p style={{ color: 'red' }}>{errors.giveFeedback}</p>}
          <label htmlFor="giveFeedback">Give Feedback</label>
          <textarea
            id="giveFeedback"
            value={giveFeedback}
            onChange={(e) => setGiveFeedback(e.target.value)}
            placeholder="What feedback did you give to others?"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.capture && <p style={{ color: 'red' }}>{errors.capture}</p>}
          <label htmlFor="capture">Capture Insights</label>
          <textarea
            id="capture"
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            placeholder="Note the most valuable feedback and insights received"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />
        </div>
      </div>
    </div>
  );
}

export default GiveGetFeedback;