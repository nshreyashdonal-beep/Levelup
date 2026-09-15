// src/pages/BecomeInstructor.jsx
// Instructor signup — separate page from the student Signup page, on
// purpose. There's no role toggle here at all: this form always sends
// role: "instructor". A teacher lands here from the Navbar's
// "Become Instructor" link or the "For Teachers" card on Home, not by
// picking a toggle on the student form.
//
// Fields are trimmed down to what the real `users` table actually has
// (name, email, password) — the earlier draft of this page posted
// bio/phone/location to a /api/instructors/signup route that doesn't
// exist in our backend. Those fields can come back later as a real
// `instructor_profile` piece (see PROGRESS.md) once that table exists.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE } from '../api.js';
import './Signup.css';
import './BecomeInstructor.css';

export default function BecomeInstructor() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', bio: '', phone: '', location: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'instructor' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      // Same pattern as Signup: /register doesn't return a token,
      // so send them to login to sign in next.
      navigate('/login');
    } catch (err) {
      setError('Could not reach the server. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-page-wrap instructor-theme">
      <Navbar />

      <main className="signup-main">
        <div className="signup-card">
          {/* Left — Form */}
          <div className="signup-form-side">
            <h2 className="signup-title">Become an Instructor</h2>
            <p className="signup-subtitle">Create your instructor account and teach independently.</p>

            {error && <div className="signup-error">{error}</div>}

            <form onSubmit={handleSubmit} className="signup-form">
              <label className="signup-label">Full Name</label>
              <input
                name="name"
                type="text"
                placeholder="Enter full name"
                required
                value={formData.name}
                onChange={handleChange}
                className="signup-input"
              />

              <label className="signup-label">Work Email</label>
              <input
                name="email"
                type="email"
                placeholder="Enter work email"
                required
                value={formData.email}
                onChange={handleChange}
                className="signup-input"
              />

              <label className="signup-label">Password</label>
              <div className="signup-password-row">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="signup-input signup-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="signup-show-btn"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <label className="signup-label">Short Bio</label>
              <textarea
                name="bio"
                placeholder="Tell students about yourself"
                required
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                className="signup-input"
              />

              <label className="signup-label">Phone Number</label>
              <input
                name="phone"
                type="text"
                placeholder="Enter phone number"
                required
                value={formData.phone}
                onChange={handleChange}
                className="signup-input"
              />

              <label className="signup-label">Location</label>
              <input
                name="location"
                type="text"
                placeholder="Enter current location"
                required
                value={formData.location}
                onChange={handleChange}
                className="signup-input"
              />

              <button type="submit" disabled={loading} className="signup-submit-btn">
                {loading ? 'Creating account...' : 'Become Instructor'}
              </button>

              <p className="signup-footer-text">
                Already have an account? <Link to="/login" className="signup-link">Login</Link>
              </p>
              <p className="signup-footer-text">
                Here to learn instead? <Link to="/signup" className="signup-link">Sign up as a Student</Link>
              </p>
            </form>
          </div>

          {/* Right — Info panel */}
          <div className="signup-info-side">
            <h3 className="signup-info-title">Teach as a Mini Institute</h3>
            {['Create online or hybrid courses', 'Connect with nearby students', 'Earn independently'].map((item) => (
              <div key={item} className="signup-info-item">
                {item}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
