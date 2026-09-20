// Edit the basic information for one course.
// The shared ManageCourseLayout already loads the course and checks access.

import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { API_BASE } from '../api';
import './ManageCourseDetails.css';

export default function ManageCourseDetails() {
  const { course, updateCourse } = useOutletContext();
  const [formData, setFormData] = useState({
    title: course.title || '',
    description: course.description || '',
    price: course.price ?? '',
    category: course.category || '',
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

            <label className="manage-course-details-field">
              Category
              <input name="category" value={formData.category} onChange={handleChange} />
            </label>

            <label className="manage-course-details-field">
              Language
              <input name="language" value={formData.language} onChange={handleChange} />
            </label>

            <label className="manage-course-details-field">
              Level
              <select name="level" value={formData.level} onChange={handleChange}>
                <option value="">Select level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <label className="manage-course-details-field">
              Delivery mode
              <select name="delivery_mode" value={formData.delivery_mode} onChange={handleChange}>
                <option value="">Select mode</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
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
              Capacity
              <input name="capacity" type="number" min="0" step="1" value={formData.capacity} onChange={handleChange} />
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
