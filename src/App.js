import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import ReportDashboard from './components/admin/ReportDashboard';
import BuilderView from './components/BuilderView';

function App() {
  const isAdmin = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode') === 'admin';
  }, []);

  if (!isAdmin) {
    return <BuilderView />;
  }

  // Get the base URL from the homepage in package.json
  const basename = process.env.PUBLIC_URL || '';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="reports" element={<ReportDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
