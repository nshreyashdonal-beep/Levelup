// Manage the real course structure: modules and lectures.
// This page keeps module and lecture management together so the instructor
// can build the actual course content step by step.

import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { API_BASE } from '../api';
import './ManageCourseContent.css';

const emptyLecture = {
  title: '',
  content: '',
  video_url: '',
  duration_minutes: '',
};

export default function ManageCourseContent() {
  const { course, updateCourse } = useOutletContext();

  const [openModuleId, setOpenModuleId] = useState(null);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [lectureForms, setLectureForms] = useState({});
  const [editingLectureId, setEditingLectureId] = useState(null);
  const [editLectureForm, setEditLectureForm] = useState(emptyLecture);

  const [addingModule, setAddingModule] = useState(false);
  const [addingLectureId, setAddingLectureId] = useState(null);
  const [savingLectureId, setSavingLectureId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function clearMessages() {
    setMessage('');
    setError('');
  }

  function getLectureForm(moduleId) {
    return lectureForms[moduleId] || emptyLecture;
  }

  function updateNewLecture(moduleId, field, value) {
    setLectureForms((current) => ({
      ...current,
      [moduleId]: {
        ...getLectureForm(moduleId),
        [field]: value,
      },
    }));
  }

  async function addModule(event) {
    event.preventDefault();

    if (!newModuleTitle.trim()) {
      setError('Please enter a module title.');
      return;
    }

    setAddingModule(true);
    clearMessages();

    try {
      const response = await fetch(`${API_BASE}/api/courses/${course.id}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: newModuleTitle.trim(),
          position: course.modules?.length || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not add the module.');
        return;
      }

      const updatedModules = [
        ...(course.modules || []),
        { ...data, lectures: [] },
      ];

      updateCourse({ ...course, modules: updatedModules });
      setNewModuleTitle('');
      setOpenModuleId(data.id);
      setMessage('Module added.');
    } catch {
      setError('Could not reach the server. Is it running?');
    } finally {
      setAddingModule(false);
    }
  }

  async function addLecture(event, module) {
    event.preventDefault();

    const form = getLectureForm(module.id);

    if (!form.title.trim()) {
      setError('Please enter a lecture title.');
      return;
    }

    setAddingLectureId(module.id);
    clearMessages();

    try {
      const response = await fetch(`${API_BASE}/api/modules/${module.id}/lectures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim() || null,
          video_url: form.video_url.trim() || null,
          duration_minutes: form.duration_minutes
            ? Number(form.duration_minutes)
            : null,
          position: module.lectures?.length || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not add the lecture.');
        return;
      }

      const updatedModules = (course.modules || []).map((item) => {
        if (item.id !== module.id) return item;

        return {
          ...item,
          lectures: [...(item.lectures || []), data],
        };
      });

      updateCourse({ ...course, modules: updatedModules });

      setLectureForms((current) => ({
        ...current,
        [module.id]: emptyLecture,
      }));

      setMessage('Lecture added. It is planned by default.');
    } catch {
      setError('Could not reach the server. Is it running?');
    } finally {
      setAddingLectureId(null);
    }
  }

  function startEditingLecture(lecture) {
    clearMessages();
    setEditingLectureId(lecture.id);
    setEditLectureForm({
      title: lecture.title || '',
      content: lecture.content || '',
      video_url: lecture.video_url || '',
      duration_minutes: lecture.duration_minutes ?? '',
    });
  }

  function cancelEditingLecture() {
    setEditingLectureId(null);
    setEditLectureForm(emptyLecture);
  }

  async function saveLecture(event, lecture) {
    event.preventDefault();

    if (!editLectureForm.title.trim()) {
      setError('Please enter a lecture title.');
      return;
    }

    setSavingLectureId(lecture.id);
    clearMessages();

    try {
      const response = await fetch(`${API_BASE}/api/lectures/${lecture.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: editLectureForm.title.trim(),
          content: editLectureForm.content.trim() || null,
          video_url: editLectureForm.video_url.trim() || null,
          duration_minutes: editLectureForm.duration_minutes
            ? Number(editLectureForm.duration_minutes)
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not update the lecture.');
        return;
      }

      updateCourse({
        ...course,
        modules: (course.modules || []).map((module) => ({
          ...module,
          lectures: (module.lectures || []).map((item) =>
            item.id === lecture.id ? { ...item, ...data } : item
          ),
        })),
      });

      cancelEditingLecture();
      setMessage('Lecture updated.');
    } catch {
      setError('Could not reach the server. Is it running?');
    } finally {
      setSavingLectureId(null);
    }
  }

  async function toggleModuleStatus(module) {
    const nextStatus = module.status === 'available' ? 'planned' : 'available';
    await updateModule(module.id, { status: nextStatus });
  }

  async function toggleLectureStatus(lecture) {
    const nextStatus = lecture.status === 'available' ? 'planned' : 'available';
    await updateLecture(lecture.id, { status: nextStatus });
  }

  async function updateModule(moduleId, changes) {
    clearMessages();

    try {
      const response = await fetch(`${API_BASE}/api/modules/${moduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(changes),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not update the module.');
        return;
      }

      updateCourse({
        ...course,
        modules: (course.modules || []).map((module) =>
          module.id === moduleId ? { ...module, ...data } : module
        ),
      });

      setMessage('Module status updated.');
    } catch {
      setError('Could not reach the server. Is it running?');
    }
  }

  async function updateLecture(lectureId, changes) {
    clearMessages();

    try {
      const response = await fetch(`${API_BASE}/api/lectures/${lectureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(changes),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not update the lecture.');
        return;
      }

      updateCourse({
        ...course,
        modules: (course.modules || []).map((module) => ({
          ...module,
          lectures: (module.lectures || []).map((lecture) =>
            lecture.id === lectureId ? { ...lecture, ...data } : lecture
          ),
        })),
      });

      setMessage('Lecture status updated.');
    } catch {
      setError('Could not reach the server. Is it running?');
    }
  }

  return (
    <section className="manage-course-content">
      <div className="manage-course-content-heading">
        <div>
          <p className="manage-course-content-eyebrow">COURSE CONTENT</p>
          <h2>Modules & Lectures</h2>
          <p>
            Build the actual course structure students will work through.
          </p>
        </div>

        <span className="manage-course-content-count">
          {course.modules?.length || 0}{' '}
          {course.modules?.length === 1 ? 'module' : 'modules'}
        </span>
      </div>

      {message && (
        <div className="manage-course-content-success" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="manage-course-content-error" role="alert">
          {error}
        </div>
      )}

      <div className="manage-course-content-add-card">
        <div>
          <h3>Add a module</h3>
          <p>Modules are the major sections of your course.</p>
        </div>

        <form onSubmit={addModule} className="manage-course-content-add-form">
          <input
            value={newModuleTitle}
            onChange={(event) => setNewModuleTitle(event.target.value)}
            placeholder="e.g. SQL Fundamentals"
            aria-label="New module title"
            maxLength="150"
          />

          <button type="submit" disabled={addingModule}>
            {addingModule ? 'Adding...' : '+ Add Module'}
          </button>
        </form>
      </div>

      <div className="manage-course-content-list">
        {course.modules?.length ? (
          course.modules.map((module, moduleIndex) => {
            const isOpen = openModuleId === module.id;

            return (
              <article
                className="manage-course-content-module"
                key={module.id}
              >
                <button
                  type="button"
                  className="manage-course-content-module-header"
                  onClick={() =>
                    setOpenModuleId(isOpen ? null : module.id)
                  }
                  aria-expanded={isOpen}
                >
                  <span className="manage-course-content-module-number">
                    {moduleIndex + 1}
                  </span>

                  <span className="manage-course-content-module-title-wrap">
                    <strong>{module.title}</strong>
                    <small>
                      {module.lectures?.length || 0}{' '}
                      {module.lectures?.length === 1
                        ? 'lecture'
                        : 'lectures'}
                    </small>
                  </span>

                  <span
                    className={`manage-course-content-status ${
                      module.status === 'available'
                        ? 'is-available'
                        : 'is-planned'
                    }`}
                  >
                    {module.status}
                  </span>

                  <span
                    className="manage-course-content-chevron"
                    aria-hidden="true"
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div className="manage-course-content-module-body">
                    <div className="manage-course-content-module-toolbar">
                      <div>
                        <strong>Module availability</strong>
                        <span>
                          Turn this module on when its content is ready.
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`manage-course-content-switch ${
                          module.status === 'available' ? 'is-on' : ''
                        }`}
                        onClick={() => toggleModuleStatus(module)}
                        aria-label={`Mark module ${module.status === 'available' ? 'planned' : 'available'}`}
                        aria-pressed={module.status === 'available'}
                      >
                        <span />
                      </button>
                    </div>

                    {module.lectures?.length ? (
                      <div className="manage-course-content-lectures">
                        {module.lectures.map((lecture, lectureIndex) => (
                          <div
                            className="manage-course-content-lecture"
                            key={lecture.id}
                          >
                            {editingLectureId === lecture.id ? (
                              <form
                                className="manage-course-content-edit-lecture"
                                onSubmit={(event) =>
                                  saveLecture(event, lecture)
                                }
                              >
                                <div className="manage-course-content-lecture-edit-heading">
                                  <span className="manage-course-content-lecture-number">
                                    {moduleIndex + 1}.{lectureIndex + 1}
                                  </span>
                                  <strong>Edit Lecture</strong>
                                </div>

                                <label>
                                  Lecture Title
                                  <input
                                    value={editLectureForm.title}
                                    onChange={(event) =>
                                      setEditLectureForm((current) => ({
                                        ...current,
                                        title: event.target.value,
                                      }))
                                    }
                                    maxLength="150"
                                  />
                                </label>

                                <label>
                                  Lecture Plan / Content
                                  <textarea
                                    value={editLectureForm.content}
                                    onChange={(event) =>
                                      setEditLectureForm((current) => ({
                                        ...current,
                                        content: event.target.value,
                                      }))
                                    }
                                    placeholder="What will be covered in this lecture?"
                                    rows="4"
                                  />
                                </label>

                                <div className="manage-course-content-form-row">
                                  <label>
                                    Duration (minutes)
                                    <input
                                      type="number"
                                      min="0"
                                      value={editLectureForm.duration_minutes}
                                      onChange={(event) =>
                                        setEditLectureForm((current) => ({
                                          ...current,
                                          duration_minutes: event.target.value,
                                        }))
                                      }
                                    />
                                  </label>

                                  <label>
                                    Video URL
                                    <input
                                      type="url"
                                      value={editLectureForm.video_url}
                                      onChange={(event) =>
                                        setEditLectureForm((current) => ({
                                          ...current,
                                          video_url: event.target.value,
                                        }))
                                      }
                                      placeholder="https://..."
                                    />
                                  </label>
                                </div>

                                <div className="manage-course-content-edit-actions">
                                  <button
                                    type="button"
                                    className="manage-course-content-secondary-button"
                                    onClick={cancelEditingLecture}
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    type="submit"
                                    disabled={savingLectureId === lecture.id}
                                  >
                                    {savingLectureId === lecture.id
                                      ? 'Saving...'
                                      : 'Save Lecture'}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <span className="manage-course-content-lecture-number">
                                  {moduleIndex + 1}.{lectureIndex + 1}
                                </span>

                                <div className="manage-course-content-lecture-info">
                                  <strong>{lecture.title}</strong>

                                  <span>
                                    {lecture.duration_minutes
                                      ? `${lecture.duration_minutes} min`
                                      : 'No duration set'}
                                  </span>

                                  {lecture.content && (
                                    <p>{lecture.content}</p>
                                  )}

                                  {lecture.video_url && (
                                    <small className="manage-course-content-video-url">
                                      Video URL added
                                    </small>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  className="manage-course-content-edit-button"
                                  onClick={() => startEditingLecture(lecture)}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className={`manage-course-content-switch manage-course-content-lecture-switch ${
                                    lecture.status === 'available'
                                      ? 'is-on'
                                      : ''
                                  }`}
                                  onClick={() =>
                                    toggleLectureStatus(lecture)
                                  }
                                  aria-label={`Mark lecture ${lecture.status === 'available' ? 'planned' : 'available'}`}
                                  aria-pressed={lecture.status === 'available'}
                                >
                                  <span />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="manage-course-content-empty">
                        No lectures yet. Add the first lecture below.
                      </p>
                    )}

                    <form
                      className="manage-course-content-add-lecture"
                      onSubmit={(event) => addLecture(event, module)}
                    >
                      <h4>Add Lecture</h4>

                      <label>
                        Lecture Title
                        <input
                          value={getLectureForm(module.id).title}
                          onChange={(event) =>
                            updateNewLecture(
                              module.id,
                              'title',
                              event.target.value
                            )
                          }
                          placeholder="e.g. Introduction to SQL"
                          maxLength="150"
                        />
                      </label>

                      <label>
                        Lecture Plan / Content
                        <textarea
                          value={getLectureForm(module.id).content}
                          onChange={(event) =>
                            updateNewLecture(
                              module.id,
                              'content',
                              event.target.value
                            )
                          }
                          placeholder="What will be covered in this lecture?"
                          rows="4"
                        />
                      </label>

                      <div className="manage-course-content-form-row">
                        <label>
                          Duration (minutes)
                          <input
                            type="number"
                            min="0"
                            value={getLectureForm(module.id).duration_minutes}
                            onChange={(event) =>
                              updateNewLecture(
                                module.id,
                                'duration_minutes',
                                event.target.value
                              )
                            }
                            placeholder="e.g. 30"
                          />
                        </label>

                        <label>
                          Video URL
                          <input
                            type="url"
                            value={getLectureForm(module.id).video_url}
                            onChange={(event) =>
                              updateNewLecture(
                                module.id,
                                'video_url',
                                event.target.value
                              )
                            }
                            placeholder="https://..."
                          />
                        </label>
                      </div>

                      <div className="manage-course-content-add-lecture-actions">
                        <span>
                          New lectures start as <strong>Planned</strong>.
                        </span>

                        <button
                          type="submit"
                          disabled={addingLectureId === module.id}
                        >
                          {addingLectureId === module.id
                            ? 'Adding...'
                            : '+ Add Lecture'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="manage-course-content-empty-card">
            <div aria-hidden="true">＋</div>
            <h3>No modules yet</h3>
            <p>
              Start by adding the first major section of your course above.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
