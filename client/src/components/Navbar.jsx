// src/components/Navbar.jsx
// Site header shown on every page: logo, center nav links + search,
// and login/signup buttons. Styling lives in Navbar.css (colocated).

import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <header className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo">
        <div className="navbar-logo-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z"
              fill="white" stroke="white" strokeWidth="1.2"
              strokeLinejoin="round" strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="navbar-logo-text">Level Up</span>
      </Link>

      {/* Center nav */}
      <nav className="navbar-center">
        <a href="#" className="navbar-link">Subscribe</a>
        <input
          type="text"
          placeholder="Search..."
          className="navbar-search"
        />
        <Link to="/become-instructor" className="navbar-link">
          Become Instructor
        </Link>
      </nav>

      {/* Auth buttons */}
      <div className="navbar-auth">
        <Link to="/login" className="btn btn-outline">
          Login
        </Link>
        <Link to="/signup" className="btn btn-solid">
          Signup
        </Link>
      </div>
    </header>
  )
}
