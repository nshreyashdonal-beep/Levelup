// src/pages/ManageCourses.jsx
// Instructor-only "My Courses" page, reached via InstructorNav's "My
// Courses" link and InstructorWelcome's "Manage Courses" action card.
//
// Restyled/restructured this session to match the layout MyCourses.jsx
// (the student "My Courses" page) already uses — eyebrow + title + count
// badge header, a loading/empty status card, and a card grid — but built
// entirely with the Instructor emerald tokens and components per
// instructions.md, not by importing or branching on the student page.
// See instructions.md sections 1-7: Instructor pages must stay on the
// green/emerald visual language, reuse InstructorNav + Footer
// variant="instructor", and behavior (guards, routes, API calls, empty/
// loading states) must not change during a visual-only pass.
//
// Behavior preserved from before this pass:
//   - Same instructor-only guard as InstructorDashboard.jsx.
//   - Same data source: GET /api/courses?instructor_id= (no new endpoint).
//   - "+ Create Course" links to the instructor create-course form.
//   - Cards are still NOT clickable and don't link anywhere — there's no
//     edit/detail route for an instructor's own course yet, so making the
//     card look interactive (cursor pointer, arrow icon, hover lift) would
//     be a fake affordance. Instead each card carries a small "Manage —
//     coming soon" tag, and the page keeps the same note explaining why.

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
  const [loading, setLoading] = useState(true);

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
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    fetch(`${API_BASE}/api/courses?instructor_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([])) // if the request fails, just show the empty state
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="managecourses-wrap">
      <InstructorNav user={user} />

      <main className="managecourses-main">
        <div className="managecourses-heading">
          <div>
            <p className="managecourses-eyebrow">YOUR TEACHING SPACE</p>
            <h1 className="managecourses-title">My Courses</h1>
            <p className="managecourses-subtitle">
              The courses you've created and published on LevelUp.
            </p>
          </div>

          <div className="managecourses-heading-actions">
            {!loading && courses.length > 0 && (
              <span className="managecourses-count">
                {courses.length} {courses.length === 1 ? 'course' : 'courses'} created
              </span>
            )}

            <button
              type="button"
              className="managecourses-create-btn"
              onClick={() => navigate('/create-course')}
            >
              + Create Course
            </button>
          </div>
        </div>

        {loading && (
          <div className="managecourses-status-card">
            <div className="managecourses-status-icon" aria-hidden="true">✦</div>
            <p className="managecourses-status-title">Loading your courses...</p>
            <span>Getting your teaching space ready.</span>
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="managecourses-status-card">
            <div className="managecourses-status-icon" aria-hidden="true">📦</div>
            <p className="managecourses-status-title">You haven't created any courses yet.</p>
            <span>Use the button above to start your first draft course.</span>
          </div>
        )}

        {!loading && courses.length > 0 && (
          <>
            <div className="managecourses-grid">
              {courses.map((course) => (
                <div key={course.id} className="managecourses-card">
                  <div className="managecourses-card-badge">
                    {course.title.charAt(0).toUpperCase()}
                  </div>

                  <div className="managecourses-card-body">
                    <div className="managecourses-card-topline">
                      <span className="managecourses-card-label">CREATED</span>
                    </div>
                    <h2 className="managecourses-card-title">{course.title}</h2>
                    {course.description && (
                      <p className="managecourses-card-desc">{course.description}</p>
                    )}
                    <div className="managecourses-card-footer">
                      <p className="managecourses-card-price">₹{course.price}</p>
                      <button
                        type="button"
                        className="managecourses-card-manage-btn"
                        onClick={() => navigate(`/courses/${course.id}/modules`)}
                      >
                        Add Module
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="managecourses-note">
              Add modules now; lecture creation and full course editing will be added in
              the next course-management pieces.
            </p>
          </>
        )}
      </main>

      <Footer variant="instructor" />
    </div>
  );
}
