import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, PlusCircle, Home } from 'lucide-react';

import { signOut } from '../utils/auth';
import type { User } from '../utils/supabaseClient';

interface NavigationSidebarProps {
  user: User;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ user }) => {
  const navigate = useNavigate();
const handleSignOut = async () => {
  try {
    await signOut();
    navigate('/login');
    window.location.reload(); // <- Add this!
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary-600" />
          <h1 className="text-xl font-bold text-gray-800">EduVerge</h1>
        </div>
        <p className="text-sm text-gray-600 mt-2">{user.name}</p>
        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
      </div>

      <nav className="flex-1 p-4">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors mb-2"
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </Link>

        {user.role === 'faculty' && (
          <Link
            to="/create-assessment"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors mb-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="font-medium">Create Assessment</span>
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default NavigationSidebar;