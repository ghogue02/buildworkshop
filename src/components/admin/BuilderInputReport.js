import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

function BuilderInputReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [builderData, setBuilderData] = useState(null);
  const [sectionCounts, setSectionCounts] = useState({});

  useEffect(() => {
    loadBuilderData();
  }, []);

  const loadBuilderData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all user inputs
      const { data: inputs, error } = await supabase
        .from('user_inputs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by section
      const sectionData = {};
      const counts = {};
      
      inputs.forEach(input => {
        if (!sectionData[input.section_name]) {
          sectionData[input.section_name] = [];
          counts[input.section_name] = 0;
        }
        sectionData[input.section_name].push(input);
        counts[input.section_name]++;
      });
      
      setBuilderData(sectionData);
      setSectionCounts(counts);
    } catch (error) {
      console.error('Error loading builder data:', error);
      setError('Failed to load builder data');
    } finally {
      setLoading(false);
    }
  };

  const SectionCard = ({ title, count, data }) => (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: 0, color: '#4CAF50' }}>{title}</h3>
        <div style={{
          backgroundColor: '#333',
          padding: '5px 10px',
          borderRadius: '20px',
          fontSize: '14px'
        }}>
          {count} entries
        </div>
      </div>
      
      <div>
        <h4>Common Words:</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {extractCommonWords(data).map((word, index) => (
            <div key={index} style={{
              backgroundColor: '#333',
              padding: '5px 10px',
              borderRadius: '20px',
              fontSize: '14px'
            }}>
              {word}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Simple function to extract common words from section data
  const extractCommonWords = (sectionData) => {
    if (!sectionData || sectionData.length === 0) return [];
    
    const words = {};
    const stopWords = new Set(['and', 'the', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'have', 'more', 'an', 'was', 'we', 'will', 'can', 'all', 'they', 'their']);
    
    sectionData.forEach(input => {
      const text = JSON.stringify(input.input_data).toLowerCase();
      const matches = text.match(/\b[a-z]{4,}\b/g) || [];
      
      matches.forEach(word => {
        if (!stopWords.has(word)) {
          words[word] = (words[word] || 0) + 1;
        }
      });
    });
    
    return Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);
  };

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  if (loading || !builderData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
        Loading builder data...
      </div>
    );
  }

  // Calculate completion funnel
  const sectionOrder = [
    'User Info',
    'Problem Definition',
    'MVP Planner',
    'Give & Get Feedback',
    'Refine Your MVP',
    'Start Build',
    'Presentations & Retro'
  ];
  
  const maxCount = Math.max(...Object.values(sectionCounts), 1);

  return (
    <div style={{ color: 'white' }}>
      <h2 style={{ marginBottom: '30px' }}>Builder Input Analysis</h2>

      {/* Completion Funnel */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>Completion Funnel</h3>
        <div>
          {sectionOrder.map(section => {
            const count = sectionCounts[section] || 0;
            const percentage = ((count / maxCount) * 100).toFixed(1);
            
            return (
              <div key={section} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '15px'
              }}>
                <div style={{ minWidth: '200px' }}>{section}</div>
                <div style={{
                  flex: 1,
                  height: '20px',
                  backgroundColor: '#333',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: '#4CAF50',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ minWidth: '100px' }}>
                  {count} ({percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section Analysis */}
      <div>
        <h3 style={{ marginBottom: '20px' }}>Section Insights</h3>
        
        {sectionOrder.map(section => (
          builderData[section] && (
            <SectionCard
              key={section}
              title={section}
              count={sectionCounts[section] || 0}
              data={builderData[section]}
            />
          )
        ))}
      </div>
    </div>
  );
}

export default BuilderInputReport;