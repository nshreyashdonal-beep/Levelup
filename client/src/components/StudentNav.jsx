// src/components/StudentNav.jsx
// Logged-in-student navbar — different from the public Navbar.jsx (which
// shows Login/Signup buttons for logged-out visitors). This one shows an
// Explore link, a highlighted "My Courses" link, and a circular avatar
// with the student's initial instead of auth buttons.
//
// The mockup (src.rar) had this exact component copy-pasted separately
// inside both Studentdashboard.jsx and Mycourses.jsx. Pulled it out into
// its own file here so both real pages can share one copy instead of
// duplicating the same JSX twice.
//
// `activeLink` lets each page highlight whichever nav item matches where
// the user currently is (mockup's Mycourses.jsx highlighted "My Courses"
// in indigo while Studentdashboard.jsx didn't highlight anything).

import { Link } from 'react-router-dom';
import ProfileMenu from './ProfileMenu.jsx';
import BrandLogo from './BrandLogo.jsx';
import './StudentNav.css';

export default function StudentNav({ user, activeLink }) {
  return (
    <header className="student-nav">
      <Link to="/" className="student-nav-logo">
        <BrandLogo compact />
      </Link>

      <div className="student-nav-search-wrap">
        <input type="text" placeholder="Search..." className="student-nav-search" />
      </div>

      <nav className="student-nav-links">
        <a href="#" className="student-nav-link">Subscribe</a>
        <Link
          to="/student-landing"
          className={`student-nav-link ${activeLink === 'explore' ? 'student-nav-link--active' : ''}`}
        >
          Explore
        </Link>
        <Link
          to="/mycourse"
          className={`student-nav-link ${activeLink === 'mycourse' ? 'student-nav-link--active' : ''}`}
        >
          My Courses
        </Link>
        <ProfileMenu user={user} />
      </nav>
    </header>
  );
}
