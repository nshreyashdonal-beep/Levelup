// src/pages/InstructorWelcome.jsx
// New page: what an instructor sees right after logging in, before the
// real Instructor Dashboard (stat cards + quick actions). Same idea as
// StudentDashboard.jsx (welcome message + journey track), but for
// instructors, plus a "Continue to Your Dashboard" section with a button
// through to the actual dashboard.
//
// The journey steps + track markup are lifted as-is from the "Teacher's
// Path" tab on Home.jsx (teacherSteps array and JourneyTrack's JSX) —
// not reinvented — so this page shows the exact same 6-step teacher
// journey a visitor already saw on the homepage, just without the tab
// toggle (there's only one journey to show here, the instructor's own).
//
// Same localStorage guard pattern as StudentDashboard/InstructorDashboard:
// reads `user` from localStorage, redirects to /login if missing or
// role !== 'instructor'.

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InstructorNav from '../components/InstructorNav';
import Footer from '../components/Footer';
import './InstructorWelcome.css';

// Copied as-is from Home.jsx's teacherSteps.
const teacherSteps = [
  { icon: '📝', label: 'Create Profile', sub: 'Set up in minutes' },
  { icon: '📦', label: 'Upload Course', sub: 'Build curriculum' },
  { icon: '🎙️', label: 'Go Live', sub: 'Start teaching' },
  { icon: '🧑‍🎓', label: 'Students Enroll', sub: 'Grow audience' },
  { icon: '📍', label: 'Meet Locally', sub: 'Build connections' },
  { icon: '🚀', label: 'Earn & Grow', sub: 'Independent & thriving', final: true },
];

export default function InstructorWelcome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : null;

    if (!parsed || parsed.role !== 'instructor') {
      navigate('/login');
      return;
    }
    setUser(parsed);
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="instructor-welcome-wrap">
      <InstructorNav user={user} />

      <main className="instructor-welcome-main">
        {/* Welcome */}
        <div className="instructor-welcome-header">
          <h1 className="instructor-welcome-title">Welcome {user.name}!</h1>
        </div>

        <div className="instructor-welcome-info-bar">
          <span>{user.email}</span>
        </div>

        {/* Journey — same steps/markup as Home.jsx's "Teacher's Path" tab */}
        <section className="instructor-welcome-journey">
          <h2 className="instructor-welcome-section-title">Your Journey on LevelUp</h2>

          <div className="instructor-welcome-journey-track">
            <div className="instructor-welcome-journey-line" />
            {teacherSteps.map((step, i) => (
              <div key={i} className="instructor-welcome-journey-step">
                <div className={`instructor-welcome-journey-node ${step.final ? 'instructor-welcome-journey-node--final' : ''}`}>
                  <span>{step.icon}</span>
                  {!step.final && <span className="instructor-welcome-journey-badge">{i + 1}</span>}
                </div>
                <p className="instructor-welcome-journey-label">{step.label}</p>
                <p className="instructor-welcome-journey-sub">{step.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Link through to the real dashboard */}
        <section className="instructor-welcome-cta">
          <h2 className="instructor-welcome-section-title">Continue to Your Dashboard</h2>
          <p className="instructor-welcome-cta-subtitle">View your courses, stats, and quick actions</p>
          <Link to="/instructor-dashboard" className="instructor-welcome-cta-btn">
            Go to Dashboard
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
