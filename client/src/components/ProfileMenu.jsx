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
    setOpen(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    if (window.location.pathname === '/') {
      navigate('/', { replace: true });
    } else {
      navigate('/');
    }
  }

  if (!user) return null;

  const initial = user.name?.charAt(0).toUpperCase() || 'U';
  const isInstructor = user.role === 'instructor';

  return (
    <div className="profile-menu" ref={menuRef}>
      <div
        className={`profile-menu-avatar ${isInstructor ? 'profile-menu-avatar--instructor' : ''} ${user.avatar_url ? 'profile-menu-avatar--has-img' : ''}`}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        title={user.name}
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.name} className="profile-menu-avatar-img" />
        ) : (
          initial
        )}
      </div>

      {open && (
        <div className="profile-menu-dropdown">
          <div className="profile-menu-header">
            <div className={`profile-menu-header-avatar ${isInstructor ? 'profile-menu-header-avatar--instructor' : ''} ${user.avatar_url ? 'profile-menu-header-avatar--has-img' : ''}`}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="profile-menu-avatar-img" />
              ) : (
                initial
              )}
            </div>
            <div className="profile-menu-header-info">
              <div className="profile-menu-name">{user?.name}</div>
              <div className="profile-menu-email">{user?.email}</div>
            </div>
          </div>

          <div className="profile-menu-section">
            <Link
              to="/profile"
              className={`profile-menu-link profile-menu-edit ${isInstructor ? 'profile-menu-link--instructor' : ''}`}
              onClick={() => setOpen(false)}
            >
              Edit Profile
            </Link>
          </div>

          <div className="profile-menu-section">
            {isInstructor ? (
              <>
                <Link
                  to="/instructor-welcome"
                  className="profile-menu-link profile-menu-link--instructor"
                  onClick={() => setOpen(false)}
                >
                  Welcome
                </Link>
                <Link
                  to="/instructor-dashboard"
                  className="profile-menu-link profile-menu-link--instructor"
                  onClick={() => setOpen(false)}
                >
                  Instructor Dashboard
                </Link>
                <Link
                  to="/manage-courses"
                  className="profile-menu-link profile-menu-link--instructor"
                  onClick={() => setOpen(false)}
                >
                  My Courses
                </Link>
              </>
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
