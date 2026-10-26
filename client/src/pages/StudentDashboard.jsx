// src/pages/StudentDashboard.jsx
// Student dashboard displaying welcome overview, upcoming doubt & in-person sessions,
// learning journey steps, and quick action cards.
// Enterprise-grade clean UI with zero cartoon emojis.

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentNav from '../components/StudentNav';
import Footer from '../components/Footer';
import { API_BASE } from '../api';
import './StudentDashboard.css';

const journeySteps = [
  { num: '01', label: 'Search', sub: 'Find teachers near you' },
  { num: '02', label: 'Browse Profile', sub: 'Check ratings & subjects' },
  { num: '03', label: 'Join Online Class', sub: 'Attend live sessions' },
  { num: '04', label: 'Book Offline', sub: 'Clear doubts locally' },
  { num: '05', label: 'Track Progress', sub: 'Stay consistent' },
  { num: '06', label: 'Level Up', sub: 'Achieve your goal', final: true },
];

function getSessionCountdownBadge(dateString) {
  const diffMs = new Date(dateString) - new Date();
  if (diffMs < -3 * 60 * 60 * 1000) {
    return { label: 'Completed', variant: 'past' };
  }
  if (diffMs < 0) {
    return { label: 'Today', variant: 'today' };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 24) {
    return { label: 'Today', variant: 'today' };
  }
  if (diffDays === 1) return { label: 'Tomorrow', variant: 'soon' };
  if (diffDays <= 7) return { label: `In ${diffDays} days`, variant: 'soon' };
  return { label: `In ${diffDays} days`, variant: 'upcoming' };
}

function formatSessionTime(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [enrolledSessions, setEnrolledSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : null;

    if (!parsed || parsed.role !== 'student') {
      navigate('/login');
      return;
    }
    setUser(parsed);
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    setSessionsLoading(true);

    fetch(`${API_BASE}/api/sessions/enrolled`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setEnrolledSessions(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load enrolled sessions:', err);
      })
      .finally(() => setSessionsLoading(false));
  }, [user]);

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

        {/* Upcoming Doubt Sessions & In-Person Meets */}
        <section className="student-dash-sessions-section">
          <div className="student-dash-section-header">
            <div>
              <span className="dash-section-eyebrow">SCHEDULED SESSIONS</span>
              <h2 className="student-dash-section-title text-left">
                Upcoming In-Person Meets & Doubt Sessions
              </h2>
            </div>
            {enrolledSessions.length > 0 && (
              <span className="dash-sessions-count">
                {enrolledSessions.length} upcoming
              </span>
            )}
          </div>

          {sessionsLoading ? (
            <div className="student-dash-sessions-loading">
              <p>Checking your course schedule...</p>
            </div>
          ) : enrolledSessions.length === 0 ? (
            <div className="student-dash-sessions-empty">
              <p className="sessions-empty-title">No upcoming sessions scheduled</p>
              <p className="sessions-empty-desc">
                When your instructors schedule in-person lab meetups or live doubt clearing sessions, they will appear here with live countdowns.
              </p>
            </div>
          ) : (
            <div className="student-dash-sessions-grid">
              {enrolledSessions.map((session) => {
                const countdown = getSessionCountdownBadge(session.scheduled_at);
                const isOffline = session.session_type === 'offline';
                const isMock = session.session_type === 'mock_test';
                const isOnlineMode = session.delivery_mode === 'online';

                return (
                  <article key={session.id} className="student-session-card">
                    <div className="student-session-card-header">
                      <div className="student-session-badges">
                        <span className={`student-session-type type-${session.session_type}`}>
                          {isOffline
                            ? 'In-Person Meetup'
                            : isMock
                            ? 'Mock Test'
                            : 'Doubt Session'}
                        </span>
                        <span className={`student-countdown-pill timing-${countdown.variant}`}>
                          {countdown.label}
                        </span>
                      </div>
                      <span className={`student-mode-badge mode-${session.delivery_mode}`}>
                        {session.delivery_mode?.toUpperCase()}
                      </span>
                    </div>

                    <div className="student-session-course-title">
                      {session.course_title}
                    </div>

                    <h3 className="student-session-title">{session.title}</h3>

                    {session.description && (
                      <p className="student-session-desc">{session.description}</p>
                    )}

                    <div className="student-session-details">
                      <div className="session-detail-row">
                        <span className="detail-label">WHEN</span>
                        <span className="detail-value">
                          {formatSessionTime(session.scheduled_at)}
                        </span>
                      </div>

                      <div className="session-detail-row">
                        <span className="detail-label">
                          {isOnlineMode ? 'MEETING LINK' : 'VENUE / LAB'}
                        </span>
                        <span className="detail-value">
                          {session.location ? (
                            isOnlineMode && session.location.startsWith('http') ? (
                              <a
                                href={session.location}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="session-link-action"
                              >
                                Join Google Meet ↗
                              </a>
                            ) : (
                              session.location
                            )
                          ) : (
                            <span className="text-muted">Not specified</span>
                          )}
                        </span>
                      </div>

                      <div className="session-detail-row">
                        <span className="detail-label">INSTRUCTOR</span>
                        <span className="detail-value">
                          {session.instructor_name}
                          {session.instructor_city ? ` (${session.instructor_city})` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="student-session-footer">
                      <Link
                        to={`/courses/${session.course_id}`}
                        className="student-session-open-link"
                      >
                        Open Course Details →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Journey */}
        <section className="student-dash-journey">
          <h2 className="student-dash-section-title">Your Journey on LevelUp</h2>

          <div className="student-dash-journey-track">
            <div className="student-dash-journey-line" />
            {journeySteps.map((step, i) => (
              <div key={i} className="student-dash-journey-step">
                <div className={`student-dash-journey-node ${step.final ? 'student-dash-journey-node--final' : ''}`}>
                  <span className="student-dash-journey-num">{step.num}</span>
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
              <div className="student-dash-action-icon-badge">COURSES</div>
              <h3 className="student-dash-action-title">My Courses</h3>
              <p className="student-dash-action-desc">Continue learning from your enrolled courses</p>
              <span className="student-dash-action-link">Go to My Courses →</span>
            </Link>

            <Link to="/student-landing" className="student-dash-action-card">
              <div className="student-dash-action-icon-badge">EXPLORE</div>
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
