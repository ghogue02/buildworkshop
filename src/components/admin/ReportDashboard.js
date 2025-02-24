import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { dataAggregationService } from '../../services/dataAggregationService';
import { setOpenAIKey } from '../../config';

function ReportDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    filterCompleted: false,
    problemCategories: []
  });

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const newReport = await dataAggregationService.generateReport(filters);
      setReport(newReport);
    } catch (error) {
      console.error('Error loading report:', error);
      if (error.message.includes('OpenAI API key not found')) {
        setShowKeyForm(true);
        setError('Please enter your OpenAI API key to generate reports');
      } else {
        setError('Failed to load report data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySubmit = async (e) => {
    e.preventDefault();
    setOpenAIKey(apiKey);
    setShowKeyForm(false);
    await loadReport();
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    loadReport();
  };

  const MetricCard = ({ title, value, description }) => (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '20px',
      height: '100%'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>{title}</h3>
      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
        {value}
      </div>
      <p style={{ margin: 0, color: '#888' }}>{description}</p>
    </div>
  );

  const InsightSection = ({ title, insights, type }) => (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>{title}</h3>
      {type === 'list' ? (
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          {insights.map((insight, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>{insight}</li>
          ))}
        </ul>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {Object.entries(insights).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (showKeyForm) {
    return (
      <div style={{
        padding: '40px',
        maxWidth: '600px',
        margin: '0 auto',
        color: 'white'
      }}>
        <h2 style={{ marginBottom: '20px' }}>OpenAI API Key Required</h2>
        <p style={{ marginBottom: '20px', color: '#888' }}>
          To generate AI-powered reports and insights, please enter your OpenAI API key.
          This key will only be stored in your browser's memory and will not be saved
          or transmitted anywhere else.
        </p>
        <form onSubmit={handleApiKeySubmit}>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: 'white'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save Key & Generate Report
          </button>
        </form>
      </div>
    );
  }

  if (error && !showKeyForm) {
    return (
      <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  if (loading || !report) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
        Loading report data...
      </div>
    );
  }

  // Prepare chart data
  const sectionCompletionData = Object.entries(report.metrics.sectionCompletionRates)
    .map(([name, rate]) => ({
      name,
      rate: (rate * 100).toFixed(1)
    }));

  const timeDistributionData = Object.entries(report.metrics.averageTimePerSection)
    .map(([name, time]) => ({
      name,
      minutes: (time / 60000).toFixed(1)
    }));

  return (
    <div style={{ color: 'white' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: 0 }}>AI Builder Analysis</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange({ startDate: e.target.value })}
            style={{
              padding: '8px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: 'white'
            }}
          />
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange({ endDate: e.target.value })}
            style={{
              padding: '8px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: 'white'
            }}
          />
          <button
            onClick={() => handleFilterChange({
              startDate: null,
              endDate: null
            })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#333',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <MetricCard
          title="Total Builders"
          value={report.metrics.totalBuilders}
          description="Number of builders in selected period"
        />
        <MetricCard
          title="Completion Rate"
          value={`${(report.metrics.completionRate * 100).toFixed(1)}%`}
          description="Percentage of builders completing all sections"
        />
        <MetricCard
          title="Average Time per Section"
          value={`${(Object.values(report.metrics.averageTimePerSection)
            .reduce((a, b) => a + b, 0) / (Object.keys(report.metrics.averageTimePerSection).length || 1) / 60000
            ).toFixed(1)} minutes`}
          description="Average time spent in each section"
        />
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Section Completion Rates */}
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>
            Section Completion Rates
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionCompletionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="white"
                />
                <YAxis stroke="white" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    color: 'white'
                  }}
                />
                <Bar dataKey="rate" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Distribution */}
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>
            Time Distribution (minutes)
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="white"
                />
                <YAxis stroke="white" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    color: 'white'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#4CAF50"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analysis Sections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px'
      }}>
        <InsightSection
          title="Key Findings"
          insights={report.summary.key_findings}
          type="list"
        />
        <InsightSection
          title="Common Challenges"
          insights={report.analysis.patterns.challenges}
          type="list"
        />
        <InsightSection
          title="Success Patterns"
          insights={report.analysis.success_indicators}
          type="list"
        />
        <InsightSection
          title="Recommendations"
          insights={report.improvements}
          type="object"
        />
      </div>
    </div>
  );
}

export default ReportDashboard;