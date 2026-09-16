// src/components/ProfileMenu.jsx
// The dropdown that opens when you click the avatar circle in StudentNav
// or InstructorNav. Before this, the avatar was just a plain div that did
// nothing on click.
//
// Only shows items that actually go somewhere in this app right now:
// a link to Student Dashboard + My Courses (student), or the Instructor
// Dashboard (instructor), and a real Log out. The Udemy screenshot this
// was designed from also has cart/wishlist/payment methods/subscriptions/
// credits/purchase history — none of that exists anywhere in this
// project's schema or plans, so it's left out entirely instead of being
// shown as dead links.

import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ProfileMenu.css';

export default function ProfileMenu({ user }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Clicking anywhere outside the open menu closes it. This listens on
  // the whole document, so it has to check whether the click landed
  // inside our own menuRef box before deciding to close.
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }

  const initial = user?.name?.charAt(0).toUpperCase() || '?';
  const isInstructor = user?.role === 'instructor';

  return (
    <div className="profile-menu" ref={menuRef}>
      <div
        className="profile-menu-avatar"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        {initial}
      </div>

      {open && (
        <div className="profile-menu-dropdown">
          <div className="profile-menu-header">
            <div className="profile-menu-header-avatar">{initial}</div>
            <div>
              <div className="profile-menu-name">{user?.name}</div>
              <div className="profile-menu-email">{user?.email}</div>
            </div>
          </div>

          <div className="profile-menu-section">
            {isInstructor ? (
              <Link
                to="/instructor-dashboard"
                className="profile-menu-link"
                onClick={() => setOpen(false)}
              >
                Instructor Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/student-dashboard"
                  className="profile-menu-link"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/mycourse"
                  className="profile-menu-link"
                  onClick={() => setOpen(false)}
                >
                  My Courses
                </Link>
              </>
            )}
          </div>

          <div className="profile-menu-section">
            <button
              type="button"
              className="profile-menu-link profile-menu-logout"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
