// src/pages/Login.jsx
// Converted from the src.rar mockup: two-column card (form + info panel).
// Styling lives in Login.css (colocated), same pattern as Home/Navbar/Footer.
//
// Note: the mockup had a student/instructor toggle that picked a different
// login endpoint (/api/students/login vs /api/instructors/login). Our real
// backend only has ONE login endpoint (/api/auth/login) that already
// figures out the role from the users table and sends it back — so a
// toggle here wouldn't change the request at all. Left it out rather than
// keep a control that does nothing.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE } from '../api.js';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        return;
      }

      // Save the token so future requests can prove who's logged in.
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Send students to their dashboard now that it exists. Instructors
      // still go home for now — no instructor dashboard yet (next piece
      // in PROGRESS.md's dashboards branch).
      navigate(data.user.role === 'student' ? '/student-dashboard' : '/');
    } catch (err) {
      setError('Could not reach the server. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page-wrap">
      <Navbar />

      <main className="login-main">
        <div className="login-card">
          {/* Left — Form */}
          <div className="login-form-side">
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">
              Login to continue learning with nearby instructors.
            </p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <label className="login-label">Email</label>
              <input
                name="email"
                type="email"
                placeholder="Enter email"
                required
                value={formData.email}
                onChange={handleChange}
                className="login-input"
              />

              <label className="login-label">Password</label>
              <div className="login-password-row">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="login-input login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-show-btn"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <button type="submit" disabled={loading} className="login-submit-btn">
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <p className="login-footer-text">
                New here? <Link to="/signup" className="login-link">Create account</Link>
              </p>
            </form>
          </div>

          {/* Right — Info panel */}
          <div className="login-info-side">
            <h3 className="login-info-title">Learn Hybrid. Learn Local.</h3>
            {['Find instructors near you', 'Join online + offline learning', 'Track your progress'].map((item) => (
              <div key={item} className="login-info-item">
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
