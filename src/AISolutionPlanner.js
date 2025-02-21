import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

function AISolutionPlanner({ onSave, sessionId }) {
  const [aiOptions, setAiOptions] = useState(['', '', '']);
  const [howItWorks, setHowItWorks] = useState('');
  const [dataNeeds, setDataNeeds] = useState('');
  const [userExperience, setUserExperience] = useState('');
  const [valueProposition, setValueProposition] = useState('');
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
          .eq('section_name', 'AI Solution Planner')
          .single();

        if (error) throw error;

        if (data?.input_data) {
          setAiOptions(data.input_data.aiOptions || ['', '', '']);
          setHowItWorks(data.input_data.howItWorks || '');
          setDataNeeds(data.input_data.dataNeeds || '');
          setUserExperience(data.input_data.userExperience || '');
          setValueProposition(data.input_data.valueProposition || '');
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
    if (!aiOptions[0].trim()) {
      newErrors.aiOptions = 'At least one AI option is required';
    }
    if (!howItWorks.trim()) {
      newErrors.howItWorks = 'How AI Would Work is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...aiOptions];
    newOptions[index] = value;
    setAiOptions(newOptions);
  };

  const saveData = useCallback(async () => {
    if (!sessionId || !validate()) return;

    try {
      const { error } = await supabase
        .from('user_inputs')
        .upsert({
          session_id: sessionId,
          section_name: 'AI Solution Planner',
          input_data: {
            aiOptions,
            howItWorks,
            dataNeeds,
            userExperience,
            valueProposition,
          }
        }, {
          onConflict: 'session_id,section_name'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving data:', error.message);
    }
  }, [sessionId, aiOptions, howItWorks, dataNeeds, userExperience, valueProposition]);

  // Debounce save after 1 second of no changes
  useEffect(() => {
    if (loading) return; // Don't save while initial data is loading
    
    const timer = setTimeout(() => {
      saveData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [aiOptions, howItWorks, dataNeeds, userExperience, valueProposition, saveData, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid white', borderRadius: '8px' }}>
      <h2>AI Solution Planner</h2>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {errors.aiOptions && <p style={{ color: 'red' }}>{errors.aiOptions}</p>}
        <label>AI Options (List possibilities, pros/cons of each)</label>
        {aiOptions.map((option, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <label htmlFor={`option-${index}`}>Option {index + 1}:</label>
            <input
              type="text"
              id={`option-${index}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              style={{ marginLeft: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white' }}
            />
          </div>
        ))}

        {errors.howItWorks && <p style={{ color: 'red' }}>{errors.howItWorks}</p>}
        <label htmlFor="howItWorks">How It Works (Pick technology, map out steps, plan for improvement)</label>
        <textarea
          id="howItWorks"
          value={howItWorks}
          onChange={(e) => setHowItWorks(e.target.value)}
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        <label htmlFor="dataNeeds">Data Needs (User inputs, external sources, privacy considerations)</label>
        <textarea
          id="dataNeeds"
          value={dataNeeds}
          onChange={(e) => setDataNeeds(e.target.value)}
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        <label htmlFor="userExperience">User Experience (Discovery, problem-solving steps, ease of use)</label>
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
  );
}

export default AISolutionPlanner;