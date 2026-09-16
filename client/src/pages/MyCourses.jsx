// src/pages/MyCourses.jsx
// Converted from the uploaded Mycourses.jsx mockup.
//
// Differences from the mockup, all because our real backend doesn't
// have most of the fields the mockup imagined:
//   1. Same localStorage role fix as every other dashboard page — reads
//      user.role from the `user` object instead of a separate `role` key.
//   2. Courses come from GET /api/enrollments/me (already built) instead
//      of a hardcoded array.
//   3. Dropped: course "type" (Hybrid/Online), "level" (Beginner/
//      Intermediate), per-course progress %, and the per-course tech
//      logo image — none of these have a column anywhere in the schema,
//      so showing them would mean making up data. Flagged as follow-up
//      work in PROGRESS.md, not built now.
//   4. Added instructor name for real — GET /api/enrollments/me was
//      extended this session with one extra join (users) to return it,
//      since the mockup already expected a real instructor name and
//      that data does genuinely exist, just wasn't being joined in yet.
//   5. Card image band replaced with a plain colored circle showing the
//      course title's first letter, since there's no per-course icon
//      image to show instead.
//   6. Added a "no courses yet" empty state — the mockup only ever
//      showed its 3 hardcoded courses, so it never needed one.
//
// Uses the existing StudentNav component (already built for Student
// Dashboard) instead of redefining the same header inline again, and
// highlights "My Courses" via StudentNav's activeLink prop.

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentNav from '../components/StudentNav';
import Footer from '../components/Footer';
import { API_BASE } from '../api';
import './MyCourses.css';

export default function MyCourses() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Guard: only logged-in students get past this page.
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : null;

    if (!parsed || parsed.role !== 'student') {
      navigate('/login');
      return;
    }
    setUser(parsed);
  }, [navigate]);

  // Once we know who's logged in, fetch their real enrollments.
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/enrollments/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([])) // if the request fails, just show the empty state
      .finally(() => setLoading(false));
  }, [user]);

  const openCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  if (!user) return null;

  return (
    <div className="mycourses-wrap">
      <StudentNav user={user} activeLink="mycourse" />

      <main className="mycourses-main">
        <div className="mycourses-heading">
          <div>
            <p className="mycourses-eyebrow">YOUR LEARNING SPACE</p>
            <h1 className="mycourses-title">My Courses</h1>
            <p className="mycourses-subtitle">
              Continue learning from the courses you have joined.
            </p>
          </div>
          {!loading && courses.length > 0 && (
            <span className="mycourses-count">
              {courses.length} {courses.length === 1 ? 'course' : 'courses'} enrolled
            </span>
          )}
        </div>

        {loading && (
          <div className="mycourses-status-card">
            <div className="mycourses-status-icon" aria-hidden="true">✦</div>
            <p className="mycourses-status-title">Loading your courses...</p>
            <span>Getting your learning space ready.</span>
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="mycourses-status-card">
            <div className="mycourses-status-icon" aria-hidden="true">📚</div>
            <p className="mycourses-status-title">You have no enrolled courses yet.</p>
            <span>Find a course and start building your learning journey.</span>
            <Link to="/student-landing" className="mycourses-explore-link">
              Explore courses <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        {!loading && courses.length > 0 && (
          <div className="mycourses-grid">
            {courses.map((course) => (
              <div
                key={course.id}
                className="mycourses-card"
                onClick={() => openCourse(course.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openCourse(course.id);
                  }
                }}
                role="button"
                tabIndex="0"
              >
                <div className="mycourses-card-badge">
                  {course.title.charAt(0).toUpperCase()}
                </div>

                <div className="mycourses-card-body">
                  <div className="mycourses-card-topline">
                    <span className="mycourses-card-label">ENROLLED</span>
                    <span className="mycourses-card-arrow" aria-hidden="true">↗</span>
                  </div>
                  <h2 className="mycourses-card-title">{course.title}</h2>
                  <p className="mycourses-card-instructor">by {course.instructor_name}</p>
                  <div className="mycourses-card-footer">
                    <p className="mycourses-card-price">₹{course.price}</p>
                    <span className="mycourses-card-action">
                      Continue <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
