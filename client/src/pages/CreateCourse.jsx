// Instructor-only form for creating a new draft course.

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InstructorNav from '../components/InstructorNav';
import Footer from '../components/Footer';
import { API_BASE } from '../api';
import './CreateCourse.css';

const initialForm = {
  title: '',
  description: '',
  price: '',
  category: '',
  level: '',
  delivery_mode: '',
  language: '',
  thumbnail_url: '',
  duration_weeks: '',
  capacity: '',
  curriculum: '',
  outcomes: '',
};

export default function CreateCourse() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : null;

    if (!parsed || parsed.role !== 'instructor') {
      navigate('/login');
      return;
    }

    setUser(parsed);
  }, [navigate]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const payload = Object.entries(formData).reduce((result, [key, value]) => {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        result[key] = trimmedValue;
      }
      return result;
    }, {});

    try {
      const response = await fetch(`${API_BASE}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not create the course. Please try again.');
        return;
      }

      navigate('/manage-courses');
    } catch {
      setError('Could not reach the server. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="create-course-wrap">
      <InstructorNav user={user} />

      <main className="create-course-main">
        <div className="create-course-heading">
          <div>
            <Link to="/manage-courses" className="create-course-back-link">
              ← Back to My Courses
            </Link>
            <p className="create-course-eyebrow">BUILD YOUR NEXT COURSE</p>
            <h1 className="create-course-title">Create a Course</h1>
            <p className="create-course-subtitle">
              Start with the course details. You can add modules and lectures after it is created.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="create-course-form">
          {error && <div className="create-course-error" role="alert">{error}</div>}

          <section className="create-course-section">
            <div className="create-course-section-heading">
              <p className="create-course-section-number">01</p>
              <div>
                <h2>Course basics</h2>
                <p>Give students a clear first impression.</p>
              </div>
            </div>

            <div className="create-course-fields">
              <label className="create-course-field create-course-field-full">
                Course title *
                <input
                  name="title"
                  type="text"
                  maxLength="150"
                  placeholder="e.g. Full-Stack Web Development"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="create-course-field create-course-field-full">
                Description
                <textarea
                  name="description"
                  rows="4"
                  placeholder="What will students learn in this course?"
                  value={formData.description}
                  onChange={handleChange}
                />
              </label>

              <label className="create-course-field">
                Category
                <input
                  name="category"
                  type="text"
                  placeholder="e.g. Development"
                  value={formData.category}
                  onChange={handleChange}
                />
              </label>

              <label className="create-course-field">
                Language
                <input
                  name="language"
                  type="text"
                  placeholder="e.g. English"
                  value={formData.language}
                  onChange={handleChange}
                />
              </label>

              <label className="create-course-field">
                Level
                <select name="level" value={formData.level} onChange={handleChange}>
                  <option value="">Choose a level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>

              <label className="create-course-field">
                Delivery mode
                <select name="delivery_mode" value={formData.delivery_mode} onChange={handleChange}>
                  <option value="">Choose a mode</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </label>
            </div>
          </section>

          <section className="create-course-section">
            <div className="create-course-section-heading">
              <p className="create-course-section-number">02</p>
              <div>
                <h2>Course details</h2>
                <p>Add practical information before you publish.</p>
              </div>
            </div>

            <div className="create-course-fields">
              <label className="create-course-field">
                Price (₹)
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={formData.price}
                  onChange={handleChange}
                />
              </label>

              <label className="create-course-field">
                Duration (weeks)
                <input
                  name="duration_weeks"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 8"
                  value={formData.duration_weeks}
                  onChange={handleChange}
                />
              </label>

              <label className="create-course-field">
                Student capacity
                <input
                  name="capacity"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 30"
                  value={formData.capacity}
                  onChange={handleChange}
                />
              </label>

              <label className="create-course-field create-course-field-full">
                Thumbnail URL
                <input
                  name="thumbnail_url"
                  type="url"
                  placeholder="https://example.com/course-image.jpg"
                  value={formData.thumbnail_url}
                  onChange={handleChange}
                />
              </label>

              <label className="create-course-field create-course-field-full">
                Curriculum
                <textarea
                  name="curriculum"
                  rows="4"
                  placeholder="Outline the topics or weeks students can expect."
                  value={formData.curriculum}
                  onChange={handleChange}
                />
              </label>

              <label className="create-course-field create-course-field-full">
                Learning outcomes
                <textarea
                  name="outcomes"
                  rows="4"
                  placeholder="What should students be able to do after completing this course?"
                  value={formData.outcomes}
                  onChange={handleChange}
                />
              </label>
            </div>
          </section>

          <div className="create-course-form-actions">
            <Link to="/manage-courses" className="create-course-cancel-link">Cancel</Link>
            <button type="submit" className="create-course-submit-btn" disabled={loading}>
              {loading ? 'Creating course...' : 'Create Draft Course'}
            </button>
          </div>
        </form>
      </main>

      <Footer variant="instructor" />
    </div>
  );
}
