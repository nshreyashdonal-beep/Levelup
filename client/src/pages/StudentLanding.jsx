// src/pages/StudentLanding.jsx
// Landing page for logged-in students — shows hero + course browse.
// Uses StudentNav instead of public Navbar. No journey tabs, how-it-works,
// or reviews — just clean hero and available courses to explore.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentNav from '../components/StudentNav'
import Footer from '../components/Footer'
import { API_BASE } from '../api'
import '../pages/Home.css'
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

  const focusCourses = () => {
    const coursesSection = document.getElementById('explore-courses')

    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="student-landing-page">
      <StudentNav user={user} activeLink="explore" />

      <main className="student-landing-main">
        {/* Hero section */}
        <section className="home-hero-panel student-landing-hero-panel">
          <div className="home-hero-content">
            <p className="home-hero-eyebrow">LEARN LOCALLY. GROW TOGETHER.</p>
            <h1>Learn from the best in your neighborhood.</h1>
            <p className="home-hero-description">
              Build practical skills with passionate instructors, flexible
              courses, and a learning community that moves with you.
            </p>
            <div className="home-hero-actions">
              <button
                type="button"
                onClick={focusCourses}
                className="home-hero-action home-hero-action--student"
              >
                Explore Courses
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          <div className="home-hero-visual">
            <div className="home-hero-accent home-hero-accent--top" aria-hidden="true" />
            <div className="home-hero-image">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644"
                alt="Students learning together"
              />
            </div>
            <div className="home-hero-note home-hero-note--top">
              <span aria-hidden="true">✦</span>
              Learn something new
            </div>
            <div className="home-hero-note home-hero-note--bottom">
              <span className="home-hero-note-avatar">4.9</span>
              <span>
                <strong>Trusted learning</strong>
                <small>By local communities</small>
              </span>
            </div>
          </div>
        </section>

        {/* Courses browse section */}
        <section id="explore-courses" className="student-landing-courses">
          <div className="student-landing-courses-heading">
            <div>
              <p className="student-landing-courses-eyebrow">YOUR NEXT STEP</p>
              <h2>Explore Courses</h2>
              <p className="student-landing-courses-subtitle">
                Find a course that matches your goals and learn at your own pace.
              </p>
            </div>
            {!loading && courses.length > 0 && (
              <span className="student-landing-course-count">
                {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
              </span>
            )}
          </div>

          {loading ? (
            <div className="student-landing-status-card">
              <div className="student-landing-status-icon" aria-hidden="true">✦</div>
              <p className="student-landing-loading">Finding courses for you...</p>
              <span>Please wait while the course list loads.</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="student-landing-status-card">
              <div className="student-landing-status-icon" aria-hidden="true">📚</div>
              <p className="student-landing-empty">No courses available yet</p>
              <span>New learning opportunities will appear here soon.</span>
            </div>
          ) : (
            <div className="student-landing-courses-grid">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="student-landing-course-card"
                  onClick={() => handleCourseClick(course.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleCourseClick(course.id)
                    }
                  }}
                  role="button"
                  tabIndex="0"
                >
                  {/* Course icon/avatar */}
                  <div className="course-card-top">
                    <div className="course-card-avatar">
                    {course.title.charAt(0).toUpperCase()}
                    </div>
                    <span className="course-card-open" aria-hidden="true">↗</span>
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
                  <span className="course-card-action">View course <span aria-hidden="true">→</span></span>
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
