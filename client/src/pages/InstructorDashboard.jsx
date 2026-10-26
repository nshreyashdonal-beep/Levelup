// src/pages/InstructorDashboard.jsx
// Complete Instructor Cockpit Dashboard.
// Displays live real-time metrics (Active courses, Total students, Total earnings, Avg rating),
// actionable quick actions, individual course performance breakdown, and recent student activity.

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InstructorNav from '../components/InstructorNav';
import Footer from '../components/Footer';
import { API_BASE } from '../api';
import './InstructorDashboard.css';

// Professional SVG Icons (No Emojis)
const Icons = {
  Book: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Currency: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  Star: ({ filled = true, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke={filled ? '#f59e0b' : '#cbd5e1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Folder: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  UserCheck: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  MessageSquare: () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

function getStoredInstructor() {
  const stored = localStorage.getItem('user');
  const parsed = stored ? JSON.parse(stored) : null;
  return parsed && parsed.role === 'instructor' ? parsed : null;
}

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [user] = useState(getStoredInstructor);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      total_courses: 0,
      published_courses: 0,
      draft_courses: 0,
      total_students: 0,
      total_enrollments: 0,
      total_earnings: 0,
      avg_rating: 0,
      total_reviews: 0,
    },
    courses: [],
    recent_enrollments: [],
    recent_reviews: [],
  });

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;

    let ignore = false;
    const token = localStorage.getItem('token');

    setLoading(true);
    setError('');

    fetch(`${API_BASE}/api/instructors/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load dashboard data');
        }
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setDashboardData(data);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError('Could not fetch real-time dashboard data. Please try again.');
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [user]);

  if (!user) return null;

  const { stats, courses, recent_enrollments, recent_reviews } = dashboardData;

  const quickActions = [
    {
      Icon: Icons.Plus,
      title: 'Create Course',
      desc: 'Build and publish a brand new course syllabus',
      to: '/create-course',
      accent: 'action-emerald',
    },
    {
      Icon: Icons.Folder,
      title: 'Manage All Courses',
      desc: 'Edit lectures, update pricing & review drafts',
      to: '/manage-courses',
      accent: 'action-indigo',
    },
    {
      Icon: Icons.Eye,
      title: 'View Public Profile',
      desc: 'See how students discover and experience your profile',
      to: `/instructors/${user.id}`,
      accent: 'action-sky',
    },
    {
      Icon: Icons.UserCheck,
      title: 'Edit Profile & Bio',
      desc: 'Update your avatar photo, headline & city location',
      to: '/profile',
      accent: 'action-purple',
    },
  ];

  return (
    <div className="instructor-dash-wrap">
      <InstructorNav user={user} />

      <main className="instructor-dash-main">
        {/* Welcome Header (Matches Welcome.png exactly) */}
        <div className="instructor-dash-welcome-card">
          <div className="instructor-dash-welcome-top">
            <h1 className="instructor-dash-welcome-title">Welcome {user.name}!</h1>
          </div>
          <div className="instructor-dash-welcome-bottom">
            <span className="instructor-dash-welcome-email">{user.email}</span>
            <div className="instructor-dash-welcome-actions">
              <Link to={`/instructors/${user.id}`} className="instructor-view-profile-btn">
                <Icons.Eye />
                <span>View Public Profile</span>
              </Link>
              <Link to="/create-course" className="instructor-new-course-btn">
                <Icons.Plus />
                <span>Create Course</span>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="instructor-dash-error-banner" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* 4 Primary Stats Cards */}
        <section className="instructor-dash-stats" aria-label="Instructor Performance Overview">
          {/* Card 1: Active Courses */}
          <div className="instructor-dash-stat-card">
            <div className="instructor-dash-stat-header">
              <span className="instructor-dash-stat-label">Active Courses</span>
              <span className="instructor-dash-stat-icon">
                <Icons.Book />
              </span>
            </div>
            <div className="instructor-dash-stat-value">
              {loading ? '...' : `${stats.published_courses} Published`}
            </div>
            <div className="instructor-dash-stat-sub">
              {loading
                ? 'Loading courses...'
                : stats.draft_courses > 0
                ? `${stats.draft_courses} draft${stats.draft_courses === 1 ? '' : 's'} in progress`
                : `${stats.total_courses} total course${stats.total_courses === 1 ? '' : 's'} created`}
            </div>
          </div>

          {/* Card 2: Total Students */}
          <div className="instructor-dash-stat-card">
            <div className="instructor-dash-stat-header">
              <span className="instructor-dash-stat-label">Total Students</span>
              <span className="instructor-dash-stat-icon">
                <Icons.Users />
              </span>
            </div>
            <div className="instructor-dash-stat-value">
              {loading ? '...' : stats.total_students}
            </div>
            <div className="instructor-dash-stat-sub">
              {loading
                ? 'Loading students...'
                : `${stats.total_enrollments} course enrollment${stats.total_enrollments === 1 ? '' : 's'}`}
            </div>
          </div>

          {/* Card 3: Total Earnings */}
          <div className="instructor-dash-stat-card">
            <div className="instructor-dash-stat-header">
              <span className="instructor-dash-stat-label">Total Earnings</span>
              <span className="instructor-dash-stat-icon stat-icon--earnings">
                <Icons.Currency />
              </span>
            </div>
            <div className="instructor-dash-stat-value stat-val--earnings">
              {loading ? '...' : `₹${stats.total_earnings.toLocaleString('en-IN')}`}
            </div>
            <div className="instructor-dash-stat-sub">
              {loading ? 'Calculating revenue...' : 'From enrolled students'}
            </div>
          </div>

          {/* Card 4: Avg. Rating */}
          <div className="instructor-dash-stat-card">
            <div className="instructor-dash-stat-header">
              <span className="instructor-dash-stat-label">Avg. Rating</span>
              <span className="instructor-dash-stat-icon stat-icon--rating">
                <Icons.Star size={19} />
              </span>
            </div>
            <div className="instructor-dash-stat-value stat-val--rating">
              {loading
                ? '...'
                : stats.total_reviews > 0
                ? `${Number(stats.avg_rating).toFixed(1)} ★`
                : 'New'}
            </div>
            <div className="instructor-dash-stat-sub">
              {loading
                ? 'Loading reviews...'
                : stats.total_reviews > 0
                ? `Across ${stats.total_reviews} review${stats.total_reviews === 1 ? '' : 's'}`
                : 'No student reviews yet'}
            </div>
          </div>
        </section>

        {/* Quick Actions (Actionable Buttons with Clean Icons) */}
        <section className="instructor-dash-section">
          <h2 className="instructor-dash-section-title">Quick Actions</h2>
          <div className="instructor-dash-actions-grid">
            {quickActions.map((action) => {
              const ActionIcon = action.Icon;
              return (
                <div
                  key={action.title}
                  className={`instructor-dash-action-card ${action.accent}`}
                  onClick={() => navigate(action.to)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(action.to);
                    }
                  }}
                >
                  <div className="instructor-dash-action-top">
                    <span className="instructor-dash-action-icon">
                      <ActionIcon />
                    </span>
                    <span className="instructor-dash-action-arrow">
                      <Icons.ArrowRight />
                    </span>
                  </div>
                  <h3 className="instructor-dash-action-title">{action.title}</h3>
                  <p className="instructor-dash-action-desc">{action.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Course Performance Breakdown */}
        <section className="instructor-dash-section">
          <div className="section-title-row">
            <div>
              <h2 className="instructor-dash-section-title">Course Performance</h2>
              <p className="section-subtitle-text">
                Live enrollment metrics, revenue earned, and student feedback per course.
              </p>
            </div>
            <Link to="/manage-courses" className="section-link-action">
              Manage All Courses →
            </Link>
          </div>

          {loading ? (
            <div className="instructor-course-perf-loading">
              <p>Loading course performance...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="instructor-course-perf-empty">
              <div className="empty-icon-wrap">
                <Icons.Book />
              </div>
              <h3>No courses created yet</h3>
              <p>Create and publish your first course to begin teaching and earning.</p>
              <button
                type="button"
                className="instructor-new-course-btn"
                onClick={() => navigate('/create-course')}
              >
                <Icons.Plus />
                <span>Create Your First Course</span>
              </button>
            </div>
          ) : (
            <div className="instructor-course-perf-table-wrap">
              <table className="instructor-course-perf-table">
                <thead>
                  <tr>
                    <th>Course Title</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Enrolled</th>
                    <th>Earnings</th>
                    <th>Rating</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td className="cell-course-title">
                        <div className="course-title-col">
                          <span className="course-main-title">{c.title}</span>
                          <span className="course-meta-tags">
                            {c.delivery_mode ? c.delivery_mode.toUpperCase() : 'ONLINE'} • {c.level ? c.level.toUpperCase() : 'BEGINNER'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${c.status === 'published' ? 'status-published' : 'status-draft'}`}>
                          {c.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="cell-price">₹{Number(c.price).toLocaleString('en-IN')}</td>
                      <td>
                        <strong className="cell-highlight-num">{c.enrolled_count}</strong>
                        <span className="cell-sub-label"> students</span>
                      </td>
                      <td className="cell-earnings">
                        ₹{Number(c.course_earnings).toLocaleString('en-IN')}
                      </td>
                      <td>
                        {c.review_count > 0 ? (
                          <span className="rating-badge">
                            <Icons.Star size={14} />
                            <span>{Number(c.avg_rating).toFixed(1)}</span>
                            <span className="rating-count">({c.review_count})</span>
                          </span>
                        ) : (
                          <span className="rating-new-tag">New</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-manage-btn"
                          onClick={() => navigate(`/manage-courses/${c.id}`)}
                        >
                          Manage →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Activity Feed Split Grid (Recent Enrollments & Recent Reviews) */}
        <div className="instructor-dash-activity-grid">
          {/* Column 1: Recent Student Enrollments */}
          <section className="instructor-dash-section activity-card">
            <h2 className="instructor-dash-section-title">
              <Icons.Users />
              <span>Recent Enrollments</span>
            </h2>
            <div className="activity-list">
              {loading ? (
                <p className="activity-empty-msg">Loading enrollments...</p>
              ) : recent_enrollments.length === 0 ? (
                <div className="activity-empty-box">
                  <p>No student enrollments yet.</p>
                  <span>When students sign up for your courses, they will appear here in real-time.</span>
                </div>
              ) : (
                recent_enrollments.map((enr) => (
                  <div key={enr.enrollment_id} className="activity-item">
                    <div className="activity-item-avatar">
                      {(enr.student_name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div className="activity-item-content">
                      <div className="activity-item-topline">
                        <strong className="activity-user-name">{enr.student_name}</strong>
                        <span className="activity-item-date">
                          {new Date(enr.enrolled_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <p className="activity-item-course">
                        Enrolled in <em>{enr.course_title}</em>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Column 2: Recent Reviews & Feedback */}
          <section className="instructor-dash-section activity-card">
            <h2 className="instructor-dash-section-title">
              <Icons.MessageSquare />
              <span>Recent Student Reviews</span>
            </h2>
            <div className="activity-list">
              {loading ? (
                <p className="activity-empty-msg">Loading reviews...</p>
              ) : recent_reviews.length === 0 ? (
                <div className="activity-empty-box">
                  <p>No reviews received yet.</p>
                  <span>Student ratings and feedback will appear here as they complete your course lessons.</span>
                </div>
              ) : (
                recent_reviews.map((rev) => (
                  <div key={rev.review_id} className="activity-item review-item">
                    <div className="review-stars-badge">
                      {Array.from({ length: rev.rating || 5 }).map((_, idx) => (
                        <Icons.Star key={idx} size={15} />
                      ))}
                    </div>
                    <div className="activity-item-content">
                      {rev.comment && <p className="review-comment-text">&ldquo;{rev.comment}&rdquo;</p>}
                      <div className="review-meta-line">
                        <strong className="activity-user-name">{rev.student_name}</strong>
                        <span>•</span>
                        <span className="activity-item-course-name">{rev.course_title}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer variant="instructor" />
    </div>
  );
}
