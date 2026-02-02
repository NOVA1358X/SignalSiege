// Layout component - provides common structure for all pages

import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Main content */}
      <Outlet />
    </div>
  );
};

export default Layout;
