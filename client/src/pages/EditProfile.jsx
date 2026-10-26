// src/pages/EditProfile.jsx
// Profile management page for both students and instructors.
// Allows editing personal details, uploading profile pictures via Cloudinary,
// updating instructor geolocation and bio, and securely changing passwords.

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import StudentNav from '../components/StudentNav';
import InstructorNav from '../components/InstructorNav';
import Footer from '../components/Footer';
import { API_BASE } from '../api';
import { uploadProfileImage } from '../api/cloudinary';
import './EditProfile.css';

export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Authentication state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const token = localStorage.getItem('token');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Guard: unauthenticated visitors are redirected to /login
  useEffect(() => {
    if (!token || !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [token, currentUser, navigate]);

  // Fetch initial profile data from backend
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to load profile details.');
        }

        const data = await res.json();
        if (isMounted) {
          setName(data.name || '');
          setEmail(data.email || '');
          setAvatarUrl(data.avatar_url || '');
          setBio(data.bio || '');
          setPhone(data.phone || '');
          setCity(data.city || '');
          setLatitude(data.latitude !== null && data.latitude !== undefined ? String(data.latitude) : '');
          setLongitude(data.longitude !== null && data.longitude !== undefined ? String(data.longitude) : '');
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to connect to the server.');
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Handle Cloudinary Image Upload
  async function handleImageFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setMessage(null);

    // Validate type and size
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP, or GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB in size.');
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(10);

      const result = await uploadProfileImage(file, (progress) => {
        setUploadProgress(progress);
      });

      setAvatarUrl(result.secureUrl);
      setMessage('Profile photo uploaded to Cloudinary! Click "Save Changes" to apply.');
    } catch (err) {
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // Handle Geolocation capture for instructors
  function handleLocateMe() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setLocating(false);
        setMessage(`Coordinates captured: ${lat}, ${lng}! Remember to save changes.`);
      },
      (err) => {
        setLocating(false);
        let msg = 'Could not get your location.';
        if (err.code === 1) msg = 'Location access was denied in your browser settings.';
        else if (err.code === 2) msg = 'Location is unavailable. Check your network or GPS.';
        setError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!name.trim()) {
      setError('Full name cannot be empty.');
      return;
    }

    // Password validation if updating password
    if (newPassword) {
      if (!currentPassword) {
        setError('Please enter your current password to set a new password.');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirm password do not match.');
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        avatar_url: avatarUrl || null,
      };

      if (currentUser?.role === 'instructor') {
        payload.bio = bio;
        payload.phone = phone;
        payload.city = city;
        payload.latitude = latitude !== '' ? parseFloat(latitude) : null;
        payload.longitude = longitude !== '' ? parseFloat(longitude) : null;
      }

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch(`${API_BASE}/api/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      // Update stored user in localStorage
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        window.dispatchEvent(new Event('auth-change'));
      }

      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  }

  const isInstructor = currentUser?.role === 'instructor';
  const initial = name?.charAt(0).toUpperCase() || currentUser?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <div className={`edit-profile-page ${isInstructor ? 'theme-instructor' : 'theme-student'}`}>
      {isInstructor ? <InstructorNav user={currentUser} /> : <StudentNav user={currentUser} />}

      <main className="edit-profile-container">
        {/* Breadcrumb Navigation */}
        <div className="edit-profile-breadcrumb">
          <Link to={isInstructor ? '/instructor-dashboard' : '/student-landing'}>
            {isInstructor ? 'Dashboard' : 'Home'}
          </Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Edit Profile</span>
        </div>

        {/* Page Header */}
        <div className="edit-profile-header">
          <div>
            <h1 className="edit-profile-title">Account Settings</h1>
            <p className="edit-profile-subtitle">
              Manage your profile details, avatar, security, and teaching credentials.
            </p>
          </div>
          <div className="edit-profile-badge">
            {isInstructor ? '👨‍🏫 Verified Instructor' : '🎓 Student Account'}
          </div>
        </div>

        {/* Global Notifications */}
        {message && (
          <div className="profile-alert profile-alert--success">
            <span className="profile-alert-icon">✓</span>
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="profile-alert profile-alert--error">
            <span className="profile-alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="edit-profile-loading">
            <div className="profile-spinner" />
            <p>Loading your profile details...</p>
          </div>
        ) : (
          <form className="edit-profile-form" onSubmit={handleSubmit}>
            {/* Section 1: Avatar / Photo Management */}
            <div className="profile-card profile-avatar-card">
              <h2 className="profile-card-title">Profile Photo</h2>
              <p className="profile-card-desc">
                This image will appear on your profile, course cards, and reviews.
              </p>

              <div className="avatar-upload-row">
                <div className="avatar-preview-wrapper">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="avatar-preview-img" />
                  ) : (
                    <div className="avatar-preview-placeholder">{initial}</div>
                  )}

                  {uploadingImage && (
                    <div className="avatar-uploading-overlay">
                      <div className="avatar-progress-text">{uploadProgress}%</div>
                    </div>
                  )}
                </div>

                <div className="avatar-actions-wrap">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageFileSelected}
                  />

                  <div className="avatar-buttons">
                    <button
                      type="button"
                      className="btn-upload-photo"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage || saving}
                    >
                      {uploadingImage ? 'Uploading to Cloudinary...' : '📷 Change Photo'}
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={() => {
                          setAvatarUrl('');
                          setMessage('Photo removed. Click "Save Changes" to save.');
                        }}
                        disabled={uploadingImage || saving}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {uploadingImage && (
                    <div className="avatar-progress-bar-track">
                      <div
                        className="avatar-progress-bar-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  <span className="avatar-guidance">
                    JPG, PNG, WEBP or GIF. Max size 5 MB. Direct Cloudinary upload.
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Personal Information */}
            <div className="profile-card">
              <h2 className="profile-card-title">Personal Information</h2>
              <div className="profile-grid">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-input form-input--disabled"
                    value={email}
                    disabled
                    title="Account email address cannot be changed."
                  />
                  <span className="form-help-text">
                    🔒 Primary account identifier used for authentication.
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Instructor Details (Conditionally Rendered) */}
            {isInstructor && (
              <div className="profile-card instructor-details-card">
                <div className="card-badge-row">
                  <h2 className="profile-card-title">Instructor Credentials & Location</h2>
                  <span className="instructor-pill">Nearby Map Directory</span>
                </div>
                <p className="profile-card-desc">
                  Students discover your courses and offline doubt sessions using this information.
                </p>

                <div className="form-group">
                  <label htmlFor="bio" className="form-label">
                    Professional Headline & Bio
                  </label>
                  <textarea
                    id="bio"
                    rows="3"
                    className="form-textarea"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell students about your teaching experience, industry background, and skills..."
                  />
                </div>

                <div className="profile-grid">
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="city" className="form-label">
                      City / Operational Base
                    </label>
                    <input
                      id="city"
                      type="text"
                      className="form-input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Indore, Madhya Pradesh"
                    />
                  </div>
                </div>

                {/* Geolocation Section */}
                <div className="geo-group-card">
                  <div className="geo-header">
                    <div>
                      <h3 className="geo-title">Map Pin & Coordinates</h3>
                      <p className="geo-desc">
                        Exact GPS coordinates power the Nearby Instructors map so local students can find you.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn-locate-me"
                      onClick={handleLocateMe}
                      disabled={locating}
                    >
                      {locating ? '📍 Pinpointing GPS...' : '📍 Auto-Locate Me'}
                    </button>
                  </div>

                  <div className="profile-grid profile-grid--coords">
                    <div className="form-group">
                      <label htmlFor="latitude" className="form-label">
                        Latitude
                      </label>
                      <input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        className="form-input"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="e.g. 22.719600"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="longitude" className="form-label">
                        Longitude
                      </label>
                      <input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        className="form-input"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="e.g. 75.857700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Security & Password Management */}
            <div className="profile-card">
              <h2 className="profile-card-title">Security & Password</h2>
              <p className="profile-card-desc">
                Leave these fields empty if you do not want to change your password.
              </p>

              <div className="form-group">
                <label htmlFor="currentPassword" className="form-label">
                  Current Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password to authorize changes"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="btn-toggle-pw"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="profile-grid">
                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="btn-toggle-pw"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Save & Action Bar */}
            <div className="profile-actions-bar">
              <button
                type="button"
                className="btn-profile-cancel"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-profile-save"
                disabled={saving || uploadingImage}
              >
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
