// src/components/InstructorNav.jsx
// Logged-in-instructor navbar — different from the public Navbar.jsx
// (which shows Login/Signup buttons for logged-out visitors).
//
// Laid out like StudentNav.jsx (centered search bar, circular avatar on
// the right) rather than the original mockup's left-to-right row with a
// square avatar — same visual system across both logged-in navs instead
// of two different layouts for what's functionally the same kind of bar.
//
// The mockup (Instructordashboard.jsx) had this defined as a separate
// TeacherNav() function inside the same file. Pulled it out into its own
// component here so any future instructor pages (e.g. Create/Manage
// Course) can reuse it instead of copy-pasting the same JSX again.

import { Link } from 'react-router-dom';
import ProfileMenu from './ProfileMenu.jsx';
import './InstructorNav.css';

export default function InstructorNav({ user }) {
  return (
    <header className="instructor-nav">
      <Link to="/" className="instructor-nav-logo">
        <div className="instructor-nav-logo-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z"
              fill="white" stroke="white" strokeWidth="1.2"
              strokeLinejoin="round" strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="instructor-nav-logo-text">Level Up</span>
      </Link>

      <div className="instructor-nav-search-wrap">
        <input type="text" placeholder="Search..." className="instructor-nav-search" />
      </div>

      <nav className="instructor-nav-links">
        <a href="#" className="instructor-nav-link">Subscribe</a>
        <Link to="/manage-courses" className="instructor-nav-link">Create Course</Link>
        <Link to="/instructor-dashboard" className="instructor-nav-link">Dashboard</Link>
        <ProfileMenu user={user} />
      </nav>
    </header>
  );
}
