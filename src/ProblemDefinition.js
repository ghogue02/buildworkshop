import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

function ProblemDefinition({ onSave, sessionId }) {
  const [summary, setSummary] = useState('');
  const [context, setContext] = useState('');
  const [impact, setImpact] = useState('');
  const [rootCauses, setRootCauses] = useState('');
  const [outcome, setOutcome] = useState('');
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
          .eq('section_name', 'Problem Definition')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data?.input_data) {
          setSummary(data.input_data.summary || '');
          setContext(data.input_data.context || '');
          setImpact(data.input_data.impact || '');
          setRootCauses(data.input_data.rootCauses || '');
          setOutcome(data.input_data.outcome || '');
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
    if (!summary.trim()) newErrors.summary = 'Summary is required';
    if (!context.trim()) newErrors.context = 'Context is required';
    if (!impact.trim()) newErrors.impact = 'Impact is required';
    if (!rootCauses.trim()) newErrors.rootCauses = 'Root Causes is required';
    if (!outcome.trim()) newErrors.outcome = 'Outcome is required';
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
          section_name: 'Problem Definition',
          input_data: {
            summary,
            context,
            impact,
            rootCauses,
            outcome,
          }
        }, {
          onConflict: 'session_id,section_name'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving data:', error.message);
    }
  }, [sessionId, summary, context, impact, rootCauses, outcome]);

  // Debounce save after 1 second of no changes
  useEffect(() => {
    if (loading) return; // Don't save while initial data is loading
    
    const timer = setTimeout(() => {
      saveData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [summary, context, impact, rootCauses, outcome, saveData, loading]);

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
        <h2>Problem Definition</h2>
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