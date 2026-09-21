// src/pages/Home.jsx
// Landing page: hero image/text, a tabbed "journey" walkthrough for
// students vs teachers, a how-it-works section, and student reviews.
// Styling lives in Home.css (colocated), following the same pattern
// as Navbar.css / Footer.css.

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { API_BASE } from '../api'
import './Home.css'

const studentSteps = [
  { icon: "🔍", label: "Search",            sub: "Find teachers near you" },
  { icon: "👤", label: "Browse Profile",    sub: "Check ratings & subjects" },
  { icon: "💻", label: "Join Online Class", sub: "Attend live sessions" },
  { icon: "🤝", label: "Book Offline",      sub: "Clear doubts locally" },
  { icon: "📊", label: "Track Progress",    sub: "Stay consistent" },
  { icon: "🏆", label: "Level Up",          sub: "Achieve your goal", final: true },
]

const teacherSteps = [
  { icon: "📝", label: "Create Profile",    sub: "Set up in minutes" },
  { icon: "📦", label: "Upload Course",     sub: "Build curriculum" },
  { icon: "🎙️", label: "Go Live",           sub: "Start teaching" },
  { icon: "🧑‍🎓", label: "Students Enroll",  sub: "Grow audience" },
  { icon: "📍", label: "Meet Locally",      sub: "Build connections" },
  { icon: "🚀", label: "Earn & Grow",       sub: "Independent & thriving", final: true },
]

const reviews = [
  {
    text: "I used to regularly follow YouTube videos but struggled with consistency. With local guidance and structured classes, I improved a lot.",
    name: "Anmol Rathore",
    tag: "UPSC",
  },
  {
    text: "Hybrid learning helped me balance everything. Online classes + offline doubt solving made a huge difference.",
    name: "Raja Majhi",
    tag: "GATE",
  },
  {
    text: "I improved my accuracy and speed because I could directly meet my teacher for guidance when needed.",
    name: "Amit Kumar Mandal",
    tag: "BANKING",
  },
]

// One row of step "nodes" connected by a dashed line. `variant` picks
// which color scheme (student = indigo, teacher = emerald) via CSS
// classes instead of Tailwind's inline color utilities.
function JourneyTrack({ steps, variant }) {
  return (
    <div className={`journey-track journey-track--${variant}`}>
      <div className="journey-track-line" />
      {steps.map((step, i) => (
        <div key={i} className="journey-step">
          <div className={`journey-node ${step.final ? 'journey-node--final' : ''}`}>
            <span>{step.icon}</span>
            {!step.final && <span className="journey-badge">{i + 1}</span>}
          </div>
          <p className="journey-step-label">{step.label}</p>
          <p className="journey-step-sub">{step.sub}</p>
        </div>
      ))}
    </div>
  )
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('student')
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [visitorLocation, setVisitorLocation] = useState(null)
  const [nearbyInstructors, setNearbyInstructors] = useState([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState('')
  // Controls whether the instructor list side panel is visible beside the map
  const [listPanelOpen, setListPanelOpen] = useState(false)
  const mapElementRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const mapMarkersRef = useRef(null)
  const instructorMarkersRef = useRef(new Map())
  const visitorMarkerRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetch(`${API_BASE}/api/courses`)
      .then(response => response.json())
      .then(data => {
        setCourses(Array.isArray(data) ? data : [])
        setCoursesLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch public courses:', error)
        setCoursesLoading(false)
      })
  }, [])

  useEffect(() => {
    if (location.hash !== '#explore-courses') return

    const coursesSection = document.getElementById('explore-courses')
    if (coursesSection) {
      window.requestAnimationFrame(() => {
        coursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [location.hash])

  const handleLocationRequest = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported')
      return
    }

    setLocationStatus('loading')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNearbyLoading(true)
        setNearbyError('')
        setVisitorLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocationStatus('success')
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied')
        } else {
          setLocationStatus('error')
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    )
  }

  useEffect(() => {
    if (!visitorLocation) return

    const controller = new AbortController()

    fetch(
      `${API_BASE}/api/instructors/nearby?lat=${visitorLocation.latitude}&lng=${visitorLocation.longitude}`,
      { signal: controller.signal }
    )
      .then(response => {
        if (!response.ok) {
          throw new Error('Nearby instructors could not be loaded.')
        }
        return response.json()
      })
      .then(data => {
        setNearbyInstructors(Array.isArray(data.results) ? data.results : [])
        setNearbyLoading(false)
      })
      .catch(error => {
        if (error.name === 'AbortError') return
        console.error('Failed to fetch nearby instructors:', error)
        setNearbyError('Nearby instructors could not be loaded. Please try again.')
        setNearbyLoading(false)
      })

    return () => controller.abort()
  }, [visitorLocation])

  useEffect(() => {
    if (!mapElementRef.current) return

    const map = L.map(mapElementRef.current).setView([22.9734, 78.6569], 5)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    mapInstanceRef.current = map
    mapMarkersRef.current = L.layerGroup().addTo(map)
    const instructorMarkers = instructorMarkersRef.current
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })

    resizeObserver.observe(mapElementRef.current)
    window.requestAnimationFrame(() => map.invalidateSize())

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapInstanceRef.current = null
      mapMarkersRef.current = null
      instructorMarkers.clear()
      visitorMarkerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !mapMarkersRef.current) return

    mapMarkersRef.current.clearLayers()
    instructorMarkersRef.current.clear()

    if (!visitorLocation) return

    const visitorIcon = L.divIcon({
      className: 'levelup-map-marker-wrap',
      html: '<span class="levelup-map-marker levelup-map-marker--visitor"></span>',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    })

    const instructorIcon = L.divIcon({
      className: 'levelup-map-marker-wrap',
      html: '<span class="levelup-map-marker levelup-map-marker--instructor"></span>',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    })

    visitorMarkerRef.current = L.marker(
      [visitorLocation.latitude, visitorLocation.longitude],
      { icon: visitorIcon }
    )
      .bindPopup('<strong>You are here</strong>')
      .addTo(mapMarkersRef.current)

    nearbyInstructors.forEach(instructor => {
      const courseLinks = instructor.courses
        .map(course => `<a href="/courses/${course.id}">${escapeHtml(course.title)}</a>`)
        .join('<br />')

      const marker = L.marker(
        [instructor.latitude, instructor.longitude],
        { icon: instructorIcon }
      )
        .bindPopup(
          `<strong>${escapeHtml(instructor.instructor_name)}</strong>` +
          `<br />${escapeHtml(instructor.city || 'LevelUp instructor')}` +
          `<br /><span>${instructor.distance_km} km away</span>` +
          `<br />${courseLinks}`
        )
        .addTo(mapMarkersRef.current)

      instructorMarkersRef.current.set(instructor.instructor_id, marker)
    })

    if (nearbyInstructors.length > 0) {
      const bounds = L.latLngBounds([
        [visitorLocation.latitude, visitorLocation.longitude],
        ...nearbyInstructors.map(instructor => [instructor.latitude, instructor.longitude]),
      ])
      mapInstanceRef.current.fitBounds(bounds, { padding: [28, 28] })
    } else {
      mapInstanceRef.current.setView(
        [visitorLocation.latitude, visitorLocation.longitude],
        12
      )
    }
  }, [nearbyInstructors, visitorLocation])

  useEffect(() => {
    if (!mapInstanceRef.current || !visitorLocation) return

    mapInstanceRef.current.setView(
      [visitorLocation.latitude, visitorLocation.longitude],
      12,
      { animate: true }
    )
  }, [visitorLocation])

  const focusInstructor = (instructor) => {
    const marker = instructorMarkersRef.current.get(instructor.instructor_id)
    if (!marker || !mapInstanceRef.current) return

    mapInstanceRef.current.setView(
      [instructor.latitude, instructor.longitude],
      14,
      { animate: true }
    )
    marker.openPopup()
  }

  const recenterOnVisitor = () => {
    if (!visitorLocation || !mapInstanceRef.current) return

    mapInstanceRef.current.setView(
      [visitorLocation.latitude, visitorLocation.longitude],
      14,
      { animate: true }
    )
    visitorMarkerRef.current?.openPopup()
  }

  // When the side panel opens or closes, wait for the CSS transition to
  // finish (~350 ms) then tell Leaflet to recalculate the map container
  // size so tiles fill the narrower or wider space correctly.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }, 380)
    return () => clearTimeout(timer)
  }, [listPanelOpen])

  // Close the side panel automatically if location is no longer 'success'
  // (e.g. user taps the button again and triggers a new request).
  // We derive visibility: the panel is only actually "open" when location is also 'success'.
  const listPanelVisible = listPanelOpen && locationStatus === 'success'

  const locationMessages = {
    idle: 'Allow location access to prepare nearby instructor results.',
    loading: 'Finding your location...',
    success: 'Location found. Nearby instructors are shown on the map.',
    denied: 'Location access was not granted. You can try again whenever you are ready.',
    unsupported: 'This browser does not support location access. Nearby search is unavailable here.',
    error: 'We could not determine your location. Check your connection or try again.',
  }

  const locationButtonLabel = locationStatus === 'loading'
    ? 'Finding you...'
    : 'Use my location'

  const locationButtonDisabled = locationStatus === 'loading'


  return (
    <div className="home-page">
      <Navbar />

      <main className="home-main">

        {/* Hero panel */}
        <section className="home-hero-panel">
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
                onClick={() => navigate('/signup')}
                className="home-hero-action home-hero-action--student"
              >
                Start learning
                <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/become-instructor')}
                className="home-hero-action home-hero-action--instructor"
              >
                Teach on LevelUp
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

        {/* Nearby map panel — markers are added only after location permission. */}
        <section className="home-location-section" aria-labelledby="home-location-title">
          <div className="home-location-card">
            <div className="home-location-header">
              <div className="home-location-icon" aria-hidden="true">⌖</div>
              <div className="home-location-content">
                <div className="home-location-title-row">
                  <p className="home-section-eyebrow">LEARN CLOSER TO HOME</p>
                </div>
                <h2 id="home-location-title">Find your next instructor nearby</h2>
                <p>
                  Use your location to discover trusted LevelUp instructors
                  and practical courses around you.
                </p>
                <p className="home-location-message" aria-live="polite">
                  {locationMessages[locationStatus]}
                </p>
              </div>
              <div className="home-location-action">
                <button
                  type="button"
                  className={`home-location-button ${locationStatus === 'success' ? 'home-location-button--success' : ''}`}
                  onClick={handleLocationRequest}
                  disabled={locationButtonDisabled}
                >
                  {locationStatus === 'success' ? (
                    <span className="home-location-button-success">
                      <span aria-hidden="true">✓</span>
                      Location found
                    </span>
                  ) : (
                    locationButtonLabel
                  )}
                </button>
                {locationStatus === 'success' && (
                  <p className="home-location-button-hint">
                    Click again to relocate
                  </p>
                )}
              </div>
            </div>

            {/* Map + instructor list side by side */}
            <div className={`home-map-list-wrap${listPanelVisible ? ' home-map-list-wrap--open' : ''}`}>

              {/* The Leaflet map — shrinks to 56 % when the panel is open */}
              <div className="home-location-map-wrap">
                <div
                  ref={mapElementRef}
                  className="home-nearby-map"
                  aria-label="Map showing nearby LevelUp instructors"
                />
                <div className="home-nearby-legend" aria-label="Map legend">
                  <span><i className="home-nearby-legend-dot home-nearby-legend-dot--visitor" />You</span>
                  <span><i className="home-nearby-legend-dot home-nearby-legend-dot--instructor" />Instructor</span>
                </div>
                <button
                  type="button"
                  className="home-map-recenter-button"
                  onClick={recenterOnVisitor}
                  disabled={!visitorLocation}
                  aria-label={visitorLocation ? 'Center map on your location' : 'Allow location to center the map on you'}
                >
                  <span aria-hidden="true">⌖</span>
                  {visitorLocation ? 'Center on me' : 'Allow location first'}
                </button>
                {!visitorLocation && (
                  <div className="home-location-map-overlay">
                    <span className="home-location-map-overlay-icon" aria-hidden="true">⌖</span>
                    <strong>Ready to find instructors near you?</strong>
                    <span>Allow location access to discover instructors nearby.</span>
                  </div>
                )}
              </div>

              {/* Instructor list panel — slides in from the right */}
              {locationStatus === 'success' && (
                <div className="home-list-panel" aria-hidden={!listPanelVisible}>
                  <div className="home-list-panel-inner">

                    {/* Panel header */}
                    <div className="home-list-panel-header">
                      <div>
                        <h3>Instructors near you</h3>
                        {!nearbyLoading && !nearbyError && (
                          <span>
                            {nearbyInstructors.length} {nearbyInstructors.length === 1 ? 'instructor' : 'instructors'} within 25 km
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="home-list-panel-close"
                        onClick={() => setListPanelOpen(false)}
                        aria-label="Close instructor list"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Scrollable instructor list */}
                    <div className="home-list-panel-scroll">
                      {nearbyLoading ? (
                        <div className="home-nearby-status">Finding instructors near you...</div>
                      ) : nearbyError ? (
                        <div className="home-nearby-status home-nearby-status--error" role="alert">
                          {nearbyError}
                        </div>
                      ) : nearbyInstructors.length === 0 ? (
                        <div className="home-nearby-status">
                          No instructors near you yet. Try again later as more local courses are published.
                        </div>
                      ) : (
                        <div className="home-nearby-list">
                          {nearbyInstructors.map(instructor => (
                            <button
                              key={instructor.instructor_id}
                              type="button"
                              className="home-nearby-instructor"
                              onClick={() => focusInstructor(instructor)}
                            >
                              <span className="home-nearby-instructor-avatar" aria-hidden="true">
                                {instructor.instructor_name.charAt(0).toUpperCase()}
                              </span>
                              <span className="home-nearby-instructor-info">
                                <strong>{instructor.instructor_name}</strong>
                                <span>{instructor.city || 'LevelUp instructor'}</span>
                                <small>
                                  {instructor.courses.length} {instructor.courses.length === 1 ? 'course' : 'courses'}
                                </small>
                              </span>
                              <span className="home-nearby-instructor-distance">
                                {instructor.distance_km} km
                                <small>View map →</small>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle button — visible once location is found */}
            {locationStatus === 'success' && (
              <div className="home-list-toggle-bar">
                <button
                  type="button"
                  className={`home-list-toggle-btn${listPanelVisible ? ' home-list-toggle-btn--active' : ''}`}
                  onClick={() => setListPanelOpen(prev => !prev)}
                >
                  <span aria-hidden="true">📋</span>
                  <span>{listPanelVisible ? 'Hide instructor list' : 'See all instructors'}</span>
                  {!nearbyLoading && !nearbyError && (
                    <span className="home-list-count-badge">{nearbyInstructors.length}</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Public course browse section */}
        <section id="explore-courses" className="home-explore-courses">
          <div className="home-explore-heading">
            <div>
              <p className="home-section-eyebrow">YOUR NEXT STEP</p>
              <h2>Explore Courses</h2>
              <p>
                Browse available courses and find the right learning path
                before creating an account.
              </p>
            </div>
            {!coursesLoading && (
              <span className="home-course-count">
                {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
              </span>
            )}
          </div>

          {coursesLoading ? (
            <div className="home-course-status">Finding courses for you...</div>
          ) : courses.length === 0 ? (
            <div className="home-course-status">New courses will appear here soon.</div>
          ) : (
            <div className="home-course-grid">
              {courses.map(course => (
                <article
                  key={course.id}
                  className="home-course-card"
                  onClick={() => navigate(`/courses/${course.id}`)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/courses/${course.id}`)
                    }
                  }}
                  role="button"
                  tabIndex="0"
                >
                  <div className="home-course-avatar">
                    {course.title.charAt(0).toUpperCase()}
                  </div>
                  <h3>{course.title}</h3>
                  <p>By {course.instructor_name || 'LevelUp instructor'}</p>
                  <div className="home-course-meta">
                    <strong>₹{course.price}</strong>
                    <span>View course →</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Journey section */}
        <section className="home-journey">
          <h2>Your Journey on LevelUp</h2>
          <p className="home-section-subtitle">
            Follow your path — whether you're here to learn or to teach
          </p>

          <div className="journey-tabs">
            <button
              onClick={() => setActiveTab('student')}
              className={`journey-tab journey-tab--student ${activeTab === 'student' ? 'active' : ''}`}
            >
              Student's Path
            </button>
            <button
              onClick={() => setActiveTab('teacher')}
              className={`journey-tab journey-tab--teacher ${activeTab === 'teacher' ? 'active' : ''}`}
            >
              Teacher's Path
            </button>
          </div>

          {activeTab === 'student' && <JourneyTrack steps={studentSteps} variant="student" />}
          {activeTab === 'teacher' && <JourneyTrack steps={teacherSteps} variant="teacher" />}
        </section>

        {/* How it works */}
        <section className="home-how">
          <h2>How LevelUp Works</h2>
          <div className="how-cards">
            <div className="how-card">
              <h3>For Students</h3>
              <ul>
                {["Find teachers near you", "Attend online classes", "Meet offline for doubts", "Learn with guidance"].map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button onClick={() => navigate('/signup')} className="how-card-btn how-card-btn--student">
                Start Learning
              </button>
            </div>

            <div className="how-card">
              <h3>For Teachers</h3>
              <ul>
                {["Create your courses", "Teach online", "Meet students locally", "Grow independently"].map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button onClick={() => navigate('/become-instructor')} className="how-card-btn how-card-btn--teacher">
                Become Instructor
              </button>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="home-reviews">
          <h2>What Students Say</h2>
          <div className="reviews-grid">
            {reviews.map(r => (
              <div key={r.name} className="review-card">
                <span className="review-quote-mark">"</span>
                <p className="review-text">{r.text}</p>
                <div className="review-footer">
                  <p className="review-name">{r.name}</p>
                  <span className="review-tag">{r.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
