import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import BuilderList from './BuilderList';
import BuilderDetails from './BuilderDetails';

function AdminDashboard() {
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilder, setSelectedBuilder] = useState(null);
  const [error, setError] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);

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

  const deleteBuilder = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this builder? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setDeleteStatus({ type: 'info', message: 'Deleting builder...' });

      // First verify if the user exists and get all their data
      const { data: userData, error: fetchError } = await supabase
        .from('user_inputs')
        .select('id')
        .eq('session_id', sessionId);

      if (fetchError) {
        console.error('Error fetching user data before deletion:', fetchError);
        throw fetchError;
      }

      console.log(`Found ${userData.length} records to delete for session ${sessionId}`);

      // Delete from user_inputs table
      const { data: deletedData, error: userInputsError } = await supabase
        .from('user_inputs')
        .delete()
        .eq('session_id', sessionId)
        .select();

      if (userInputsError) {
        console.error('Error deleting from user_inputs:', userInputsError);
        throw userInputsError;
      }

      console.log(`Successfully deleted ${deletedData.length} records from user_inputs`);

      // Delete from admin_notes table
      const { data: deletedNotes, error: adminNotesError } = await supabase
        .from('admin_notes')
        .delete()
        .eq('session_id', sessionId)
        .select();

      if (adminNotesError && adminNotesError.code !== 'PGRST116') {
        console.error('Error deleting from admin_notes:', adminNotesError);
        throw adminNotesError;
      }

      console.log(`Successfully deleted ${deletedNotes?.length || 0} records from admin_notes`);

      // Verify deletion was successful
      const { data: verifyData, error: verifyError } = await supabase
        .from('user_inputs')
        .select('id')
        .eq('session_id', sessionId);

      if (verifyError) {
        console.error('Error verifying deletion:', verifyError);
      } else if (verifyData.length > 0) {
        console.warn(`Warning: ${verifyData.length} records still exist after deletion`);
      } else {
        console.log('Verification successful: All records deleted');
      }

      // Update local state
      setBuilders(prevBuilders => prevBuilders.filter(builder => builder.sessionId !== sessionId));
      
      // If the deleted builder was selected, select another one or set to null
      if (selectedBuilder === sessionId) {
        const remainingBuilders = builders.filter(builder => builder.sessionId !== sessionId);
        setSelectedBuilder(remainingBuilders.length > 0 ? remainingBuilders[0].sessionId : null);
      }

      setDeleteStatus({ type: 'success', message: 'Builder deleted successfully' });
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setDeleteStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting builder:', error);
      setDeleteStatus({ type: 'error', message: `Error deleting builder: ${error.message}` });
    } finally {
      setLoading(false);
    }
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
        {deleteStatus && (
          <div
            style={{
              padding: '10px 15px',
              marginBottom: '20px',
              borderRadius: '4px',
              backgroundColor: deleteStatus.type === 'error' ? '#ff4444' :
                              deleteStatus.type === 'success' ? '#4CAF50' : '#333',
              color: 'white'
            }}
          >
            {deleteStatus.message}
          </div>
        )}
        
        {selectedBuilder ? (
          <BuilderDetails
            builder={builders.find(b => b.sessionId === selectedBuilder)}
            onDeleteBuilder={deleteBuilder}
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