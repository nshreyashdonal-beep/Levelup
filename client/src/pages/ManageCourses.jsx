// src/pages/ManageCourses.jsx
// Instructor "My Courses" page — this page answers "which courses do
// I own, published, draft, or archived?". Selecting a course hands off to the
// ManageCourseLayout workspace (details/content/publish/sessions).

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorNav from '../components/InstructorNav';
import Footer from '../components/Footer';
import CourseCard from '../components/CourseCard';
import { API_BASE } from '../api';
import './ManageCourses.css';

function getStoredInstructor() {
  const stored = localStorage.getItem('user');
  const parsed = stored ? JSON.parse(stored) : null;
  return parsed && parsed.role === 'instructor' ? parsed : null;
}

export default function ManageCourses() {
  const navigate = useNavigate();
  const [user] = useState(getStoredInstructor);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect anyone who isn't a logged-in instructor
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // Load only this instructor's courses
  useEffect(() => {
    if (!user) return;

    let ignore = false;

    setLoading(true);
    fetch(`${API_BASE}/api/courses?instructor_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) setCourses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ignore) setCourses([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [user]);

  const publishedCourses = courses.filter((course) => course.status === 'published');
  const draftCourses = courses.filter((course) => course.status === 'draft');
  const archivedCourses = courses.filter((course) => course.status === 'archived');

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
          <div
            className="managecourses-grid managecourses-skeleton-grid"
            role="status"
            aria-label="Loading your courses"
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCourseCard key={index} />
            ))}
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="managecourses-status-card">
            <div className="managecourses-status-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <p className="managecourses-status-title">You haven't created any courses yet.</p>
            <span>Use the button above to start your first draft course.</span>
          </div>
        )}

        {!loading && courses.length > 0 && (
          <>
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
                    <CourseCard
                      key={course.id}
                      course={course}
                      variant="instructor"
                      onManageClick={() => navigate(`/manage-courses/${course.id}`)}
                    />
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
                    <CourseCard
                      key={course.id}
                      course={course}
                      variant="instructor"
                      onManageClick={() => navigate(`/manage-courses/${course.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>

            {archivedCourses.length > 0 && (
              <section className="managecourses-section">
                <h2 className="managecourses-section-title">Archived Courses</h2>
                <p className="managecourses-section-subtitle">
                  Closed to new enrollments — hidden from Explore, while enrolled students continue to learn.
                </p>

                <div className="managecourses-grid">
                  {archivedCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      variant="instructor"
                      onManageClick={() => navigate(`/manage-courses/${course.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer variant="instructor" />
    </div>
  );
}

// Skeleton placeholder mirroring the 16:9 CourseCard geometry
function SkeletonCourseCard() {
  return (
    <div className="managecourses-skeleton-card" aria-hidden="true">
      <div className="managecourses-skeleton-thumb" />

      <div className="managecourses-skeleton-body">
        <div className="managecourses-skeleton-line managecourses-skeleton-line--title" />
        <div className="managecourses-skeleton-line managecourses-skeleton-line--meta" />
        <div className="managecourses-skeleton-line managecourses-skeleton-line--rating" />

        <div className="managecourses-skeleton-footer">
          <div className="managecourses-skeleton-line managecourses-skeleton-line--price" />
          <div className="managecourses-skeleton-line managecourses-skeleton-line--btn" />
        </div>
      </div>
    </div>
  );
}
