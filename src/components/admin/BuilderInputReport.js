import React, { useState, useEffect } from 'react';
import { builderInputAnalysis } from '../../services/builderInputAnalysis';

function BuilderInputReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await builderInputAnalysis.analyzeSectionInputs();
      setAnalysis(result);
    } catch (error) {
      console.error('Error loading analysis:', error);
      setError('Failed to load builder input analysis');
    } finally {
      setLoading(false);
    }
  };

  const SectionAnalysis = ({ title, data, type = 'default' }) => {
    if (!data) return null;

    return (
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>{title}</h3>
        {type === 'themes' && data.map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px',
            padding: '8px',
            backgroundColor: index % 2 === 0 ? '#222' : 'transparent',
            borderRadius: '4px'
          }}>
            <span>{item.theme}</span>
            <span style={{ color: '#4CAF50' }}>{item.count}</span>
          </div>
        ))}
        {type === 'complexity' && (
          <div style={{ display: 'grid', gap: '15px' }}>
            {Object.entries(
              data.reduce((acc, item) => {
                acc[item.level] = (acc[item.level] || 0) + 1;
                return acc;
              }, {})
            ).map(([level, count]) => (
              <div key={level} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px',
                backgroundColor: '#222',
                borderRadius: '4px'
              }}>
                <span>{level} Complexity</span>
                <span style={{ color: '#4CAF50' }}>{count}</span>
              </div>
            ))}
          </div>
        )}
        {type === 'default' && (
          <pre style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  if (loading || !analysis) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
        Loading analysis...
      </div>
    );
  }

  return (
    <div style={{ color: 'white' }}>
      <h2 style={{ marginBottom: '30px' }}>Builder Input Analysis</h2>

      {/* Overview Section */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>Overview</h3>
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <strong>Total Builders:</strong> {analysis.overview.totalBuilders}
          </div>
          <div>
            <strong>Completion Rates:</strong>
            <div style={{ marginTop: '10px' }}>
              {Object.entries(analysis.overview.completionRates).map(([section, rate]) => (
                <div key={section} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px'
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
                      width: `${rate * 100}%`,
                      height: '100%',
                      backgroundColor: '#4CAF50',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ minWidth: '60px' }}>
                    {(rate * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Problem Definition Analysis */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '20px' }}>Problem Definition Insights</h3>
        <div style={{ display: 'grid', gap: '20px' }}>
          <SectionAnalysis
            title="Common Themes"
            data={analysis.problemDefinition?.commonThemes}
            type="themes"
          />
          <SectionAnalysis
            title="Impact Areas"
            data={analysis.problemDefinition?.impactAreas}
            type="themes"
          />
          <SectionAnalysis
            title="Problem Complexity"
            data={analysis.problemDefinition?.complexityLevels}
            type="complexity"
          />
        </div>
      </div>

      {/* MVP Planning Analysis */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '20px' }}>MVP Planning Insights</h3>
        <div style={{ display: 'grid', gap: '20px' }}>
          <SectionAnalysis
            title="Solution Approaches"
            data={analysis.mvpPlanner?.solutionTypes}
            type="themes"
          />
          <SectionAnalysis
            title="AI Integration Patterns"
            data={analysis.mvpPlanner?.aiIntegration}
            type="themes"
          />
        </div>
      </div>

      {/* Build Progress Analysis */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '20px' }}>Build Progress Insights</h3>
        <div style={{ display: 'grid', gap: '20px' }}>
          <SectionAnalysis
            title="Implementation Approaches"
            data={analysis.build?.implementationApproaches}
            type="themes"
          />
          <SectionAnalysis
            title="AI Usage Patterns"
            data={analysis.build?.aiUsage}
            type="themes"
          />
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '20px' }}>Recommendations</h3>
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          padding: '20px'
        }}>
          {analysis.overview.recommendations.map((rec, index) => (
            <div key={index} style={{
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#222',
              borderRadius: '4px'
            }}>
              <strong style={{ color: '#4CAF50' }}>{rec.section}</strong>
              <p style={{ margin: '5px 0 0 0' }}>{rec.suggestion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BuilderInputReport;