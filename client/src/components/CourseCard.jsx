import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import './CourseCard.css';

/**
 * CourseCard - Modern professional course card (Udemy / Coursera reference style)
 * Features:
 * - 16:9 Thumbnail banner with lazy loading, gradient fallback, and top-left 'NEW' overlay badge
 * - Full multi-line course title with zero truncation
 * - Dedicated clickable instructor profile row with circular avatar & location
 * - Typographic metadata line: Level • Delivery Mode • Language (e.g. Beginner • Hybrid • English)
 * - Enterprise star rating row (4.8 ★ (14) or 4.8 ★ (from previous course))
 * - Pinned bottom footer with formatted Price (₹) and high-visibility Enroll CTA
 */
export default function CourseCard({
  course,
  hideInstructor = false,
  onEnrollClick,
  userLocation = null,
  distanceKm: distanceKmOverride = null,
  enrolled = false,
  progressPercent = 0,
}) {
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);

  if (!course) return null;

  const handleCardClick = () => {
    navigate(
      enrolled
        ? `/courses/${course.id}?from=mycourses&tab=classroom`
        : `/courses/${course.id}`
    );
  };

  const handleInstructorClick = (e) => {
    e.stopPropagation();
    if (course.instructor_id) {
      navigate(`/instructors/${course.instructor_id}`);
    }
  };

  const handleEnrollClick = (e) => {
    e.stopPropagation();
    if (onEnrollClick) {
      onEnrollClick(course);
    } else {
      navigate(`/courses/${course.id}`);
    }
  };

  const clampedProgress = Math.min(100, Math.max(0, Number(progressPercent) || 0));

  const rawThumbnailUrl =
    course.thumbnail_url || course.thumbnailUrl || course.thumbnail || '';
  const thumbnailUrl = String(rawThumbnailUrl).trim();
  const thumbnailSrc =
    thumbnailUrl.startsWith('/') && !thumbnailUrl.startsWith('//')
      ? `${API_BASE}${thumbnailUrl}`
      : thumbnailUrl;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  // Date-based "New Course" logic (published within the last 30 days)
  const isDateNew =
    course.is_new !== undefined
      ? Boolean(course.is_new)
      : course.created_at
      ? new Date() - new Date(course.created_at) <= 30 * 24 * 60 * 60 * 1000
      : false;

  const badgeText = isDateNew
    ? Number(course.instructor_total_reviews) > 0
      ? 'New Release'
      : 'New'
    : null;

  // Clean delivery mode label (no emojis)
  const deliveryMode = (course.delivery_mode || 'online').toLowerCase();
  const modeLabel =
    deliveryMode === 'offline'
      ? 'Offline'
      : deliveryMode === 'hybrid'
      ? 'Hybrid'
      : 'Online';

  // Level label
  const levelLabel = course.level
    ? course.level.charAt(0).toUpperCase() + course.level.slice(1)
    : null;

  // Language label
  const languageLabel = course.language || null;

  // Typographic metadata array
  const metaItems = [levelLabel, modeLabel, languageLabel].filter(Boolean);
  // Distance calculation & location awareness
  const hasUserLocation = Boolean(
    userLocation &&
      Number.isFinite(Number(userLocation.latitude)) &&
      Number.isFinite(Number(userLocation.longitude))
  );

  const rawDistance =
    distanceKmOverride !== null && distanceKmOverride !== undefined
      ? Number(distanceKmOverride)
      : course.distance_km !== null && course.distance_km !== undefined
      ? Number(course.distance_km)
      : course.distanceKm !== null && course.distanceKm !== undefined
      ? Number(course.distanceKm)
      : null;

  const calculatedDistanceKm =
    hasUserLocation &&
    Number.isFinite(Number(course.instructor_latitude)) &&
    Number.isFinite(Number(course.instructor_longitude))
      ? (() => {
          const toRadians = (value) => (value * Math.PI) / 180;
          const latitudeDelta = toRadians(
            Number(course.instructor_latitude) - Number(userLocation.latitude)
          );
          const longitudeDelta = toRadians(
            Number(course.instructor_longitude) - Number(userLocation.longitude)
          );
          const latitudeOne = toRadians(Number(userLocation.latitude));
          const latitudeTwo = toRadians(Number(course.instructor_latitude));
          const haversine =
            Math.sin(latitudeDelta / 2) ** 2 +
            Math.cos(latitudeOne) *
              Math.cos(latitudeTwo) *
              Math.sin(longitudeDelta / 2) ** 2;
          return 6371 * 2 * Math.asin(Math.sqrt(haversine));
        })()
      : null;

  const resolvedDistanceKm =
    rawDistance !== null && Number.isFinite(rawDistance)
      ? rawDistance
      : calculatedDistanceKm;

  const hasDistance =
    (hasUserLocation || rawDistance !== null) &&
    resolvedDistanceKm !== null &&
    Number.isFinite(resolvedDistanceKm) &&
    resolvedDistanceKm >= 0;

  // Format price
  const formattedPrice =
    course.price !== undefined && course.price !== null
      ? `₹${Number(course.price).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : 'Free';

  return (
    <article
      className="course-card"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View course: ${course.title}`}
    >
      {/* 1. 16:9 Thumbnail Banner with Overlay Badge */}
      <div className="course-card-thumb-wrapper">
        {badgeText && (
          <span className="course-card-thumb-badge">{badgeText}</span>
        )}

        {!thumbnailSrc || imgFailed ? (
          <div className="course-card-thumb-fallback">
            <span className="course-card-fallback-icon" aria-hidden="true">LEVELUP</span>
            <span className="course-card-fallback-category">
              {course.category_name ||
                course.root_category_name ||
                course.subcategory_name ||
                'LevelUp Academy'}
            </span>
          </div>
        ) : (
          <img
            src={thumbnailSrc}
            alt={course.title}
            className="course-card-thumb-img"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>

      {/* 2. Card Content Area */}
      <div className="course-card-body">
        {/* Course Title (Completely visible, multi-line) */}
        <h3 className="course-card-title">{course.title}</h3>

        {/* Dedicated Instructor Row */}
        {!hideInstructor && (
          <div
            className="course-card-instructor"
            onClick={handleInstructorClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleInstructorClick(e);
              }
            }}
            title={`View ${course.instructor_name || 'Instructor'}'s profile`}
          >
            <div className="course-card-instructor-avatar">
              {course.instructor_avatar_url ? (
                <img
                  src={course.instructor_avatar_url}
                  alt={course.instructor_name || 'Instructor'}
                  className="course-card-instructor-img"
                />
              ) : (
                <div className="course-card-instructor-initials">
                  {(course.instructor_name || 'I').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="course-card-instructor-meta">
              <span className="course-card-instructor-name">
                {course.instructor_name || 'LevelUp Instructor'}
              </span>
              {course.instructor_city && (
                <span className="course-card-instructor-city">
                  📍 {course.instructor_city}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Distance Badge (Visible when user clicks 'Use my location') */}
        {hasDistance && (
          <div className="course-card-distance-pill">
            <span>From you</span>
            <strong>
              {resolvedDistanceKm < 1 ? '< 1 km' : `${resolvedDistanceKm.toFixed(1)} km`}
            </strong>
          </div>
        )}

        {/* Typographic Metadata Line: Level • Delivery Mode • Language */}
        {metaItems.length > 0 && (
          <div className="course-card-meta-line">
            {metaItems.map((item, idx) => (
              <React.Fragment key={item}>
                {idx > 0 && <span className="course-card-meta-dot">•</span>}
                <span className="course-card-meta-item">{item}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Professional Star Rating Row */}
        {course.rating_source === 'previous_course' ? (
          <div
            className="course-card-rating-row"
            title="Rating from previous course edition"
          >
            <span className="rating-score">
              {Number(course.avg_rating).toFixed(1)}
            </span>
            <span className="rating-star">★</span>
            <span className="rating-meta">
              ({course.review_count} • from previous course)
            </span>
          </div>
        ) : course.rating_source === 'direct' && Number(course.avg_rating) > 0 ? (
          <div
            className="course-card-rating-row"
            title={`${course.review_count || 0} student reviews`}
          >
            <span className="rating-score">
              {Number(course.avg_rating).toFixed(1)}
            </span>
            <span className="rating-star">★</span>
            <span className="rating-meta">({course.review_count})</span>
          </div>
        ) : Number(course.instructor_total_reviews) > 0 ? (
          <div
            className="course-card-rating-row is-instructor"
            title={`Instructor has ${course.instructor_total_reviews} reviews across all courses`}
          >
            <span className="rating-score">
              {Number(course.instructor_avg_rating).toFixed(1)}
            </span>
            <span className="rating-star">★</span>
            <span className="rating-meta">(Instructor)</span>
          </div>
        ) : (
          <div className="course-card-rating-row is-new" title="Newly launched course">
            <span className="rating-star">★</span>
            <span className="rating-score">New</span>
            <span className="rating-meta">(No reviews yet)</span>
          </div>
        )}
      </div>

      {/* 3. Footer: enrollment progress or purchase action */}
      {enrolled ? (
        <div className="course-card-progress-footer">
          <div className="course-card-progress-heading">
            <span>Course progress</span>
            <strong>{clampedProgress}%</strong>
          </div>
          <div
            className="course-card-progress-track"
            role="progressbar"
            aria-valuenow={clampedProgress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`${clampedProgress}% complete`}
          >
            <span
              className="course-card-progress-fill"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
          <span className="course-card-progress-action">
            {clampedProgress >= 100 ? 'Review course' : 'Continue learning'} <span aria-hidden="true">→</span>
          </span>
        </div>
      ) : (
        <div className="course-card-footer">
          <div className="course-card-price-col">
            <span className="course-card-price">{formattedPrice}</span>
          </div>
          <button
            type="button"
            className="course-card-enroll-btn"
            onClick={handleEnrollClick}
            aria-label={`Enroll in ${course.title}`}
          >
            Enroll
          </button>
        </div>
      )}
    </article>
  );
}
