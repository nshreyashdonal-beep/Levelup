// src/pages/Login.jsx
// A simple login form. On success, saves the token to localStorage and
// sends the user to the homepage.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../api.js';
import '../styles/forms.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); // stops the browser from doing a full page reload on submit
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // The server sent back an error message (e.g. "Invalid email or password")
        setError(data.error);
        return;
      }

      // Save the token so future requests can prove who's logged in.
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/'); // send them to the homepage now that they're logged in
    } catch (err) {
      setError('Could not reach the server. Is it running?');
    }
  }

  return (
    <div className="page">
      <h1>Log In</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit">Log In</button>
      </form>

      <p>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;
