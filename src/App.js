import React, { useMemo } from 'react';
import AdminDashboard from './components/admin/AdminDashboard';
import BuilderView from './components/BuilderView';

function App() {
  const isAdmin = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode') === 'admin';
  }, []);

  return isAdmin ? <AdminDashboard /> : <BuilderView />;
}

export default App;
