// src/pages/StudentLanding.jsx
// Landing page for logged-in students — shows hero + course browse.
// Uses StudentNav instead of public Navbar. No journey tabs, how-it-works,
// or reviews — just clean hero and available courses to explore.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentNav from '../components/StudentNav'
import Footer from '../components/Footer'
import { API_BASE } from '../api'
import './StudentLanding.css'

export default function StudentLanding() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get logged-in user from localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    // Fetch all courses to display
    fetch(`${API_BASE}/api/courses`)
      .then(res => res.json())
      .then(data => {
        setCourses(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch courses:', err)
        setLoading(false)
      })
  }, [])

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`)
  }

  return (
    <div className="student-landing-page">
      <StudentNav user={user} activeLink="explore" />

      <main className="student-landing-main">
        {/* Hero section */}
        <section className="student-landing-hero-image">
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644"
            alt="Learning"
          />
        </section>

        <section className="student-landing-hero-text">
          <h1>Learn from the best in your neighborhood</h1>
          <p>Your decentralized platform</p>
        </section>

        {/* Courses browse section */}
        <section className="student-landing-courses">
          <h2>Explore Courses</h2>
          <p className="student-landing-courses-subtitle">
            Browse available courses and start your learning journey
          </p>

          {loading ? (
            <p className="student-landing-loading">Loading courses...</p>
          ) : courses.length === 0 ? (
            <p className="student-landing-empty">No courses available yet</p>
          ) : (
            <div className="student-landing-courses-grid">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="student-landing-course-card"
                  onClick={() => handleCourseClick(course.id)}
                >
                  {/* Course icon/avatar */}
                  <div className="course-card-avatar">
                    {course.title.charAt(0).toUpperCase()}
                  </div>

                  {/* Course info */}
                  <div className="course-card-content">
                    <h3 className="course-card-title">{course.title}</h3>
                    <p className="course-card-instructor">
                      By {course.instructor_name || 'Unknown'}
                    </p>
                    <div className="course-card-meta">
                      <span className="course-card-price">₹{course.price}</span>
                      <span className="course-card-rating">
                        ⭐ {(course.avg_rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
