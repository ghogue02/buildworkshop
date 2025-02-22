import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

function MVPPlanner({ onSave, sessionId }) {
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
          .eq('section_name', 'MVP Planner')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

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
      newErrors.aiOptions = 'At least one idea is required';
    }
    if (!howItWorks.trim()) {
      newErrors.howItWorks = 'How It Works is required';
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
          section_name: 'MVP Planner',
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
        <h2>MVP Planner</h2>
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