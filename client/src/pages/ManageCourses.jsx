// src/pages/ManageCourses.jsx
// Instructor-only "My Courses" page, reached via InstructorNav's "My
// Courses" link and InstructorWelcome's "Manage Courses" action card.
//
// Restyled/restructured in an earlier session to match the layout
// MyCourses.jsx (the student "My Courses" page) already uses — eyebrow +
// title + count badge header, a loading/empty status card, and a card
// grid — but built entirely with the Instructor emerald tokens and
// components per instructions.md, not by importing or branching on the
// student page.
//
// Branch 3, Session 8: instead of one mixed grid with a status badge on
// each card, courses are now split into two labeled sections — Published
// Courses and Draft Courses — so status is obvious from where a card sits,
// not just a small label on it. Draft cards get a new "Publish" button
// that calls the existing PATCH /api/courses/:id route (built in
// Session 5) with { status: 'published' }; nothing new on the backend
// except returning `status` from the list query.
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

  // Which course is currently being published (disables just that card's
  // button instead of every button on the page) + one shared error message
  // if a publish request fails.
  const [publishingId, setPublishingId] = useState(null);
  const [publishError, setPublishError] = useState('');

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

  // Flip one course from draft to published using the existing PATCH
  // route, then update it in local state so the card moves from the
  // Draft section to the Published section without a full refetch.
  async function publishCourse(courseId) {
    setPublishingId(courseId);
    setPublishError('');

    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: 'published' }),
      });

      if (!response.ok) {
        setPublishError('Could not publish the course. Please try again.');
        return;
      }

      setCourses((current) =>
        current.map((course) =>
          course.id === courseId ? { ...course, status: 'published' } : course
        )
      );
    } catch {
      setPublishError('Could not reach the server. Is it running?');
    } finally {
      setPublishingId(null);
    }
  }

  // Split once per render instead of filtering inline twice below.
  const publishedCourses = courses.filter((course) => course.status === 'published');
  const draftCourses = courses.filter((course) => course.status !== 'published');

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
            {publishError && <p className="managecourses-publish-error">{publishError}</p>}

            <section className="managecourses-section">
              <h2 className="managecourses-section-title">Draft Courses</h2>
              <p className="managecourses-section-subtitle">
                Still in progress — only you can see these until you publish them.
              </p>

              {draftCourses.length === 0 ? (
                <p className="managecourses-section-empty">Nothing in draft right now.</p>
              ) : (
                <div className="managecourses-grid">
                  {draftCourses.map((course) => (
                    <div key={course.id} className="managecourses-card">
                      <div className="managecourses-card-badge">
                        {course.title.charAt(0).toUpperCase()}
                      </div>

                      <div className="managecourses-card-body">
                        <div className="managecourses-card-topline">
                          <span className="managecourses-card-label">DRAFT</span>
                        </div>
                        <h2 className="managecourses-card-title">{course.title}</h2>
                        {course.description && (
                          <p className="managecourses-card-desc">{course.description}</p>
                        )}
                        <div className="managecourses-card-footer">
                          <p className="managecourses-card-price">₹{course.price}</p>
                          <div className="managecourses-card-actions">
                            <button
                              type="button"
                              className="managecourses-card-manage-btn"
                              onClick={() => navigate(`/courses/${course.id}/modules`)}
                            >
                              Add Module
                            </button>
                            <button
                              type="button"
                              className="managecourses-card-publish-btn"
                              disabled={publishingId === course.id}
                              onClick={() => publishCourse(course.id)}
                            >
                              {publishingId === course.id ? 'Publishing...' : 'Publish'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="managecourses-section">
              <h2 className="managecourses-section-title">Published Courses</h2>
              <p className="managecourses-section-subtitle">
                Live on LevelUp — students can find and enroll in these.
              </p>

              {publishedCourses.length === 0 ? (
                <p className="managecourses-section-empty">
                  Nothing published yet — publish a draft above when it's ready.
                </p>
              ) : (
                <div className="managecourses-grid">
                  {publishedCourses.map((course) => (
                    <div key={course.id} className="managecourses-card">
                      <div className="managecourses-card-badge">
                        {course.title.charAt(0).toUpperCase()}
                      </div>

                      <div className="managecourses-card-body">
                        <div className="managecourses-card-topline">
                          <span className="managecourses-card-label">PUBLISHED</span>
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
              )}
            </section>

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
