// src/App.jsx
// Defines which "page" component shows for which URL path.
// No CSS import here — App itself renders no markup of its own, just
// routes to whichever page component matches the current URL.

import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import BecomeInstructor from './pages/BecomeInstructor.jsx'
import StudentLanding from './pages/StudentLanding.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import InstructorDashboard from './pages/InstructorDashboard.jsx'
import InstructorWelcome from './pages/InstructorWelcome.jsx'
import MyCourses from './pages/MyCourses.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/become-instructor" element={<BecomeInstructor />} />
      <Route path="/student-landing" element={<StudentLanding />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/instructor-welcome" element={<InstructorWelcome />} />
      <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
      <Route path="/mycourse" element={<MyCourses />} />
    </Routes>
  )
}

export default App
