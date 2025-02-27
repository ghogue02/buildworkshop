import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, withRetry } from './supabaseClient';

function ProblemDefinition({ onSave, sessionId }) {
  const [summary, setSummary] = useState('');
  const [context, setContext] = useState('');
  const [impact, setImpact] = useState('');
  const [rootCauses, setRootCauses] = useState('');
  const [outcome, setOutcome] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const [connectionError, setConnectionError] = useState(null); // Added for connection error tracking
  const isMounted = useRef(true);
  const lastSaveTime = useRef(null);
  const saveAttempts = useRef(0);

  // Debug logging function
  const debugLog = (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[ProblemDefinition Debug ${timestamp}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  };

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading && isMounted.current) {
        debugLog('Loading timeout reached, forcing loading state to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [loading]);

  // Load existing data
  useEffect(() => {
    const loadExistingData = async () => {
      if (!sessionId) {
        debugLog('No sessionId provided, skipping data load');
        setLoading(false); // Ensure loading is set to false even if no sessionId
        return;
      }

      debugLog(`Loading existing data for session ${sessionId}`);
      setConnectionError(null); // Reset connection error
      try {
        // Use withRetry for better reliability
        const { data, error } = await withRetry(async () => {
          debugLog('Fetching Problem Definition data from Supabase');
          return await supabase
            .from('user_inputs')
            .select('input_data')
            .eq('session_id', sessionId)
            .eq('section_name', 'Problem Definition')
            .maybeSingle();
        }, 3, 2000);

        if (error) {
          if (error.code !== 'PGRST116') {
            debugLog(`Error fetching data: ${error.code}`, error);
            setConnectionError(`Database error: ${error.message}`);
            throw error;
          } else {
            debugLog('No existing data found (PGRST116)');
          }
        }

        if (data?.input_data) {
          debugLog('Data loaded successfully', data.input_data);
          setSummary(data.input_data.summary || '');
          setContext(data.input_data.context || '');
          setImpact(data.input_data.impact || '');
          setRootCauses(data.input_data.rootCauses || '');
          setOutcome(data.input_data.outcome || '');
        } else {
          debugLog('No data or empty data returned, initializing with defaults');
          // Initialize with default values
          setSummary('');
          setContext('');
          setImpact('');
          setRootCauses('');
          setOutcome('');
        }
      } catch (error) {
        debugLog('Error loading data:', error);
        console.error('Error loading data:', error);
        // Initialize with default values on error
        setSummary('');
        setContext('');
        setImpact('');
        setRootCauses('');
        setOutcome('');
        
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          const errorMsg = 'Network error: Could not connect to Supabase. Please check your internet connection.';
          debugLog(errorMsg);
          setConnectionError(errorMsg);
        }
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
    if (!summary.trim()) newErrors.summary = 'Summary is required';
    if (!context.trim()) newErrors.context = 'Context is required';
    if (!impact.trim()) newErrors.impact = 'Impact is required';
    if (!rootCauses.trim()) newErrors.rootCauses = 'Root Causes is required';
    if (!outcome.trim()) newErrors.outcome = 'Outcome is required';
    
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
    if (!summary.trim() && !context.trim() && !impact.trim() && !rootCauses.trim() && !outcome.trim()) {
      debugLog('No content to save, all fields are empty');
      return;
    }

    // Track time since last save
    const timeSinceLastSave = lastSaveTime.current
      ? currentTime - lastSaveTime.current
      : null;
    
    debugLog(`Time since last save: ${timeSinceLastSave ? `${timeSinceLastSave}ms` : 'First save'}`);
    
    setSaveStatus('Saving...');
    setConnectionError(null); // Reset connection error
    try {
      debugLog('Preparing data for save', {
        session_id: sessionId,
        section_name: 'Problem Definition',
        data: { summary, context, impact, rootCauses, outcome }
      });

      // First check if a record already exists
      debugLog('Checking if record exists');
      const { data: existingData, error: fetchError } = await withRetry(async () => {
        return await supabase
          .from('user_inputs')
          .select('id')
          .eq('session_id', sessionId)
          .eq('section_name', 'Problem Definition')
          .maybeSingle();
      }, 3, 2000);

      if (fetchError) {
        debugLog('Error checking for existing data:', fetchError);
        setConnectionError(`Database error: ${fetchError.message}`);
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
                summary,
                context,
                impact,
                rootCauses,
                outcome
              },
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('section_name', 'Problem Definition');
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
              section_name: 'Problem Definition',
              input_data: {
                summary,
                context,
                impact,
                rootCauses,
                outcome
              }
            });
        }, 3, 2000);
        
        error = insertError;
      }

      if (error) {
        debugLog('Database operation failed:', error);
        setConnectionError(`Database operation failed: ${error.message}`);
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
        onSave('Problem Definition', {
          summary,
          context,
          impact,
          rootCauses,
          outcome
        });
      }
    } catch (error) {
      debugLog('Error saving data:', error);
      console.error('Error saving data:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        const errorMsg = 'Network error: Could not connect to the database. Please check your internet connection.';
        debugLog(errorMsg);
        setConnectionError(errorMsg);
        setSaveStatus(`Error: Failed to connect to database`);
      } else {
        setSaveStatus(`Error: ${error.message || 'Failed to save'}`);
      }
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        if (isMounted.current) {
          setSaveStatus(null);
        }
      }, 5000);
    }
  }, [sessionId, summary, context, impact, rootCauses, outcome, onSave]);

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
  }, [summary, context, impact, rootCauses, outcome, saveData, loading]);

  // Display connection error if present
  const renderConnectionError = () => {
    if (!connectionError) return null;
    
    return (
      <div style={{
        backgroundColor: '#ff4444',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '20px',
        width: '100%'
      }}>
        <strong>Connection Error:</strong> {connectionError}
      </div>
    );
  };

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
      {/* Left Panel - P.A.I.N. Framework */}
      <div style={{ 
        flex: '0 0 300px',
        padding: '20px',
        border: '1px solid white',
        borderRadius: '8px',
        backgroundColor: '#1a1a1a',
        height: 'fit-content'
      }}>
        <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Problem Solving Framework</h3>
        
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          It's critical to learn how to think about problems and solve them conceptually.
          This will be even more important in a future where AI does the coding.
          You'll need to decide on the best option and how to actually solve the problem.
        </p>

        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          There are many problem solving frameworks.
          Today, we'll use: <strong>P.A.I.N.</strong>
        </p>

        <div style={{ marginLeft: '10px' }}>
          <p style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#4CAF50' }}>P</strong>roblem: State and define the problem
          </p>
          <p style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#4CAF50' }}>A</strong>nalyze: Identify root causes and constraints
          </p>
          <p style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#4CAF50' }}>I</strong>deate: Brainstorm solutions
          </p>
          <p style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#4CAF50' }}>N</strong>ext Steps: Define the implementation
          </p>
        </div>
      </div>

      {/* Right Panel - Problem Definition Form */}
      <div style={{ 
        flex: 1,
        marginBottom: '20px', 
        padding: '20px', 
        border: '1px solid white', 
        borderRadius: '8px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>Problem Definition</h2>
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
        {renderConnectionError()}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {errors.summary && <p style={{ color: 'red' }}>{errors.summary}</p>}
          <label htmlFor="summary">Summary (One-sentence description)</label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="e.g., Chaotic mornings cause stress and lateness"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.context && <p style={{ color: 'red' }}>{errors.context}</p>}
          <label htmlFor="context">Context (Why it happens)</label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., No planning, hitting snooze, rushing through breakfast"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.impact && <p style={{ color: 'red' }}>{errors.impact}</p>}
          <label htmlFor="impact">Impact (Who it affects and consequences)</label>
          <textarea
            id="impact"
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            placeholder="e.g., Students/workers have less energy and focus"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.rootCauses && <p style={{ color: 'red' }}>{errors.rootCauses}</p>}
          <label htmlFor="rootCauses">Root Causes (Main reasons behind the problem)</label>
          <textarea
            id="rootCauses"
            value={rootCauses}
            onChange={(e) => setRootCauses(e.target.value)}
            placeholder="e.g., Poor planning, no structure, distractions"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.outcome && <p style={{ color: 'red' }}>{errors.outcome}</p>}
          <label htmlFor="outcome">Outcome (What success looks like)</label>
          <textarea
            id="outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g., People follow routines and start days energized"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />
        </div>
      </div>
    </div>
  );
}

export default ProblemDefinition;