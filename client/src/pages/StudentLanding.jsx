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
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedCategoryName, setSelectedCategoryName] = useState('')
  // searchInput updates immediately as the student types
  const [searchInput, setSearchInput] = useState('')
  // debouncedQuery updates 300ms after typing stops to prevent rapid API calls & map redraws
  const [debouncedQuery, setDebouncedQuery] = useState('')

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

  useEffect(() => {
    // Get logged-in user from localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])


  // Sync URL query params & auto-scroll to map if hash is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q') || params.get('search')
    const cat = params.get('category_id')
    if (q) {
      setSearchInput(q)
      setDebouncedQuery(q)
    }
    if (cat) {
      setSelectedCategoryId(cat)
    }

    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '')
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 250)
      return () => clearTimeout(timer)
    } else if (cat) {
      const timer = setTimeout(() => {
        const el = document.getElementById('explore-courses')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [])

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch courses whenever selected category or debounced query changes
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCategoryId) params.append('category_id', selectedCategoryId)
    if (debouncedQuery) params.append('q', debouncedQuery)
    const query = params.toString() ? `?${params.toString()}` : ''

    fetch(`${API_BASE}/api/courses${query}`)
      .then(res => res.json())
      .then(data => {
        setCourses(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch courses:', err)
        setLoading(false)
      })
  }, [selectedCategoryId, debouncedQuery])

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

  // Fetch nearby instructors whenever location, category, or debounced search changes
  useEffect(() => {
    if (!visitorLocation) return

    const controller = new AbortController()
    setNearbyLoading(true)

    const params = new URLSearchParams({
      lat: visitorLocation.latitude,
      lng: visitorLocation.longitude,
    })
    if (selectedCategoryId) params.append('category_id', selectedCategoryId)
    if (debouncedQuery) params.append('q', debouncedQuery)

    fetch(
      `${API_BASE}/api/instructors/nearby?${params.toString()}`,
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
  }, [visitorLocation, selectedCategoryId, debouncedQuery])

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
          `<br /><div style="margin: 6px 0;"><a href="/instructors/${instructor.instructor_id}" style="font-weight: 700; color: #4f46e5; text-decoration: none;">View Full Profile & Courses →</a></div>` +
          (courseLinks ? `<small style="color: #64748b;">Courses:</small><br />${courseLinks}` : '')
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
  // (e.g. student taps the button again and triggers a new request).
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

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`)
  }

    const handleSearchSubmit = () => {
    setDebouncedQuery(searchInput.trim())
    const mapEl = document.getElementById('nearby-map-section')
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleCategoryChange = (catId, catName) => {
    setSelectedCategoryId(catId)
    setSelectedCategoryName(catName || '')
    const mapEl = document.getElementById('nearby-map-section')
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setDebouncedQuery('')
    setSelectedCategoryId('')
    setSelectedCategoryName('')
  }

  const hasActiveFilters = Boolean(searchInput || debouncedQuery || selectedCategoryId)

  return (
    <div className="student-landing-page">
      <StudentNav
        user={user}
        activeLink="explore"
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        selectedCategoryId={selectedCategoryId}
        selectedCategoryName={selectedCategoryName}
        onCategoryChange={handleCategoryChange}
        onSearchSubmit={handleSearchSubmit}
      />

      <main className="student-landing-main">
        {/* Nearby map panel — markers are added only after location permission. */}
        <section id="nearby-map-section" className="home-location-section" aria-labelledby="home-location-title">
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
                          {hasActiveFilters ? (
                            <>
                              No nearby instructors teach courses matching your filter.
                              <button
                                type="button"
                                className="home-nearby-reset-link"
                                onClick={handleResetFilters}
                              >
                                Reset filters
                              </button>
                            </>
                          ) : (
                            'No instructors near you yet. Try again later as more local courses are published.'
                          )}
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

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="course-active-filter-bar">
              <span className="course-active-filter-label">Active filters:</span>
              {selectedCategoryName && (
                <span className="course-active-filter-chip">
                  Category: <strong>{selectedCategoryName}</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId('')
                      setSelectedCategoryName('')
                    }}
                    aria-label="Remove category filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {debouncedQuery && (
                <span className="course-active-filter-chip">
                  Search: <strong>"{debouncedQuery}"</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      setDebouncedQuery('')
                    }}
                    aria-label="Remove search query"
                  >
                    ✕
                  </button>
                </span>
              )}
              <button
                type="button"
                className="course-active-filter-reset"
                onClick={handleResetFilters}
              >
                Reset all filters
              </button>
            </div>
          )}

          {loading ? (
            <div className="student-landing-status-card">
              <div className="student-landing-status-icon" aria-hidden="true">✦</div>
              <p className="student-landing-loading">Finding courses for you...</p>
              <span>Please wait while the course list loads.</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="student-landing-status-card">
              <div className="student-landing-status-icon" aria-hidden="true">
                {hasActiveFilters ? '🔍' : '📚'}
              </div>
              <p className="student-landing-empty">
                {debouncedQuery
                  ? `No courses match "${debouncedQuery}"`
                  : selectedCategoryId
                  ? 'No courses found in this category'
                  : 'No courses available yet'}
              </p>
              <span>
                {hasActiveFilters
                  ? 'Try checking for typos, searching for a different keyword, or resetting your filters.'
                  : 'New learning opportunities will appear here soon.'}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="course-empty-reset-btn"
                  onClick={handleResetFilters}
                >
                  Reset filters
                </button>
              )}
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
                  {/* Card Header: Delivery Mode & Level Badges */}
                  <div className="course-card-top">
                    <div className="course-card-badges-row">
                      <span className={`course-card-mode-pill is-${course.delivery_mode || 'online'}`}>
                        {course.delivery_mode === 'offline' ? '🏢 Offline' : course.delivery_mode === 'hybrid' ? '🔄 Hybrid' : '🌐 Online'}
                      </span>
                      {course.level && (
                        <span className="course-card-level-pill">
                          {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                        </span>
                      )}
                      {course.rating_source === 'fresh' && (
                        Number(course.instructor_total_reviews) > 0 ? (
                          <span className="course-card-new-pill is-release">✨ New Release</span>
                        ) : (
                          <span className="course-card-new-pill">✨ New Course</span>
                        )
                      )}
                    </div>
                    <span className="course-card-open" aria-hidden="true">↗</span>
                  </div>

                  {/* Course Content */}
                  <div className="course-card-content">
                    <h3 className="course-card-title">{course.title}</h3>
                    
                    {/* Instructor Row with Profile Avatar & City */}
                    <div
                      className="course-card-instructor-row"
                      onClick={(e) => {
                        if (course.instructor_id) {
                          e.stopPropagation();
                          navigate(`/instructors/${course.instructor_id}`);
                        }
                      }}
                      title={`View ${course.instructor_name || 'instructor'}'s full profile`}
                    >
                      <div className="course-card-instructor-avatar">
                        {course.instructor_avatar_url ? (
                          <img
                            src={course.instructor_avatar_url}
                            alt={course.instructor_name}
                            className="course-card-instructor-img"
                          />
                        ) : (
                          <div className="course-card-instructor-initials">
                            {(course.instructor_name || 'I').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="course-card-instructor-details">
                        <span className="course-card-instructor-name">
                          {course.instructor_name || 'LevelUp Instructor'}
                        </span>
                        {course.instructor_city && (
                          <span className="course-card-instructor-city">
                            📍 {course.instructor_city}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="course-card-meta">
                      <span className="course-card-price">₹{course.price}</span>
                      {course.rating_source === 'previous_course' ? (
                        <span className="course-card-rating is-previous" title="Rating from previous course edition">
                          ⭐ {Number(course.avg_rating).toFixed(1)} <small className="from-prev-tag">({course.review_count} • from previous course)</small>
                        </span>
                      ) : course.rating_source === 'direct' && Number(course.avg_rating) > 0 ? (
                        <span className="course-card-rating">
                          ⭐ {Number(course.avg_rating).toFixed(1)} {course.review_count ? `(${course.review_count})` : ''}
                        </span>
                      ) : Number(course.instructor_total_reviews) > 0 ? (
                        <span className="course-card-rating is-instructor" title={`Instructor has ${course.instructor_total_reviews} reviews across all courses`}>
                          ★ {Number(course.instructor_avg_rating).toFixed(1)} <small className="from-prev-tag">(Instructor)</small>
                        </span>
                      ) : (
                        <span className="course-card-fresh-pill">✨ Fresh Launch</span>
                      )}
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
