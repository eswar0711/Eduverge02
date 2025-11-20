// src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from './utils/auth';
import type { User } from './utils/supabaseClient';
import LoginPage from './pages/LoginPage';
import FacultyDashboard from './components/FacultyDashboard';
import StudentDashboard from './components/StudentDashboard';
import AssessmentCreation from './components/AssessmentCreation';
import TestTaking from './components/TestTaking';
import ResultsPage from './components/ResultsPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
    </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage onLogin={checkUser} /> : <Navigate to="/" />} />
        
        <Route
          path="/"
          element={
            user ? (
              user.role === 'faculty' ? (
                <FacultyDashboard user={user} />
              ) : (
                <StudentDashboard user={user} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        
        <Route
          path="/create-assessment"
          element={user?.role === 'faculty' ? <AssessmentCreation user={user} /> : <Navigate to="/" />}
        />
        
        <Route
          path="/take-test/:assessmentId"
          element={user?.role === 'student' ? <TestTaking user={user} /> : <Navigate to="/" />}
        />
        
        <Route
          path="/results/:submissionId"
          element={user ? <ResultsPage user={user} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
};

export default App;