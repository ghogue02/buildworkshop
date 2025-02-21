import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

function PresentationsRetro({ onSave, sessionId }) {
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [demo, setDemo] = useState('');
  const [journey, setJourney] = useState('');
  const [impact, setImpact] = useState('');
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
          .eq('section_name', 'Presentations & Retro')
          .single();

        if (error) throw error;

        if (data?.input_data) {
          setProblem(data.input_data.problem || '');
          setSolution(data.input_data.solution || '');
          setDemo(data.input_data.demo || '');
          setJourney(data.input_data.journey || '');
          setImpact(data.input_data.impact || '');
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
    if (!problem.trim()) newErrors.problem = 'Problem statement is required';
    if (!solution.trim()) newErrors.solution = 'Solution explanation is required';
    if (!demo.trim()) newErrors.demo = 'Demo description is required';
    if (!journey.trim()) newErrors.journey = 'Journey reflection is required';
    if (!impact.trim()) newErrors.impact = 'Impact statement is required';
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
          section_name: 'Presentations & Retro',
          input_data: {
            problem,
            solution,
            demo,
            journey,
            impact
          }
        }, {
          onConflict: 'session_id,section_name'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving data:', error.message);
    }
  }, [sessionId, problem, solution, demo, journey, impact]);

  // Debounce save after 1 second of no changes
  useEffect(() => {
    if (loading) return; // Don't save while initial data is loading
    
    const timer = setTimeout(() => {
      saveData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [problem, solution, demo, journey, impact, saveData, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid white', borderRadius: '8px' }}>
      <h2>2-Minute Demo Guide</h2>
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