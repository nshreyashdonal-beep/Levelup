// src/components/Navbar.jsx
// Site header shown on every page: logo, center nav links + search,
// and login/signup buttons. Styling lives in Navbar.css (colocated).

import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo.jsx'
import './Navbar.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <BrandLogo />
        </Link>

        <button
          type="button"
          className="navbar-menu-button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((wasOpen) => !wasOpen)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`navbar-content ${menuOpen ? 'navbar-content-open' : ''}`}>
          <nav className="navbar-center" aria-label="Main navigation">
            <a href="#" className="navbar-link" onClick={closeMenu}>
              Subscribe
            </a>
            <Link to="/#explore-courses" className="navbar-link" onClick={closeMenu}>
              Explore
            </Link>
            <Link to="/become-instructor" className="navbar-link" onClick={closeMenu}>
              Become Instructor
            </Link>
          </nav>

          <div className="navbar-search-wrap">
            <svg className="navbar-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search courses..."
              aria-label="Search courses"
              className="navbar-search"
            />
          </div>

          <div className="navbar-auth">
            <Link to="/login" className="btn btn-outline" onClick={closeMenu}>
              Log in
            </Link>
            <Link to="/signup" className="btn btn-solid" onClick={closeMenu}>
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
