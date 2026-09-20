// src/pages/ManageCourseLayout.jsx
// Shared shell for managing one instructor-owned course. This page handles
// the instructor guard and the course fetch once; the child pages (Details,
// Content, Publish — see App.jsx) only focus on one job each and read the
// course through useOutletContext instead of fetching it themselves.
//
// Two things this page deliberately avoids, both because they caused a
// visible flash when this workspace was first built:
//   1. Reading the logged-in user in a useEffect. That leaves `user` null
//      on the first render, so the page returns null (blank) for a frame
//      before the effect runs — noticeable here because it's stacked on
//      top of the course fetch below. A lazy useState initializer resolves
//      it synchronously on the first render instead.
//   2. Fetching the instructor's whole course list just to confirm they own
//      this course, then fetching the course itself. GET /api/courses/:id
//      now returns instructor_id, so ownership can be checked from the one
//      request this page already has to make.
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import InstructorNav from '../components/InstructorNav';
import Footer from '../components/Footer';
import { API_BASE } from '../api';
import './ManageCourseLayout.css';

function getStoredInstructor() {
  const stored = localStorage.getItem('user');
  const parsed = stored ? JSON.parse(stored) : null;
  return parsed && parsed.role === 'instructor' ? parsed : null;
}

export default function ManageCourseLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();

  const [user] = useState(getStoredInstructor);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect anyone who isn't a logged-in instructor. `user` is already
  // resolved by the time this runs, so this only fires for the
  // logged-out/wrong-role case, not on every normal visit.
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !courseId) return;

    // `ignore` guards against a stale response overwriting state — needed
    // because StrictMode runs this effect twice in dev (mount → cleanup →
    // remount), which fires two real fetches for the same navigation.
    // Without this, whichever response lands second "wins" regardless of
    // which one actually matches the current courseId, which is what was
    // causing the loading/content flicker when opening a course. Same
    // protection matters in production too, e.g. clicking two different
    // course cards in quick succession.
    let ignore = false;

    async function loadCourse() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE}/api/courses/${courseId}`);
        const data = await response.json();
        if (ignore) return;

        if (!response.ok) {
          setError(data.error || 'Could not load the course.');
          return;
        }

        // GET /api/courses/:id is public (students use it too), so
        // ownership isn't enforced server-side — check it here before
        // treating this as "this instructor's course".
        if (String(data.instructor_id) !== String(user.id)) {
          setError('You do not have access to this course.');
          return;
        }

        setCourse(data);
      } catch {
        if (!ignore) setError('Could not reach the server. Is it running?');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadCourse();

    return () => {
      ignore = true;
    };
  }, [user, courseId]);

  function updateCourse(updatedCourse) {
    setCourse(updatedCourse);
  }

  if (!user) return null;

  const currentPath = location.pathname;

  return (
    <div className="manage-course-layout-wrap">
      <InstructorNav user={user} />

      <main className="manage-course-layout-main">
        <Link to="/manage-courses" className="manage-course-layout-back-link">
          ← Back to My Courses
        </Link>

        {loading && (
          <div className="manage-course-layout-status">
            <div className="manage-course-layout-status-icon" aria-hidden="true">✦</div>
            <h1>Loading course...</h1>
            <p>Getting your course workspace ready.</p>
          </div>
        )}

        {!loading && error && (
          <div className="manage-course-layout-status" role="alert">
            <div className="manage-course-layout-status-icon" aria-hidden="true">!</div>
            <h1>Course unavailable</h1>
            <p>{error}</p>
            <Link to="/manage-courses" className="manage-course-layout-status-link">
              Return to My Courses
            </Link>
          </div>
        )}

        {!loading && !error && course && (
          <>
            <header className="manage-course-layout-header">
              <div className="manage-course-layout-course-icon" aria-hidden="true">
                {course.title?.charAt(0).toUpperCase() || 'C'}
              </div>

              <div className="manage-course-layout-course-info">
                <div className="manage-course-layout-eyebrow-row">
                  <p className="manage-course-layout-eyebrow">COURSE MANAGEMENT</p>
                  <span className={`manage-course-layout-status-badge ${course.status === 'published' ? 'is-published' : 'is-draft'}`}>
                    {course.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h1>{course.title}</h1>
                <p>Manage the information and content for this course.</p>
              </div>
            </header>

            <nav className="manage-course-layout-nav" aria-label="Course management">
              <Link
                to={`/manage-courses/${courseId}/details`}
                className={currentPath.endsWith('/details') ? 'is-active' : ''}
              >
                Details
              </Link>
              <Link
                to={`/manage-courses/${courseId}/content`}
                className={currentPath.endsWith('/content') ? 'is-active' : ''}
              >
                Modules & Lectures
              </Link>
              <Link
                to={`/manage-courses/${courseId}/publish`}
                className={currentPath.endsWith('/publish') ? 'is-active' : ''}
              >
                Publish
              </Link>
            </nav>

            {/* Outlet only swaps this content — InstructorNav/Footer above
                and the header/nav don't remount when switching tabs, since
                Details/Content/Publish are all children of this one route. */}
            <div className="manage-course-layout-content">
              <Outlet context={{ course, user, updateCourse }} />
            </div>
          </>
        )}
      </main>

      <Footer variant="instructor" />
    </div>
  );
}
