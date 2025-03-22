import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './firebase/AuthContext'; 
import Student from './components/student/student';
import Login from './components/Login/login';
import Signup from './components/SignUp/signup';
import College from './components/College/college';
import HandleApplication from './components/College/handleApplications';
import UniversityPage from './components/student/UniversityPage';
import ProfilePage from './components/student/MyProfile';
import SeeApplicationsPage from './components/College/seeApplications';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate replace to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/student-dashboard" element={<Student />} />
          <Route path="/college-dashboard" element={<College />} />
          <Route path="/university-details/:collegeId" element={<UniversityPage />} />
          <Route path="/handle-applications" element={<HandleApplication />} />
          <Route path="/see-applications/:studentId" element={<SeeApplicationsPage />} />
          <Route path="/my-profile" element={<ProfilePage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

