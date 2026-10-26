// src/App.jsx
// Defines which "page" component shows for which URL path.
// No CSS import here — App itself renders no markup of its own, just
// routes to whichever page component matches the current URL.

import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import BecomeInstructor from './pages/BecomeInstructor.jsx'
import StudentLanding from './pages/StudentLanding.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import InstructorDashboard from './pages/InstructorDashboard.jsx'
import InstructorWelcome from './pages/InstructorWelcome.jsx'
import MyCourses from './pages/MyCourses.jsx'
import CourseDetail from './pages/CourseDetail.jsx'
import ManageCourses from './pages/ManageCourses.jsx'
import CreateCourse from './pages/CreateCourse.jsx'
import ManageCourseLayout from './pages/ManageCourseLayout.jsx'
import ManageCourseDetails from './pages/ManageCourseDetails.jsx'
import ManageCourseContent from './pages/ManageCourseContent.jsx'
import PublishCourse from './pages/PublishCourse.jsx'
import CoursePlayer from './pages/CoursePlayer.jsx'
import InstructorProfile from './pages/InstructorProfile.jsx'
import EditProfile from './pages/EditProfile.jsx'

function App() {
  const navigate = useNavigate()

  // Cross-tab session synchronization:
  // If user logs out or switches accounts in another tab, sync this tab immediately.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key === 'token' || event.key === 'user') {
        const token = localStorage.getItem('token')
        const user = localStorage.getItem('user')

        if (!token || !user) {
          // User logged out in another tab
          const protectedPrefixes = [
            '/student-',
            '/instructor-',
            '/mycourse',
            '/manage-courses',
            '/create-course',
            '/profile',
          ]
          const isProtected =
            protectedPrefixes.some((p) => window.location.pathname.startsWith(p)) ||
            window.location.pathname.includes('/learn')

          if (isProtected) {
            navigate('/', { replace: true })
          }
        } else {
          // Token or user switched in another tab — reload to sync active session
          window.location.reload()
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [navigate])

  return (
    <>
      {/* Resets scroll position on every route change — see
          components/ScrollToTop.jsx for why this is needed. */}
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/become-instructor" element={<BecomeInstructor />} />
        <Route path="/student-landing" element={<StudentLanding />} />
        <Route path="/explore" element={<Navigate to="/student-landing" replace />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/instructor-welcome" element={<InstructorWelcome />} />
        <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
        <Route path="/mycourse" element={<MyCourses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/instructors/:id" element={<InstructorProfile />} />
        <Route path="/courses/:courseId/learn" element={<CoursePlayer />} />
        <Route path="/manage-courses" element={<ManageCourses />} />
        <Route path="/create-course" element={<CreateCourse />} />
        <Route path="/profile" element={<EditProfile />} />

        {/* One shared course-management shell (guard + course fetch happen
            once in ManageCourseLayout); each child route is one job on
            that course. */}
        <Route path="/manage-courses/:courseId" element={<ManageCourseLayout />}>
          <Route index element={<Navigate to="details" replace />} />
          <Route path="details" element={<ManageCourseDetails />} />
          <Route path="content" element={<ManageCourseContent />} />
          <Route path="publish" element={<PublishCourse />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
