// src/pages/ManageCourseSessions.jsx
// Course Studio Sessions management tab.
// Enables instructors to schedule, reschedule, and cancel doubt sessions,
// in-person institute meetups, and mock tests according to course delivery mode.
// Hybrid courses fully support BOTH in-person center meetups AND live online Google Meet sessions.
// Enterprise-grade clean UI with zero cartoon emojis.

import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { API_BASE } from '../api';
import './ManageCourseSessions.css';

// Helper to format ISO date string to readable display
function formatSessionDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Convert Date or ISO to YYYY-MM-DDTHH:mm for datetime-local input
function toLocalDatetimeInput(dateString) {
  if (!dateString) {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 2, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${nextHour.getFullYear()}-${pad(nextHour.getMonth() + 1)}-${pad(nextHour.getDate())}T${pad(nextHour.getHours())}:${pad(nextHour.getMinutes())}`;
  }
  const d = new Date(dateString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Compute human countdown or status badge
function getSessionTimingBadge(dateString) {
  const diffMs = new Date(dateString) - new Date();
  if (diffMs < -3 * 60 * 60 * 1000) {
    return { label: 'Completed', variant: 'past' };
  }
  if (diffMs < 0) {
    return { label: 'In Progress / Today', variant: 'active' };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 24) {
    if (new Date(dateString).getDate() === new Date().getDate()) {
      return { label: 'Today', variant: 'today' };
    }
    return { label: 'Tomorrow', variant: 'soon' };
  }
  if (diffDays === 1) return { label: 'In 1 day', variant: 'soon' };
  if (diffDays <= 7) return { label: `In ${diffDays} days`, variant: 'soon' };
  return { label: `In ${diffDays} days`, variant: 'upcoming' };
}

export default function ManageCourseSessions() {
  const { course } = useOutletContext();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Delivery format state inside modal ('in_person' or 'online')
  const [deliveryFormat, setDeliveryFormat] = useState('in_person');

  // Form Fields
  const [formData, setFormData] = useState({
    session_type: 'doubt',
    title: '',
    description: '',
    scheduled_at: '',
    location: '',
  });

  const courseMode = course?.delivery_mode || 'online';
  const isHybrid = courseMode === 'hybrid';
  const isOffline = courseMode === 'offline';
  const isOnline = courseMode === 'online';

  const defaultInstituteAddress =
    course?.center_name || course?.address || 'Institute Campus — Lab 2';

  const fetchSessions = useCallback(async () => {
    if (!course?.id) return;
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/api/sessions?course_id=${course.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load sessions');
      }
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load sessions.');
    } finally {
      setLoading(false);
    }
  }, [course?.id]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  function handleOpenCreate(type = 'doubt', format = 'in_person') {
    setEditingSession(null);
    const chosenFormat = isOnline ? 'online' : isOffline ? 'in_person' : format;
    setDeliveryFormat(chosenFormat);

    let defaultTitle = '';
    let defaultLocation = '';

    if (chosenFormat === 'online') {
      defaultTitle = 'Live Online Doubt Clearing & Q&A';
      defaultLocation = 'https://meet.google.com/new';
    } else if (type === 'offline') {
      defaultTitle = 'In-Person Lab & Practice Meetup';
      defaultLocation = defaultInstituteAddress;
    } else {
      defaultTitle = 'In-Person Doubt Clearing Session';
      defaultLocation = defaultInstituteAddress;
    }

    setFormData({
      session_type: type,
      title: defaultTitle,
      description: '',
      scheduled_at: toLocalDatetimeInput(),
      location: defaultLocation,
    });
    setError('');
    setIsModalOpen(true);
  }

  function handleOpenEdit(session) {
    setEditingSession(session);
    const isUrl =
      session.location &&
      (session.location.startsWith('http') || session.location.includes('meet.google.com'));
    setDeliveryFormat(isUrl ? 'online' : 'in_person');

    setFormData({
      session_type: session.session_type || 'doubt',
      title: session.title || '',
      description: session.description || '',
      scheduled_at: toLocalDatetimeInput(session.scheduled_at),
      location: session.location || '',
    });
    setError('');
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingSession(null);
    setSaving(false);
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a session topic / title.');
      return;
    }
    if (!formData.scheduled_at) {
      setError('Please select a scheduled date and time.');
      return;
    }
    if (!formData.location.trim()) {
      setError(
        deliveryFormat === 'online'
          ? 'Please enter a Google Meet link for this online session.'
          : 'Please enter a center or room venue for this in-person session.'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');

      if (editingSession) {
        // PATCH existing session
        const response = await fetch(`${API_BASE}/api/sessions/${editingSession.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim(),
            session_type: formData.session_type,
            scheduled_at: new Date(formData.scheduled_at).toISOString(),
            location: formData.location.trim(),
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update session');

        setNotice('Session updated successfully.');
      } else {
        // POST new session
        const response = await fetch(`${API_BASE}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            course_id: course.id,
            title: formData.title.trim(),
            description: formData.description.trim(),
            session_type: formData.session_type,
            scheduled_at: new Date(formData.scheduled_at).toISOString(),
            location: formData.location.trim(),
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to schedule session');

        setNotice('New session scheduled successfully.');
      }

      handleCloseModal();
      fetchSessions();
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSession(sessionId) {
    try {
      setDeleting(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to cancel session');

      setDeleteConfirmId(null);
      setNotice('Session cancelled successfully.');
      fetchSessions();
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setError(err.message || 'Could not cancel session.');
    } finally {
      setDeleting(false);
    }
  }

  const isCurrentOnline = deliveryFormat === 'online';

  return (
    <section className="manage-sessions">
      {/* Header Context Banner */}
      <div className="manage-sessions-header">
        <div className="manage-sessions-title-area">
          <div className="manage-sessions-badges">
            <span className="manage-sessions-eyebrow">COURSE SESSIONS</span>
            <span className={`manage-sessions-mode-pill mode-${courseMode}`}>
              {courseMode.toUpperCase()} FORMAT
            </span>
          </div>
          <h2>
            {isHybrid
              ? 'Schedule Doubt & In-Person Sessions'
              : isOffline
              ? 'Schedule In-Person Doubt Sessions'
              : 'Schedule Live Doubt Sessions'}
          </h2>
          <p className="manage-sessions-desc">
            {isHybrid &&
              'Hybrid courses give you full flexibility: schedule hands-on institute workshops at your center, as well as live virtual doubt clearing sessions with Google Meet links.'}
            {isOffline &&
              'Manage classroom doubt clearing hours, lab workshops, and evaluation meets held at your physical training center.'}
            {isOnline &&
              'Host real-time doubt clearing sessions and mock tests. Share Google Meet links so enrolled students can join online.'}
          </p>
        </div>

        {/* Action Buttons based on delivery mode */}
        <div className="manage-sessions-actions-bar">
          {isHybrid ? (
            <>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleOpenCreate('offline', 'in_person')}
              >
                + Schedule In-Person Meetup
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleOpenCreate('doubt', 'online')}
              >
                + Schedule Online Doubt Session
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleOpenCreate('doubt', 'in_person')}
              >
                + Schedule In-Person Doubt Session
              </button>
            </>
          ) : isOffline ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleOpenCreate('doubt', 'in_person')}
            >
              + Schedule In-Person Doubt Session
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleOpenCreate('doubt', 'online')}
            >
              + Schedule Live Doubt Session
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {notice && (
        <div className="manage-sessions-alert alert-success" role="alert">
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="manage-sessions-alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Sessions List */}
      <div className="manage-sessions-container">
        <div className="manage-sessions-list-header">
          <h3>Scheduled Sessions ({sessions.length})</h3>
          <span className="sessions-list-hint">
            Visible to enrolled students on their course details and student dashboard.
          </span>
        </div>

        {loading ? (
          <div className="manage-sessions-empty-state">
            <p>Loading scheduled sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="manage-sessions-empty-state">
            <h4>No sessions scheduled yet</h4>
            <p>
              {isHybrid
                ? 'Create in-person lab meetups or live Google Meet doubt sessions so students know how and where to attend.'
                : isOffline
                ? 'Add in-person doubt clearing sessions for your classroom batches.'
                : 'Schedule a live virtual doubt session with Google Meet.'}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                handleOpenCreate(isHybrid ? 'offline' : 'doubt', isOnline ? 'online' : 'in_person')
              }
            >
              {isHybrid ? 'Schedule First In-Person Meetup' : 'Schedule First Session'}
            </button>
          </div>
        ) : (
          <div className="manage-sessions-grid">
            {sessions.map((session) => {
              const timing = getSessionTimingBadge(session.scheduled_at);
              const isSessionOnline =
                session.location &&
                (session.location.startsWith('http') || session.location.includes('meet.google.com'));
              const isOfflineType = session.session_type === 'offline';
              const isMockTest = session.session_type === 'mock_test';

              return (
                <article key={session.id} className="session-card">
                  <div className="session-card-top">
                    <div className="session-card-tags">
                      <span
                        className={`session-type-badge ${
                          isSessionOnline ? 'type-online' : `type-${session.session_type}`
                        }`}
                      >
                        {isSessionOnline
                          ? 'Live Online Doubt'
                          : isOfflineType
                          ? 'In-Person Meetup'
                          : isMockTest
                          ? 'Mock Test'
                          : 'In-Person Doubt'}
                      </span>
                      <span className={`session-timing-pill timing-${timing.variant}`}>
                        {timing.label}
                      </span>
                    </div>

                    <div className="session-card-controls">
                      <button
                        type="button"
                        className="btn-session-link"
                        onClick={() => handleOpenEdit(session)}
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        className="btn-session-link text-danger"
                        onClick={() => setDeleteConfirmId(session.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  <h4 className="session-card-title">{session.title}</h4>

                  {session.description && (
                    <p className="session-card-desc">{session.description}</p>
                  )}

                  <div className="session-card-meta-list">
                    <div className="session-meta-row">
                      <span className="session-meta-label">WHEN</span>
                      <span className="session-meta-val">
                        {formatSessionDate(session.scheduled_at)}
                      </span>
                    </div>

                    <div className="session-meta-row">
                      <span className="session-meta-label">
                        {isSessionOnline ? 'MEETING LINK' : 'VENUE / LAB'}
                      </span>
                      <span className="session-meta-val">
                        {session.location ? (
                          isSessionOnline ? (
                            <a
                              href={session.location}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="session-venue-link"
                            >
                              Join Google Meet ↗
                            </a>
                          ) : (
                            session.location
                          )
                        ) : (
                          <span className="text-muted">Not specified</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Inline Delete Confirmation */}
                  {deleteConfirmId === session.id && (
                    <div className="session-card-cancel-confirm">
                      <p>Cancel this scheduled session? This cannot be undone.</p>
                      <div className="cancel-actions">
                        <button
                          type="button"
                          className="btn-danger-sm"
                          disabled={deleting}
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          {deleting ? 'Cancelling...' : 'Confirm Cancellation'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary-sm"
                          disabled={deleting}
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Keep Session
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Session Modal */}
      {isModalOpen && (
        <div className="sessions-modal-backdrop" onClick={handleCloseModal}>
          <div
            className="sessions-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-session-title"
          >
            <div className="sessions-modal-header">
              <h3 id="modal-session-title">
                {editingSession ? 'Reschedule Session' : 'Schedule New Session'}
              </h3>
              <button
                type="button"
                className="sessions-modal-close"
                onClick={handleCloseModal}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="sessions-modal-form">
              {/* Delivery Format Choice for Hybrid Courses */}
              {isHybrid && (
                <div className="form-field">
                  <label>Session Format</label>
                  <div className="format-toggle-bar">
                    <button
                      type="button"
                      className={`format-toggle-btn ${
                        deliveryFormat === 'in_person' ? 'is-active' : ''
                      }`}
                      onClick={() => {
                        setDeliveryFormat('in_person');
                        if (formData.location.startsWith('http')) {
                          setFormData({
                            ...formData,
                            location: defaultInstituteAddress,
                            session_type: formData.session_type === 'doubt' ? 'doubt' : 'offline',
                          });
                        }
                      }}
                    >
                      In-Person at Center
                    </button>
                    <button
                      type="button"
                      className={`format-toggle-btn ${
                        deliveryFormat === 'online' ? 'is-active' : ''
                      }`}
                      onClick={() => {
                        setDeliveryFormat('online');
                        if (!formData.location.startsWith('http')) {
                          setFormData({
                            ...formData,
                            location: 'https://meet.google.com/new',
                            session_type: 'doubt',
                          });
                        }
                      }}
                    >
                      Live Online (Google Meet)
                    </button>
                  </div>
                  <span className="field-hint">
                    {deliveryFormat === 'in_person'
                      ? 'Students assemble at the institute campus/lab room.'
                      : 'Students join live virtually via Google Meet.'}
                  </span>
                </div>
              )}

              {/* Session Type */}
              <div className="form-field">
                <label htmlFor="session-type">Session Type</label>
                <select
                  id="session-type"
                  value={formData.session_type}
                  onChange={(e) =>
                    setFormData({ ...formData, session_type: e.target.value })
                  }
                  required
                >
                  {isHybrid ? (
                    deliveryFormat === 'in_person' ? (
                      <>
                        <option value="offline">In-Person Lab & Workshop (At Institute)</option>
                        <option value="doubt">In-Person Doubt Clearing Session</option>
                        <option value="mock_test">In-Person Mock Test & Evaluation</option>
                      </>
                    ) : (
                      <>
                        <option value="doubt">Live Virtual Doubt Session (Google Meet)</option>
                        <option value="mock_test">Live Online Mock Test & Review</option>
                      </>
                    )
                  ) : isOffline ? (
                    <>
                      <option value="doubt">In-Person Doubt Session</option>
                      <option value="offline">Practical Lab Session</option>
                      <option value="mock_test">Mock Test & Assessment</option>
                    </>
                  ) : (
                    <>
                      <option value="doubt">Live Virtual Doubt Session</option>
                      <option value="mock_test">Live Online Mock Test & Review</option>
                    </>
                  )}
                </select>
              </div>

              {/* Title / Topic */}
              <div className="form-field">
                <label htmlFor="session-title">Session Title / Topic</label>
                <input
                  id="session-title"
                  type="text"
                  placeholder={
                    isCurrentOnline
                      ? 'e.g. Weekly Live Q&A and Architecture Debugging'
                      : 'e.g. Redux Toolkit Hands-on Lab & Doubt Session'
                  }
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Scheduled Date & Time */}
              <div className="form-field">
                <label htmlFor="session-date">Date & Time</label>
                <input
                  id="session-date"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_at: e.target.value })
                  }
                  required
                />
                <span className="field-hint">
                  Students will see this local date and time in their dashboard countdown.
                </span>
              </div>

              {/* Location / Venue */}
              <div className="form-field">
                <label htmlFor="session-location">
                  {isCurrentOnline ? 'Google Meet Link' : 'Institute Center / Room Venue'}
                </label>
                <div className="field-with-action">
                  <input
                    id="session-location"
                    type="text"
                    placeholder={
                      isCurrentOnline
                        ? 'https://meet.google.com/abc-defg-hij'
                        : 'e.g. Center 2, 3rd Floor Lab, MG Road Campus'
                    }
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  />
                  {isCurrentOnline && (
                    <button
                      type="button"
                      className="btn-helper-action"
                      onClick={() =>
                        window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer')
                      }
                      title="Generate new meeting room on Google Meet"
                    >
                      New Meet ↗
                    </button>
                  )}
                </div>
                <span className="field-hint">
                  {isCurrentOnline
                    ? 'Paste your Google Meet room link. Students will click this to join live.'
                    : 'Physical venue where students should assemble for this session.'}
                </span>
              </div>

              {/* Description / Preparation Notes */}
              <div className="form-field">
                <label htmlFor="session-desc">Preparation Notes & Agenda (Optional)</label>
                <textarea
                  id="session-desc"
                  rows={3}
                  placeholder="e.g. Bring your laptops with Node v20 installed. We will debug state management and review project submissions."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="sessions-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving
                    ? 'Saving...'
                    : editingSession
                    ? 'Save Changes'
                    : 'Schedule Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
