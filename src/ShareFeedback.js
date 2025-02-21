import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

function ShareFeedback({ onSave, sessionId }) {
  const [share, setShare] = useState('');
  const [requestFeedback, setRequestFeedback] = useState('');
  const [giveFeedback, setGiveFeedback] = useState('');
  const [capture, setCapture] = useState('');
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
          .eq('section_name', 'Share Feedback')
          .single();

        if (error) throw error;

        if (data?.input_data) {
          setShare(data.input_data.share || '');
          setRequestFeedback(data.input_data.requestFeedback || '');
          setGiveFeedback(data.input_data.giveFeedback || '');
          setCapture(data.input_data.capture || '');
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
    if (!share.trim()) newErrors.share = 'Share section is required';
    if (!requestFeedback.trim()) newErrors.requestFeedback = 'Request Feedback section is required';
    if (!giveFeedback.trim()) newErrors.giveFeedback = 'Give Feedback section is required';
    if (!capture.trim()) newErrors.capture = 'Capture section is required';
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
          section_name: 'Share Feedback',
          input_data: {
            share,
            requestFeedback,
            giveFeedback,
            capture
          }
        }, {
          onConflict: 'session_id,section_name'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving data:', error.message);
    }
  }, [sessionId, share, requestFeedback, giveFeedback, capture]);

  // Debounce save after 1 second of no changes
  useEffect(() => {
    if (loading) return; // Don't save while initial data is loading
    
    const timer = setTimeout(() => {
      saveData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [share, requestFeedback, giveFeedback, capture, saveData, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid white', borderRadius: '8px' }}>
      <h2>👥 Peer Feedback Session Guide (45 min)</h2>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {errors.share && <p style={{ color: 'red' }}>{errors.share}</p>}
        <label htmlFor="share">📣 Share (5 min/person)</label>
        <textarea
          id="share"
          value={share}
          onChange={(e) => setShare(e.target.value)}
          placeholder="Problem statement, why you care, solution concept"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        {errors.requestFeedback && <p style={{ color: 'red' }}>{errors.requestFeedback}</p>}
        <label htmlFor="requestFeedback">🔍 Request Feedback (4 min/person)</label>
        <textarea
          id="requestFeedback"
          value={requestFeedback}
          onChange={(e) => setRequestFeedback(e.target.value)}
          placeholder="Ask about clarity, confusion, weaknesses, alternatives"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        {errors.giveFeedback && <p style={{ color: 'red' }}>{errors.giveFeedback}</p>}
        <label htmlFor="giveFeedback">💬 Give Feedback</label>
        <textarea
          id="giveFeedback"
          value={giveFeedback}
          onChange={(e) => setGiveFeedback(e.target.value)}
          placeholder="Start positive, ask questions about users, challenges, specific situations"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        {errors.capture && <p style={{ color: 'red' }}>{errors.capture}</p>}
        <label htmlFor="capture">📝 Capture (2 min)</label>
        <textarea
          id="capture"
          value={capture}
          onChange={(e) => setCapture(e.target.value)}
          placeholder="Note best suggestions, new ideas, planned improvements"
          style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
        />

        <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
          🌟 Remember: Goal is making ideas stronger through different perspectives!
        </p>
      </div>
    </div>
  );
}

export default ShareFeedback;