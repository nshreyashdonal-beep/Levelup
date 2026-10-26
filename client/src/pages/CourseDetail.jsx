// src/pages/CourseDetail.jsx
// Redesigned course details view with a 3-tab layout:
//   Tab 1: About (Description, outcomes, specifications, reviews)
//   Tab 2: Instructor (Profile photo, verified badge, bio, city, sessions, and catalog link)
//   Tab 3: Classroom (Embedded sample player, curriculum with preview vs locked lectures)
// Anchored by a persistent sticky enrollment card on the right column.

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import StudentNav from '../components/StudentNav';
import Footer from '../components/Footer';
import { API_BASE } from '../api';
import { getSavedVisitorLocation, saveVisitorLocation } from '../utils/locationStorage';
import './CourseDetail.css';

async function readJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(
      'The frontend reached the wrong server. Restart Vite and use the URL it displays.'
    );
  }

  return response.json();
}

// Helper to parse video embed info (YouTube, Vimeo, Cloudinary, direct video)
function getVideoPreview(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '').toLowerCase();

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      let id = parsed.searchParams.get('v');
      if (!id && parsed.pathname.includes('/embed/')) {
        id = parsed.pathname.split('/embed/')[1]?.split('?')[0];
      } else if (!id && parsed.pathname.includes('/shorts/')) {
        id = parsed.pathname.split('/shorts/')[1]?.split('/')[0];
      }
      return id
        ? {
            type: 'youtube',
            id,
            src: `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0`,
          }
        : null;
    }

    if (hostname === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id
        ? {
            type: 'youtube',
            id,
            src: `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0`,
          }
        : null;
    }

    if (hostname === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return /^\d+$/.test(id || '')
        ? { type: 'embed', src: `https://player.vimeo.com/video/${id}` }
        : null;
    }

    const isCloudinary =
      hostname.endsWith('cloudinary.com') && parsed.pathname.includes('/video/upload/');
    const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(parsed.pathname);

    if (isCloudinary) {
      parsed.pathname = parsed.pathname.replace(
        '/video/upload/',
        '/video/upload/vc_h264,ac_aac,f_mp4/'
      );
    }

    return isCloudinary || isDirectVideo ? { type: 'video', src: parsed.toString() } : null;
  } catch {
    return null;
  }
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [distanceKm, setDistanceKm] = useState(null);

  // Tab state: 'about' | 'instructor' | 'classroom'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'about';
  });

  // Classroom trial class state
  const [selectedTrialLecture, setSelectedTrialLecture] = useState(null);

  // Enroll button state
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [learningModules, setLearningModules] = useState([]);
  const [learningLoading, setLearningLoading] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState({});
  const [isHeroMinimized, setIsHeroMinimized] = useState(false);

  // Leave-a-review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewDone, setReviewDone] = useState(false);

  // Sync tab with URL search parameter if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['about', 'instructor', 'classroom'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Read current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Fetch course, sessions, and reviews in parallel
  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch(`${API_BASE}/api/courses/${id}`).then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return readJsonResponse(res);
      }),
      fetch(`${API_BASE}/api/sessions?course_id=${id}`).then(readJsonResponse),
      fetch(`${API_BASE}/api/reviews?course_id=${id}`).then(readJsonResponse),
    ])
      .then(([courseData, sessionsData, reviewsData]) => {
        if (courseData) setCourse(courseData);
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      })
      .catch((err) => {
        console.error('Failed to load course:', err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Check enrollment for logged-in students
  useEffect(() => {
    if (!user || user.role !== 'student') return;

    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/enrollments/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.some((e) => e.course_id === id)) {
          setAlreadyEnrolled(true);
        }
      })
      .catch(() => {});
  }, [user, id]);

  // Fetch learning curriculum & lecture completions for enrolled students
  useEffect(() => {
    if (!alreadyEnrolled || !user || user.role !== 'student') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setLearningLoading(true);
    fetch(`${API_BASE}/api/learning/courses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.modules) {
          setLearningModules(data.modules);
        }
      })
      .catch((err) => console.error('Failed to load learning progress:', err))
      .finally(() => setLearningLoading(false));
  }, [alreadyEnrolled, user, id]);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const isFromPreviousCourse = reviews.some((r) => r.is_from_previous_course);
  const hasDirectReviews = reviews.length > 0 && !isFromPreviousCourse;
  const hasInstructorReviews =
    !reviews.length && Number(course?.instructor_total_reviews) > 0;
  const isFreshLaunch =
    reviews.length === 0 &&
    (!course?.instructor_total_reviews || Number(course?.instructor_total_reviews) === 0);

  // Gather all lectures across modules
  const allLectures = course?.modules?.flatMap((m) => m.lectures || []) || [];
  const hasExplicitTrials = course?.modules?.some((m) =>
    m.lectures?.some((l) => Boolean(l.is_trial))
  );
  const firstTrialLecture =
    allLectures.find((l) => Boolean(l.is_trial)) ||
    allLectures.find((l) => l.video_url) ||
    allLectures[0] ||
    null;
  const currentTrialLecture = selectedTrialLecture || firstTrialLecture;
  const trialVideoPreview = currentTrialLecture ? getVideoPreview(currentTrialLecture.video_url) : null;

  const searchParams = new URLSearchParams(location.search);
  const isFromMyCourses =
    searchParams.get('from') === 'mycourses' ||
    Boolean(alreadyEnrolled && user?.role === 'student');

  const enrolledLectures = useMemo(() => {
    return (learningModules.length > 0 ? learningModules : course?.modules || []).flatMap(
      (m) => (m.lectures || []).map((l) => ({ ...l, moduleId: m.id }))
    );
  }, [learningModules, course?.modules]);

  const totalEnrolledLectures = enrolledLectures.length || allLectures.length || 0;
  const completedLecturesCount = enrolledLectures.filter((l) =>
    Boolean(l.completed || l.completed_at)
  ).length;
  const enrolledProgressPercent =
    totalEnrolledLectures > 0
      ? Math.round((completedLecturesCount / totalEnrolledLectures) * 100)
      : 0;

  const resumeLecture = useMemo(() => {
    if (!enrolledLectures.length) return null;
    return (
      enrolledLectures.find((l) => !l.completed && !l.completed_at) ||
      enrolledLectures[0]
    );
  }, [enrolledLectures]);

  const toggleModule = (moduleKey) => {
    setCollapsedModules((current) => ({
      ...current,
      [moduleKey]: !current[moduleKey],
    }));
  };

  const currentModulesList = useMemo(() => {
    return learningModules.length > 0 ? learningModules : course?.modules || [];
  }, [learningModules, course?.modules]);

  const allCollapsed = useMemo(() => {
    if (!currentModulesList.length) return false;
    return currentModulesList.every((mod, idx) =>
      Boolean(collapsedModules[mod.id || `module-${idx}`])
    );
  }, [currentModulesList, collapsedModules]);

  const toggleAllModules = () => {
    const nextState = !allCollapsed;
    const updated = {};
    currentModulesList.forEach((mod, idx) => {
      updated[mod.id || `module-${idx}`] = nextState;
    });
    setCollapsedModules(updated);
  };

  function handleEnroll() {
    const token = localStorage.getItem('token');

    if (!token || !user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'student') {
      setEnrollError('Only students can enroll in courses');
      return;
    }

    setEnrolling(true);
    setEnrollError('');

    fetch(`${API_BASE}/api/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ course_id: id }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setAlreadyEnrolled(true);
        } else {
          setEnrollError(data.error || 'Something went wrong enrolling');
        }
      })
      .catch(() => setEnrollError('Something went wrong enrolling'))
      .finally(() => setEnrolling(false));
  }

  function handleReviewSubmit(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');

    if (!token || !user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'student') {
      setReviewError('Only students can leave reviews');
      return;
    }

    if (!alreadyEnrolled) {
      setReviewError('You must be enrolled in this course to leave a review');
      return;
    }

    if (!reviewRating) {
      setReviewError('Please select a rating');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');

    fetch(`${API_BASE}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        course_id: id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, status: res.status, data })))
      .then(({ ok, status, data }) => {
        if (ok) {
          setReviews((prev) => [{ ...data, student_name: user.name }, ...prev]);
          setReviewDone(true);
        } else if (status === 409) {
          setReviewDone(true);
        } else {
          setReviewError(data.error || 'Something went wrong submitting your review');
        }
      })
      .catch(() => setReviewError('Could not reach the server. Is it running?'))
      .finally(() => setSubmittingReview(false));
  }

  const SESSION_TYPE_LABELS = {
    doubt: 'Doubt Session',
    offline: 'Offline Meet',
    mock_test: 'Mock Test',
  };

  const deliveryMode = course?.delivery_mode || 'online';
  const deliveryLabel =
    deliveryMode === 'offline' ? 'Offline' : deliveryMode === 'hybrid' ? 'Hybrid' : 'Online';
  const isLocationBasedCourse = deliveryMode === 'offline' || deliveryMode === 'hybrid';

  useEffect(() => {
    if (!isLocationBasedCourse) return undefined;

    const computeDistance = (lat, lng) => {
      const instructorLatitude = Number(course?.instructor_latitude);
      const instructorLongitude = Number(course?.instructor_longitude);

      if (
        !Number.isFinite(instructorLatitude) ||
        !Number.isFinite(instructorLongitude)
      ) {
        return;
      }

      const earthRadiusKm = 6371;
      const toRadians = (value) => (value * Math.PI) / 180;
      const latitudeDelta = toRadians(instructorLatitude - lat);
      const longitudeDelta = toRadians(instructorLongitude - lng);
      const latitudeOne = toRadians(lat);
      const latitudeTwo = toRadians(instructorLatitude);
      const haversine =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(latitudeOne) *
          Math.cos(latitudeTwo) *
          Math.sin(longitudeDelta / 2) ** 2;
      const distance = 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));

      setDistanceKm(distance);
    };

    const saved = getSavedVisitorLocation();
    if (saved) {
      computeDistance(saved.latitude, saved.longitude);
      return undefined;
    }

    // Only query browser geolocation if permission was ALREADY granted (never prompt unprompted)
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              ({ coords }) => {
                saveVisitorLocation({ latitude: coords.latitude, longitude: coords.longitude });
                computeDistance(coords.latitude, coords.longitude);
              },
              () => {},
              {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300000,
              }
            );
          }
        })
        .catch(() => {});
    }

    return undefined;
  }, [
    course?.instructor_latitude,
    course?.instructor_longitude,
    isLocationBasedCourse,
  ]);

  // Parse learning outcomes from course.outcomes or provide a structured checklist fallback
  let outcomesList = [];
  if (course?.outcomes) {
    outcomesList = course.outcomes
      .split('\n')
      .map((item) => item.replace(/^[•\-\*\d\.]+\s*/, '').trim())
      .filter(Boolean);
  }
  if (outcomesList.length === 0) {
    outcomesList = [
      'Master core foundations and architect scalable solutions',
      'Hands-on project development with modern best practices',
      'Real-world debugging, testing, and system optimization',
      'Direct preparation for industry applications and interviews',
    ];
  }

  function getSessionCountdownInfo(dateString) {
    if (!dateString) return { countdownText: '', formattedDateTime: '' };
    const target = new Date(dateString);
    const now = new Date();
    const diffMs = target - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let countdownText = '';
    if (diffMs < -3 * 60 * 60 * 1000) {
      countdownText = 'Completed';
    } else if (diffMs < 0) {
      countdownText = 'Happening Today';
    } else if (diffHours < 24 && target.getDate() === now.getDate()) {
      countdownText = 'Today';
    } else if (diffDays === 0 || (diffHours < 36 && target.getDate() === now.getDate() + 1)) {
      countdownText = 'Tomorrow';
    } else if (diffDays === 1) {
      countdownText = 'In 1 day';
    } else {
      countdownText = `In ${diffDays} days`;
    }

    const formattedDateTime = target.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return { countdownText, formattedDateTime };
  }

  const upcomingSessions = (sessions || [])
    .filter((s) => new Date(s.scheduled_at) > new Date(Date.now() - 3 * 60 * 60 * 1000))
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const nextSession = upcomingSessions[0];

  if (loading) {
    return (
      <div className="course-detail-page">
        <StudentNav user={user} activeLink={isFromMyCourses ? 'mycourses' : 'explore'} />
        <main className="course-detail-main">
          <p className="course-detail-status">Loading course details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="course-detail-page">
        <StudentNav user={user} activeLink={isFromMyCourses ? 'mycourses' : 'explore'} />
        <main className="course-detail-main">
          <p className="course-detail-status">Course not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <StudentNav user={user} activeLink={isFromMyCourses ? 'mycourses' : 'explore'} />

      <main className="course-detail-main">
        {/* Breadcrumb Path */}
        <nav className="course-detail-breadcrumb" aria-label="Breadcrumb">
          {isFromMyCourses ? (
            <>
              <Link to="/mycourse">My Courses</Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-active">{course.title}</span>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <span className="breadcrumb-separator">›</span>
              <Link to="/student-landing#explore-courses">Explore</Link>
              {course.category_path && (
                <>
                  <span className="breadcrumb-separator">›</span>
                  <Link
                    to={
                      course.category_id
                        ? `/student-landing?category_id=${course.category_id}#explore-courses`
                        : '/student-landing#explore-courses'
                    }
                    className="breadcrumb-category-link"
                  >
                    {course.category_path}
                  </Link>
                </>
              )}
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-active">{course.title}</span>
            </>
          )}
        </nav>

        {/* Hero Section */}
        <section className="course-detail-hero">
          <div className="course-detail-hero-tags">
            <span className={`course-badge-mode is-${deliveryMode}`}>
              {deliveryLabel}
            </span>
            {course.level && (
              <span className="course-badge-level">
                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
              </span>
            )}
            {course.language && (
              <span className="course-badge-language">{course.language}</span>
            )}
            {isLocationBasedCourse && distanceKm !== null && (
              <span className="course-distance-badge">
                <span className="course-distance-label">From you</span>
                <strong>
                  {distanceKm < 1 ? 'Less than 1 km' : `${distanceKm.toFixed(1)} km`}
                </strong>
              </span>
            )}
          </div>

          <h1 className="course-detail-hero-title">{course.title}</h1>
          <p className="course-detail-hero-subtitle">
            {course.description || 'Master practical skills with structured modules and guided mentorship.'}
          </p>

          <div className="course-detail-hero-instructor-row">
            <div className="hero-instructor-avatar">
              {course.instructor_avatar_url ? (
                <img
                  src={course.instructor_avatar_url}
                  alt={course.instructor_name}
                  className="hero-instructor-img"
                />
              ) : (
                <div className="hero-instructor-initials">
                  {(course.instructor_name || 'I').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="hero-instructor-meta">
              <span className="hero-instructor-name">
                By <strong>{course.instructor_name}</strong>
              </span>
              <span className="hero-verified-pill">✓ Verified</span>
              {course.instructor_city && (
                <span className="hero-instructor-location">
                  <span className="location-label">Based in</span>
                  <strong>{course.instructor_city}</strong>
                </span>
              )}
              {isFromPreviousCourse ? (
                <span className="hero-instructor-rating hero-rating-previous">
                  Rating {avgRating} ({reviews.length} review{reviews.length === 1 ? '' : 's'} from previous course)
                </span>
              ) : hasDirectReviews ? (
                <span className="hero-instructor-rating">
                  Rating {avgRating} ({reviews.length} review{reviews.length === 1 ? '' : 's'})
                </span>
              ) : hasInstructorReviews ? (
                <span className="hero-instructor-rating hero-rating-instructor">
                  Instructor rating {Number(course.instructor_avg_rating).toFixed(1)} ({course.instructor_total_reviews} reviews)
                </span>
              ) : (
                <span className="hero-fresh-trust-badge">
                  <span className="hero-new-pill">New Course</span>
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Two-Column Grid: Left Content Tabs + Right Sticky Enrollment Card */}
        <div className="course-detail-layout-grid">
          {/* LEFT COLUMN: TABS & CONTENT */}
          <div className="course-detail-primary-col">
            {/* Prominent Countdown Banner for Next Upcoming Session */}
            {nextSession && (() => {
              const isNextOnline =
                nextSession.location &&
                (nextSession.location.startsWith('http') ||
                  nextSession.location.includes('meet.google.com'));
              return (
                <div
                  className={`course-detail-upcoming-banner banner-${
                    isNextOnline ? 'online' : nextSession.session_type
                  }`}
                  role="region"
                  aria-label="Upcoming Scheduled Session"
                >
                  <div className="upcoming-banner-eyebrow">
                    <span className="upcoming-pulse-dot" aria-hidden="true" />
                    <span className="upcoming-type-label">
                      {isNextOnline
                        ? 'UPCOMING LIVE ONLINE DOUBT'
                        : nextSession.session_type === 'offline'
                        ? 'UPCOMING IN-PERSON SESSION'
                        : nextSession.session_type === 'mock_test'
                        ? 'UPCOMING MOCK TEST'
                        : 'UPCOMING IN-PERSON DOUBT SESSION'}
                    </span>
                    <span className="upcoming-countdown-badge">
                      {getSessionCountdownInfo(nextSession.scheduled_at).countdownText}
                    </span>
                  </div>
                  <div className="upcoming-banner-body">
                    <div className="upcoming-banner-main-info">
                      <span className="upcoming-datetime">
                        {getSessionCountdownInfo(nextSession.scheduled_at).formattedDateTime}
                      </span>
                      <span className="upcoming-dot-sep" aria-hidden="true">·</span>
                      <strong className="upcoming-session-title">{nextSession.title}</strong>
                    </div>
                    {nextSession.location && (
                      <div className="upcoming-banner-location">
                        <span className="upcoming-loc-label">
                          {isNextOnline ? 'Link:' : 'Venue:'}
                        </span>
                        {isNextOnline ? (
                          <a
                            href={nextSession.location}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="upcoming-meet-link"
                          >
                            Join Google Meet ↗
                          </a>
                        ) : (
                          <span className="upcoming-loc-text">{nextSession.location}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Tab Navigation Buttons */}
            <nav className="course-detail-nav-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'about'}
                className={`course-detail-nav-tab ${activeTab === 'about' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('about')}
              >
                About
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'instructor'}
                className={`course-detail-nav-tab ${activeTab === 'instructor' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('instructor')}
              >
                Instructor
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'classroom'}
                className={`course-detail-nav-tab ${activeTab === 'classroom' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('classroom')}
              >
                Classroom
              </button>
            </nav>

            {/* TAB 1: ABOUT COURSE */}
            {activeTab === 'about' && (
              <div className="course-detail-tab-pane">
                {/* Full Description Narrative */}
                <div className="course-detail-card-panel">
                  <h2 className="panel-heading">Course Description</h2>
                  <p className="course-detail-narrative">
                    {course.description || 'No detailed description provided yet.'}
                  </p>
                </div>

                {/* What You Will Learn (Outcomes) */}
                <div className="course-detail-card-panel">
                  <h2 className="panel-heading">What You Will Learn</h2>
                  <div className="course-outcomes-grid">
                    {outcomesList.map((outcome, idx) => (
                      <div key={idx} className="outcome-item">
                        <span className="outcome-check">✓</span>
                        <span className="outcome-text">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Course Specifications */}
                <div className="course-detail-card-panel">
                  <h2 className="panel-heading">Course Specifications</h2>
                  <div className="course-specs-grid">
                    <div className="spec-card">
                      <span className="spec-icon" aria-hidden="true">01</span>
                      <div className="spec-info">
                        <span className="spec-label">Duration</span>
                        <strong className="spec-value">
                          {course.duration_weeks ? `${course.duration_weeks} Weeks` : 'Flexible'}
                        </strong>
                      </div>
                    </div>

                    <div className="spec-card">
                      <span className="spec-icon" aria-hidden="true">02</span>
                      <div className="spec-info">
                        <span className="spec-label">Batch Size</span>
                        <strong className="spec-value">
                          {course.capacity ? `${course.capacity} Students` : 'Open Batch'}
                        </strong>
                      </div>
                    </div>

                    <div className="spec-card">
                      <span className="spec-icon" aria-hidden="true">03</span>
                      <div className="spec-info">
                        <span className="spec-label">Delivery Mode</span>
                        <strong className="spec-value">{deliveryLabel}</strong>
                      </div>
                    </div>

                    <div className="spec-card">
                      <span className="spec-icon" aria-hidden="true">04</span>
                      <div className="spec-info">
                        <span className="spec-label">Level</span>
                        <strong className="spec-value">
                          {course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : 'All Levels'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Reviews Section */}
                <div className="course-detail-card-panel">
                  <div className="panel-heading-row">
                    <h2 className="panel-heading">Student Reviews & Ratings</h2>
                    <span className="panel-rating-badge">
                      {isFromPreviousCourse
                        ? `Rating ${avgRating} / 5.0 (from previous course)`
                        : avgRating
                        ? `Rating ${avgRating} / 5.0`
                        : hasInstructorReviews
                        ? `Instructor rating ${Number(course.instructor_avg_rating).toFixed(1)} / 5.0`
                        : 'Fresh Launch'}
                    </span>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="course-detail-new-course-invite-card">
                      <div className="new-course-invite-icon" aria-hidden="true">NEW</div>
                      <div className="new-course-invite-content">
                        <h3 className="new-course-invite-title">Be the First Student to Review!</h3>
                        <p className="new-course-invite-desc">
                          Instructor <strong>{course.instructor_name || 'this mentor'}</strong> recently joined LevelUp with this fresh course.
                          Experience their teaching style with zero commitment by watching the Free Trial Class in the Classroom tab before enrolling.
                        </p>
                        <div className="new-course-invite-actions">
                          <button
                            type="button"
                            className="invite-action-btn is-primary"
                            onClick={() => {
                              setActiveTab('classroom');
                              document.querySelector('.course-detail-nav-tabs')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            Watch Free Trial Class →
                          </button>
                          <button
                            type="button"
                            className="invite-action-btn is-secondary"
                            onClick={() => {
                              setActiveTab('instructor');
                              document.querySelector('.course-detail-nav-tabs')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            View Instructor Background →
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isFromPreviousCourse && (
                        <div className="previous-course-reviews-banner">
                          <span className="prev-banner-icon" aria-hidden="true">i</span>
                          <span className="prev-banner-text">
                            Showing verified student reviews from previous course edition ({reviews[0]?.previous_course_title || 'parent course'}).
                          </span>
                        </div>
                      )}
                      <div className="course-detail-reviews-list">
                        {reviews.map((review) => (
                          <div key={review.id} className="course-detail-review-card">
                            <div className="course-detail-review-header">
                              <div className="review-author-wrap">
                                <span className="course-detail-review-name">{review.student_name}</span>
                                {review.is_from_previous_course && (
                                  <span className="review-prev-course-pill">
                                    Verified Student (from previous course)
                                  </span>
                                )}
                              </div>
                              <span className="course-detail-review-rating">
                                {review.rating}/5
                              </span>
                            </div>
                            {review.comment && (
                              <p className="course-detail-review-comment">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Leave a Review Form */}
                  <div className="course-detail-review-form-wrap">
                    {reviewDone ? (
                      <p className="course-detail-review-thanks">
                        ✓ Thanks — your review has been recorded.
                      </p>
                    ) : !user ? (
                      <p className="course-detail-review-login-msg">
                        <button
                          type="button"
                          className="course-detail-review-login-btn"
                          onClick={() => navigate('/login')}
                        >
                          Log in
                        </button>{' '}
                        as a student to leave a review.
                      </p>
                    ) : user.role !== 'student' ? (
                      <p className="course-detail-review-login-msg">Only students can leave reviews.</p>
                    ) : !alreadyEnrolled ? (
                      <p className="course-detail-review-login-msg">
                        Only enrolled students can leave a review.{' '}
                        <button
                          type="button"
                          className="course-detail-review-login-btn"
                          onClick={handleEnroll}
                          disabled={enrolling}
                        >
                          {enrolling ? 'Enrolling...' : 'Enroll in this course'}
                        </button>{' '}
                        to share your feedback.
                      </p>
                    ) : (
                      <form onSubmit={handleReviewSubmit} className="course-detail-review-form">
                        <p className="course-detail-review-form-label">Leave a review</p>

                        <div className="course-detail-stars-input">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              className={`course-detail-star ${n <= reviewRating ? 'course-detail-star--filled' : ''}`}
                              onClick={() => setReviewRating(n)}
                              aria-label={`${n} star${n === 1 ? '' : 's'}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>

                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="What did you think of this course? (optional)"
                          className="course-detail-review-textarea"
                          rows={3}
                        />

                        {reviewError && <p className="course-detail-review-error">{reviewError}</p>}

                        <button
                          type="submit"
                          className="course-detail-review-submit-btn"
                          disabled={submittingReview}
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ABOUT INSTRUCTOR */}
            {activeTab === 'instructor' && (
              <div className="course-detail-tab-pane">
                <div className="course-detail-card-panel instructor-profile-panel">
                  <div className="instructor-profile-header">
                    <div className="instructor-profile-avatar-large">
                      {course.instructor_avatar_url ? (
                        <img
                          src={course.instructor_avatar_url}
                          alt={course.instructor_name}
                          className="instructor-avatar-large-img"
                        />
                      ) : (
                        <div className="instructor-avatar-large-initials">
                          {(course.instructor_name || 'I').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="instructor-profile-main-info">
                      <div className="instructor-name-badge-row">
                        <h2 className="instructor-profile-name">{course.instructor_name}</h2>
                        <span className="hero-verified-pill">✓ Verified Instructor</span>
                      </div>
                      <p className="instructor-profile-headline">
                        Educator & Specialist at LevelUp
                      </p>
                      {course.instructor_city && (
                        <p className="instructor-profile-city">
                          <span>Based in</span> <strong>{course.instructor_city}, India</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="instructor-stats-ribbon">
                    <div className="ribbon-item">
                      <span className="ribbon-num">
                        {isFromPreviousCourse
                          ? `Rating ${avgRating}`
                          : avgRating
                          ? `Rating ${avgRating}`
                          : hasInstructorReviews
                          ? `Rating ${Number(course.instructor_avg_rating).toFixed(1)}`
                          : 'New'}
                      </span>
                      <span className="ribbon-label">
                        {isFreshLaunch ? 'Fresh Mentor' : 'Rating'}
                      </span>
                    </div>
                    <div className="ribbon-item">
                      <span className="ribbon-num">
                        {reviews.length > 0
                          ? reviews.length
                          : Number(course.instructor_total_reviews) || 0}
                      </span>
                      <span className="ribbon-label">Reviews</span>
                    </div>
                    <div className="ribbon-item">
                      <span className="ribbon-num">{course.modules?.length || 1}</span>
                      <span className="ribbon-label">Modules</span>
                    </div>
                  </div>

                  <div className="instructor-bio-section">
                    <h3 className="section-subheading">About the Instructor</h3>
                    <p className="instructor-bio-text">
                      {course.instructor_bio ||
                        `Hello! I am ${course.instructor_name}. I design hands-on curricula focused on real-world projects, practical debugging, and bridging student knowledge with industry standards.`}
                    </p>
                  </div>

                  {/* Catalogue Link Button */}
                  <div className="instructor-catalogue-cta-box">
                    <div className="catalogue-cta-text">
                      <strong>Explore More by {course.instructor_name}</strong>
                      <p>View the instructor&apos;s full catalogue across Online, Offline, and Hybrid formats.</p>
                    </div>
                    <button
                      type="button"
                      className="instructor-catalogue-btn"
                      onClick={() => navigate(`/instructors/${course.instructor_id}`)}
                    >
                      View All Courses →
                    </button>
                  </div>
                </div>

                {/* Scheduled Sessions */}
                <div className="course-detail-card-panel">
                  <div className="panel-heading-row">
                    <h2 className="panel-heading">Scheduled Doubt Sessions & Offline Meets</h2>
                    <span className="panel-sub-count">
                      {sessions.length} scheduled session{sessions.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {sessions.length === 0 ? (
                    <p className="course-detail-empty">No sessions currently scheduled for this course.</p>
                  ) : (
                    <div className="course-detail-sessions-list">
                      {sessions.map((session) => {
                        const { countdownText, formattedDateTime } = getSessionCountdownInfo(session.scheduled_at);
                        const isSessionOnline =
                          session.location &&
                          (session.location.startsWith('http') ||
                            session.location.includes('meet.google.com'));
                        const isOffline = session.session_type === 'offline';
                        const isMock = session.session_type === 'mock_test';
                        return (
                          <div key={session.id} className="course-detail-session-card">
                            <div className="session-card-header">
                              <span
                                className={`course-detail-session-type ${
                                  isSessionOnline ? 'type-online' : `type-${session.session_type}`
                                }`}
                              >
                                {isSessionOnline
                                  ? 'Live Online Doubt'
                                  : isOffline
                                  ? 'In-Person Meetup'
                                  : isMock
                                  ? 'Mock Test'
                                  : 'In-Person Doubt'}
                              </span>
                              <span className="course-detail-session-countdown">
                                {countdownText}
                              </span>
                            </div>
                            <h3 className="course-detail-session-title">{session.title}</h3>
                            {session.description && (
                              <p className="course-detail-session-desc">{session.description}</p>
                            )}
                            <div className="course-detail-session-meta">
                              <div className="session-meta-item">
                                <span className="session-meta-key">TIME:</span>
                                <span className="session-meta-value">{formattedDateTime}</span>
                              </div>
                              {session.location && (
                                <div className="session-meta-item">
                                  <span className="session-meta-key">
                                    {isSessionOnline ? 'LINK:' : 'VENUE:'}
                                  </span>
                                  {isSessionOnline ? (
                                    <a
                                      href={session.location}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="course-detail-session-meet-link"
                                    >
                                      Join Google Meet ↗
                                    </a>
                                  ) : (
                                    <span className="session-meta-value">{session.location}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: CLASSROOM */}
            {activeTab === 'classroom' && (
              <div className="course-detail-tab-pane">
                {alreadyEnrolled ? (
                  <div className={`course-detail-card-panel classroom-enrolled-panel ${isHeroMinimized ? 'is-minimized' : ''}`}>
                    <div className="classroom-enrolled-top-bar">
                      <span className="classroom-enrolled-tag">ACTIVE CLASSROOM</span>
                      <button
                        type="button"
                        className="classroom-panel-minimize-btn"
                        onClick={() => setIsHeroMinimized(!isHeroMinimized)}
                        aria-label={isHeroMinimized ? 'Expand classroom banner' : 'Minimize classroom banner'}
                        title={isHeroMinimized ? 'Expand banner' : 'Minimize banner'}
                      >
                        <span aria-hidden="true">{isHeroMinimized ? '+' : '−'}</span>
                        <span className="minimize-btn-label">{isHeroMinimized ? 'Expand' : 'Minimize'}</span>
                      </button>
                    </div>

                    {!isHeroMinimized ? (
                      <>
                        <div className="classroom-enrolled-header">
                          <div className="enrolled-header-text">
                            <h2 className="panel-heading">
                              {enrolledProgressPercent >= 100
                                ? 'Course completed'
                                : resumeLecture
                                ? `Next Lecture: ${resumeLecture.title}`
                                : 'Welcome to your classroom'}
                            </h2>
                            <p className="classroom-enrolled-desc">
                              {enrolledProgressPercent >= 100
                                ? 'Congratulations on completing this course! You can revisit any lecture anytime.'
                                : 'Pick up right where you left off or jump into any lecture from the curriculum below.'}
                            </p>
                          </div>

                          <div className="enrolled-header-actions">
                            <button
                              type="button"
                              className="classroom-enrolled-launch-btn"
                              onClick={() => {
                                const target = resumeLecture?.id
                                  ? `/courses/${id}/learn?lectureId=${resumeLecture.id}`
                                  : `/courses/${id}/learn`;
                                navigate(target);
                              }}
                            >
                              <span className="btn-play-icon" aria-hidden="true">▶</span>
                              {enrolledProgressPercent > 0
                                ? 'Resume in Classroom Player'
                                : 'Start Course in Player'}
                            </button>
                          </div>
                        </div>

                        <div className="classroom-enrolled-metrics-bar">
                          <div className="enrolled-metric-item">
                            <span className="metric-val">{enrolledProgressPercent}%</span>
                            <span className="metric-lbl">Course Progress</span>
                          </div>
                          <div className="enrolled-metric-divider" />
                          <div className="enrolled-metric-item">
                            <span className="metric-val">
                              {completedLecturesCount} / {totalEnrolledLectures}
                            </span>
                            <span className="metric-lbl">Lectures Finished</span>
                          </div>
                          <div className="enrolled-metric-divider" />
                          <div className="enrolled-metric-item">
                            <span className="metric-val">
                              {currentModulesList.length}
                            </span>
                            <span className="metric-lbl">Curriculum Modules</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="classroom-enrolled-compact-bar">
                        <div className="compact-bar-info">
                          <strong className="compact-bar-progress">{enrolledProgressPercent}% Completed</strong>
                          <span className="compact-bar-sub">
                            ({completedLecturesCount} of {totalEnrolledLectures} lectures finished)
                          </span>
                        </div>
                        <button
                          type="button"
                          className="classroom-enrolled-launch-btn is-compact"
                          onClick={() => {
                            const target = resumeLecture?.id
                              ? `/courses/${id}/learn?lectureId=${resumeLecture.id}`
                              : `/courses/${id}/learn`;
                            navigate(target);
                          }}
                        >
                          <span className="btn-play-icon" aria-hidden="true">▶</span>
                          Resume Player
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="course-detail-card-panel classroom-trial-panel">
                    <div className="classroom-trial-header">
                      <span className="classroom-trial-tag">FREE TRIAL CLASSROOM</span>
                      <h2 className="panel-heading">Attend a Sample Class Before Enrolling</h2>
                      <p className="classroom-trial-desc">
                        Experience the instructor&apos;s teaching style with zero commitment. Click any free preview lecture below to watch.
                      </p>
                    </div>

                    {/* Embedded Trial Player */}
                    <div className="classroom-video-player-container">
                      {trialVideoPreview?.type === 'youtube' ? (
                        <iframe
                          className="classroom-trial-iframe"
                          src={trialVideoPreview.src}
                          title={currentTrialLecture?.title || 'Trial Class Preview'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : trialVideoPreview?.type === 'video' ? (
                        <video
                          className="classroom-trial-video"
                          src={trialVideoPreview.src}
                          controls
                          poster={course.thumbnail_url || undefined}
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div className="classroom-no-video-placeholder">
                          <span className="placeholder-icon">▶</span>
                          <p>Preview video currently being prepared for this lecture.</p>
                        </div>
                      )}

                      <div className="classroom-player-info-bar">
                        <span className="now-playing-badge">
                          {currentTrialLecture?.is_trial ? 'Free Trial Class:' : 'Now Playing Sample:'}
                        </span>
                        <strong className="now-playing-title">
                          {currentTrialLecture?.title || 'Introductory Lecture'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Curriculum List */}
                <div className="course-detail-card-panel">
                  <div className="classroom-curriculum-header-bar">
                    <h2 className="panel-heading">
                      {alreadyEnrolled ? 'Curriculum & Course Syllabus' : 'Curriculum & Free Trial Lectures'}
                    </h2>
                    {currentModulesList.length > 0 && (
                      <button
                        type="button"
                        className="classroom-toggle-all-btn"
                        onClick={toggleAllModules}
                      >
                        <span aria-hidden="true">{allCollapsed ? '+' : '−'}</span>
                        <span>{allCollapsed ? 'Expand all modules' : 'Collapse all modules'}</span>
                      </button>
                    )}
                  </div>

                  {(!course.modules || course.modules.length === 0) ? (
                    <p className="course-detail-empty">No curriculum modules uploaded yet.</p>
                  ) : (
                    <div className="classroom-curriculum-list">
                      {(learningModules.length > 0 ? learningModules : course.modules).map((mod, modIdx) => {
                        const moduleKey = mod.id || `module-${modIdx}`;
                        const isModuleCollapsed = Boolean(collapsedModules[moduleKey]);

                        return (
                        <div key={moduleKey} className={`classroom-module-block ${isModuleCollapsed ? 'is-collapsed' : ''}`}>
                          <div
                            className="classroom-module-header"
                            onClick={() => toggleModule(moduleKey)}
                            role="button"
                            tabIndex={0}
                            aria-expanded={!isModuleCollapsed}
                            aria-controls={`module-content-${moduleKey}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleModule(moduleKey);
                              }
                            }}
                          >
                            <h3 className="classroom-module-title">
                              Module {modIdx + 1}: {String(mod.title || '').replace(/^Module\s+\d+\s*:\s*/i, '')}
                            </h3>
                            <div className="classroom-module-header-actions">
                              <span className="classroom-module-count">
                                {mod.lectures?.length || 0} Lecture{mod.lectures?.length === 1 ? '' : 's'}
                              </span>
                              <button
                                type="button"
                                className="classroom-module-toggle"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleModule(moduleKey);
                                }}
                                aria-expanded={!isModuleCollapsed}
                                aria-label={`${isModuleCollapsed ? 'Expand' : 'Collapse'} module ${modIdx + 1}`}
                              >
                                <span aria-hidden="true">{isModuleCollapsed ? '+' : '−'}</span>
                              </button>
                            </div>
                          </div>

                          <div id={`module-content-${moduleKey}`} className="classroom-lectures-group">
                            {(mod.lectures || []).map((lec, lecIdx) => {
                              if (alreadyEnrolled) {
                                const isCompleted = Boolean(lec.completed || lec.completed_at);
                                const isResume = !isCompleted && resumeLecture?.id === lec.id;

                                return (
                                  <div
                                    key={lec.id || lecIdx}
                                    className={`classroom-lecture-row is-enrolled-row ${isResume ? 'is-resume-row' : ''} ${isCompleted ? 'is-completed-row' : ''}`}
                                    onClick={() => navigate(`/courses/${id}/learn?lectureId=${lec.id}`)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        navigate(`/courses/${id}/learn?lectureId=${lec.id}`);
                                      }
                                    }}
                                  >
                                    <div className="lecture-row-left">
                                      <span
                                        className={`lecture-icon ${
                                          isCompleted
                                            ? 'lecture-icon--completed'
                                            : isResume
                                            ? 'lecture-icon--resume'
                                            : 'lecture-icon--standard'
                                        }`}
                                      >
                                        {isCompleted ? '✓' : isResume ? '▶' : '•'}
                                      </span>
                                      <div className="lecture-title-col">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                          <span className="lecture-row-title">{lec.title}</span>
                                          {isCompleted && (
                                            <span className="classroom-lecture-tag is-completed">✓ Completed</span>
                                          )}
                                          {isResume && (
                                            <span className="classroom-lecture-tag is-resume">▶ Up Next</span>
                                          )}
                                        </div>
                                        {(lec.duration_minutes || lec.duration_seconds) && (
                                          <span className="lecture-duration">
                                            {lec.duration_minutes || 0}m {lec.duration_seconds ? `${lec.duration_seconds}s` : ''}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="lecture-row-right">
                                      <button
                                        type="button"
                                        className={`lecture-enrolled-play-btn ${isResume ? 'is-resume-btn' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/courses/${id}/learn?lectureId=${lec.id}`);
                                        }}
                                      >
                                        {isCompleted ? 'Rewatch' : isResume ? 'Resume' : 'Play'} →
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              // If instructor marked any lectures as trial, unlock those; otherwise default to module 1, lecture 1
                              const isFreeTrial = Boolean(lec.is_trial) || (!hasExplicitTrials && modIdx === 0 && lecIdx === 0);
                              const isSelected = currentTrialLecture?.id === lec.id;

                              return (
                                <div
                                  key={lec.id || lecIdx}
                                  className={`classroom-lecture-row ${isSelected ? 'is-selected' : ''} ${isFreeTrial ? 'is-free' : 'is-locked'}`}
                                >
                                  <div className="lecture-row-left">
                                    <span className="lecture-icon">
                                      {isFreeTrial ? 'PLAY' : 'LOCKED'}
                                    </span>
                                    <div className="lecture-title-col">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span className="lecture-row-title">{lec.title}</span>
                                        {Boolean(lec.is_trial) && (
                                          <span className="classroom-trial-badge">Free Trial</span>
                                        )}
                                      </div>
                                      {(lec.duration_minutes || lec.duration_seconds) && (
                                        <span className="lecture-duration">
                                          {lec.duration_minutes || 0}m {lec.duration_seconds ? `${lec.duration_seconds}s` : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="lecture-row-right">
                                    {isFreeTrial ? (
                                      <button
                                        type="button"
                                        className={`lecture-trial-play-btn ${isSelected ? 'is-active' : ''}`}
                                        onClick={() => setSelectedTrialLecture(lec)}
                                      >
                                        {isSelected ? 'Watching' : 'Watch Preview'}
                                      </button>
                                    ) : (
                                      <span
                                        className="lecture-locked-tag"
                                        title="Enroll in this course to unlock all lectures"
                                      >
                                        Enrolled Only
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: STICKY ENROLLMENT CARD */}
          <aside className="course-detail-sticky-col">
            <div className="sticky-enrollment-card">
              {/* Thumbnail / Header */}
              <div className="sticky-card-media">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="sticky-card-img" />
                ) : (
                  <div className="sticky-card-placeholder">
                    <span>{course.title.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <span className={`sticky-card-delivery-badge is-${deliveryMode}`}>
                  {deliveryLabel}
                </span>
              </div>

              {/* Price & Guarantee (or Enrolled Progress Status) */}
              <div className="sticky-card-body">
                {alreadyEnrolled ? (
                  <div className="sticky-enrolled-status-card">
                    <div className="sticky-enrolled-heading">
                      <span className="sticky-card-kicker">YOUR LEARNING PLAN</span>
                      <span className="sticky-enrolled-heading-copy">
                        Keep building your momentum
                      </span>
                    </div>
                    <div className="sticky-enrolled-badge-row">
                      <span className="sticky-enrolled-status-pill">
                        <span className="enrolled-check-icon" aria-hidden="true">✓</span>
                        Enrolled
                      </span>
                      <strong className="sticky-enrolled-percent">{enrolledProgressPercent}%</strong>
                    </div>

                    <div
                      className="sticky-enrolled-track"
                      role="progressbar"
                      aria-valuenow={enrolledProgressPercent}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <div
                        className="sticky-enrolled-fill"
                        style={{ width: `${enrolledProgressPercent}%` }}
                      />
                    </div>

                    <p className="sticky-enrolled-counter">
                      {completedLecturesCount} of {totalEnrolledLectures} lectures completed
                    </p>
                  </div>
                ) : (
                  <>
                    <span className="sticky-card-kicker">COURSE ACCESS</span>
                    <div className="sticky-price-row">
                      <div className="sticky-price-main">
                        <span className="sticky-currency">₹</span>
                        <span className="sticky-amount">{course.price}</span>
                      </div>
                      {Number(course.price) > 0 && (
                        <span className="sticky-discount-pill">Limited Offer</span>
                      )}
                    </div>

                    <div className="sticky-trial-guarantee">
                      <span className="guarantee-icon" aria-hidden="true">SAFE</span>
                      <div className="sticky-guarantee-info">
                        <strong className="sticky-guarantee-title">100% Free Trial Lectures Included</strong>
                        {isFreshLaunch ? (
                          <span className="sticky-guarantee-sub">
                            Instructor is newly onboarded to LevelUp.{' '}
                            <button
                              type="button"
                              className="sticky-faculty-link"
                              onClick={() => {
                                setActiveTab('instructor');
                                document.querySelector('.course-detail-nav-tabs')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                            >
                              Check Faculty Profile →
                            </button>
                          </span>
                        ) : (
                          <span className="sticky-guarantee-sub">
                            Watch trial previews with zero financial risk
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Primary CTA Button */}
                <div className="sticky-cta-wrap">
                  <button
                    type="button"
                    className={`sticky-cta-btn ${alreadyEnrolled ? 'is-enrolled' : ''}`}
                    onClick={() => {
                      if (alreadyEnrolled) {
                        const target = resumeLecture?.id
                          ? `/courses/${id}/learn?lectureId=${resumeLecture.id}`
                          : `/courses/${id}/learn`;
                        navigate(target);
                        return;
                      }
                      handleEnroll();
                    }}
                    disabled={enrolling}
                  >
                    {alreadyEnrolled ? (
                      enrolledProgressPercent >= 100
                        ? 'Review in Classroom →'
                        : 'Continue Learning in Classroom →'
                    ) : enrolling ? (
                      'Enrolling...'
                    ) : (
                      'Enroll Now'
                    )}
                  </button>
                  {enrollError && <p className="sticky-enroll-error">{enrollError}</p>}
                  {!enrollError && (
                    <p className="sticky-cta-note">
                      {alreadyEnrolled
                        ? 'Your next lesson opens directly in the classroom.'
                        : 'Start with the included trial lectures before enrolling.'}
                    </p>
                  )}
                </div>

                {/* Course Inclusions List */}
                <div className="sticky-inclusions-list">
                  <p className="inclusions-title">This course includes:</p>
                  <ul className="inclusions-items">
                    <li>
                      <span className="inc-icon" aria-hidden="true">01</span>
                      <span>{allLectures.length || 1} On-Demand Video Lectures</span>
                    </li>
                    <li>
                      <span className="inc-icon" aria-hidden="true">02</span>
                      <span>{course.modules?.length || 1} Comprehensive Modules</span>
                    </li>
                    <li>
                      <span className="inc-icon" aria-hidden="true">03</span>
                      <span>Scheduled Instructor Doubt Sessions</span>
                    </li>
                    <li>
                      <span className="inc-icon" aria-hidden="true">04</span>
                      <span>Full Lifetime Learning Access</span>
                    </li>
                    <li>
                      <span className="inc-icon" aria-hidden="true">05</span>
                      <span>Certificate of Completion</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}