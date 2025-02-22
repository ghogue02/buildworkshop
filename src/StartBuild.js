import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

function StartBuild({ onSave, sessionId }) {
  const [whatBuilt, setWhatBuilt] = useState('');
  const [functionality, setFunctionality] = useState('');
  const [futureAdditions, setFutureAdditions] = useState('');
  const [aiHelp, setAiHelp] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Load existing data
  useEffect(() => {
    const loadExistingData = async () => {
      if (!sessionId) return;

      try {
        const { data, error } = await supabase
          .from('user_inputs')
          .select('input_data')
          .eq('session_id', sessionId)
          .eq('section_name', 'Start Build')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data?.input_data) {
          setWhatBuilt(data.input_data.whatBuilt || '');
          setFunctionality(data.input_data.functionality || '');
          setFutureAdditions(data.input_data.futureAdditions || '');
          setAiHelp(data.input_data.aiHelp || '');
        }
      } catch (error) {
        console.error('Error loading data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    loadExistingData();
  }, [sessionId]);

  const validate = () => {
    let newErrors = {};
    if (!whatBuilt.trim()) newErrors.whatBuilt = 'What you built is required';
    if (!functionality.trim()) newErrors.functionality = 'Functionality is required';
    if (!futureAdditions.trim()) newErrors.futureAdditions = 'Future additions is required';
    if (!aiHelp.trim()) newErrors.aiHelp = 'AI help description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveData = useCallback(async () => {
    if (!sessionId || !validate()) return;

    try {
      const { error } = await supabase
        .from('user_inputs')
        .upsert({
          session_id: sessionId,
          section_name: 'Start Build',
          input_data: {
            whatBuilt,
            functionality,
            futureAdditions,
            aiHelp
          }
        }, {
          onConflict: 'session_id,section_name'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving data:', error.message);
    }
  }, [sessionId, whatBuilt, functionality, futureAdditions, aiHelp]);

  // Debounce save after 1 second of no changes
  useEffect(() => {
    if (loading) return; // Don't save while initial data is loading
    
    const timer = setTimeout(() => {
      saveData();
    }, 1000);

    return () => clearTimeout(timer);
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
        <h2>Build Progress</h2>
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