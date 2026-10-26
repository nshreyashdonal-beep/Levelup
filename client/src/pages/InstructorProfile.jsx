// src/pages/InstructorProfile.jsx
// Dedicated public showcase page for an instructor:
//   - Full About & Bio Header with verified badge, city, rating, and teaching metrics
//   - Complete Course Catalogue with Online, Hybrid, and Offline mode filter pills
//   - Direct navigation to individual course detail pages

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StudentNav from '../components/StudentNav';
import Footer from '../components/Footer';
import CourseCard from '../components/CourseCard';
import { API_BASE } from '../api';
import './InstructorProfile.css';

export default function InstructorProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [instructor, setInstructor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [modeFilter, setModeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Read current user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  // Fetch instructor profile and courses in parallel
  useEffect(() => {
    setLoading(true);
    setNotFound(false);

    Promise.all([
      fetch(`${API_BASE}/api/instructors/${id}`).then((res) => {
        if (res.status === 404) return null;
        return res.json();
      }),
      fetch(`${API_BASE}/api/courses?instructor_id=${id}`).then((res) => res.json()),
    ])
      .then(([instructorData, coursesData]) => {
        if (!instructorData || instructorData.error) {
          setNotFound(true);
        } else {
          setInstructor(instructorData);
        }
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      })
      .catch((err) => {
        console.error('Failed to load instructor profile:', err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Mode counts
  const onlineCount = courses.filter((c) => (c.delivery_mode || 'online') === 'online').length;
  const hybridCount = courses.filter((c) => c.delivery_mode === 'hybrid').length;
  const offlineCount = courses.filter((c) => c.delivery_mode === 'offline').length;

  const filteredCourses = courses.filter((course) => {
    if (modeFilter === 'all') return true;
    const mode = course.delivery_mode || 'online';
    return mode === modeFilter;
  });

  if (loading) {
    return (
      <div className="instructor-profile-page">
        <StudentNav user={user} activeLink="explore" />
        <main className="instructor-profile-main">
          <p className="instructor-profile-status">Loading instructor profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !instructor) {
    return (
      <div className="instructor-profile-page">
        <StudentNav user={user} activeLink="explore" />
        <main className="instructor-profile-main">
          <div className="instructor-profile-empty-card">
            <h2>Instructor not found</h2>
            <p>The instructor you are looking for does not exist or has been removed.</p>
            <Link to="/student-landing" className="instructor-profile-back-btn">
              ← Back to Explore Courses
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="instructor-profile-page">
      <StudentNav user={user} activeLink="explore" />

      <main className="instructor-profile-main">
        {/* Breadcrumb Path */}
        <nav className="instructor-profile-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator">›</span>
          <Link to="/student-landing#explore-courses">Explore</Link>
          <span className="breadcrumb-separator">›</span>
          <Link to="/student-landing#nearby-map-section">Instructors</Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-active">{instructor.name}</span>
        </nav>

        {/* TOP HERO: ABOUT INSTRUCTOR */}
        <section className="instructor-hero-card">
          <div className="instructor-hero-top">
            <div className="instructor-hero-avatar-wrap">
              {instructor.avatar_url ? (
                <img
                  src={instructor.avatar_url}
                  alt={instructor.name}
                  className="instructor-hero-avatar-img"
                />
              ) : (
                <div className="instructor-hero-avatar-initials">
                  {(instructor.name || 'I').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="instructor-hero-header-info">
              <div className="instructor-hero-name-row">
                <h1 className="instructor-hero-name">{instructor.name}</h1>
                <span className="instructor-hero-verified-badge">✓ Verified Mentor</span>
              </div>

              <p className="instructor-hero-title">
                Course Creator & Educator at LevelUp
              </p>

              {instructor.city && (
                <p className="instructor-hero-location">
                  Based in {instructor.city}, India
                </p>
              )}
            </div>
          </div>

          {/* Stats Ribbon */}
          <div className="instructor-hero-stats-ribbon">
            <div className="stats-ribbon-item">
              <span className="stats-ribbon-val">
              {Number(instructor.avg_rating) > 0 ? Number(instructor.avg_rating).toFixed(1) : '5.0'}
              </span>
              <span className="stats-ribbon-lbl">
                {instructor.review_count || 0} Review{instructor.review_count === 1 ? '' : 's'}
              </span>
            </div>

            <div className="stats-ribbon-item">
              <span className="stats-ribbon-val">{instructor.student_count || 0}</span>
              <span className="stats-ribbon-lbl">Enrolled Students</span>
            </div>

            <div className="stats-ribbon-item">
              <span className="stats-ribbon-val">{courses.length}</span>
              <span className="stats-ribbon-lbl">Published Courses</span>
            </div>
          </div>

          {/* Bio Narrative */}
          <div className="instructor-hero-bio">
            <h2 className="instructor-bio-title">About the Instructor</h2>
            <p className="instructor-bio-text">
              {instructor.bio ||
                `Hello! I am ${instructor.name}. I create practical, project-based courses on LevelUp designed to help learners acquire real-world skills, master modern tooling, and bridge textbook knowledge with industry standards.`}
            </p>
          </div>
        </section>

        {/* CATALOGUE SECTION: ALL COURSES */}
        <section className="instructor-catalogue-section">
          <div className="instructor-catalogue-header">
            <div>
              <h2 className="instructor-catalogue-title">
                Courses by {instructor.name}
              </h2>
              <p className="instructor-catalogue-subtitle">
                Browse all available courses across online, offline, and hybrid delivery modes.
              </p>
            </div>

            {/* Mode Filter Pills */}
            <div className="instructor-catalogue-filter-pills" role="tablist">
              <button
                type="button"
                className={`catalogue-filter-pill ${modeFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setModeFilter('all')}
              >
                All ({courses.length})
              </button>

              <button
                type="button"
                className={`catalogue-filter-pill ${modeFilter === 'online' ? 'is-active' : ''}`}
                onClick={() => setModeFilter('online')}
              >
                Online ({onlineCount})
              </button>

              <button
                type="button"
                className={`catalogue-filter-pill ${modeFilter === 'hybrid' ? 'is-active' : ''}`}
                onClick={() => setModeFilter('hybrid')}
              >
                Hybrid ({hybridCount})
              </button>

              <button
                type="button"
                className={`catalogue-filter-pill ${modeFilter === 'offline' ? 'is-active' : ''}`}
                onClick={() => setModeFilter('offline')}
              >
                Offline ({offlineCount})
              </button>
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <div className="instructor-catalogue-empty">
              <span className="empty-icon" aria-hidden="true">NO COURSES</span>
              <p>No courses found in this category.</p>
              {modeFilter !== 'all' && (
                <button
                  type="button"
                  className="reset-filter-btn"
                  onClick={() => setModeFilter('all')}
                >
                  Show all courses ({courses.length})
                </button>
              )}
            </div>
          ) : (
            <div className="instructor-catalogue-grid">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  hideInstructor={true}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}