// src/components/Navbar.jsx
// Public site header: Logo, unified Category Filter + Search, center nav links,
// and login/signup buttons (or user profile menu if already logged in).

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo.jsx'
import NavbarSearchFilter from './NavbarSearchFilter.jsx'
import ProfileMenu from './ProfileMenu.jsx'
import './Navbar.css'

export default function Navbar({
  searchInput,
  onSearchInputChange,
  selectedCategoryId,
  onCategoryChange,
  onSearchSubmit,
  selectedCategoryName,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    function syncUser() {
      try {
        const stored = localStorage.getItem('user')
        setUser(stored ? JSON.parse(stored) : null)
      } catch {
        setUser(null)
      }
    }

    syncUser()

    window.addEventListener('storage', syncUser)
    window.addEventListener('auth-change', syncUser)

    return () => {
      window.removeEventListener('storage', syncUser)
      window.removeEventListener('auth-change', syncUser)
    }
  }, [])

  function closeMenu() {
    setMenuOpen(false)
  }

  const isInstructor = user?.role === 'instructor'
  const homeLink = user
    ? isInstructor
      ? '/instructor-dashboard'
      : '/student-landing'
    : '/'

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to={homeLink} className="navbar-logo" onClick={closeMenu}>
          <BrandLogo variant={isInstructor ? 'instructor' : 'student'} />
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
            {!user && (
              <Link to="/become-instructor" className="navbar-link" onClick={closeMenu}>
                Become Instructor
              </Link>
            )}
            {user && (
              <Link to={homeLink} className="navbar-link" onClick={closeMenu}>
                Dashboard
              </Link>
            )}
          </nav>

          <div className="navbar-search-wrap">
            <NavbarSearchFilter
              searchInput={searchInput}
              onSearchInputChange={onSearchInputChange}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={onCategoryChange}
              onSearchSubmit={onSearchSubmit}
              selectedCategoryName={selectedCategoryName}
              placeholder="Search courses, topics (e.g. Python, React)..."
            />
          </div>

          <div className="navbar-auth">
            {user ? (
              <ProfileMenu user={user} />
            ) : (
              <>
                <Link to="/login" className="btn btn-outline" onClick={closeMenu}>
                  Log in
                </Link>
                <Link to="/signup" className="btn btn-solid" onClick={closeMenu}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
