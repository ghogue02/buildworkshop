import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

function StartBuild({ onSave, sessionId }) {
  const [setup, setSetup] = useState('');
  const [core, setCore] = useState('');
  const [ux, setUx] = useState('');
  const [testing, setTesting] = useState('');
  const [finalTouches, setFinalTouches] = useState('');
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
          setSetup(data.input_data.setup || '');
          setCore(data.input_data.core || '');
          setUx(data.input_data.ux || '');
          setTesting(data.input_data.testing || '');
          setFinalTouches(data.input_data.finalTouches || '');
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
    if (!setup.trim()) newErrors.setup = 'Setup & Planning is required';
    if (!core.trim()) newErrors.core = 'Core Functionality is required';
    if (!ux.trim()) newErrors.ux = 'User Experience is required';
    if (!testing.trim()) newErrors.testing = 'Testing & Refinement is required';
    if (!finalTouches.trim()) newErrors.finalTouches = 'Final Touches is required';
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
            setup,
            core,
            ux,
            testing,
            finalTouches
          }
        }, {
          onConflict: 'session_id,section_name'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving data:', error.message);
    }
  }, [sessionId, setup, core, ux, testing, finalTouches]);

  // Debounce save after 1 second of no changes
  useEffect(() => {
    if (loading) return; // Don't save while initial data is loading
    
    const timer = setTimeout(() => {
      saveData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [setup, core, ux, testing, finalTouches, saveData, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid white', borderRadius: '8px' }}>
      <h2>⏱️ 75-Minute AI Product Build Sprint</h2>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {errors.setup && <p style={{ color: 'red' }}>{errors.setup}</p>}
        <label htmlFor="setup">⚙️ Setup & Planning (15 min)</label>
        <textarea
          id="setup"
          value={setup}
          onChange={(e) => setSetup(e.target.value)}
          placeholder="Choose platform, identify proof of concept features, have a rough flowchart"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        {errors.core && <p style={{ color: 'red' }}>{errors.core}</p>}
        <label htmlFor="core">🧩 Core Functionality (25 min)</label>
        <textarea
          id="core"
          value={core}
          onChange={(e) => setCore(e.target.value)}
          placeholder="Build a place for inputs, basic AI use, a minimal interface, and a way to store data"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        {errors.ux && <p style={{ color: 'red' }}>{errors.ux}</p>}
        <label htmlFor="ux">👤 User Experience (15 min)</label>
        <textarea
          id="ux"
          value={ux}
          onChange={(e) => setUx(e.target.value)}
          placeholder="Build the interface, adjust slightly using AI prompts, ensure user experience makes sense"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        {errors.testing && <p style={{ color: 'red' }}>{errors.testing}</p>}
        <label htmlFor="testing">🔍 Testing & Refinement (10 min)</label>
        <textarea
          id="testing"
          value={testing}
          onChange={(e) => setTesting(e.target.value)}
          placeholder="Test with sample data, fix bugs that pop up with AI, simplify areas that break down too quickly"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        {errors.finalTouches && <p style={{ color: 'red' }}>{errors.finalTouches}</p>}
        <label htmlFor="finalTouches">🎬 Final Touches (10 min)</label>
        <textarea
          id="finalTouches"
          value={finalTouches}
          onChange={(e) => setFinalTouches(e.target.value)}
          placeholder="Add welcome screen/instructions, finalize for demo, practice explanation"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
          💪 Remember: Focus on demonstrating your core concept, not building everything!
        </p>
      </div>
    </div>
  );
}

export default StartBuild;