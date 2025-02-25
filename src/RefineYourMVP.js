import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, withRetry } from './supabaseClient';

function RefineYourMVP({ onSave, sessionId }) {
  const [feedbackIntegration, setFeedbackIntegration] = useState('');
  const [aiEnhancement, setAiEnhancement] = useState('');
  const [productRefinement, setProductRefinement] = useState('');
  const [keyImprovements, setKeyImprovements] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const isMounted = useRef(true);
  const lastSaveTime = useRef(null);
  const saveAttempts = useRef(0);

  // Debug logging function
  const debugLog = (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[RefineYourMVP Debug ${timestamp}] ${message}`;
    
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
          debugLog('Fetching Refine Your MVP data from Supabase');
          return await supabase
            .from('user_inputs')
            .select('input_data')
            .eq('session_id', sessionId)
            .eq('section_name', 'Refine Your MVP')
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
          setFeedbackIntegration(data.input_data.feedbackIntegration || '');
          setAiEnhancement(data.input_data.aiEnhancement || '');
          setProductRefinement(data.input_data.productRefinement || '');
          setKeyImprovements(data.input_data.keyImprovements || '');
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
    if (!feedbackIntegration.trim()) newErrors.feedbackIntegration = 'Feedback Integration is required';
    if (!aiEnhancement.trim()) newErrors.aiEnhancement = 'AI Enhancement is required';
    if (!productRefinement.trim()) newErrors.productRefinement = 'Product Refinement is required';
    if (!keyImprovements.trim()) newErrors.keyImprovements = 'Key Improvements is required';
    
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
    if (!feedbackIntegration.trim() && !aiEnhancement.trim() && 
        !productRefinement.trim() && !keyImprovements.trim()) {
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
        section_name: 'Refine Your MVP',
        data: { feedbackIntegration, aiEnhancement, productRefinement, keyImprovements }
      });

      // First check if a record already exists
      debugLog('Checking if record exists');
      const { data: existingData, error: fetchError } = await withRetry(async () => {
        return await supabase
          .from('user_inputs')
          .select('id')
          .eq('session_id', sessionId)
          .eq('section_name', 'Refine Your MVP')
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
                feedbackIntegration,
                aiEnhancement,
                productRefinement,
                keyImprovements
              },
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('section_name', 'Refine Your MVP');
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
              section_name: 'Refine Your MVP',
              input_data: {
                feedbackIntegration,
                aiEnhancement,
                productRefinement,
                keyImprovements
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
        onSave('Refine Your MVP', {
          feedbackIntegration,
          aiEnhancement,
          productRefinement,
          keyImprovements
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
  }, [sessionId, feedbackIntegration, aiEnhancement, productRefinement, keyImprovements, onSave]);

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
  }, [feedbackIntegration, aiEnhancement, productRefinement, keyImprovements, saveData, loading]);

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
        <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Refine Your MVP (20 min)</h3>
        
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          By the end of this part, your goal is to have a refined product idea based on the feedback you received.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ 
            color: '#4CAF50', 
            fontWeight: 'bold',
            marginBottom: '5px' 
          }}>Exercise: Refine your product MVP based on feedback</p>
          
          <ul style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            <li><strong>Feedback Integration:</strong> "Most helpful feedback and how I used it..."</li>
            <li><strong>AI Enhancement:</strong> "How I made the AI solution more practical..."</li>
            <li><strong>Product Refinement:</strong> "Key changes that improved my original idea..."</li>
            <li><strong>Key Improvements:</strong> Updates to functionality, experience, technology, audience</li>
          </ul>
        </div>

        <p style={{ 
          marginTop: '20px',
          fontStyle: 'italic',
          color: '#888'
        }}>
          Remember: Show how feedback transformed your concept into something better!
        </p>
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
          <h2>Refine Your MVP</h2>
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
          {errors.feedbackIntegration && <p style={{ color: 'red' }}>{errors.feedbackIntegration}</p>}
          <label htmlFor="feedbackIntegration">Feedback Integration</label>
          <textarea
            id="feedbackIntegration"
            value={feedbackIntegration}
            onChange={(e) => setFeedbackIntegration(e.target.value)}
            placeholder="What was the most helpful feedback and how did you use it?"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.aiEnhancement && <p style={{ color: 'red' }}>{errors.aiEnhancement}</p>}
          <label htmlFor="aiEnhancement">AI Enhancement</label>
          <textarea
            id="aiEnhancement"
            value={aiEnhancement}
            onChange={(e) => setAiEnhancement(e.target.value)}
            placeholder="How did you make the AI solution more practical?"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.productRefinement && <p style={{ color: 'red' }}>{errors.productRefinement}</p>}
          <label htmlFor="productRefinement">Product Refinement</label>
          <textarea
            id="productRefinement"
            value={productRefinement}
            onChange={(e) => setProductRefinement(e.target.value)}
            placeholder="What key changes improved your original idea?"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.keyImprovements && <p style={{ color: 'red' }}>{errors.keyImprovements}</p>}
          <label htmlFor="keyImprovements">Key Improvements</label>
          <textarea
            id="keyImprovements"
            value={keyImprovements}
            onChange={(e) => setKeyImprovements(e.target.value)}
            placeholder="What updates did you make to functionality, experience, technology, or audience?"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />
        </div>
      </div>
    </div>
  );
}

export default RefineYourMVP;