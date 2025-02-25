import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, withRetry } from './supabaseClient';

function StartBuild({ onSave, sessionId }) {
  const [whatBuilt, setWhatBuilt] = useState('');
  const [functionality, setFunctionality] = useState('');
  const [futureAdditions, setFutureAdditions] = useState('');
  const [aiHelp, setAiHelp] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const isMounted = useRef(true);
  const lastSaveTime = useRef(null);
  const saveAttempts = useRef(0);

  // Debug logging function
  const debugLog = (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[StartBuild Debug ${timestamp}] ${message}`;
    
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
          debugLog('Fetching Start Build data from Supabase');
          return await supabase
            .from('user_inputs')
            .select('input_data')
            .eq('session_id', sessionId)
            .eq('section_name', 'Start Build')
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
          setWhatBuilt(data.input_data.whatBuilt || '');
          setFunctionality(data.input_data.functionality || '');
          setFutureAdditions(data.input_data.futureAdditions || '');
          setAiHelp(data.input_data.aiHelp || '');
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
    if (!whatBuilt.trim()) newErrors.whatBuilt = 'What you built is required';
    if (!functionality.trim()) newErrors.functionality = 'Functionality is required';
    if (!futureAdditions.trim()) newErrors.futureAdditions = 'Future additions is required';
    if (!aiHelp.trim()) newErrors.aiHelp = 'AI help description is required';
    
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
    
    if (!validate()) {
      debugLog('Validation failed, not saving');
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
        section_name: 'Start Build',
        data: { whatBuilt, functionality, futureAdditions, aiHelp }
      });

      // First check if a record already exists
      debugLog('Checking if record exists');
      const { data: existingData, error: fetchError } = await withRetry(async () => {
        return await supabase
          .from('user_inputs')
          .select('id')
          .eq('session_id', sessionId)
          .eq('section_name', 'Start Build')
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
                whatBuilt,
                functionality,
                futureAdditions,
                aiHelp
              },
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('section_name', 'Start Build');
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
              section_name: 'Start Build',
              input_data: {
                whatBuilt,
                functionality,
                futureAdditions,
                aiHelp
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
        onSave('Start Build', {
          whatBuilt,
          functionality,
          futureAdditions,
          aiHelp
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
  }, [sessionId, whatBuilt, functionality, futureAdditions, aiHelp, onSave]);

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
  }, [whatBuilt, functionality, futureAdditions, aiHelp, saveData, loading]);

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
      {/* Left Panel - Instructions */}
      <div style={{ 
        flex: '0 0 300px',
        padding: '20px',
        border: '1px solid white',
        borderRadius: '8px',
        backgroundColor: '#1a1a1a',
        height: 'fit-content'
      }}>
        <h3 style={{ color: '#4CAF50', marginTop: 0 }}>⏱️ 60-Minute Build Sprint</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ 
            marginBottom: '20px',
            lineHeight: '1.6' 
          }}>
            <strong>Exercise:</strong>
          </p>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            Use AI to build a website that displays your problem statement. This can be as simple or as complex as you want. You can use AI to add style (color, fonts, etc) to the website. Feel free to be creative. Do not write any code/syntax. Use AI to troubleshoot.
          </p>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            If you complete part 1, feel free to explore. Try building a simple demo or generate mockups of your MVP. You can start to build your MVP or create a compelling way to present the solution.
          </p>
        </div>
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
          <h2>Build Progress</h2>
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
          {errors.whatBuilt && <p style={{ color: 'red' }}>{errors.whatBuilt}</p>}
          <label htmlFor="whatBuilt">What did you build?</label>
          <textarea
            id="whatBuilt"
            value={whatBuilt}
            onChange={(e) => setWhatBuilt(e.target.value)}
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.functionality && <p style={{ color: 'red' }}>{errors.functionality}</p>}
          <label htmlFor="functionality">What functionality did you get in your product?</label>
          <textarea
            id="functionality"
            value={functionality}
            onChange={(e) => setFunctionality(e.target.value)}
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.futureAdditions && <p style={{ color: 'red' }}>{errors.futureAdditions}</p>}
          <label htmlFor="futureAdditions">What would you try to do if you had more time?</label>
          <textarea
            id="futureAdditions"
            value={futureAdditions}
            onChange={(e) => setFutureAdditions(e.target.value)}
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.aiHelp && <p style={{ color: 'red' }}>{errors.aiHelp}</p>}
          <label htmlFor="aiHelp">How did AI help you build?</label>
          <textarea
            id="aiHelp"
            value={aiHelp}
            onChange={(e) => setAiHelp(e.target.value)}
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />
        </div>
      </div>
    </div>
  );
}

export default StartBuild;