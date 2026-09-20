// src/pages/InstructorDashboard.jsx
// Converted from the uploaded Instructordashboard.jsx mockup.
//
// Differences from the mockup, all because our real backend/login flow
// is different from the mockup's imagined one:
//   1. The mockup checks a separate localStorage.getItem("role") key. We
//      never store a standalone "role" key — Login.jsx saves the whole
//      user object (which includes role) under "user" — so we read
//      user.role from that instead, same fix already made in
//      StudentDashboard.jsx.
//   2. Dropped user.location and the whole "Your Bio" section — our
//      /api/auth/login response only ever returns
//      { id, name, email, role }, never bio/phone/location (those live
//      in instructor_profiles but login doesn't join to it), so both
//      would just show "undefined" or never render. Same reasoning
//      already logged for Student Dashboard's location field.
//   3. Of the four stat cards, only "Active Courses" is wired to real
//      data, via GET /api/courses?instructor_id=<id> (server route
//      extended this session to accept that filter). "Total Students",
//      "Total Earnings" and "Avg. Rating" stay at their placeholder
//      values ("0"/"0"/"—") — there's no backend yet for enrollment
//      counts per instructor, earnings, or rating aggregation. Faking
//      numbers for those would be worse than an honest placeholder.
//   4. Quick Action cards: "Create Course" now links to /manage-courses
//      (that page exists now). "Go Live" and "Schedule Offline" stay
//      non-clickable since they depend on features that don't exist at
//      all yet.
//
// Uses the new InstructorNav component (components/InstructorNav.jsx),
// pulled out of the mockup's inline TeacherNav function, same pattern as
// StudentNav.jsx.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorNav from '../components/InstructorNav';
import Footer from '../components/Footer';
import { API_BASE } from '../api';
import './InstructorDashboard.css';

const quickActions = [
  { icon: '➕', title: 'Create Course', desc: 'Build and publish a new course', to: '/manage-courses' },
  { icon: '🎙️', title: 'Go Live', desc: 'Start a live session with students' },
  { icon: '📍', title: 'Schedule Offline', desc: 'Set up a local meetup with students' },
];

// Reads the logged-in instructor synchronously instead of in a useEffect,
// so `user` is already correct on the very first render. Doing this check
// in an effect leaves `user` null for the first render (return null below
// fires, painting nothing) until the effect runs a moment later — visible
// as a flash every time this page is navigated to. Same fix already
// applied to ManageCourses.jsx and ManageCourseLayout.jsx.
function getStoredInstructor() {
  const stored = localStorage.getItem('user');
  const parsed = stored ? JSON.parse(stored) : null;
  return parsed && parsed.role === 'instructor' ? parsed : null;
}

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [user] = useState(getStoredInstructor);
  const [activeCourseCount, setActiveCourseCount] = useState(0);

  // Redirect anyone who isn't a logged-in instructor. `user` is already
  // resolved by the time this runs, so this only fires for the
  // logged-out/wrong-role case, not on every normal visit.
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // Once we know who's logged in, fetch just this instructor's own
  // courses so the "Active Courses" stat card shows a real number
  // instead of the mockup's hardcoded "0".
  useEffect(() => {
    if (!user) return;

    // `ignore` stops a stale response from overwriting state if this
    // effect runs twice (StrictMode in dev, or fast repeat navigation).
    let ignore = false;

    fetch(`${API_BASE}/api/courses?instructor_id=${user.id}`)
      .then((res) => res.json())
      .then((courses) => {
        if (!ignore) setActiveCourseCount(courses.length);
      })
      .catch(() => {
        if (!ignore) setActiveCourseCount(0); // if the request fails, just show 0 rather than crash the page
      });

    return () => {
      ignore = true;
    };
  }, [user]);

  // Nothing to show yet while the guard above is still deciding.
  if (!user) return null;

  const stats = [
    { label: 'Active Courses', value: String(activeCourseCount), icon: '📦' },
    { label: 'Total Students', value: '0', icon: '🧑‍🎓' },
    { label: 'Total Earnings', value: '₹0', icon: '💰' },
    { label: 'Avg. Rating', value: '—', icon: '⭐' },
  ];

  return (
    <div className="instructor-dash-wrap">
      <InstructorNav user={user} />

      <main className="instructor-dash-main">
        {/* Welcome */}
        <div className="instructor-dash-welcome">
          <h1 className="instructor-dash-welcome-title">Welcome, {user.name} 👋</h1>
          <div className="instructor-dash-info-bar">
            <span>{user.email}</span>
          </div>
        </div>

        <hr className="instructor-dash-divider" />

        {/* Stats */}
        <div className="instructor-dash-stats">
          {stats.map((s) => (
            <div key={s.label} className="instructor-dash-stat-card">
              <div className="instructor-dash-stat-icon">{s.icon}</div>
              <div className="instructor-dash-stat-value">{s.value}</div>
              <div className="instructor-dash-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <h2 className="instructor-dash-section-title">Quick Actions</h2>
        <div className="instructor-dash-actions">
          {quickActions.map((action) => (
            <div
              key={action.title}
              className={`instructor-dash-action-card ${action.to ? 'instructor-dash-action-card--clickable' : ''}`}
              onClick={action.to ? () => navigate(action.to) : undefined}
            >
              <div className="instructor-dash-action-icon">{action.icon}</div>
              <h3 className="instructor-dash-action-title">{action.title}</h3>
              <p className="instructor-dash-action-desc">{action.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer variant="instructor" />
    </div>
  );
}
