// Shared validation for lecture media fields used by create and edit routes.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function validateLectureMedia(fields) {
  const { content, video_url, duration_minutes, duration_seconds } = fields;

  if (content !== undefined && content !== null && typeof content !== 'string') {
    return 'content must be text';
  }

  if (video_url !== undefined && video_url !== null) {
    if (typeof video_url !== 'string' || video_url.trim() === '') {
      return 'video_url must be a non-empty URL';
    }

    try {
      const parsedUrl = new URL(video_url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return 'video_url must use http or https';
      }
    } catch {
      return 'video_url must be a valid URL';
    }
  }

  if (duration_minutes !== undefined && duration_minutes !== null) {
    const duration = Number(duration_minutes);
    if (!Number.isInteger(duration) || duration < 0) {
      return 'duration_minutes must be a non-negative integer';
    }
  }

  if (duration_seconds !== undefined && duration_seconds !== null) {
    const duration = Number(duration_seconds);
    if (!Number.isInteger(duration) || duration < 0) {
      return 'duration_seconds must be a non-negative integer';
    }
  }

  return null;
}

module.exports = { isUuid, validateLectureMedia };
