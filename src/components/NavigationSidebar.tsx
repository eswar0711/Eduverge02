// src/components/NavigationSidebar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, PlusCircle, Home, FileText } from 'lucide-react';
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
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">EduVerge</h1>
        </div>
        <p className="text-sm font-medium text-gray-800">{user.name}</p>
        <p className="text-xs text-gray-500 capitalize mt-1">
          {user.role === 'faculty' ? '👨‍🏫 Faculty' : '👨‍🎓 Student'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {/* Dashboard */}
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors font-medium"
        >
          <Home className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        {/* Faculty Navigation */}
        {user.role === 'faculty' && (
          <>
            <Link
              to="/create-assessment"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors font-medium"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create Assessment</span>
            </Link>

            <Link
              to="/course-materials"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors font-medium"
            >
              <FileText className="w-5 h-5" />
              <span>Course Materials</span>
            </Link>
          </>
        )}

        {/* Student Navigation */}
        {user.role === 'student' && (
          <Link
            to="/courses"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors font-medium"
          >
            <BookOpen className="w-5 h-5" />
            <span>Course Materials</span>
          </Link>
        )}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-gray-200"></div>

      {/* Sign Out */}
      <div className="p-4">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default NavigationSidebar;
