// src/pages/Signup.jsx
// Converted from the src.rar mockup: two-column card (form + info panel).
// Styling lives in Signup.css (colocated), same pattern as Login.
//
// Two differences from the mockup, both because our real backend is
// different from the mockup's imagined one:
//   1. Dropped the "Location" field — the users table has no location
//      column (geolocation is being built last, see PROGRESS.md).
//   2. This public signup is student-only. Instructors use the separate
//      Become Instructor page, so registration always sends role: "student".

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE } from '../api.js';
import './Signup.css';

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
        body: JSON.stringify({ ...formData, role: 'student' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed. Please try again.');
        return;
      }

      // Registration doesn't log you in automatically (no token comes
      // back from /register) — send them to login to sign in next.
      navigate('/login');
    } catch (err) {
      setError('Could not reach the server. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-page-wrap">
      <Navbar />

      <main className="signup-main">
        <div className="signup-card">
          {/* Left — Form */}
          <div className="signup-form-side">
            <h2 className="signup-title">Create Student Account</h2>
            <p className="signup-subtitle">Join LevelUp and find instructors near you.</p>

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

              <label className="signup-label">Email</label>
              <input
                name="email"
                type="email"
                placeholder="Enter email"
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

              <button type="submit" disabled={loading} className="signup-submit-btn">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="signup-footer-text">
                Already have an account? <Link to="/login" className="signup-link">Login</Link>
              </p>
            </form>
          </div>

          {/* Right — Info panel */}
          <div className="signup-info-side">
            <h3 className="signup-info-title">Why Join LevelUp?</h3>
            {['Find instructors near you', 'Hybrid + online learning', 'Track your progress'].map((item) => (
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
