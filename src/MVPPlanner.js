import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, withRetry } from './supabaseClient';

function MVPPlanner({ onSave, sessionId }) {
  const [aiOptions, setAiOptions] = useState(['', '', '']);
  const [howItWorks, setHowItWorks] = useState('');
  const [dataNeeds, setDataNeeds] = useState('');
  const [userExperience, setUserExperience] = useState('');
  const [valueProposition, setValueProposition] = useState('');
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
    const logMessage = `[MVPPlanner Debug ${timestamp}] ${message}`;
    
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
          debugLog('Fetching MVP Planner data from Supabase');
          return await supabase
            .from('user_inputs')
            .select('input_data')
            .eq('session_id', sessionId)
            .eq('section_name', 'MVP Planner')
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
          setAiOptions(data.input_data.aiOptions || ['', '', '']);
          setHowItWorks(data.input_data.howItWorks || '');
          setDataNeeds(data.input_data.dataNeeds || '');
          setUserExperience(data.input_data.userExperience || '');
          setValueProposition(data.input_data.valueProposition || '');
        } else {
          debugLog('No data or empty data returned, initializing with defaults');
          // Initialize with default values
          setAiOptions(['', '', '']);
          setHowItWorks('');
          setDataNeeds('');
          setUserExperience('');
          setValueProposition('');
        }
      } catch (error) {
        debugLog('Error loading data:', error);
        console.error('Error loading data:', error);
        // Initialize with default values on error
        setAiOptions(['', '', '']);
        setHowItWorks('');
        setDataNeeds('');
        setUserExperience('');
        setValueProposition('');
        
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
    if (!aiOptions[0].trim()) {
      newErrors.aiOptions = 'At least one idea is required';
    }
    if (!howItWorks.trim()) {
      newErrors.howItWorks = 'How It Works is required';
    }
    
    const isValid = Object.keys(newErrors).length === 0;
    debugLog(`Validation result: ${isValid ? 'Valid' : 'Invalid'}`, newErrors);
    
    setErrors(newErrors);
    return isValid;
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...aiOptions];
    newOptions[index] = value;
    setAiOptions(newOptions);
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
    if (!aiOptions[0].trim() && !howItWorks.trim() && !dataNeeds.trim() &&
        !userExperience.trim() && !valueProposition.trim()) {
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
        section_name: 'MVP Planner',
        data: { aiOptions, howItWorks, dataNeeds, userExperience, valueProposition }
      });

      // First check if a record already exists
      debugLog('Checking if record exists');
      const { data: existingData, error: fetchError } = await withRetry(async () => {
        return await supabase
          .from('user_inputs')
          .select('id')
          .eq('session_id', sessionId)
          .eq('section_name', 'MVP Planner')
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
                aiOptions,
                howItWorks,
                dataNeeds,
                userExperience,
                valueProposition
              },
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('section_name', 'MVP Planner');
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
              section_name: 'MVP Planner',
              input_data: {
                aiOptions,
                howItWorks,
                dataNeeds,
                userExperience,
                valueProposition
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
        onSave('MVP Planner', {
          aiOptions,
          howItWorks,
          dataNeeds,
          userExperience,
          valueProposition
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
  }, [sessionId, aiOptions, howItWorks, dataNeeds, userExperience, valueProposition, onSave]);

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
  }, [aiOptions, howItWorks, dataNeeds, userExperience, valueProposition, saveData, loading]);

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

  // Show a loading indicator, but only for a short time
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
      {/* Left Panel - Questions */}
      <div style={{ 
        flex: '0 0 300px',
        padding: '20px',
        border: '1px solid white',
        borderRadius: '8px',
        backgroundColor: '#1a1a1a',
        height: 'fit-content'
      }}>
        <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Guiding Questions</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ 
            color: '#4CAF50', 
            fontWeight: 'bold',
            marginBottom: '5px' 
          }}>Ideas:</p>
          <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            What are the different ways AI could solve this problem? What are the pros and cons of each? Which is the best option?
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ 
            color: '#4CAF50', 
            fontWeight: 'bold',
            marginBottom: '5px' 
          }}>Implementation:</p>
          <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            How exactly would AI solve this problem?
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ 
            color: '#4CAF50', 
            fontWeight: 'bold',
            marginBottom: '5px' 
          }}>Data Requirements:</p>
          <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            What data or inputs would it need?
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ 
            color: '#4CAF50', 
            fontWeight: 'bold',
            marginBottom: '5px' 
          }}>User Experience:</p>
          <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            What would a user's experience look like?
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
          <h2>MVP Planner</h2>
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
          {errors.aiOptions && <p style={{ color: 'red' }}>{errors.aiOptions}</p>}
          <label>Ideas (List possibilities, pros/cons of each)</label>
          {aiOptions.map((option, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <label htmlFor={`option-${index}`}>Option {index + 1}:</label>
              <input
                type="text"
                id={`option-${index}`}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                style={{ marginLeft: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', width: 'calc(100% - 100px)' }}
              />
            </div>
          ))}

          {errors.howItWorks && <p style={{ color: 'red' }}>{errors.howItWorks}</p>}
          <label htmlFor="howItWorks">How It Works (Implementation details)</label>
          <textarea
            id="howItWorks"
            value={howItWorks}
            onChange={(e) => setHowItWorks(e.target.value)}
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          <label htmlFor="dataNeeds">Data Needs (Required inputs and sources)</label>
          <textarea
            id="dataNeeds"
            value={dataNeeds}
            onChange={(e) => setDataNeeds(e.target.value)}
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          <label htmlFor="userExperience">User Experience (Interface and interactions)</label>
          <textarea
            id="userExperience"
            value={userExperience}
            onChange={(e) => setUserExperience(e.target.value)}
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          <label htmlFor="valueProposition">Value Proposition</label>
          <textarea
            id="valueProposition"
            value={valueProposition}
            onChange={(e) => setValueProposition(e.target.value)}
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />
        </div>
      </div>
    </div>
  );
}

export default MVPPlanner;