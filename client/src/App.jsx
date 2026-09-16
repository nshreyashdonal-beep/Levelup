// src/App.jsx
// Defines which "page" component shows for which URL path.
// No CSS import here — App itself renders no markup of its own, just
// routes to whichever page component matches the current URL.

import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import BecomeInstructor from './pages/BecomeInstructor.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/become-instructor" element={<BecomeInstructor />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
    </Routes>
  )
}

export default App
