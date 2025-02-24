import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

function AdminLayout() {
  const location = useLocation();
  const basename = process.env.PUBLIC_URL || '';

  const NavLink = ({ to, children }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link
        to={to}
        style={{
          padding: '10px 20px',
          textDecoration: 'none',
          color: isActive ? '#4CAF50' : 'white',
          backgroundColor: isActive ? '#1a1a1a' : 'transparent',
          borderRadius: '4px',
          transition: 'all 0.3s ease'
        }}
      >
        {children}
      </Link>
    );
  };

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
          <NavLink to={`${basename}/admin`}>Builders</NavLink>
          <NavLink to={`${basename}/admin/reports`}>AI Reports</NavLink>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;