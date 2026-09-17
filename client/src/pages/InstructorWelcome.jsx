// src/pages/InstructorWelcome.jsx
// Instructor welcome screen with the same welcome, journey, and action-card
// structure as StudentDashboard, using the instructor's emerald theme.

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
        <div className="instructor-welcome-header">
          <h1 className="instructor-welcome-title">Welcome {user.name}!</h1>
        </div>

        {/* Email */}
        <div className="instructor-welcome-info-bar">
          <span>{user.email}</span>
        </div>

        {/* Journey */}
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

        {/* Action cards */}
        <section className="instructor-welcome-actions">
          <h2 className="instructor-welcome-section-title">Start Your Teaching Journey</h2>
          <p className="instructor-welcome-actions-subtitle">Choose what you want to do next on LevelUp</p>

          <div className="instructor-welcome-action-cards">
            <Link to="/manage-courses" className="instructor-welcome-action-card">
              <div className="instructor-welcome-action-icon">📦</div>
              <h3 className="instructor-welcome-action-title">Manage Courses</h3>
              <p className="instructor-welcome-action-desc">Create, edit, and publish your courses</p>
              <span className="instructor-welcome-action-link">Manage Courses →</span>
            </Link>

            <Link to="/instructor-dashboard" className="instructor-welcome-action-card">
              <div className="instructor-welcome-action-icon">📊</div>
              <h3 className="instructor-welcome-action-title">Instructor Dashboard</h3>
              <p className="instructor-welcome-action-desc">View your courses, stats, and quick actions</p>
              <span className="instructor-welcome-action-link">Open Dashboard →</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer variant="instructor" />
    </div>
  );
}
