import React, { useMemo, useState, useEffect } from 'react';
import AdminDashboard from './components/admin/AdminDashboard';
import ReportDashboard from './components/admin/ReportDashboard';
import BuilderInputReport from './components/admin/BuilderInputReport';
import BuilderView from './components/BuilderView';
import { testSupabaseConnection } from './supabaseClient';

function App() {
  const isAdmin = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode') === 'admin';
  }, []);

  const [activeView, setActiveView] = useState('builders');
  
  // Test Supabase connection when the app starts
  useEffect(() => {
    const testConnection = async () => {
      console.log('Testing Supabase connection...');
      const result = await testSupabaseConnection();
      console.log('Supabase connection test result:', result);
    };
    
    testConnection();
  }, []);

  if (!isAdmin) {
    return <BuilderView />;
  }

  const NavLink = ({ view, children }) => (
    <button
      onClick={() => setActiveView(view)}
      style={{
        padding: '10px 20px',
        textDecoration: 'none',
        color: activeView === view ? '#4CAF50' : 'white',
        backgroundColor: activeView === view ? '#1a1a1a' : 'transparent',
        borderRadius: '4px',
        transition: 'all 0.3s ease',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'black',
      color: 'white'
    }}>
      {/* Navigation Header */}
      <nav style={{
        padding: '20px',
        borderBottom: '1px solid #333',
        backgroundColor: '#0a0a0a'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '20px',
          alignItems: 'center'
        }}>
          <NavLink view="builders">Builders</NavLink>
          <NavLink view="analytics">Analytics</NavLink>
          <NavLink view="insights">Builder Insights</NavLink>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {activeView === 'builders' && <AdminDashboard />}
        {activeView === 'analytics' && <ReportDashboard />}
        {activeView === 'insights' && <BuilderInputReport />}
      </main>
    </div>
  );
}

export default App;
