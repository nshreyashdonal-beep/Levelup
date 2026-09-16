// src/pages/CourseDetail.jsx
// Individual course view — full description, scheduled sessions, reviews,
// a leave-a-review form, and an Enroll button. Reached by clicking a
// course card on the Explore page (StudentLanding), which already calls
// navigate(`/courses/${id}`).
//
// Kept public like StudentLanding — no forced login redirect, since
// browsing a course's details shouldn't require an account (GET
// /api/courses/:id, /api/sessions, /api/reviews are all public routes
// too). Only Enroll and the review form need a logged-in student, each
// checked at their own point instead of gating the whole page.
//
// The review form has no "already reviewed" pre-check the way Enroll
// checks GET /api/enrollments/me — there's no equivalent "my review for
// this course" endpoint, and GET /api/reviews doesn't return student_id
// to match against locally. Simpler: just let the student submit, and
// treat the backend's 409 (unique constraint already exists for this)
// the same as a successful submit — the form disappears either way.

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentNav from '../components/StudentNav';
import Footer from '../components/Footer';
import { API_BASE } from '../api';
import './CourseDetail.css';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Enroll button state
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Leave-a-review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewDone, setReviewDone] = useState(false); // true after a successful
  // submit OR a 409 (already reviewed) — either way, the form has nothing
  // left to do, so it's replaced with a status message instead.

  // Who's logged in (if anyone) — same localStorage read every other
  // page uses, no redirect if it's empty.
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Fetch the course, its sessions, and its reviews all at once.
  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch(`${API_BASE}/api/courses/${id}`).then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      }),
      fetch(`${API_BASE}/api/sessions?course_id=${id}`).then((res) => res.json()),
      fetch(`${API_BASE}/api/reviews?course_id=${id}`).then((res) => res.json()),
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

  // If a logged-in student is viewing, check whether they're already
  // enrolled — reuses the existing GET /api/enrollments/me route instead
  // of adding a new backend endpoint just for this.
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
      .catch(() => {}); // not critical — worst case the button just doesn't pre-fill
  }, [user, id]);

  // Average rating computed from the reviews we already fetched — there's
  // no avg_rating column in the DB, so this is the honest number instead
  // of a made-up one.
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  function handleEnroll() {
    const token = localStorage.getItem('token');

    // Not logged in at all → send to login instead of failing silently.
    if (!token || !user) {
      navigate('/login');
      return;
    }

    // Logged in as an instructor → enrolling doesn't make sense for them
    // (same rule the backend enforces with requireRole('student')).
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
          // Backend already sends "You are already enrolled..." for the
          // 409 case, so this covers that too instead of a separate check.
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

    // Same rule the backend enforces with requireRole('student').
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
          // Add it straight into the list — the POST response doesn't
          // join the student's name back, so use the one we already
          // have from localStorage instead of re-fetching the whole list.
          setReviews((prev) => [{ ...data, student_name: user.name }, ...prev]);
          setReviewDone(true);
        } else if (status === 409) {
          // Already reviewed this course — nothing left for the form to
          // do, so treat it the same as a successful submit.
          setReviewDone(true);
        } else {
          setReviewError(data.error || 'Something went wrong submitting your review');
        }
      })
      .catch(() => setReviewError('Could not reach the server. Is it running?'))
      .finally(() => setSubmittingReview(false));
  }

  // Same session_type values the backend allows — used just to make the
  // label on each session card readable instead of showing "mock_test".
  const SESSION_TYPE_LABELS = {
    doubt: 'Doubt Session',
    offline: 'Offline Meet',
    mock_test: 'Mock Test',
  };

  if (loading) {
    return (
      <div className="course-detail-page">
        <StudentNav user={user} activeLink="explore" />
        <main className="course-detail-main">
          <p className="course-detail-status">Loading course...</p>
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
        {/* Header: title, instructor, price, rating, enroll button */}
        <section className="course-detail-header">
          <div className="course-detail-avatar">
            {course.title.charAt(0).toUpperCase()}
          </div>

          <div className="course-detail-header-info">
            <h1 className="course-detail-title">{course.title}</h1>
            <p className="course-detail-instructor">By {course.instructor_name}</p>
            <div className="course-detail-meta">
              <span className="course-detail-price">₹{course.price}</span>
              <span className="course-detail-rating">
                {avgRating ? `⭐ ${avgRating} (${reviews.length} review${reviews.length === 1 ? '' : 's'})` : 'No reviews yet'}
              </span>
            </div>
          </div>

          <div className="course-detail-enroll-wrap">
            <button
              className="course-detail-enroll-btn"
              onClick={handleEnroll}
              disabled={enrolling || alreadyEnrolled}
            >
              {alreadyEnrolled ? 'Enrolled ✓' : enrolling ? 'Enrolling...' : 'Enroll Now'}
            </button>
            {enrollError && <p className="course-detail-enroll-error">{enrollError}</p>}
          </div>
        </section>

        {/* Full description */}
        <section className="course-detail-section">
          <h2>About this course</h2>
          <p className="course-detail-description">
            {course.description || 'No description provided yet.'}
          </p>
        </section>

        {/* Sessions */}
        <section className="course-detail-section">
          <h2>Sessions</h2>
          {sessions.length === 0 ? (
            <p className="course-detail-empty">No sessions scheduled yet.</p>
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
                    {new Date(session.scheduled_at).toLocaleString()}
                    {session.location ? ` · ${session.location}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="course-detail-section">
          <h2>Reviews</h2>
          {reviews.length === 0 ? (
            <p className="course-detail-empty">No reviews yet.</p>
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

          {/* Leave a review */}
          <div className="course-detail-review-form-wrap">
            {reviewDone ? (
              <p className="course-detail-review-thanks">
                Thanks — your review has been recorded.
              </p>
            ) : !user ? (
              <p className="course-detail-review-login-msg">
                <button className="course-detail-review-login-btn" onClick={() => navigate('/login')}>
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
        </section>
      </main>

      <Footer />
    </div>
  );
}
