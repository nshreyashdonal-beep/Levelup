// Manage the real course structure: modules and lectures.
// This page keeps module and lecture management together so the instructor
// can build the actual course content step by step.

import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { API_BASE } from '../api';
import { uploadLectureVideo } from '../api/cloudinary';
import './ManageCourseContent.css';

const emptyLecture = {
  title: '',
  content: '',
  video_url: '',
  duration_seconds: '',
  is_trial: false,
};

function getVideoPreview(url) {
  if (!url?.trim()) return null;

  try {
    const parsedUrl = new URL(url.trim());
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const videoId = parsedUrl.searchParams.get('v');
      return videoId
        ? {
            type: 'youtube',
            src: `https://www.youtube.com/embed/${videoId}`,
            videoId,
          }
        : { type: 'unsupported' };
    }

    if (hostname === 'youtu.be') {
      const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
      return videoId
        ? {
            type: 'youtube',
            src: `https://www.youtube.com/embed/${videoId}`,
            videoId,
          }
        : { type: 'unsupported' };
    }

    if (hostname === 'vimeo.com') {
      const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
      return /^\d+$/.test(videoId || '')
        ? { type: 'embed', src: `https://player.vimeo.com/video/${videoId}` }
        : { type: 'unsupported' };
    }

    const isCloudinaryVideo = hostname.endsWith('cloudinary.com')
      && parsedUrl.pathname.includes('/video/upload/');
    const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(parsedUrl.pathname);

    if (isCloudinaryVideo) {
      parsedUrl.pathname = parsedUrl.pathname.replace(
        '/video/upload/',
        '/video/upload/vc_h264,ac_aac,f_mp4/'
      );
    }

    return isCloudinaryVideo || isDirectVideo
      ? { type: 'video', src: parsedUrl.toString() }
      : { type: 'unsupported' };
  } catch {
    return { type: 'unsupported' };
  }
}

function getVideoDurationSeconds(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const durationSeconds = Number.isFinite(video.duration)
        ? Math.max(0, Math.round(video.duration))
        : null;
      URL.revokeObjectURL(objectUrl);
      resolve(durationSeconds);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    video.src = objectUrl;
  });
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds ? `${minutes} min ${remainingSeconds} sec` : `${minutes} min`;
}

function secondsToDuration(seconds) {
  return Number.isFinite(seconds) && seconds >= 0
    ? Math.max(0, Math.round(seconds))
    : null;
}

function YouTubePreview({ preview, onDurationDetected }) {
  useEffect(() => {
    let player;
    let cancelled = false;

    function createPlayer() {
      if (cancelled || !window.YT?.Player) return;

      player = new window.YT.Player('lecture-youtube-preview', {
        videoId: preview.videoId,
        events: {
          onReady: (event) => {
            const duration = event.target.getDuration();
            if (Number.isFinite(duration) && duration > 0) {
              onDurationDetected(secondsToDuration(duration));
            }
          },
        },
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
      }

      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [preview.videoId]);

  return <div id="lecture-youtube-preview" className="manage-course-content-youtube-preview" />;
}

function VideoPreview({ url, onDurationDetected }) {
  const preview = getVideoPreview(url);

  if (!preview) return null;

  return (
    <div className="manage-course-content-preview">
      <span className="manage-course-content-preview-label">Live Preview</span>

      {preview.type === 'youtube' && (
        <YouTubePreview
          preview={preview}
          onDurationDetected={onDurationDetected}
        />
      )}

      {preview.type === 'embed' && (
        <iframe
          src={preview.src}
          title="Lecture video preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}

      {preview.type === 'video' && (
        <video
          controls
          preload="metadata"
          playsInline
          src={preview.src}
          onLoadedMetadata={(event) => {
            event.currentTarget.muted = false;
            event.currentTarget.volume = 1;
            const durationSeconds = secondsToDuration(event.currentTarget.duration);
            if (durationSeconds !== null) onDurationDetected?.(durationSeconds);
          }}
        >
          Your browser does not support video playback.
        </video>
      )}

      {preview.type === 'unsupported' && (
        <p className="manage-course-content-preview-message">
          Preview is unavailable for this URL. Use YouTube, Vimeo, or a direct
          MP4/WebM/OGG video URL.
        </p>
      )}
    </div>
  );
}

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
  const [uploadingVideoKey, setUploadingVideoKey] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const uploadAbortRef = useRef(null);

  function clearMessages() {
    setMessage('');
    setError('');
  }

  function cancelUpload() {
    if (uploadAbortRef.current) {
      uploadAbortRef.current();
      uploadAbortRef.current = null;
    }
    setUploadingVideoKey(null);
    setUploadProgress(0);
    setMessage('Video upload was cancelled.');
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

  async function uploadVideo(file, formKey, updateForm) {
    clearMessages();
    setUploadingVideoKey(formKey);
    setUploadProgress(0);

    try {
      const uploadedVideo = await uploadLectureVideo(
        file,
        setUploadProgress,
        uploadAbortRef
      );
      const cloudinaryDurationSeconds = secondsToDuration(uploadedVideo.duration);

      updateForm({
        secureUrl: uploadedVideo.secureUrl,
        durationSeconds: cloudinaryDurationSeconds,
      });
      setMessage('Video uploaded successfully. URL and exact duration filled in.');

      if (cloudinaryDurationSeconds === null) {
        const localDurationSeconds = await getVideoDurationSeconds(file);
        if (localDurationSeconds !== null) {
          updateForm({
            secureUrl: uploadedVideo.secureUrl,
            durationSeconds: localDurationSeconds,
          });
        }
      }
    } catch (uploadError) {
      if (uploadError.isCancelled) {
        setMessage('Video upload was cancelled.');
      } else {
        setError(uploadError.message || 'Could not upload the video.');
      }
    } finally {
      uploadAbortRef.current = null;
      setUploadingVideoKey(null);
    }
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
          duration_seconds: form.duration_seconds !== ''
            ? Number(form.duration_seconds)
            : null,
          position: module.lectures?.length || 0,
          is_trial: Boolean(form.is_trial),
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
      duration_seconds: lecture.duration_seconds
        ?? (lecture.duration_minutes != null ? lecture.duration_minutes * 60 : ''),
      is_trial: Boolean(lecture.is_trial),
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
          duration_seconds: editLectureForm.duration_seconds !== ''
            ? Number(editLectureForm.duration_seconds)
            : null,
          is_trial: Boolean(editLectureForm.is_trial),
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
                                    Duration (seconds)
                                    <input
                                      type="number"
                                      min="0"
                                      value={editLectureForm.duration_seconds}
                                      onChange={(event) =>
                                        setEditLectureForm((current) => ({
                                          ...current,
                                          duration_seconds: event.target.value,
                                        }))
                                      }
                                    />
                                    <small>
                                      {formatDuration(Number(editLectureForm.duration_seconds))}
                                    </small>
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

                                <label className="manage-course-content-upload-field">
                                  Or upload a video file directly to Cloudinary
                                  <input
                                    type="file"
                                    accept="video/*"
                                    disabled={uploadingVideoKey === `edit-${lecture.id}`}
                                    onChange={(event) => {
                                      const file = event.target.files?.[0];
                                      if (!file) return;
                                      uploadVideo(
                                        file,
                                        `edit-${lecture.id}`,
                                        ({ secureUrl, durationSeconds }) =>
                                          setEditLectureForm((current) => ({
                                            ...current,
                                            video_url: secureUrl,
                                            ...(durationSeconds !== null && {
                                              duration_seconds: durationSeconds,
                                            }),
                                          }))
                                      );
                                      event.target.value = '';
                                    }}
                                  />
                                  {uploadingVideoKey === `edit-${lecture.id}` && (
                                    <div className="manage-course-content-upload-progress-row">
                                      <span className="manage-course-content-upload-progress">
                                        Uploading... {uploadProgress}%
                                      </span>
                                      <button
                                        type="button"
                                        className="manage-course-content-cancel-upload-btn"
                                        onClick={cancelUpload}
                                      >
                                        Cancel Upload
                                      </button>
                                    </div>
                                  )}
                                </label>

                                <VideoPreview
                                  url={editLectureForm.video_url}
                                  onDurationDetected={(durationSeconds) =>
                                    setEditLectureForm((current) => ({
                                      ...current,
                                      duration_seconds: durationSeconds,
                                    }))
                                  }
                                />

                                <label className="manage-course-content-trial-checkbox-field">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(editLectureForm.is_trial)}
                                    onChange={(event) =>
                                      setEditLectureForm((current) => ({
                                        ...current,
                                        is_trial: event.target.checked,
                                      }))
                                    }
                                  />
                                  <span>
                                    🎓 Allow Free Trial Class Preview (prospective students can watch this lecture without enrolling)
                                  </span>
                                </label>

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
                                  <div className="manage-course-content-lecture-title-row">
                                    <strong>{lecture.title}</strong>
                                    {lecture.is_trial && (
                                      <span className="manage-course-content-trial-badge">
                                        🎓 Free Trial Preview
                                      </span>
                                    )}
                                  </div>

                                  <span>
                                    {lecture.duration_seconds != null
                                      ? formatDuration(lecture.duration_seconds)
                                      : lecture.duration_minutes != null
                                        ? formatDuration(lecture.duration_minutes * 60)
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
                          Duration (seconds)
                          <input
                            type="number"
                            min="0"
                            value={getLectureForm(module.id).duration_seconds}
                            onChange={(event) =>
                              updateNewLecture(
                                module.id,
                                'duration_seconds',
                                event.target.value
                              )
                            }
                            placeholder="e.g. 300"
                          />
                          <small>
                            {formatDuration(Number(getLectureForm(module.id).duration_seconds))}
                          </small>
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

                      <label className="manage-course-content-upload-field">
                        Or upload a video file directly to Cloudinary
                        <input
                          type="file"
                          accept="video/*"
                          disabled={uploadingVideoKey === `new-${module.id}`}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            uploadVideo(
                              file,
                              `new-${module.id}`,
                              ({ secureUrl, durationSeconds }) => {
                                setLectureForms((current) => ({
                                  ...current,
                                  [module.id]: {
                                    ...(current[module.id] || emptyLecture),
                                    video_url: secureUrl,
                                    ...(durationSeconds !== null && {
                                      duration_seconds: durationSeconds,
                                    }),
                                  },
                                }));
                            }
                            );
                            event.target.value = '';
                          }}
                        />
                        {uploadingVideoKey === `new-${module.id}` && (
                          <div className="manage-course-content-upload-progress-row">
                            <span className="manage-course-content-upload-progress">
                              Uploading... {uploadProgress}%
                            </span>
                            <button
                              type="button"
                              className="manage-course-content-cancel-upload-btn"
                              onClick={cancelUpload}
                            >
                              Cancel Upload
                            </button>
                          </div>
                        )}
                      </label>

                      <VideoPreview
                        url={getLectureForm(module.id).video_url}
                      />

                      <label className="manage-course-content-trial-checkbox-field">
                        <input
                          type="checkbox"
                          checked={Boolean(getLectureForm(module.id).is_trial)}
                          onChange={(event) =>
                            setLectureForms((current) => ({
                              ...current,
                              [module.id]: {
                                ...(current[module.id] || emptyLecture),
                                is_trial: event.target.checked,
                              },
                            }))
                          }
                        />
                        <span>
                          🎓 Allow Free Trial Class Preview (prospective students can watch this lecture without enrolling)
                        </span>
                      </label>

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
