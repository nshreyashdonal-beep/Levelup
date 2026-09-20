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

  const isPublished = course.status === 'published';
  const moduleCount = course.modules?.length || 0;
  const lectureCount = (course.modules || []).reduce(
    (total, module) => total + (module.lectures?.length || 0),
    0
  );

  async function changeStatus() {
    setSaving(true);
    setError('');
    setMessage('');

    const nextStatus = isPublished ? 'draft' : 'published';

    try {
      const response = await fetch(`${API_BASE}/api/courses/${course.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not update the course status.');
        return;
      }

      updateCourse({ ...course, ...data });
      setMessage(nextStatus === 'published' ? 'Course published.' : 'Course moved back to draft.');
    } catch {
      setError('Could not reach the server. Is it running?');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="publish-course">
      <div className="publish-course-heading">
        <p className="publish-course-eyebrow">COURSE STATUS</p>
        <h2>{isPublished ? 'Your course is live' : 'Publish your course'}</h2>
        <p>
          {isPublished
            ? 'Students can currently find and enroll in this course.'
            : 'Review the course before making it visible to students.'}
        </p>
      </div>

      {message && <div className="publish-course-success" role="status">{message}</div>}
      {error && <div className="publish-course-error" role="alert">{error}</div>}

      <div className="publish-course-card">
        <div className="publish-course-status-row">
          <div>
            <span className="publish-course-label">CURRENT STATUS</span>
            <strong>{isPublished ? 'Published' : 'Draft'}</strong>
          </div>
          <span className={`publish-course-status-badge ${isPublished ? 'is-published' : 'is-draft'}`}>
            {isPublished ? 'LIVE' : 'DRAFT'}
          </span>
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
            <>
              <h3>Move this course back to draft?</h3>
              <p>Students will no longer see it as a published course.</p>
              <button type="button" onClick={changeStatus} disabled={saving} className="publish-course-secondary-btn">
                {saving ? 'Updating...' : 'Move to Draft'}
              </button>
            </>
          ) : (
            <>
              <h3>Ready to publish?</h3>
              <p>Publishing changes the course status to published.</p>
              <button type="button" onClick={changeStatus} disabled={saving} className="publish-course-primary-btn">
                {saving ? 'Publishing...' : 'Publish Course'}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
