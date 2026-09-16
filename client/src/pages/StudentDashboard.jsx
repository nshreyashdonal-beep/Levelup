// src/pages/StudentDashboard.jsx
// Converted from the src.rar mockup (Studentdashboard.jsx). No course data
// needed here — that's My Courses' job (next piece) — this page is just a
// localStorage-guarded welcome screen with the journey recap and two
// action cards, so it stays simple.
//
// Two differences from the mockup, both because our real backend/login
// flow is different from the mockup's imagined one:
//   1. The mockup checks a separate localStorage.getItem("role") key.
//      We never store a standalone "role" key — Login.jsx already saves
//      the whole user object (which includes role) under "user", so we
//      read user.role from that instead of introducing a second key that
//      could get out of sync with it.
//   2. Dropped the "location" half of the email/location bar — our
//      /api/auth/login response never includes a location field (not even
//      for instructors, see PROGRESS.md), so showing it would just print
//      "undefined".
//
// Uses the dedicated StudentNav component (components/StudentNav.jsx),
// NOT the public Navbar — Navbar is for logged-out visitors (shows
// Login/Signup buttons) and would make this page visually identical to
// the homepage, which is exactly the bug an earlier version of this file
// had.
//
// Uses Tailwind-equivalent classes converted to plain CSS in
// StudentDashboard.css, following the same pattern as every other page
// (Login.css, Signup.css, etc.) since this project isn't using Tailwind.

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentNav from '../components/StudentNav';
import Footer from '../components/Footer';
import './StudentDashboard.css';

const journeySteps = [
  { icon: '🔍', label: 'Search', sub: 'Find teachers near you' },
  { icon: '👤', label: 'Browse Profile', sub: 'Check ratings & subjects' },
  { icon: '💻', label: 'Join Online Class', sub: 'Attend live sessions' },
  { icon: '🤝', label: 'Book Offline', sub: 'Clear doubts locally' },
  { icon: '📊', label: 'Track Progress', sub: 'Stay consistent' },
  { icon: '🏆', label: 'Level Up', sub: 'Achieve your goal', final: true },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : null;

    // Guard: only logged-in students get past this page. Anyone else
    // (not logged in, or logged in as an instructor) gets sent to login.
    if (!parsed || parsed.role !== 'student') {
      navigate('/login');
      return;
    }
    setUser(parsed);
  }, [navigate]);

  // Nothing to show yet while the guard above is still deciding.
  if (!user) return null;

  return (
    <div className="student-dash-wrap">
      <StudentNav user={user} />

      <main className="student-dash-main">
        {/* Welcome */}
        <div className="student-dash-welcome">
          <h1 className="student-dash-welcome-title">Welcome {user.name}!</h1>
        </div>

        {/* Email */}
        <div className="student-dash-info-bar">
          <span>{user.email}</span>
        </div>

        {/* Journey */}
        <section className="student-dash-journey">
          <h2 className="student-dash-section-title">Your Journey on LevelUp</h2>

          <div className="student-dash-journey-track">
            <div className="student-dash-journey-line" />
            {journeySteps.map((step, i) => (
              <div key={i} className="student-dash-journey-step">
                <div className={`student-dash-journey-node ${step.final ? 'student-dash-journey-node--final' : ''}`}>
                  <span>{step.icon}</span>
                  {!step.final && <span className="student-dash-journey-badge">{i + 1}</span>}
                </div>
                <p className="student-dash-journey-label">{step.label}</p>
                <p className="student-dash-journey-sub">{step.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Action cards */}
        <section className="student-dash-actions">
          <h2 className="student-dash-section-title">Start Your Learning Journey</h2>
          <p className="student-dash-actions-subtitle">Choose what you want to do next on LevelUp</p>

          <div className="student-dash-action-cards">
            <Link to="/mycourse" className="student-dash-action-card">
              <div className="student-dash-action-icon">📖</div>
              <h3 className="student-dash-action-title">My Courses</h3>
              <p className="student-dash-action-desc">Continue learning from your enrolled courses</p>
              <span className="student-dash-action-link">Go to My Courses →</span>
            </Link>

            <Link to="/" className="student-dash-action-card">
              <div className="student-dash-action-icon">🔍</div>
              <h3 className="student-dash-action-title">Explore Courses</h3>
              <p className="student-dash-action-desc">Discover new courses and instructors near you</p>
              <span className="student-dash-action-link">Explore Now →</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
