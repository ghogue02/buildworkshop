import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, withRetry } from './supabaseClient';

function PresentationsRetro({ onSave, sessionId }) {
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [demo, setDemo] = useState('');
  const [journey, setJourney] = useState('');
  const [impact, setImpact] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const isMounted = useRef(true);
  const lastSaveTime = useRef(null);
  const saveAttempts = useRef(0);

  // Debug logging function
  const debugLog = (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[PresentationsRetro Debug ${timestamp}] ${message}`;
    
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
          debugLog('Fetching Presentations & Retro data from Supabase');
          return await supabase
            .from('user_inputs')
            .select('input_data')
            .eq('session_id', sessionId)
            .eq('section_name', 'Presentations & Retro')
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
          setProblem(data.input_data.problem || '');
          setSolution(data.input_data.solution || '');
          setDemo(data.input_data.demo || '');
          setJourney(data.input_data.journey || '');
          setImpact(data.input_data.impact || '');
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
    if (!problem.trim()) newErrors.problem = 'Problem statement is required';
    if (!solution.trim()) newErrors.solution = 'Solution explanation is required';
    if (!demo.trim()) newErrors.demo = 'Demo description is required';
    if (!journey.trim()) newErrors.journey = 'Journey reflection is required';
    if (!impact.trim()) newErrors.impact = 'Impact statement is required';
    
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
    if (!problem.trim() && !solution.trim() && !demo.trim() && 
        !journey.trim() && !impact.trim()) {
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
        section_name: 'Presentations & Retro',
        data: { problem, solution, demo, journey, impact }
      });

      // First check if a record already exists
      debugLog('Checking if record exists');
      const { data: existingData, error: fetchError } = await withRetry(async () => {
        return await supabase
          .from('user_inputs')
          .select('id')
          .eq('session_id', sessionId)
          .eq('section_name', 'Presentations & Retro')
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
                problem,
                solution,
                demo,
                journey,
                impact
              },
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('section_name', 'Presentations & Retro');
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
              section_name: 'Presentations & Retro',
              input_data: {
                problem,
                solution,
                demo,
                journey,
                impact
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
        onSave('Presentations & Retro', {
          problem,
          solution,
          demo,
          journey,
          impact
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
  }, [sessionId, problem, solution, demo, journey, impact, onSave]);

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
  }, [problem, solution, demo, journey, impact, saveData, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid white', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>2-Minute Demo Guide</h2>
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
        {errors.problem && <p style={{ color: 'red' }}>{errors.problem}</p>}
        <label htmlFor="problem">🎯 Problem (20 sec)</label>
        <textarea
          id="problem"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="State the issue and why it matters"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        {errors.solution && <p style={{ color: 'red' }}>{errors.solution}</p>}
        <label htmlFor="solution">💡 Solution (25 sec)</label>
        <textarea
          id="solution"
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          placeholder="Explain your product and what makes it unique"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        {errors.demo && <p style={{ color: 'red' }}>{errors.demo}</p>}
        <label htmlFor="demo">🚀 Demo (50 sec)</label>
        <textarea
          id="demo"
          value={demo}
          onChange={(e) => setDemo(e.target.value)}
          placeholder="Show your solution in action with key features"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        {errors.journey && <p style={{ color: 'red' }}>{errors.journey}</p>}
        <label htmlFor="journey">📈 Journey (25 sec)</label>
        <textarea
          id="journey"
          value={journey}
          onChange={(e) => setJourney(e.target.value)}
          placeholder="Share biggest challenge and what you learned"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        {errors.impact && <p style={{ color: 'red' }}>{errors.impact}</p>}
        <label htmlFor="impact">✨ Impact (10 sec)</label>
        <textarea
          id="impact"
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          placeholder="End with how your solution helps people"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
          👉 Remember: Practice timing and focus on showing, not just telling!
        </p>
      </div>
    </div>
  );
}

export default PresentationsRetro;