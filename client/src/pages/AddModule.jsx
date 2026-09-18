// Instructor-only screen for adding a module to an existing course.

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import InstructorNav from '../components/InstructorNav';
import Footer from '../components/Footer';
import { API_BASE } from '../api';
import './AddModule.css';

export default function AddModule() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [formData, setFormData] = useState({ title: '', position: '' });
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : null;

    if (!parsed || parsed.role !== 'instructor') {
      navigate('/login');
      return;
    }

    setUser(parsed);
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    async function loadCourse() {
      setLoadingCourse(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE}/api/courses/${courseId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Could not load this course.');
          return;
        }

        setCourse(data);
        setFormData((current) => ({
          ...current,
          position: String((data.modules || []).length),
        }));
      } catch {
        setError('Could not reach the server. Is it running?');
      } finally {
        setLoadingCourse(false);
      }
    }

    loadCourse();
  }, [courseId, user]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const payload = { title: formData.title.trim() };
    if (formData.position.trim()) {
      payload.position = formData.position.trim();
    }

    try {
      const response = await fetch(`${API_BASE}/api/courses/${courseId}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not add the module. Please try again.');
        return;
      }

      setCourse((current) => ({
        ...current,
        modules: [...(current.modules || []), data],
      }));
      setFormData({ title: '', position: String((course.modules || []).length + 1) });
    } catch {
      setError('Could not reach the server. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  if (!user || loadingCourse) return null;

  return (
    <div className="add-module-wrap">
      <InstructorNav user={user} />

      <main className="add-module-main">
        <Link to="/manage-courses" className="add-module-back-link">
          ← Back to My Courses
        </Link>

        {error && !course && (
          <div className="add-module-error" role="alert">{error}</div>
        )}

        {course && (
          <>
            <div className="add-module-heading">
              <p className="add-module-eyebrow">COURSE CONTENT</p>
              <h1 className="add-module-title">Add a Module</h1>
              <p className="add-module-subtitle">
                Organize <strong>{course.title}</strong> into clear sections for your students.
              </p>
            </div>

            <div className="add-module-layout">
              <section className="add-module-form-card">
                <div className="add-module-card-heading">
                  <div className="add-module-icon" aria-hidden="true">＋</div>
                  <div>
                    <h2>New module</h2>
                    <p>Modules are major sections such as weeks or topics.</p>
                  </div>
                </div>

                {error && <div className="add-module-error" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="add-module-form">
                  <label className="add-module-field">
                    Module title *
                    <input
                      name="title"
                      type="text"
                      maxLength="150"
                      placeholder="e.g. Week 1: HTML and CSS Basics"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label className="add-module-field">
                    Position
                    <input
                      name="position"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={formData.position}
                      onChange={handleChange}
                    />
                    <span>Lower numbers appear earlier in the course.</span>
                  </label>

                  <button type="submit" className="add-module-submit-btn" disabled={loading}>
                    {loading ? 'Adding module...' : 'Add Module'}
                  </button>
                </form>
              </section>

              <aside className="add-module-list-card">
                <div className="add-module-list-heading">
                  <h2>Course modules</h2>
                  <span>{course.modules?.length || 0}</span>
                </div>

                {course.modules?.length > 0 ? (
                  <ol className="add-module-list">
                    {course.modules.map((module) => (
                      <li key={module.id}>
                        <span className="add-module-list-number">{module.position + 1}</span>
                        <div>
                          <strong>{module.title}</strong>
                          <span>{module.status}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="add-module-empty">
                    No modules yet. Add the first section of this course.
                  </p>
                )}
              </aside>
            </div>
          </>
        )}
      </main>

      <Footer variant="instructor" />
    </div>
  );
}
