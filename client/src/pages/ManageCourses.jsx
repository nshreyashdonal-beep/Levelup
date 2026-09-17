// src/pages/ManageCourses.jsx
// Instructor-only page, reached via InstructorNav's "My Courses" link.
//
// Previously this page had BOTH a "create a course" form and a list of the
// instructor's own courses on one page. Split apart: this page now shows
// ONLY the list of courses this instructor has created, plus a
// "+ Create Course" button. The actual create-course page doesn't exist
// yet (future piece), so the button is a placeholder for now rather than
// a dead link to nowhere — same "don't fake it" pattern already used for
// Instructor Dashboard's non-clickable Go Live / Schedule Offline cards.
//
// Same instructor-only guard as InstructorDashboard.jsx, and reuses
// InstructorNav the same way every other instructor page does.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorNav from '../components/InstructorNav';
import Footer from '../components/Footer';
import { API_BASE } from '../api';
import './ManageCourses.css';

export default function ManageCourses() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Guard: only logged-in instructors get past this page — same check
  // as InstructorDashboard.jsx.
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : null;

    if (!parsed || parsed.role !== 'instructor') {
      navigate('/login');
      return;
    }
    setUser(parsed);
  }, [navigate]);

  // Load this instructor's own courses — same route the Dashboard's
  // "Active Courses" count already uses.
  function loadCourses(instructorId) {
    setLoadingCourses(true);
    fetch(`${API_BASE}/api/courses?instructor_id=${instructorId}`)
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }

  useEffect(() => {
    if (user) loadCourses(user.id);
  }, [user]);

  if (!user) return null;

  return (
    <div className="manage-courses-wrap">
      <InstructorNav user={user} />

      <main className="manage-courses-main">
        <div className="manage-courses-header-row">
          <h1 className="manage-courses-title">My Courses</h1>

          {/* Real create-course page doesn't exist yet — this button is a
              placeholder for that future piece, not wired to a route. */}
          <button
            type="button"
            className="manage-courses-create-btn"
            disabled
            title="Coming soon"
          >
            + Create Course
          </button>
        </div>

        <section className="manage-courses-list-section">
          {loadingCourses ? (
            <p className="manage-courses-status">Loading your courses...</p>
          ) : courses.length === 0 ? (
            <p className="manage-courses-status">
              You haven't created any courses yet — use "Create Course" above once that
              page is ready.
            </p>
          ) : (
            <div className="manage-courses-list">
              {courses.map((course) => (
                <div key={course.id} className="manage-courses-card">
                  <div className="manage-courses-card-badge">
                    {course.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="manage-courses-card-body">
                    <p className="manage-courses-card-title">{course.title}</p>
                    {course.description && (
                      <p className="manage-courses-card-desc">{course.description}</p>
                    )}
                    <p className="manage-courses-card-price">₹{course.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="manage-courses-note">
            Editing or deleting a course isn't available yet — that needs its own backend
            route that doesn't exist yet.
          </p>
        </section>
      </main>

      <Footer variant="instructor" />
    </div>
  );
}
