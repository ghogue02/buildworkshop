import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

function RefineYourMVP({ onSave, sessionId }) {
  const [feedbackIntegration, setFeedbackIntegration] = useState('');
  const [aiEnhancement, setAiEnhancement] = useState('');
  const [productRefinement, setProductRefinement] = useState('');
  const [keyImprovements, setKeyImprovements] = useState('');
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
          .eq('section_name', 'Refine Your MVP')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data?.input_data) {
          setFeedbackIntegration(data.input_data.feedbackIntegration || '');
          setAiEnhancement(data.input_data.aiEnhancement || '');
          setProductRefinement(data.input_data.productRefinement || '');
          setKeyImprovements(data.input_data.keyImprovements || '');
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
    if (!feedbackIntegration.trim()) newErrors.feedbackIntegration = 'Feedback Integration is required';
    if (!aiEnhancement.trim()) newErrors.aiEnhancement = 'AI Enhancement is required';
    if (!productRefinement.trim()) newErrors.productRefinement = 'Product Refinement is required';
    if (!keyImprovements.trim()) newErrors.keyImprovements = 'Key Improvements is required';
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
          section_name: 'Refine Your MVP',
          input_data: {
            feedbackIntegration,
            aiEnhancement,
            productRefinement,
            keyImprovements
          }
        }, {
          onConflict: 'session_id,section_name'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving data:', error.message);
    }
  }, [sessionId, feedbackIntegration, aiEnhancement, productRefinement, keyImprovements]);

  // Debounce save after 1 second of no changes
  useEffect(() => {
    if (loading) return; // Don't save while initial data is loading
    
    const timer = setTimeout(() => {
      saveData();
    }, 1000);

    return () => clearTimeout(timer);
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
        <h2>Refine Your MVP</h2>
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