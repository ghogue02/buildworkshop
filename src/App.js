import React, { useMemo } from 'react';
import AdminDashboard from './components/admin/AdminDashboard';
import ReportDashboard from './components/admin/ReportDashboard';
import BuilderView from './components/BuilderView';

function App() {
  const { isAdmin, view } = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      isAdmin: urlParams.get('mode') === 'admin',
      view: urlParams.get('view')
    };
  }, []);

  if (!isAdmin) {
    return <BuilderView />;
  }

  // Render admin views based on the view parameter
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
          <a
            href="?mode=admin"
            style={{
              padding: '10px 20px',
              textDecoration: 'none',
              color: !view ? '#4CAF50' : 'white',
              backgroundColor: !view ? '#1a1a1a' : 'transparent',
              borderRadius: '4px',
              transition: 'all 0.3s ease'
            }}
          >
            Builders
          </a>
          <a
            href="?mode=admin&view=reports"
            style={{
              padding: '10px 20px',
              textDecoration: 'none',
              color: view === 'reports' ? '#4CAF50' : 'white',
              backgroundColor: view === 'reports' ? '#1a1a1a' : 'transparent',
              borderRadius: '4px',
              transition: 'all 0.3s ease'
            }}
          >
            AI Reports
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {view === 'reports' ? <ReportDashboard /> : <AdminDashboard />}
      </main>
    </div>
  );
}

export default App;
