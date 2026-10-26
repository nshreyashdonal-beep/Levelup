// Publishing is kept on its own page so the instructor can review the
// course state without mixing it into editing the course content.

import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { API_BASE } from '../api';
import './PublishCourse.css';

export default function PublishCourse() {
  const { course, updateCourse } = useOutletContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const status = course.status || 'draft';
  const isPublished = status === 'published';
  const isArchived = status === 'archived';
  const enrolledCount = Number(course?.enrolled_count || 0);

  const moduleCount = course.modules?.length || 0;
  const lectureCount = (course.modules || []).reduce(
    (total, module) => total + (module.lectures?.length || 0),
    0
  );

  async function changeStatus(targetStatus) {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/courses/${course.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not update the course status.');
        return;
      }

      updateCourse({ ...course, ...data });
      if (targetStatus === 'published') {
        setMessage('Course published and live for student enrollments.');
      } else if (targetStatus === 'archived') {
        setMessage('Course archived. Enrollments are now closed; active students retain full access.');
      } else {
        setMessage('Course moved back to draft.');
      }
    } catch {
      setError('Could not reach the server. Is it running?');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="publish-course">
      <div className="publish-course-heading">
        <p className="publish-course-eyebrow">COURSE LIFECYCLE</p>
        <h2>
          {isPublished
            ? 'Your course is live'
            : isArchived
            ? 'Course enrollments are closed'
            : 'Publish your course'}
        </h2>
        <p>
          {isPublished
            ? 'Students can currently find and enroll in this course on LevelUp.'
            : isArchived
            ? 'This course is archived and hidden from public search. Enrolled students continue to learn.'
            : 'Review your course content before making it visible to students.'}
        </p>
      </div>

      {message && <div className="publish-course-success" role="status">{message}</div>}
      {error && <div className="publish-course-error" role="alert">{error}</div>}

      <div className="publish-course-card">
        <div className="publish-course-status-row">
          <div>
            <span className="publish-course-label">CURRENT STATUS</span>
            <strong>
              {isPublished
                ? 'Published'
                : isArchived
                ? 'Archived (Closed to new students)'
                : 'Draft'}
            </strong>
          </div>
          <div className="publish-course-status-badges">
            {enrolledCount > 0 && (
              <span className="publish-course-students-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                {enrolledCount} {enrolledCount === 1 ? 'student enrolled' : 'students enrolled'}
              </span>
            )}
            <span className={`publish-course-status-badge is-${status}`}>
              {isPublished ? 'LIVE' : isArchived ? 'ARCHIVED' : 'DRAFT'}
            </span>
          </div>
        </div>

        <div className="publish-course-checklist">
          <h3>Course overview</h3>
          <div className="publish-course-check">
            <span>{course.title ? '✓' : '○'}</span>
            <div>
              <strong>Course title</strong>
              <small>{course.title ? 'Added' : 'Add a title in Details'}</small>
            </div>
          </div>
          <div className="publish-course-check">
            <span>{course.description ? '✓' : '○'}</span>
            <div>
              <strong>Description</strong>
              <small>{course.description ? 'Added' : 'Optional for now'}</small>
            </div>
          </div>
          <div className="publish-course-check">
            <span>{moduleCount > 0 ? '✓' : '○'}</span>
            <div>
              <strong>Modules</strong>
              <small>{moduleCount} {moduleCount === 1 ? 'module' : 'modules'}</small>
            </div>
          </div>
          <div className="publish-course-check">
            <span>{lectureCount > 0 ? '✓' : '○'}</span>
            <div>
              <strong>Lectures</strong>
              <small>{lectureCount} {lectureCount === 1 ? 'lecture' : 'lectures'}</small>
            </div>
          </div>
        </div>

        <div className="publish-course-action">
          {isPublished ? (
            enrolledCount > 0 ? (
              <div className="publish-course-action-block">
                <div>
                  <h3>Close enrollments for this course?</h3>
                  <p>
                    Archiving hides this course from Explore and search. Your {enrolledCount} active student(s) will continue to retain full learning access.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => changeStatus('archived')}
                  disabled={saving}
                  className="publish-course-archive-btn"
                >
                  {saving ? 'Updating...' : 'Archive Course'}
                </button>
              </div>
            ) : (
              <div className="publish-course-action-block">
                <div>
                  <h3>Move this course back to draft?</h3>
                  <p>Since no students are enrolled, you can safely return it to draft.</p>
                </div>
                <button
                  type="button"
                  onClick={() => changeStatus('draft')}
                  disabled={saving}
                  className="publish-course-secondary-btn"
                >
                  {saving ? 'Updating...' : 'Move to Draft'}
                </button>
              </div>
            )
          ) : isArchived ? (
            <div className="publish-course-action-block">
              <div>
                <h3>Re-open enrollments?</h3>
                <p>
                  Publishing makes this course visible again in Explore so new learners can discover and enroll in it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => changeStatus('published')}
                disabled={saving}
                className="publish-course-primary-btn"
              >
                {saving ? 'Publishing...' : 'Re-publish Course'}
              </button>
            </div>
          ) : (
            <div className="publish-course-action-block">
              <div>
                <h3>Ready to publish?</h3>
                <p>Publishing makes your course live for students to discover and enroll.</p>
              </div>
              <button
                type="button"
                onClick={() => changeStatus('published')}
                disabled={saving}
                className="publish-course-primary-btn"
              >
                {saving ? 'Publishing...' : 'Publish Course'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
