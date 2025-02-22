import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import BuilderList from './BuilderList';
import BuilderDetails from './BuilderDetails';

function AdminDashboard() {
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilder, setSelectedBuilder] = useState(null);
  const [error, setError] = useState(null);

  // Fetch all builders' data
  useEffect(() => {
    fetchBuilders();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('user_inputs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_inputs'
        },
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchBuilders = async () => {
    try {
      setLoading(true);
      
      // First get all unique session IDs with user info
      const { data: sessions, error: sessionError } = await supabase
        .from('user_inputs')
        .select('session_id, input_data')
        .eq('section_name', 'User Info');

      if (sessionError) throw sessionError;

      // For each session, fetch all their inputs
      const buildersData = await Promise.all(
        sessions.map(async (session) => {
          const { data: inputs, error: inputsError } = await supabase
            .from('user_inputs')
            .select('*')
            .eq('session_id', session.session_id);

          if (inputsError) throw inputsError;

          return {
            sessionId: session.session_id,
            userInfo: session.input_data,
            sections: inputs.reduce((acc, input) => {
              acc[input.section_name] = input.input_data;
              return acc;
            }, {}),
            lastUpdate: Math.max(...inputs.map(input => new Date(input.created_at).getTime())),
            progress: {
              total: 7, // Total number of sections
              completed: inputs.length
            }
          };
        })
      );

      // Sort by most recent update
      const sortedBuilders = buildersData.sort((a, b) => b.lastUpdate - a.lastUpdate);
      setBuilders(sortedBuilders);
      
      if (!selectedBuilder && sortedBuilders.length > 0) {
        setSelectedBuilder(sortedBuilders[0].sessionId);
      }
    } catch (error) {
      console.error('Error fetching builders:', error);
      setError('Failed to load builders data');
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = async (payload) => {
    // Refresh all data when there's an update
    // In a production app, you might want to update only the affected builder
    await fetchBuilders();
  };

  const handleBuilderSelect = (sessionId) => {
    setSelectedBuilder(sessionId);
  };

  if (error) {
    return (
      <div style={{
        padding: '20px',
        color: 'red',
        textAlign: 'center'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: '20px',
      padding: '20px',
      minHeight: '100vh',
      backgroundColor: 'black',
      color: 'white'
    }}>
      {/* Builders List Sidebar */}
      <div style={{
        borderRight: '1px solid #333',
        padding: '20px'
      }}>
        <h2>Builders</h2>
        {loading ? (
          <p>Loading builders...</p>
        ) : (
          <BuilderList
            builders={builders}
            selectedBuilder={selectedBuilder}
            onSelectBuilder={handleBuilderSelect}
          />
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '20px' }}>
        {selectedBuilder ? (
          <BuilderDetails
            builder={builders.find(b => b.sessionId === selectedBuilder)}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#666' }}>
            Select a builder to view their progress
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;