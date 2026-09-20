// src/pages/ManageCourses.jsx
// Instructor "My Courses" page — this page only answers "which courses do
// I own, published or draft?". Selecting a course hands off to the
// ManageCourseLayout workspace (details/content/publish) instead of doing
// any management work here.
//
// The instructor check reads localStorage synchronously via a lazy useState
// initializer instead of in a useEffect. Doing it in an effect means the
// first render always has user = null and returns null (a blank frame)
// before the effect runs and the real content appears — visible as a flash
// every time this page is navigated to. Reading it up front means an
// already-logged-in instructor gets the real page on the very first render.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorNav from '../components/InstructorNav';
import Footer from '../components/Footer';
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

  // Redirect anyone who isn't a logged-in instructor. `user` is already
  // resolved by the time this runs, so this only ever fires for the
  // logged-out/wrong-role case, not on every normal visit.
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // Load only this instructor's courses — same route the Dashboard's
  // "Active Courses" count already uses.
  useEffect(() => {
    if (!user) return;

    // See the matching comment in ManageCourseLayout.jsx: `ignore` stops a
    // stale response from overwriting state when this effect runs twice
    // (StrictMode in dev, or fast repeat navigation in prod).
    let ignore = false;

    setLoading(true);
    fetch(`${API_BASE}/api/courses?instructor_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) setCourses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ignore) setCourses([]); // if the request fails, just show the empty state
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [user]);

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
          <div
            className="managecourses-grid managecourses-skeleton-grid"
            role="status"
            aria-label="Loading your courses"
          >
            {/* Same card shell/height as a real CourseCard, so the loaded
                grid doesn't suddenly jump to a much taller layout the
                instant the fetch resolves — see the comment on
                SkeletonCourseCard below. */}
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCourseCard key={index} />
            ))}
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
                      onManage={() => navigate(`/manage-courses/${course.id}`)}
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
                      onManage={() => navigate(`/manage-courses/${course.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer variant="instructor" />
    </div>
  );
}

// One course card, either section. Editing, modules/lectures, and
// publishing all happen after "Manage Course" hands off to the
// ManageCourseLayout workspace — this card only navigates there.
function CourseCard({ course, onManage }) {
  const isPublished = course.status === 'published';

  return (
    <article className="managecourses-card">
      <div className="managecourses-card-badge" aria-hidden="true">
        {course.title?.charAt(0).toUpperCase() || 'C'}
      </div>

      <div className="managecourses-card-body">
        <div className="managecourses-card-topline">
          <span className="managecourses-card-label">
            {isPublished ? 'PUBLISHED' : 'DRAFT'}
          </span>
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
            onClick={onManage}
          >
            Manage Course →
          </button>
        </div>
      </div>
    </article>
  );
}

// Placeholder shown in place of a CourseCard while courses are loading.
// Deliberately shares CourseCard's markup shape (badge block, title line,
// two description lines, footer with a price pill and a button-shaped
// block) so the skeleton grid takes up roughly the same space the real
// grid will — that's what stops the page from jumping in height the
// instant the fetch resolves and the real cards replace these. Purely
// decorative, so it's hidden from assistive tech; the surrounding grid
// carries the "Loading your courses" status instead.
function SkeletonCourseCard() {
  return (
    <div className="managecourses-skeleton-card" aria-hidden="true">
      <div className="managecourses-skeleton-badge" />

      <div className="managecourses-skeleton-body">
        <div className="managecourses-skeleton-line managecourses-skeleton-line--label" />
        <div className="managecourses-skeleton-line managecourses-skeleton-line--title" />
        <div className="managecourses-skeleton-line managecourses-skeleton-line--desc" />
        <div className="managecourses-skeleton-line managecourses-skeleton-line--desc-short" />

        <div className="managecourses-skeleton-footer">
          <div className="managecourses-skeleton-line managecourses-skeleton-line--price" />
          <div className="managecourses-skeleton-line managecourses-skeleton-line--btn" />
        </div>
      </div>
    </div>
  );
}
