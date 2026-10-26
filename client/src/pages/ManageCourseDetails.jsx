// Edit the basic information for one course.
// The shared ManageCourseLayout already loads the course and checks access.

import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { API_BASE } from '../api';
import CategorySelector from '../components/CategorySelector';
import './ManageCourseDetails.css';

export default function ManageCourseDetails() {
  const { course, updateCourse } = useOutletContext();
  const enrolledCount = Number(course?.enrolled_count || 0);
  const hasEnrolled = enrolledCount > 0;

  const [formData, setFormData] = useState({
    title: course.title || '',
    description: course.description || '',
    price: course.price ?? '',
    category: course.category || '',
    category_id: course.category_id || '',
    level: course.level || '',
    delivery_mode: course.delivery_mode || '',
    language: course.language || '',
    thumbnail_url: course.thumbnail_url || '',
    duration_weeks: course.duration_weeks ?? '',
    capacity: course.capacity ?? '',
    curriculum: course.curriculum || '',
    outcomes: course.outcomes || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/courses/${course.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not save the course.');
        return;
      }

      updateCourse({ ...course, ...data });
      setMessage('Course details saved.');
    } catch {
      setError('Could not reach the server. Is it running?');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="manage-course-details">
      <div className="manage-course-details-heading">
        <div>
          <p className="manage-course-details-eyebrow">COURSE DETAILS</p>
          <h2>Course information</h2>
          <p>Keep the information students see about this course up to date.</p>
        </div>
      </div>

      {hasEnrolled && (
        <div className="manage-course-details-notice" role="status">
          <svg className="manage-course-details-notice-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div>
            <strong>{enrolledCount} {enrolledCount === 1 ? 'student is' : 'students are'} currently enrolled.</strong>
            <span>Academic fields (Category, Level, and Mode) are locked to protect student learning agreements.</span>
          </div>
        </div>
      )}

      {message && <div className="manage-course-details-success" role="status">{message}</div>}
      {error && <div className="manage-course-details-error" role="alert">{error}</div>}

      <form className="manage-course-details-form" onSubmit={handleSubmit}>
        <div className="manage-course-details-card">
          <div className="manage-course-details-card-heading">
            <h3>Basic information</h3>
            <p>The main information for your course.</p>
          </div>

          <div className="manage-course-details-grid">
            <label className="manage-course-details-field manage-course-details-field--wide">
              Course title *
              <input name="title" value={formData.title} onChange={handleChange} required />
            </label>

            <label className="manage-course-details-field manage-course-details-field--wide">
              Description
              <textarea name="description" rows="5" value={formData.description} onChange={handleChange} />
            </label>

            <div className="manage-course-details-field--wide">
              <div className="manage-course-details-label-row">
                <span>Category</span>
                {hasEnrolled && (
                  <span className="manage-course-details-lock-pill" title="Locked because students are enrolled">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Locked ({enrolledCount} enrolled)
                  </span>
                )}
              </div>
              <CategorySelector
                value={formData.category_id}
                disabled={hasEnrolled}
                onChange={({ categoryId }) => {
                  setFormData((current) => ({
                    ...current,
                    category_id: categoryId,
                  }));
                }}
              />
              {hasEnrolled && (
                <span className="manage-course-details-locked-hint">
                  Course category cannot be altered once students have enrolled.
                </span>
              )}
            </div>

            <label className="manage-course-details-field">
              Language
              <input name="language" value={formData.language} onChange={handleChange} />
            </label>

            <label className="manage-course-details-field">
              <div className="manage-course-details-label-row">
                <span>Level</span>
                {hasEnrolled && (
                  <span className="manage-course-details-lock-pill" title="Locked because students are enrolled">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Locked
                  </span>
                )}
              </div>
              <select name="level" value={formData.level} onChange={handleChange} disabled={hasEnrolled}>
                <option value="">Select level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              {hasEnrolled && (
                <span className="manage-course-details-locked-hint">
                  Difficulty level is locked to preserve curriculum expectations.
                </span>
              )}
            </label>

            <label className="manage-course-details-field">
              <div className="manage-course-details-label-row">
                <span>Delivery mode</span>
                {hasEnrolled && (
                  <span className="manage-course-details-lock-pill" title="Locked because students are enrolled">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Locked
                  </span>
                )}
              </div>
              <select name="delivery_mode" value={formData.delivery_mode} onChange={handleChange} disabled={hasEnrolled}>
                <option value="">Select mode</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
              {hasEnrolled && (
                <span className="manage-course-details-locked-hint">
                  Delivery mode cannot be changed while students are actively attending.
                </span>
              )}
            </label>

            <label className="manage-course-details-field">
              Price (₹)
              <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} />
            </label>

            <label className="manage-course-details-field">
              Duration (weeks)
              <input name="duration_weeks" type="number" min="0" step="1" value={formData.duration_weeks} onChange={handleChange} />
            </label>

            <label className="manage-course-details-field">
              <div className="manage-course-details-label-row">
                <span>Capacity</span>
                {hasEnrolled && (
                  <span className="manage-course-details-min-pill">
                    Min {enrolledCount}
                  </span>
                )}
              </div>
              <input
                name="capacity"
                type="number"
                min={hasEnrolled ? enrolledCount : 0}
                step="1"
                value={formData.capacity}
                onChange={handleChange}
              />
              {hasEnrolled && (
                <span className="manage-course-details-locked-hint">
                  Cannot be lower than current enrollment ({enrolledCount}).
                </span>
              )}
            </label>

            <label className="manage-course-details-field manage-course-details-field--wide">
              Thumbnail URL
              <input name="thumbnail_url" value={formData.thumbnail_url} onChange={handleChange} />
            </label>
          </div>
        </div>

        <div className="manage-course-details-card">
          <div className="manage-course-details-card-heading">
            <h3>Curriculum & outcomes</h3>
            <p>Explain what students will cover and what they should gain from the course.</p>
          </div>

          <div className="manage-course-details-stack">
            <label className="manage-course-details-field">
              Know your curriculum
              <textarea name="curriculum" rows="7" value={formData.curriculum} onChange={handleChange} />
            </label>

            <label className="manage-course-details-field">
              Outcomes
              <textarea name="outcomes" rows="7" value={formData.outcomes} onChange={handleChange} />
            </label>
          </div>
        </div>

        <div className="manage-course-details-actions">
          <button type="submit" className="manage-course-details-save" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </section>
  );
}
