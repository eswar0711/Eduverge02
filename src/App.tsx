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
import CoursePage from './components/CoursePage';
import FacultyCourseMaterials from './components/FacultyCourseMaterials';
import ScoreCalculatorModule from './components/ScoreCalculator/ScoreCalculatorModule';
import AIAssistantModule from './components/AIAssistant/AIAssistantModule';
import { ChangePassword, UserProfile } from './components/UserSettings'; // NEW


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
        {/* Login Route */}
        <Route 
          path="/login" 
          element={!user ? <LoginPage onLogin={checkUser} /> : <Navigate to="/" />} 
        />


        {/* Dashboard Routes */}
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


        {/* Faculty Assessment Routes */}
        <Route
          path="/create-assessment"
          element={user?.role === 'faculty' ? <AssessmentCreation user={user} /> : <Navigate to="/" />}
        />


        {/* Faculty Course Materials Route */}
        <Route
          path="/course-materials"
          element={user?.role === 'faculty' ? <FacultyCourseMaterials user={user} /> : <Navigate to="/" />}
        />


        {/* Student Test Taking Route */}
        <Route
          path="/take-test/:assessmentId"
          element={user?.role === 'student' ? <TestTaking user={user} /> : <Navigate to="/" />}
        />


        {/* Results Route */}
        <Route
          path="/results/:submissionId"
          element={user ? <ResultsPage user={user} /> : <Navigate to="/login" />}
        />


        {/* Student Course Page Route */}
        <Route
          path="/courses"
          element={user?.role === 'student' ? <CoursePage user={user} /> : <Navigate to="/" />}
        />


        


        {/* Student AI Assistant Route */}
        <Route
          path="/ai-assistant"
          element={user?.role === 'student' ? <AIAssistantModule user={user} /> : <Navigate to="/" />}
        />

        {/* Student Score Calculator Route */}
        <Route
          path="/score-calculator"
          element={user?.role === 'student' ? <ScoreCalculatorModule /> : <Navigate to="/" />}
        />


        {/* UserSettings Routes - NEW */}
        <Route
          path="/profile"
          element={user ? <UserProfile /> : <Navigate to="/login" />}
        />

        <Route
          path="/change-password"
          element={user ? <ChangePassword /> : <Navigate to="/login" />}
        />

        


        {/* Catch-all - Redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};


export default App;
