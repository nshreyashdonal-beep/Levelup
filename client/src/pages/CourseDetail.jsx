// src/pages/CourseDetail.jsx
// Redesigned course details view with a 3-tab layout:
//   Tab 1: About Course (Description, outcomes, specifications, reviews)
//   Tab 2: About Instructor (Profile photo, verified badge, bio, city, sessions, and catalog link)
//   Tab 3: Classroom (Free Trial) (Embedded trial player, curriculum with free preview vs locked lectures)
// Anchored by a persistent sticky enrollment card on the right column.

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import StudentNav from '../components/StudentNav';
import Footer from '../components/Footer';
import { API_BASE } from '../api';
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

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

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

  if (loading) {
    return (
      <div className="course-detail-page">
        <StudentNav user={user} activeLink="explore" />
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
        <StudentNav user={user} activeLink="explore" />
        <main className="course-detail-main">
          <p className="course-detail-status">Course not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <StudentNav user={user} activeLink="explore" />

      <main className="course-detail-main">
        {/* Breadcrumb Path */}
        <nav className="course-detail-breadcrumb" aria-label="Breadcrumb">
          <span>Home</span>
          <span className="breadcrumb-separator">›</span>
          <span>Explore</span>
          {course.category_path && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span>{course.category_path}</span>
            </>
          )}
        </nav>

        {/* Hero Section */}
        <section className="course-detail-hero">
          <div className="course-detail-hero-tags">
            <span className={`course-badge-mode is-${deliveryMode}`}>
              {deliveryMode === 'offline' ? '🏢' : deliveryMode === 'hybrid' ? '🔄' : '🌐'} {deliveryLabel}
            </span>
            {course.level && (
              <span className="course-badge-level">
                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
              </span>
            )}
            {course.language && (
              <span className="course-badge-language">🗣 {course.language}</span>
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
                <span className="hero-instructor-city">📍 {course.instructor_city}</span>
              )}
              <span className="hero-instructor-rating">
                {avgRating ? `⭐ ${avgRating} (${reviews.length} review${reviews.length === 1 ? '' : 's'})` : '⭐ New Course'}
              </span>
            </div>
          </div>
        </section>

        {/* Two-Column Grid: Left Content Tabs + Right Sticky Enrollment Card */}
        <div className="course-detail-layout-grid">
          {/* LEFT COLUMN: TABS & CONTENT */}
          <div className="course-detail-primary-col">
            {/* Tab Navigation Buttons */}
            <nav className="course-detail-nav-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'about'}
                className={`course-detail-nav-tab ${activeTab === 'about' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('about')}
              >
                <span className="nav-tab-icon">📖</span> About Course
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'instructor'}
                className={`course-detail-nav-tab ${activeTab === 'instructor' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('instructor')}
              >
                <span className="nav-tab-icon">👨‍🏫</span> About Instructor
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'classroom'}
                className={`course-detail-nav-tab ${activeTab === 'classroom' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('classroom')}
              >
                <span className="nav-tab-icon">🎓</span> Classroom (Trial)
                {allLectures.length > 0 && <span className="tab-pill-badge">Free Preview</span>}
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
                      <span className="spec-icon">⏱</span>
                      <div className="spec-info">
                        <span className="spec-label">Duration</span>
                        <strong className="spec-value">
                          {course.duration_weeks ? `${course.duration_weeks} Weeks` : 'Flexible'}
                        </strong>
                      </div>
                    </div>

                    <div className="spec-card">
                      <span className="spec-icon">👥</span>
                      <div className="spec-info">
                        <span className="spec-label">Batch Size</span>
                        <strong className="spec-value">
                          {course.capacity ? `${course.capacity} Students` : 'Open Batch'}
                        </strong>
                      </div>
                    </div>

                    <div className="spec-card">
                      <span className="spec-icon">🌐</span>
                      <div className="spec-info">
                        <span className="spec-label">Delivery Mode</span>
                        <strong className="spec-value">{deliveryLabel}</strong>
                      </div>
                    </div>

                    <div className="spec-card">
                      <span className="spec-icon">🎓</span>
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
                      {avgRating ? `⭐ ${avgRating} / 5.0` : 'No reviews yet'}
                    </span>
                  </div>

                  {reviews.length === 0 ? (
                    <p className="course-detail-empty">Be the first student to review this course!</p>
                  ) : (
                    <div className="course-detail-reviews-list">
                      {reviews.map((review) => (
                        <div key={review.id} className="course-detail-review-card">
                          <div className="course-detail-review-header">
                            <span className="course-detail-review-name">{review.student_name}</span>
                            <span className="course-detail-review-rating">
                              {'⭐'.repeat(review.rating)}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="course-detail-review-comment">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
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
                        <p className="instructor-profile-city">📍 {course.instructor_city}, India</p>
                      )}
                    </div>
                  </div>

                  <div className="instructor-stats-ribbon">
                    <div className="ribbon-item">
                      <span className="ribbon-num">{avgRating ? `⭐ ${avgRating}` : '⭐ 5.0'}</span>
                      <span className="ribbon-label">Rating</span>
                    </div>
                    <div className="ribbon-item">
                      <span className="ribbon-num">{reviews.length}</span>
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
                  <h2 className="panel-heading">Scheduled Doubt Sessions & Offline Meets</h2>
                  {sessions.length === 0 ? (
                    <p className="course-detail-empty">No sessions currently scheduled for this course.</p>
                  ) : (
                    <div className="course-detail-sessions-list">
                      {sessions.map((session) => (
                        <div key={session.id} className="course-detail-session-card">
                          <span className="course-detail-session-type">
                            {SESSION_TYPE_LABELS[session.session_type] || session.session_type}
                          </span>
                          <p className="course-detail-session-title">{session.title}</p>
                          {session.description && (
                            <p className="course-detail-session-desc">{session.description}</p>
                          )}
                          <p className="course-detail-session-when">
                            📅 {new Date(session.scheduled_at).toLocaleString()}
                            {session.location ? ` · 📍 ${session.location}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: CLASSROOM (FREE TRIAL CLASSES) */}
            {activeTab === 'classroom' && (
              <div className="course-detail-tab-pane">
                <div className="course-detail-card-panel classroom-trial-panel">
                  <div className="classroom-trial-header">
                    <span className="classroom-trial-tag">🎓 FREE TRIAL CLASSROOM</span>
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
                        {currentTrialLecture?.is_trial ? '🎓 Free Trial Class:' : 'Now Playing Sample:'}
                      </span>
                      <strong className="now-playing-title">
                        {currentTrialLecture?.title || 'Introductory Lecture'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Curriculum & Trial Lectures List */}
                <div className="course-detail-card-panel">
                  <h2 className="panel-heading">Curriculum & Free Trial Lectures</h2>

                  {(!course.modules || course.modules.length === 0) ? (
                    <p className="course-detail-empty">No curriculum modules uploaded yet.</p>
                  ) : (
                    <div className="classroom-curriculum-list">
                      {course.modules.map((mod, modIdx) => (
                        <div key={mod.id || modIdx} className="classroom-module-block">
                          <div className="classroom-module-header">
                            <h3 className="classroom-module-title">
                              Module {modIdx + 1}: {mod.title}
                            </h3>
                            <span className="classroom-module-count">
                              {mod.lectures?.length || 0} Lecture{mod.lectures?.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          <div className="classroom-lectures-group">
                            {(mod.lectures || []).map((lec, lecIdx) => {
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
                                      {isFreeTrial ? '▶' : '🔒'}
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
                                        {isSelected ? '✓ Watching' : '▶ Free Preview'}
                                      </button>
                                    ) : (
                                      <span
                                        className="lecture-locked-tag"
                                        title="Enroll in this course to unlock all lectures"
                                      >
                                        🔒 Enrolled Only
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
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

              {/* Price & Guarantee */}
              <div className="sticky-card-body">
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
                  <span className="guarantee-icon">🛡</span>
                  <span>100% Free Trial Lectures Included</span>
                </div>

                {/* Primary CTA Button */}
                <div className="sticky-cta-wrap">
                  <button
                    type="button"
                    className={`sticky-cta-btn ${alreadyEnrolled ? 'is-enrolled' : ''}`}
                    onClick={() => {
                      if (alreadyEnrolled) {
                        navigate(`/courses/${id}/learn`);
                        return;
                      }
                      handleEnroll();
                    }}
                    disabled={enrolling}
                  >
                    {alreadyEnrolled ? 'Enrolled ✓ → Go to Classroom' : enrolling ? 'Enrolling...' : '⚡ Enroll Now'}
                  </button>
                  {enrollError && <p className="sticky-enroll-error">{enrollError}</p>}
                </div>

                {/* Course Inclusions List */}
                <div className="sticky-inclusions-list">
                  <p className="inclusions-title">This course includes:</p>
                  <ul className="inclusions-items">
                    <li>
                      <span className="inc-icon">📹</span>
                      <span>{allLectures.length || 1} On-Demand Video Lectures</span>
                    </li>
                    <li>
                      <span className="inc-icon">📚</span>
                      <span>{course.modules?.length || 1} Comprehensive Modules</span>
                    </li>
                    <li>
                      <span className="inc-icon">🤝</span>
                      <span>Scheduled Instructor Doubt Sessions</span>
                    </li>
                    <li>
                      <span className="inc-icon">♾️</span>
                      <span>Full Lifetime Learning Access</span>
                    </li>
                    <li>
                      <span className="inc-icon">🎓</span>
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