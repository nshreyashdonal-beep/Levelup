import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import StudentNav from '../components/StudentNav';
import { API_BASE } from '../api';
import './CoursePlayer.css';

function getPreview(url) {
  if (!url?.trim()) return null;

  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      let id = parsed.searchParams.get('v');
      if (!id && parsed.pathname.startsWith('/embed/')) {
        id = parsed.pathname.split('/embed/')[1]?.split('/')[0];
      }
      if (!id && parsed.pathname.startsWith('/shorts/')) {
        id = parsed.pathname.split('/shorts/')[1]?.split('/')[0];
      }
      return id
        ? {
            type: 'youtube',
            id,
            src: `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0`,
          }
        : null;
    }

    if (hostname === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id
        ? {
            type: 'youtube',
            id,
            src: `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0`,
          }
        : null;
    }

    if (hostname === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return /^\d+$/.test(id || '')
        ? { type: 'embed', src: `https://player.vimeo.com/video/${id}` }
        : null;
    }

    const isCloudinary =
      hostname.endsWith('cloudinary.com') && parsed.pathname.includes('/video/upload/');
    const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(parsed.pathname);

    if (isCloudinary) {
      parsed.pathname = parsed.pathname.replace(
        '/video/upload/',
        '/video/upload/vc_h264,ac_aac,f_mp4/'
      );
    }

    return isCloudinary || isDirectVideo ? { type: 'video', src: parsed.toString() } : null;
  } catch {
    return null;
  }
}

function formatDuration(lecture) {
  const seconds =
    lecture.duration_seconds ??
    (lecture.duration_minutes != null ? lecture.duration_minutes * 60 : null);

  if (!Number.isFinite(seconds) || seconds < 0) return 'Lesson';
  if (seconds < 60) return `${seconds} sec`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds ? `${minutes} min ${remainingSeconds} sec` : `${minutes} min`;
}

export default function CoursePlayer() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [activeLectureId, setActiveLectureId] = useState(null);
  const [openModules, setOpenModules] = useState({});
  const [activeTab, setActiveTab] = useState('notes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completionError, setCompletionError] = useState('');
  const [upNext, setUpNext] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [autoplayNext, setAutoplayNext] = useState(false);
  const videoRef = useRef(null);

  // Authenticate student
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : null;

    if (!parsed || parsed.role !== 'student') {
      navigate('/login');
      return;
    }

    setUser(parsed);
  }, [navigate]);

  // Load course curriculum
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/learning/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Could not load the classroom.');
        }
        return data;
      })
      .then((data) => {
        setCourse(data.course);
        setModules(data.modules || []);

        const allLecs = (data.modules || []).flatMap((mod) =>
          (mod.lectures || []).map((lec) => ({ ...lec, moduleId: mod.id }))
        );
        const urlLectureId = searchParams.get('lectureId');
        const matchedLecture = urlLectureId
          ? allLecs.find((l) => l.id === urlLectureId)
          : null;
        const initialLecture = matchedLecture || allLecs[0];

        if (initialLecture) {
          setActiveLectureId(initialLecture.id);
          setOpenModules({ [initialLecture.moduleId]: true });
        }
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [courseId, user]);

  // Sync active lecture with lectureId query param if present
  useEffect(() => {
    const urlLectureId = searchParams.get('lectureId');
    if (urlLectureId && modules.length > 0) {
      const allLecs = modules.flatMap((mod) =>
        (mod.lectures || []).map((lec) => ({ ...lec, moduleId: mod.id }))
      );
      const found = allLecs.find((l) => l.id === urlLectureId);
      if (found) {
        setActiveLectureId(found.id);
        setOpenModules((prev) => ({ ...prev, [found.moduleId]: true }));
      }
    }
  }, [searchParams, modules]);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  const lectures = useMemo(
    () => modules.flatMap((module) => module.lectures || []),
    [modules]
  );
  const activeLecture = lectures.find((lecture) => lecture.id === activeLectureId);
  const activeIndex = lectures.findIndex((lecture) => lecture.id === activeLectureId);
  const preview = getPreview(activeLecture?.video_url);
  const completedCount = lectures.filter((lecture) => lecture.completed).length;
  const completionPercent = lectures.length
    ? Math.round((completedCount / lectures.length) * 100)
    : 0;

  function selectLecture(lecture, moduleId, shouldAutoplay = false) {
    setUpNext(null);
    setCountdown(5);
    setCompletionError('');
    setActiveLectureId(lecture.id);
    setOpenModules((current) => ({ ...current, [moduleId]: true }));
    setActiveTab('notes');
    if (shouldAutoplay) {
      setAutoplayNext(true);
    } else {
      setAutoplayNext(false);
    }
  }

  // Save progress and trigger countdown for next lecture
  async function completeLecture() {
    if (!activeLecture) return;

    const nextLecture = lectures[activeIndex + 1];
    const nextModule = nextLecture
      ? modules.find((module) =>
          module.lectures?.some((lecture) => lecture.id === nextLecture.id)
        )
      : null;

    function triggerUpNext() {
      if (nextLecture && nextModule) {
        setCountdown(5);
        setUpNext({
          lecture: nextLecture,
          moduleId: nextModule.id,
        });
      }
    }

    // If already completed earlier, still queue up the next lecture for seamless viewing/testing
    if (activeLecture.completed) {
      triggerUpNext();
      return;
    }

    const token = localStorage.getItem('token');
    setCompletionError('');

    try {
      const response = await fetch(
        `${API_BASE}/api/learning/lectures/${activeLecture.id}/complete`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not save lecture progress.');
      }

      setModules((currentModules) =>
        currentModules.map((module) => ({
          ...module,
          lectures: module.lectures?.map((lecture) =>
            lecture.id === activeLecture.id
              ? {
                  ...lecture,
                  completed: true,
                  completed_at: data.progress?.completed_at || new Date().toISOString(),
                }
              : lecture
          ),
        }))
      );

      triggerUpNext();
    } catch (requestError) {
      setCompletionError(requestError.message);
      // Still allow progression even if offline or network error
      triggerUpNext();
    }
  }

  // 5-second countdown timer for autoplaying the next video
  useEffect(() => {
    if (!upNext) return undefined;

    if (countdown <= 0) {
      const next = upNext;
      setUpNext(null);
      setCountdown(5);
      selectLecture(next.lecture, next.moduleId, true);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, upNext]);

  // Handle YouTube IFrame Player & State Change Messages
  useEffect(() => {
    if (!activeLecture || preview?.type !== 'youtube') return undefined;

    let player = null;
    let isCancelled = false;

    function initYT() {
      if (isCancelled || !window.YT || !window.YT.Player) return;
      try {
        const frameId = `yt-player-${activeLecture.id}`;
        const frameEl = document.getElementById(frameId);
        if (!frameEl) return;

        player = new window.YT.Player(frameId, {
          events: {
            onReady: (event) => {
              if (autoplayNext) {
                event.target.playVideo();
              }
            },
            onStateChange: (event) => {
              // 0 is YT.PlayerState.ENDED
              if (event.data === 0 && !isCancelled) {
                completeLecture();
              }
            },
          },
        });
      } catch (err) {
        console.warn('YouTube Player init note:', err);
      }
    }

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      const prevHandler = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevHandler === 'function') prevHandler();
        initYT();
      };
    }

    // Direct window postMessage listener for YouTube embed events
    function handleWindowMessage(event) {
      if (!event.data) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (
          (data.event === 'onStateChange' && (data.info === 0 || data.info === '0')) ||
          (data.event === 'infoDelivery' &&
            data.info &&
            (data.info.playerState === 0 || data.info.playerState === '0'))
        ) {
          if (!isCancelled) completeLecture();
        }
      } catch {}
    }

    window.addEventListener('message', handleWindowMessage);

    return () => {
      isCancelled = true;
      window.removeEventListener('message', handleWindowMessage);
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy();
        } catch {}
      }
    };
  }, [activeLecture?.id, preview?.type, autoplayNext]);

  function cancelAutoplay() {
    setUpNext(null);
    setCountdown(5);
    setAutoplayNext(false);
    setCompletionError('');
  }

  function playNextNow() {
    if (!upNext) return;
    const next = upNext;
    setUpNext(null);
    setCountdown(5);
    selectLecture(next.lecture, next.moduleId, true);
  }

  function moveLecture(direction) {
    const nextLecture = lectures[activeIndex + direction];
    if (!nextLecture) return;

    const nextModule = modules.find((module) =>
      module.lectures?.some((lecture) => lecture.id === nextLecture.id)
    );
    selectLecture(nextLecture, nextModule?.id, false);
  }

  if (!user || loading) {
    return (
      <div className="course-player-page">
        <StudentNav user={user} activeLink="mycourse" />
        <main className="course-player-status">Loading your classroom...</main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="course-player-page">
        <StudentNav user={user} activeLink="mycourse" />
        <main className="course-player-status">
          <p>{error || 'Classroom not found.'}</p>
          <button type="button" onClick={() => navigate('/mycourse')}>
            Back to My Courses
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="course-player-page">
      <StudentNav user={user} activeLink="mycourse" />

      <main className="course-player-main">
        <div className="course-player-heading">
          <div className="course-player-top-nav">
            <nav className="course-player-breadcrumb" aria-label="Breadcrumb">
              <Link to="/mycourse" className="breadcrumb-link">My Courses</Link>
              <span className="breadcrumb-separator" aria-hidden="true">›</span>
              <Link
                to={`/courses/${courseId}?from=mycourses&tab=classroom`}
                className="breadcrumb-link"
                title="Return to course overview"
              >
                {course.title}
              </Link>
              <span className="breadcrumb-separator" aria-hidden="true">›</span>
              <span className="breadcrumb-active" aria-current="page">Classroom</span>
            </nav>

            <Link
              to={`/courses/${courseId}?from=mycourses&tab=classroom`}
              className="course-player-back-to-course"
            >
              ← Back to Course Details
            </Link>
          </div>

          <p className="course-player-eyebrow">CLASSROOM</p>
          <h1>{course.title}</h1>
          <p>Continue learning at your own pace.</p>
        </div>

        <div className="course-player-layout">
          <section className="course-player-content">
            <div className="course-player-screen">
              {activeLecture && preview?.type === 'video' && (
                <video
                  key={activeLecture.id}
                  ref={videoRef}
                  controls
                  autoPlay={autoplayNext}
                  preload="auto"
                  playsInline
                  src={preview.src}
                  onCanPlay={(event) => {
                    if (autoplayNext) {
                      const video = event.currentTarget;
                      const playPromise = video.play();
                      if (playPromise !== undefined) {
                        playPromise
                          .then(() => {
                            setAutoplayNext(false);
                            setCompletionError('');
                          })
                          .catch(() => {
                            // Fallback: browser blocked unmuted autoplay, start muted
                            video.muted = true;
                            video.play()
                              .then(() => {
                                setCompletionError('Playing next video muted (browser policy). Click video to unmute.');
                              })
                              .catch(() => {
                                setCompletionError('The next lecture is ready. Press play to start.');
                              })
                              .finally(() => setAutoplayNext(false));
                          });
                      }
                    }
                  }}
                  onLoadedMetadata={(event) => {
                    if (!autoplayNext) {
                      event.currentTarget.muted = false;
                      event.currentTarget.volume = 1;
                    }
                  }}
                  onEnded={completeLecture}
                >
                  Your browser does not support video playback.
                </video>
              )}

              {activeLecture && preview?.type === 'youtube' && (
                <iframe
                  key={activeLecture.id}
                  id={`yt-player-${activeLecture.id}`}
                  src={`${preview.src}${autoplayNext ? '&autoplay=1' : ''}`}
                  title={activeLecture.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={(event) => {
                    try {
                      event.currentTarget.contentWindow.postMessage('{"event":"listening"}', '*');
                    } catch {}
                  }}
                />
              )}

              {activeLecture && preview?.type === 'embed' && (
                <iframe
                  key={activeLecture.id}
                  src={`${preview.src}${autoplayNext ? '?autoplay=1' : ''}`}
                  title={activeLecture.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}

              {activeLecture && !preview && (
                <div className="course-player-text-lesson">
                  <span>TEXT LESSON</span>
                  <h2>{activeLecture.title}</h2>
                  <p>{activeLecture.content || 'This lesson does not have video media.'}</p>
                </div>
              )}

              {!activeLecture && (
                <div className="course-player-text-lesson">
                  <span>CLASSROOM</span>
                  <h2>No lectures available yet</h2>
                  <p>Your instructor has not added a lesson to this course.</p>
                </div>
              )}
            </div>

            {upNext && (
              <div className="course-player-autoplay" role="status">
                <strong>✓ Lecture complete!</strong>
                <span>
                  Up next: {upNext.lecture.title} in {countdown}s...
                </span>
                <div>
                  <button type="button" onClick={playNextNow}>Play Now</button>
                  <button type="button" onClick={cancelAutoplay}>Cancel</button>
                </div>
              </div>
            )}

            {completionError && (
              <p className="course-player-completion-error" role="alert">
                {completionError}
              </p>
            )}

            {activeLecture && (
              <>
                <div className="course-player-lesson-heading">
                  <div>
                    <span>Lecture {activeIndex + 1} of {lectures.length}</span>
                    <h2>{activeLecture.title}</h2>
                  </div>
                  {activeLecture.completed && <strong>✓ Completed</strong>}
                </div>

                <div className="course-player-tabs">
                  <button
                    type="button"
                    className={activeTab === 'notes' ? 'is-active' : ''}
                    onClick={() => setActiveTab('notes')}
                  >
                    Lecture Notes
                  </button>
                  <button
                    type="button"
                    className={activeTab === 'resources' ? 'is-active' : ''}
                    onClick={() => setActiveTab('resources')}
                  >
                    Resources
                  </button>
                </div>

                <div className="course-player-tab-panel">
                  {activeTab === 'notes' ? (
                    <p>{activeLecture.content || 'No lecture notes were added for this lesson.'}</p>
                  ) : (
                    <p>No additional resources have been added for this lesson.</p>
                  )}
                </div>

                <div className="course-player-navigation">
                  <button
                    type="button"
                    onClick={() => moveLecture(-1)}
                    disabled={activeIndex <= 0}
                  >
                    ◄ Previous Lecture
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLecture(1)}
                    disabled={activeIndex === lectures.length - 1}
                  >
                    Next Lecture ►
                  </button>
                </div>
              </>
            )}
          </section>

          <aside className="course-player-sidebar">
            <div className="course-player-sidebar-heading">
              <div>
                <span>COURSE CONTENT</span>
                <h2>Curriculum</h2>
              </div>
              <strong>{completionPercent}%</strong>
            </div>

            <div className="course-player-progress">
              <span style={{ width: `${completionPercent}%` }} />
            </div>

            <div className="course-player-modules">
              {modules.map((module) => {
                const isOpen = openModules[module.id];
                return (
                  <div className="course-player-module" key={module.id}>
                    <button
                      type="button"
                      className="course-player-module-toggle"
                      onClick={() =>
                        setOpenModules((current) => ({
                          ...current,
                          [module.id]: !current[module.id],
                        }))
                      }
                      aria-expanded={isOpen}
                    >
                      <span>
                        <small>MODULE</small>
                        <strong>{module.title}</strong>
                      </span>
                      <b>{isOpen ? '−' : '+'}</b>
                    </button>

                    {isOpen && (
                      <div className="course-player-lecture-list">
                        {module.lectures?.map((lecture) => (
                          <button
                            type="button"
                            key={lecture.id}
                            className={`course-player-lecture ${
                              lecture.id === activeLectureId ? 'is-current' : ''
                            } ${lecture.completed ? 'is-completed' : ''}`}
                            onClick={() => selectLecture(lecture, module.id, false)}
                          >
                            <span className="course-player-lecture-status">
                              {lecture.completed ? '✓' : lecture.id === activeLectureId ? '▶' : '○'}
                            </span>
                            <span>
                              <strong>{lecture.title}</strong>
                              <small>{formatDuration(lecture)}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
