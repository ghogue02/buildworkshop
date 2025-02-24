import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  analyzeField, 
  groupByCompletion, 
  compareFieldAnalysis 
} from '../../utils/textAnalysis';

function BuilderInputReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [builderData, setBuilderData] = useState(null);
  const [sectionCounts, setSectionCounts] = useState({});
  const [fieldAnalysis, setFieldAnalysis] = useState({});
  const [comparisonAnalysis, setComparisonAnalysis] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  const sectionOrder = [
    'User Info',
    'Problem Definition',
    'MVP Planner',
    'Give & Get Feedback',
    'Refine Your MVP',
    'Start Build',
    'Presentations & Retro'
  ];

  // Field definitions for structured analysis
  const sectionFields = {
    'Problem Definition': [
      { name: 'summary', label: 'Problem Summary' },
      { name: 'context', label: 'Problem Context' },
      { name: 'impact', label: 'Problem Impact' },
      { name: 'rootCauses', label: 'Root Causes' }
    ],
    'MVP Planner': [
      { name: 'howItWorks', label: 'Solution Approach' },
      { name: 'dataNeeds', label: 'Data Requirements' },
      { name: 'userExperience', label: 'User Experience' },
      { name: 'valueProposition', label: 'Value Proposition' }
    ],
    'Give & Get Feedback': [
      { name: 'requestFeedback', label: 'Feedback Requests' },
      { name: 'giveFeedback', label: 'Feedback Given' },
      { name: 'capture', label: 'Feedback Capture' }
    ],
    'Refine Your MVP': [
      { name: 'feedbackIntegration', label: 'Feedback Integration' },
      { name: 'aiEnhancement', label: 'AI Enhancements' },
      { name: 'productRefinement', label: 'Product Refinements' }
    ],
    'Start Build': [
      { name: 'whatBuilt', label: 'Implementation' },
      { name: 'functionality', label: 'Functionality' },
      { name: 'futureAdditions', label: 'Future Plans' },
      { name: 'aiHelp', label: 'AI Assistance' }
    ],
    'Presentations & Retro': [
      { name: 'problem', label: 'Problem Statement' },
      { name: 'solution', label: 'Solution Description' },
      { name: 'demo', label: 'Demo Approach' },
      { name: 'journey', label: 'Builder Journey' },
      { name: 'impact', label: 'Impact Description' }
    ]
  };

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

      // Perform field analysis
      const analysis = {};
      Object.entries(sectionData).forEach(([section, sectionInputs]) => {
        if (sectionFields[section]) {
          analysis[section] = {};
          sectionFields[section].forEach(field => {
            analysis[section][field.name] = analyzeField(
              sectionInputs, 
              `input_data.${field.name}`, 
              true // use phrases
            );
          });
        }
      });
      setFieldAnalysis(analysis);

      // Perform comparison analysis
      const { completed, incomplete } = groupByCompletion(inputs, sectionOrder);
      const comparison = {};
      
      // Only do comparison if we have both completed and incomplete builders
      if (completed.length > 0 && incomplete.length > 0) {
        Object.entries(sectionFields).forEach(([section, fields]) => {
          comparison[section] = {};
          fields.forEach(field => {
            // Filter inputs for this section
            const sectionCompleted = completed.filter(input => input.section_name === section);
            const sectionIncomplete = incomplete.filter(input => input.section_name === section);
            
            if (sectionCompleted.length > 0 && sectionIncomplete.length > 0) {
              comparison[section][field.name] = compareFieldAnalysis(
                sectionCompleted,
                sectionIncomplete,
                `input_data.${field.name}`
              );
            }
          });
        });
      }
      setComparisonAnalysis(comparison);
    } catch (error) {
      console.error('Error loading builder data:', error);
      setError('Failed to load builder data');
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: '10px 20px',
        backgroundColor: activeTab === id ? '#4CAF50' : '#333',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        margin: '0 5px 20px 0',
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  );

  const PhraseList = ({ phrases, colorScale = false }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {phrases.map(({ item, count }, index) => {
        // Calculate color intensity based on count if colorScale is true
        const bgColor = colorScale 
          ? `rgba(76, 175, 80, ${Math.min(0.3 + (count / phrases[0].count) * 0.7, 1)})`
          : '#333';
        
        return (
          <div key={index} style={{
            backgroundColor: bgColor,
            padding: '5px 10px',
            borderRadius: '20px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span>{item}</span>
            <span style={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );

  const ComparisonList = ({ comparisons }) => (
    <div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 100px 100px',
        gap: '10px',
        marginBottom: '10px',
        fontWeight: 'bold',
        borderBottom: '1px solid #333',
        paddingBottom: '5px'
      }}>
        <div>Phrase</div>
        <div>Completed</div>
        <div>Incomplete</div>
      </div>
      {comparisons.map(({ item, group1Count, group2Count }, index) => (
        <div key={index} style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 100px 100px',
          gap: '10px',
          padding: '8px 0',
          borderBottom: '1px solid #222',
          backgroundColor: index % 2 === 0 ? '#1a1a1a' : 'transparent'
        }}>
          <div>{item}</div>
          <div style={{ color: group1Count > group2Count ? '#4CAF50' : 'white' }}>
            {group1Count}
          </div>
          <div style={{ color: group2Count > group1Count ? '#E91E63' : 'white' }}>
            {group2Count}
          </div>
        </div>
      ))}
    </div>
  );

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
  const maxCount = Math.max(...Object.values(sectionCounts), 1);

  return (
    <div style={{ color: 'white' }}>
      <h2 style={{ marginBottom: '30px' }}>Builder Input Analysis</h2>

      {/* Navigation Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <TabButton id="overview" label="Overview" />
        <TabButton id="problem" label="Problem Definition" />
        <TabButton id="mvp" label="MVP Planning" />
        <TabButton id="feedback" label="Feedback" />
        <TabButton id="build" label="Build Progress" />
        <TabButton id="comparison" label="Completion Comparison" />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
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

          {/* Key Metrics */}
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>Key Metrics</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <h4>Total Entries</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {Object.values(sectionCounts).reduce((sum, count) => sum + count, 0)}
                </div>
              </div>
              <div>
                <h4>Unique Builders</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {new Set(
                    Object.values(builderData)
                      .flat()
                      .map(input => input.session_id)
                  ).size}
                </div>
              </div>
              <div>
                <h4>Completion Rate</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {((sectionCounts['Presentations & Retro'] || 0) / (sectionCounts['User Info'] || 1) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Problem Definition Tab */}
      {activeTab === 'problem' && fieldAnalysis['Problem Definition'] && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Problem Definition Analysis</h3>
          
          {sectionFields['Problem Definition'].map(field => (
            <div key={field.name} style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h4 style={{ marginBottom: '15px', color: '#4CAF50' }}>{field.label}</h4>
              {fieldAnalysis['Problem Definition'][field.name]?.length > 0 ? (
                <PhraseList 
                  phrases={fieldAnalysis['Problem Definition'][field.name]} 
                  colorScale={true}
                />
              ) : (
                <p>No data available</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MVP Planning Tab */}
      {activeTab === 'mvp' && fieldAnalysis['MVP Planner'] && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>MVP Planning Analysis</h3>
          
          {sectionFields['MVP Planner'].map(field => (
            <div key={field.name} style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h4 style={{ marginBottom: '15px', color: '#4CAF50' }}>{field.label}</h4>
              {fieldAnalysis['MVP Planner'][field.name]?.length > 0 ? (
                <PhraseList 
                  phrases={fieldAnalysis['MVP Planner'][field.name]} 
                  colorScale={true}
                />
              ) : (
                <p>No data available</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && fieldAnalysis['Give & Get Feedback'] && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Feedback Analysis</h3>
          
          {sectionFields['Give & Get Feedback'].map(field => (
            <div key={field.name} style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h4 style={{ marginBottom: '15px', color: '#4CAF50' }}>{field.label}</h4>
              {fieldAnalysis['Give & Get Feedback'][field.name]?.length > 0 ? (
                <PhraseList 
                  phrases={fieldAnalysis['Give & Get Feedback'][field.name]} 
                  colorScale={true}
                />
              ) : (
                <p>No data available</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Build Progress Tab */}
      {activeTab === 'build' && fieldAnalysis['Start Build'] && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Build Progress Analysis</h3>
          
          {sectionFields['Start Build'].map(field => (
            <div key={field.name} style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h4 style={{ marginBottom: '15px', color: '#4CAF50' }}>{field.label}</h4>
              {fieldAnalysis['Start Build'][field.name]?.length > 0 ? (
                <PhraseList 
                  phrases={fieldAnalysis['Start Build'][field.name]} 
                  colorScale={true}
                />
              ) : (
                <p>No data available</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Completion Comparison</h3>
          
          {Object.keys(comparisonAnalysis).length > 0 ? (
            Object.entries(comparisonAnalysis).map(([section, fields]) => (
              <div key={section} style={{ marginBottom: '30px' }}>
                <h4 style={{ marginBottom: '15px' }}>{section}</h4>
                
                {Object.entries(fields).map(([fieldName, comparison]) => {
                  const fieldLabel = sectionFields[section]?.find(f => f.name === fieldName)?.label || fieldName;
                  
                  return comparison && comparison.length > 0 ? (
                    <div key={fieldName} style={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: '8px',
                      padding: '20px',
                      marginBottom: '20px'
                    }}>
                      <h5 style={{ marginBottom: '15px', color: '#4CAF50' }}>{fieldLabel}</h5>
                      <ComparisonList comparisons={comparison} />
                    </div>
                  ) : null;
                })}
              </div>
            ))
          ) : (
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <p>Not enough data for comparison analysis. Need both completed and incomplete builders.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BuilderInputReport;