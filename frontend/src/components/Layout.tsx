// Layout component - provides common structure for all pages

import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLineraStore } from '../stores/lineraStore';
import { User, Coins } from 'lucide-react';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, profile } = useLineraStore();
  
  // Don't show on profile page itself
  const showProfileButton = isConnected && location.pathname !== '/profile';
  
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Floating Profile Button */}
      <AnimatePresence>
        {showProfileButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            onClick={() => navigate('/profile')}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-dark-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl hover:border-neon-cyan/50 hover:bg-dark-700/80 transition-all shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center">
              <User className="w-4 h-4 text-neon-cyan" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 text-neon-yellow text-sm font-bold">
                <Coins className="w-3.5 h-3.5" />
                {profile?.coinBalance ?? profile?.coins ?? 0}
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Main content */}
      <Outlet />
    </div>
  );
};

export default Layout;
