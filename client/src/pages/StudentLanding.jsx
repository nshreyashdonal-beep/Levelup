// src/pages/StudentLanding.jsx
// Landing page for logged-in students — shows nearby instructors map + course browse.
// Uses StudentNav instead of public Navbar.

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import StudentNav from '../components/StudentNav'
import Footer from '../components/Footer'
import CourseCard from '../components/CourseCard'
import Pagination from '../components/Pagination'
import { API_BASE } from '../api'
import { getSavedVisitorLocation, saveVisitorLocation, clearSavedVisitorLocation } from '../utils/locationStorage'
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

function getInstructorInitials(name) {
  return String(name || 'Instructor')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
}

function buildInstructorPopup(instructor, hasActiveFilter) {
  const courses = [...(instructor.courses || [])]
    .sort((a, b) => {
      if (hasActiveFilter) return 0
      return (
        Number(b.avg_rating || 0) - Number(a.avg_rating || 0) ||
        Number(b.review_count || 0) - Number(a.review_count || 0)
      )
    })
    .slice(0, hasActiveFilter ? courses.length : 3)

  const avatar = instructor.avatar_url
    ? `<img class="levelup-map-popup-avatar-image" src="${escapeHtml(instructor.avatar_url)}" alt="" />`
    : `<span class="levelup-map-popup-avatar-fallback">${escapeHtml(getInstructorInitials(instructor.instructor_name))}</span>`

  const courseMarkup = courses.length > 0
    ? `<div class="levelup-map-popup-courses">
        <span class="levelup-map-popup-label">${hasActiveFilter ? 'Matching courses' : 'Top-rated courses'}</span>
        ${courses.map(course => (
          `<a class="levelup-map-popup-course" href="/courses/${escapeHtml(course.id)}">
            <span>${escapeHtml(course.title)}</span>
            <small>${Number(course.avg_rating || 0).toFixed(1)} rating · ${Number(course.review_count || 0)} reviews</small>
          </a>`
        )).join('')}
      </div>`
    : ''

  return `<div class="levelup-map-popup">
    <div class="levelup-map-popup-header">
      <span class="levelup-map-popup-avatar">${avatar}</span>
      <div class="levelup-map-popup-heading">
        <strong>${escapeHtml(instructor.instructor_name)}</strong>
        <span>Based in ${escapeHtml(instructor.city || 'your area')}</span>
      </div>
    </div>
    <span class="levelup-map-popup-distance">${escapeHtml(instructor.distance_km)} km from you</span>
    ${courseMarkup}
    <a class="levelup-map-popup-profile" href="/instructors/${escapeHtml(instructor.instructor_id)}">View profile and courses</a>
  </div>`
}

export default function StudentLanding() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return Math.max(1, parseInt(params.get('page'), 10) || 1)
  })
  const [limit] = useState(20)
  const [pagination, setPagination] = useState(null)
  const isFilterMount = useRef(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedCategoryName, setSelectedCategoryName] = useState('')
  // searchInput updates immediately as the student types
  const [searchInput, setSearchInput] = useState('')
  // debouncedQuery updates 300ms after typing stops to prevent rapid API calls & map redraws
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const [locationStatus, setLocationStatus] = useState(() => (getSavedVisitorLocation() ? 'success' : 'idle'))
  const [visitorLocation, setVisitorLocation] = useState(getSavedVisitorLocation)
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


  // Reset pagination to page 1 whenever category or search filter changes
  useEffect(() => {
    if (isFilterMount.current) {
      isFilterMount.current = false
      return
    }
    setPage(1)
  }, [selectedCategoryId, debouncedQuery])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    const params = new URLSearchParams(window.location.search)
    if (newPage > 1) {
      params.set('page', newPage)
    } else {
      params.delete('page')
    }
    const newSearch = params.toString() ? `?${params.toString()}` : ''
    window.history.pushState(null, '', `${window.location.pathname}${newSearch}#explore-courses`)

    const el = document.getElementById('explore-courses')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Fetch courses whenever selected category or debounced query changes
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCategoryId) params.append('category_id', selectedCategoryId)
    if (debouncedQuery) params.append('q', debouncedQuery)
    if (visitorLocation) {
      params.append('lat', visitorLocation.latitude)
      params.append('lng', visitorLocation.longitude)
    }
    params.append('page', page)
    params.append('limit', limit)
    const query = params.toString() ? `?${params.toString()}` : ''

    fetch(`${API_BASE}/api/courses${query}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.pagination) {
          setCourses(Array.isArray(data.data) ? data.data : [])
          setPagination(data.pagination)
        } else {
          setCourses(Array.isArray(data) ? data : [])
          setPagination(null)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch courses:', err)
        setLoading(false)
      })
  }, [selectedCategoryId, debouncedQuery, visitorLocation, page, limit])

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
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        saveVisitorLocation(coords)
        setVisitorLocation(coords)
        setLocationStatus('success')
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          clearSavedVisitorLocation()
          setVisitorLocation(null)
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

    const initialCenter = visitorLocation
      ? [visitorLocation.latitude, visitorLocation.longitude]
      : [22.9734, 78.6569]
    const initialZoom = visitorLocation ? 12 : 5
    const map = L.map(mapElementRef.current).setView(initialCenter, initialZoom)

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

  // Intercept clicks on links inside Leaflet popups to perform fast client-side navigation
  useEffect(() => {
    const mapEl = mapElementRef.current
    if (!mapEl) return

    const handlePopupClick = (e) => {
      const link = e.target.closest('a')
      if (!link) return
      const href = link.getAttribute('href')
      if (href && href.startsWith('/')) {
        e.preventDefault()
        navigate(href)
      }
    }

    mapEl.addEventListener('click', handlePopupClick)
    return () => mapEl.removeEventListener('click', handlePopupClick)
  }, [navigate])

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
      const marker = L.marker(
        [instructor.latitude, instructor.longitude],
        { icon: instructorIcon }
      )
        .bindPopup(buildInstructorPopup(instructor, Boolean(selectedCategoryId || debouncedQuery)), {
          className: 'levelup-map-popup-container',
          maxWidth: 300,
        })
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
  }, [nearbyInstructors, visitorLocation, selectedCategoryId, debouncedQuery])

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
  const nearbyCourseDistances = new Map(
    nearbyInstructors.flatMap((instructor) =>
      (instructor.courses || []).map((nearbyCourse) => [
        nearbyCourse.id,
        instructor.distance_km,
      ])
    )
  )

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
                            <div
                              key={instructor.instructor_id}
                              className="home-nearby-instructor"
                              onClick={() => navigate(`/instructors/${instructor.instructor_id}`)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  navigate(`/instructors/${instructor.instructor_id}`);
                                }
                              }}
                              title={`View ${instructor.instructor_name}'s full profile & courses`}
                            >
                              <span className="home-nearby-instructor-avatar" aria-hidden="true">
                                {instructor.avatar_url ? (
                                  <img
                                    src={instructor.avatar_url}
                                    alt={instructor.instructor_name}
                                    className="home-nearby-instructor-img"
                                  />
                                ) : (
                                  instructor.instructor_name.charAt(0).toUpperCase()
                                )}
                              </span>
                              <span className="home-nearby-instructor-info">
                                <strong>{instructor.instructor_name}</strong>
                                <span>{instructor.city || 'LevelUp instructor'}</span>
                                <small>
                                  {instructor.courses.length} {instructor.courses.length === 1 ? 'course' : 'courses'}
                                </small>
                              </span>
                              <div className="home-nearby-instructor-actions">
                                <span className="home-nearby-instructor-distance">
                                  {instructor.distance_km} km
                                </span>
                                <span className="home-nearby-view-link">
                                  View Profile →
                                </span>
                                <button
                                  type="button"
                                  className="home-nearby-map-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    focusInstructor(instructor);
                                  }}
                                  title="Locate on map"
                                  aria-label={`Locate ${instructor.instructor_name} on map`}
                                >
                                  Show on map
                                </button>
                              </div>
                            </div>
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
            <>
              <div className="student-landing-courses-grid">
                {courses.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    userLocation={visitorLocation}
                    distanceKm={
                      nearbyCourseDistances.get(course.id) ??
                      nearbyInstructors.find(
                        (instructor) => instructor.instructor_id === course.instructor_id
                      )?.distance_km
                    }
                  />
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={pagination?.totalPages || 1}
                totalItems={pagination?.totalItems}
                limit={limit}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
