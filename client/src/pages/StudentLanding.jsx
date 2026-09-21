// src/pages/StudentLanding.jsx
// Landing page for logged-in students — shows nearby instructors map + course browse.
// Uses StudentNav instead of public Navbar.

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import StudentNav from '../components/StudentNav'
import Footer from '../components/Footer'
import { API_BASE } from '../api'
import '../pages/Home.css'
import './StudentLanding.css'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export default function StudentLanding() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [visitorLocation, setVisitorLocation] = useState(null)
  const [nearbyInstructors, setNearbyInstructors] = useState([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState('')
  const mapElementRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const mapMarkersRef = useRef(null)
  const instructorMarkersRef = useRef(new Map())
  const visitorMarkerRef = useRef(null)

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
        setCourses(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch courses:', err)
        setLoading(false)
      })
  }, [])

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

  const locationMessages = {
    idle: 'Allow location access to prepare nearby instructor results.',
    loading: 'Finding your location...',
    success: 'Location found. Nearby instructors are shown on the map below.',
    denied: 'Location access was not granted. You can try again whenever you are ready.',
    unsupported: 'This browser does not support location access. Nearby search is unavailable here.',
    error: 'We could not determine your location. Check your connection or try again.',
  }

  const locationButtonLabel = locationStatus === 'loading'
    ? 'Finding you...'
    : 'Use my location'

  const locationButtonDisabled = locationStatus === 'loading'

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`)
  }

  return (
    <div className="student-landing-page">
      <StudentNav user={user} activeLink="explore" />

      <main className="student-landing-main">
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

            {locationStatus === 'success' && (
              <div className="home-nearby-content" aria-labelledby="home-nearby-title">
                <div className="home-nearby-heading">
                  <div>
                    <p className="home-section-eyebrow">NEARBY LEARNING</p>
                    <h2 id="home-nearby-title">Instructors around you</h2>
                    <p>
                      Explore published courses from instructors within 25 km of
                      your selected location.
                    </p>
                  </div>
                  {!nearbyLoading && !nearbyError && (
                    <span className="home-nearby-count">
                      {nearbyInstructors.length} {nearbyInstructors.length === 1 ? 'instructor' : 'instructors'}
                    </span>
                  )}
                </div>

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
            )}
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
