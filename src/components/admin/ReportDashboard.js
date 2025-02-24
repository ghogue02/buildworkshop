import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { analyticsService } from '../../services/analyticsService';

function ReportDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    filterCompleted: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getBuilderData(filters);
      setData(result);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    loadData();
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

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
        Loading analytics data...
      </div>
    );
  }

  // Prepare chart data
  const sectionCompletionData = Object.entries(data.metrics.sectionCompletionRates)
    .map(([name, rate]) => ({
      name,
      rate: (rate * 100).toFixed(1)
    }));

  const timeDistributionData = Object.entries(data.metrics.averageTimePerSection)
    .map(([name, time]) => ({
      name,
      minutes: (time / 60000).toFixed(1)
    }));

  const dropoffData = Object.entries(data.metrics.dropoffPoints)
    .map(([name, rate]) => ({
      name,
      rate: (rate * 100).toFixed(1)
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
        <h2 style={{ margin: 0 }}>Builder Analytics</h2>
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
          value={data.metrics.totalBuilders}
          description="Number of builders in selected period"
        />
        <MetricCard
          title="Completion Rate"
          value={`${(data.metrics.completionRate * 100).toFixed(1)}%`}
          description="Percentage of builders completing all sections"
        />
        <MetricCard
          title="Average Session Duration"
          value={`${(data.metrics.averageSessionDuration / 60000).toFixed(1)} minutes`}
          description="Average time spent per builder"
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

      {/* Dropoff Analysis */}
      {dropoffData.length > 0 && (
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>
            Section Dropoff Rates
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dropoffData}>
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
                <Bar dataKey="rate" fill="#E91E63" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportDashboard;