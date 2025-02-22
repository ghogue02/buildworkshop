import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

function GiveGetFeedback({ onSave, sessionId }) {
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
          .eq('section_name', 'Give & Get Feedback')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

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
    if (!share.trim()) newErrors.share = 'Share is required';
    if (!requestFeedback.trim()) newErrors.requestFeedback = 'Request Feedback is required';
    if (!giveFeedback.trim()) newErrors.giveFeedback = 'Give Feedback is required';
    if (!capture.trim()) newErrors.capture = 'Capture is required';
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
          section_name: 'Give & Get Feedback',
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
    <div style={{ 
      display: 'flex', 
      gap: '20px',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Left Panel - Instructions and Example Questions */}
      <div style={{ 
        flex: '0 0 300px',
        padding: '20px',
        border: '1px solid white',
        borderRadius: '8px',
        backgroundColor: '#1a1a1a',
        height: 'fit-content'
      }}>
        <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Group Exercise</h3>
        
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          In your group, go around and share:
        </p>
        <ul style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          <li>Your problem statement and why you chose to solve this</li>
          <li>Your product MVP and why you chose this idea</li>
          <li>Ask about clarity, confusion, weaknesses, alternatives</li>
        </ul>

        <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
          <strong style={{ color: '#4CAF50' }}>Give Feedback:</strong> Start positive, ask questions about users, challenges, specific situations
        </p>

        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          <strong style={{ color: '#4CAF50' }}>Capture:</strong> Note best suggestions, new ideas, improvements
        </p>

        <p style={{ marginBottom: '20px', lineHeight: '1.6', fontStyle: 'italic' }}>
          Remember: Goal is making ideas stronger through different perspectives and work as a team!
        </p>

        <h4 style={{ color: '#4CAF50', marginTop: '30px' }}>Example Questions</h4>
        <ul style={{ lineHeight: '1.6' }}>
          <li>Does this solution truly address the root cause of the problem?</li>
          <li>How exactly would AI solve this problem?</li>
          <li>What data or inputs would it need?</li>
          <li>What would a user's experience look like?</li>
          <li>Are there any unintended consequences of implementing this AI solution?</li>
          <li>How well does this idea integrate with existing workflows?</li>
          <li>How might this idea scale to handle larger or more complex problems?</li>
          <li>What additional features or improvements could make this solution more impactful?</li>
        </ul>
      </div>

      {/* Right Panel - Form */}
      <div style={{ 
        flex: 1,
        marginBottom: '20px', 
        padding: '20px', 
        border: '1px solid white', 
        borderRadius: '8px' 
      }}>
        <h2>Give & Get Feedback</h2>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {errors.share && <p style={{ color: 'red' }}>{errors.share}</p>}
          <label htmlFor="share">Share Your Solution</label>
          <textarea
            id="share"
            value={share}
            onChange={(e) => setShare(e.target.value)}
            placeholder="Explain your problem statement and chosen solution"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.requestFeedback && <p style={{ color: 'red' }}>{errors.requestFeedback}</p>}
          <label htmlFor="requestFeedback">Request Feedback</label>
          <textarea
            id="requestFeedback"
            value={requestFeedback}
            onChange={(e) => setRequestFeedback(e.target.value)}
            placeholder="What specific aspects would you like feedback on?"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.giveFeedback && <p style={{ color: 'red' }}>{errors.giveFeedback}</p>}
          <label htmlFor="giveFeedback">Give Feedback</label>
          <textarea
            id="giveFeedback"
            value={giveFeedback}
            onChange={(e) => setGiveFeedback(e.target.value)}
            placeholder="What feedback did you give to others?"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />

          {errors.capture && <p style={{ color: 'red' }}>{errors.capture}</p>}
          <label htmlFor="capture">Capture Insights</label>
          <textarea
            id="capture"
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            placeholder="Note the most valuable feedback and insights received"
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid white', backgroundColor: 'black', color: 'white', height: '100px' }}
          />
        </div>
      </div>
    </div>
  );
}

export default GiveGetFeedback;