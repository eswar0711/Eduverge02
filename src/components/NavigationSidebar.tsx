import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  LogOut,
  PlusCircle,
  Home,
  FileText,
  Calculator,
  Sparkles,
  User as UserIcon,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import { signOut } from '../utils/auth'; // ✅ FIXED: Removed typo (was signOutxOut)
import type { User } from '../utils/supabaseClient';

interface NavigationSidebarProps {
  user: User;
}

// ✅ NEW: Proper TypeScript interface for NavItem props
interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  activeClass: string;
  hoverClass: string;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // ✅ NEW: Close menu on ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut(); // ✅ FIXED: Corrected function name
    navigate('/login');
    window.location.reload();
  };

  // ✅ IMPROVED: Proper typing for NavItem component
  const NavItem: React.FC<NavItemProps> = ({
    to,
    icon,
    label,
    activeClass,
    hoverClass,
  }) => (
    <Link
      to={to}
      onClick={() => setIsOpen(false)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition
        ${
          isActive(to)
            ? activeClass
            : `text-gray-700 ${hoverClass}`
        }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        // ✅ IMPROVED: Added accessibility attributes
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="sidebar-nav"
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gradient-to-r from-purple-400 to-orange-400 
           text-white rounded-xl shadow-md 
           hover:from-orange-500 hover:to-purple-500 
           transition-all duration-300 ease-in-out"

      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        id="sidebar-nav" // ✅ NEW: Added ID for accessibility
        role="navigation" // ✅ NEW: Added semantic role
        aria-label="Main navigation" // ✅ NEW: Added aria-label
        className={`fixed md:relative top-0 left-0 h-screen w-64 bg-white
        border-r border-gray-200 shadow-sm z-40
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
      >
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">EduVerge</h1>
          </div>
          <p className="text-sm font-medium text-gray-800">{user.full_name}</p>
          <p className="text-xs text-gray-500 capitalize mt-1">
            {user.role === 'faculty' ? '👨‍🏫 Faculty' : '👨‍🎓 Student'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            to="/"
            icon={<Home className="w-5 h-5" aria-hidden="true" />}
            label="Dashboard"
            activeClass="bg-blue-100 text-blue-700"
            hoverClass="hover:bg-blue-50 hover:text-blue-700"
          />

          {user.role === 'faculty' && (
            <>
              <NavItem
                to="/create-assessment"
                icon={<PlusCircle className="w-5 h-5" aria-hidden="true" />}
                label="Create Assessment"
                activeClass="bg-blue-100 text-blue-700"
                hoverClass="hover:bg-blue-50 hover:text-blue-700"
              />

              <NavItem
                to="/course-materials"
                icon={<FileText className="w-5 h-5" aria-hidden="true" />}
                label="Course Materials"
                activeClass="bg-blue-100 text-blue-700"
                hoverClass="hover:bg-blue-50 hover:text-blue-700"
              />
            </>
          )}

          {user.role === 'student' && (
            <>
              <NavItem
                to="/courses"
                icon={<BookOpen className="w-5 h-5" aria-hidden="true" />}
                label="Course Materials"
                activeClass="bg-blue-100 text-blue-700"
                hoverClass="hover:bg-blue-50 hover:text-blue-700"
              />

              <NavItem
                to="/score-calculator"
                icon={<Calculator className="w-5 h-5" aria-hidden="true" />}
                label="Score Calculator"
                activeClass="bg-purple-100 text-purple-700"
                hoverClass="hover:bg-purple-50 hover:text-purple-700"
              />

              <NavItem
                to="/ai-assistant"
                icon={<Sparkles className="w-5 h-5" aria-hidden="true" />}
                label="AI Assistant"
                activeClass="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700"
                hoverClass="hover:bg-purple-50 hover:text-purple-700"
              />
            </>
          )}

          <div className="my-4 h-px bg-gray-200" />

          <div
            className="text-xs font-semibold text-gray-500 uppercase px-4 py-2"
            role="separator" // ✅ NEW: Semantic role for divider
          >
            Settings
          </div>

          <NavItem
            to="/profile"
            icon={<UserIcon className="w-5 h-5" aria-hidden="true" />}
            label="My Profile"
            activeClass="bg-green-100 text-green-700"
            hoverClass="hover:bg-green-50 hover:text-green-700"
          />

          <NavItem
            to="/change-password"
            icon={<Lock className="w-5 h-5" aria-hidden="true" />}
            label="Change Password"
            activeClass="bg-orange-100 text-orange-700"
            hoverClass="hover:bg-orange-50 hover:text-orange-700"
          />
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 md:hidden z-30"
          onClick={() => setIsOpen(false)}
          role="presentation" // ✅ NEW: Semantic role for overlay
          aria-hidden="true" // ✅ NEW: Hide from accessibility tree
        />
      )}
    </>
  );
};

export default NavigationSidebar;