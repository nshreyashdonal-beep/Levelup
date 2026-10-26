// src/components/StudentNav.jsx
// Logged-in-student navbar — shows Logo, unified Category Filter + Search,
// nav links ("Subscribe", "Explore", "My Courses"), and student profile avatar.

import { Link } from 'react-router-dom';
import ProfileMenu from './ProfileMenu.jsx';
import BrandLogo from './BrandLogo.jsx';
import NavbarSearchFilter from './NavbarSearchFilter.jsx';
import './StudentNav.css';

export default function StudentNav({
  user,
  activeLink,
  searchInput,
  onSearchInputChange,
  selectedCategoryId,
  onCategoryChange,
  onSearchSubmit,
  selectedCategoryName,
}) {
  return (
    <header className="student-nav">
      <Link to="/student-landing" className="student-nav-logo">
        <BrandLogo compact />
      </Link>

      <div className="student-nav-search-wrap">
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
