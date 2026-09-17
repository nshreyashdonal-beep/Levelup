// src/pages/ManageCourses.jsx
// Instructor-only page: a form to create a new course, plus a list of
// courses this instructor already has. No mockup existed for this one
// (src.rar never included it), so the layout is built plain from scratch
// to match the rest of the instructor-facing pages.
//
// "Manage" only goes as far as the backend currently allows: create
// (POST /api/courses) and view your own list (GET /api/courses
// ?instructor_id=<id>, same route already used for the Dashboard's
// "Active Courses" stat). There's no PUT/DELETE on courses yet — same
// situation as sessions having no edit/cancel route yet — so there's no
// edit or delete button here. Adding those is follow-up work once that
// backend route exists, not something to fake with dead buttons now.
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

  const [formData, setFormData] = useState({ title: '', description: '', price: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!formData.title.trim()) {
      setFormError('Title is required');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: formData.title.trim(),
        description: formData.description.trim(),
        // Backend defaults price to 0 if left out entirely, but an empty
        // string would otherwise get sent as-is — so send undefined
        // instead when the field was left blank.
        price: formData.price === '' ? undefined : formData.price,
      }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setFormError(data.error || 'Something went wrong creating the course');
          return;
        }
        // New course created — clear the form and put it straight into
        // the list instead of re-fetching the whole thing again.
        setFormData({ title: '', description: '', price: '' });
        setCourses((prev) => [data, ...prev]);
      })
      .catch(() => setFormError('Could not reach the server. Is it running?'))
      .finally(() => setSubmitting(false));
  }

  if (!user) return null;

  return (
    <div className="manage-courses-wrap">
      <InstructorNav user={user} />

      <main className="manage-courses-main">
        <h1 className="manage-courses-title">Manage Courses</h1>

        {/* Create course form */}
        <section className="manage-courses-form-card">
          <h2 className="manage-courses-section-heading">Create a New Course</h2>

          {formError && <div className="manage-courses-error">{formError}</div>}

          <form onSubmit={handleSubmit} className="manage-courses-form">
            <label className="manage-courses-label">Title</label>
            <input
              name="title"
              type="text"
              placeholder="e.g. Intro to Docker"
              required
              value={formData.title}
              onChange={handleChange}
              className="manage-courses-input"
            />

            <label className="manage-courses-label">Description</label>
            <textarea
              name="description"
              placeholder="What will students learn in this course?"
              value={formData.description}
              onChange={handleChange}
              className="manage-courses-input manage-courses-textarea"
              rows={4}
            />

            <label className="manage-courses-label">Price (₹)</label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={formData.price}
              onChange={handleChange}
              className="manage-courses-input"
            />

            <button type="submit" disabled={submitting} className="manage-courses-submit-btn">
              {submitting ? 'Creating...' : 'Create Course'}
            </button>
          </form>
        </section>

        {/* Existing courses list */}
        <section className="manage-courses-list-section">
          <h2 className="manage-courses-section-heading">Your Courses</h2>

          {loadingCourses ? (
            <p className="manage-courses-status">Loading your courses...</p>
          ) : courses.length === 0 ? (
            <p className="manage-courses-status">
              You haven't created any courses yet — use the form above to add your first one.
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
