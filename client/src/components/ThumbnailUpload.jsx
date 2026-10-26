import React, { useState, useRef } from 'react';
import { uploadCourseThumbnail } from '../api/cloudinary';
import './ThumbnailUpload.css';

export default function ThumbnailUpload({
  value = '',
  onChange = () => {},
  label = 'Course Thumbnail',
  disabled = false,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || disabled) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP, or GIF).');
      return;
    }

    const maxSizeBytes = 8 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError('Thumbnail image must be smaller than 8 MB.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);

    try {
      const result = await uploadCourseThumbnail(
        file,
        (pct) => setProgress(pct),
        abortRef
      );

      if (result?.secureUrl) {
        onChange(result.secureUrl);
      }
    } catch (err) {
      if (!err?.isCancelled) {
        setError(err.message || 'Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current();
    }
    setIsUploading(false);
    setProgress(0);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange('');
    setError(null);
  };

  const triggerBrowse = () => {
    if (fileInputRef.current && !disabled && !isUploading) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="thumbnail-upload-container">
      <div className="thumbnail-upload-header">
        <label className="thumbnail-upload-label">{label}</label>
        <span className="thumbnail-upload-hint">16:9 aspect ratio recommended</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        style={{ display: 'none' }}
        onChange={onFileChange}
        disabled={disabled || isUploading}
      />

      <div
        className={`thumbnail-preview-frame ${value ? 'has-image' : ''} ${
          isDragging ? 'is-dragging' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Course thumbnail preview"
              className="thumbnail-preview-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                setError('Failed to load image from URL.');
              }}
            />
            {!isUploading && !disabled && (
              <div className="thumbnail-overlay-actions">
                <button
                  type="button"
                  className="thumbnail-btn thumbnail-btn-replace"
                  onClick={triggerBrowse}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Replace Image
                </button>
                <button
                  type="button"
                  className="thumbnail-btn thumbnail-btn-remove"
                  onClick={handleRemove}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Remove
                </button>
              </div>
            )}
          </>
        ) : (
          !isUploading && (
            <button
              type="button"
              className="thumbnail-dropzone"
              onClick={triggerBrowse}
              disabled={disabled}
            >
              <svg
                className="thumbnail-dropzone-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="thumbnail-dropzone-title">
                <span>Click to browse</span> or drag and drop image
              </p>
              <p className="thumbnail-dropzone-sub">PNG, JPG, or WEBP up to 8MB</p>
            </button>
          )
        )}

        {isUploading && (
          <div className="thumbnail-progress-overlay">
            <div className="thumbnail-progress-info">
              <span>Uploading to Cloudinary...</span>
              <span>{progress}%</span>
            </div>
            <div className="thumbnail-progress-bar-bg">
              <div
                className="thumbnail-progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <button
              type="button"
              className="thumbnail-btn-cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="thumbnail-upload-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="thumbnail-url-toggle-row">
        <button
          type="button"
          className="thumbnail-url-toggle-btn"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          {showUrlInput ? 'Hide manual URL input' : 'Or paste an image URL manually'}
        </button>
      </div>

      {showUrlInput && (
        <input
          type="url"
          className="thumbnail-url-input"
          placeholder="https://example.com/image.jpg"
          value={value}
          onChange={(e) => {
            setError(null);
            onChange(e.target.value);
          }}
          disabled={disabled || isUploading}
        />
      )}
    </div>
  );
}
