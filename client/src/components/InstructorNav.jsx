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
import BrandLogo from './BrandLogo.jsx';
import './InstructorNav.css';

export default function InstructorNav({ user }) {
  return (
    <header className="instructor-nav">
      <Link to="/" className="instructor-nav-logo">
        <BrandLogo variant="instructor" compact />
      </Link>

      <div className="instructor-nav-search-wrap">
        <input type="text" placeholder="Search..." className="instructor-nav-search" />
      </div>

      <nav className="instructor-nav-links">
        <a href="#" className="instructor-nav-link">Subscribe</a>
        <Link to="/manage-courses" className="instructor-nav-link">My Courses</Link>
        <Link to="/manage-courses" className="instructor-nav-link">Create Course</Link>
        <Link to="/instructor-dashboard" className="instructor-nav-link">Dashboard</Link>
        <ProfileMenu user={user} />
      </nav>
    </header>
  );
}
