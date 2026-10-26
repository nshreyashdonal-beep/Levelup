// src/components/NavbarSearchFilter.jsx
// Unified search bar + cascading category filter for the sticky navbar.
// Features:
// 1. Category flyout dropdown (Subcategory -> Topic) on the same level as search.
// 2. Search input with clear button.
// 3. Enter key / category selection smoothly scrolls to #nearby-map-section.
// 4. Works in controlled mode (on StudentLanding/Home) or navigates cross-page.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import './NavbarSearchFilter.css';

export default function NavbarSearchFilter({
  searchInput: controlledSearchInput,
  onSearchInputChange,
  selectedCategoryId: controlledCategoryId,
  onCategoryChange,
  onSearchSubmit,
  selectedCategoryName = '',
  placeholder = 'Search courses, topics (e.g. Python, React)...',
}) {
  const navigate = useNavigate();

  // Internal state fallback for pages where props are not passed
  const [internalSearch, setInternalSearch] = useState('');
  const [internalCatId, setInternalCatId] = useState('');
  const [internalCatName, setInternalCatName] = useState('');

  const isControlledSearch = controlledSearchInput !== undefined;
  const currentSearch = isControlledSearch ? controlledSearchInput : internalSearch;

  const isControlledCategory = controlledCategoryId !== undefined;
  const currentCategoryId = isControlledCategory ? controlledCategoryId : internalCatId;
  const currentCategoryName = selectedCategoryName || internalCatName;

  // Category data fetched from backend
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredSubId, setHoveredSubId] = useState('');

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // 1. Fetch categories on mount
  useEffect(() => {
    let ignore = false;
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_BASE}/api/categories`);
        const data = await res.json();
        if (ignore) return;
        if (res.ok && Array.isArray(data.categories)) {
          setCategoriesTree(data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories for navbar:', err);
      } finally {
        if (!ignore) setLoadingCategories(false);
      }
    }
    fetchCategories();
    return () => {
      ignore = true;
    };
  }, []);

  // 2. Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Derived subcategories & topics
  const rootCategory = categoriesTree[0];
  const subcategories = rootCategory?.children || [];
  const activeSubId = hoveredSubId || (subcategories[0]?.id || '');
  const activeSub = subcategories.find((s) => s.id === activeSubId) || subcategories[0];
  const topics = activeSub?.children || [];

  // Smooth scroll to map helper
  function scrollToMapSection() {
    const mapSection = document.getElementById('nearby-map-section');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Handle Search input change
  function handleInputChange(e) {
    const val = e.target.value;
    if (isControlledSearch) {
      if (onSearchInputChange) onSearchInputChange(val);
    } else {
      setInternalSearch(val);
    }
  }

  // Handle Clear Search
  function handleClearSearch() {
    if (isControlledSearch) {
      if (onSearchInputChange) onSearchInputChange('');
    } else {
      setInternalSearch('');
    }
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }

  // Handle Enter Key Press
  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTriggerSearch();
    }
  }

  // Execute Search & Focus Map
  function handleTriggerSearch() {
    setDropdownOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(currentSearch);
      scrollToMapSection();
    } else {
      // If on another page, navigate to student landing with search query
      const params = new URLSearchParams();
      if (currentSearch.trim()) params.append('q', currentSearch.trim());
      if (currentCategoryId) params.append('category_id', currentCategoryId);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      navigate(`/student-landing${queryStr}#nearby-map-section`);
    }
  }

  // Handle selecting a category or topic
  function handleSelectCategory(catId, catName) {
    setDropdownOpen(false);
    if (isControlledCategory) {
      if (onCategoryChange) onCategoryChange(catId, catName);
    } else {
      setInternalCatId(catId);
      setInternalCatName(catName);
    }

    if (onSearchSubmit) {
      scrollToMapSection();
    } else {
      const params = new URLSearchParams();
      if (currentSearch.trim()) params.append('q', currentSearch.trim());
      if (catId) params.append('category_id', catId);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      navigate(`/student-landing${queryStr}#nearby-map-section`);
    }
  }

  // Handle resetting category
  function handleClearCategory(e) {
    e.stopPropagation();
    handleSelectCategory('', '');
  }

  return (
    <div className="navbar-search-filter" ref={containerRef}>
      {/* ── Category Dropdown Button ────────────────────────────── */}
      <div className="nav-cat-btn-wrap">
        <button
          type="button"
          className={`nav-cat-trigger-btn ${currentCategoryId ? 'nav-cat-trigger-btn--active' : ''}`}
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          title={currentCategoryName || 'Browse categories'}
        >
          <span className="nav-cat-trigger-label">
            {currentCategoryName || 'Categories'}
          </span>
          <span className="nav-cat-trigger-arrow" aria-hidden="true">
            {dropdownOpen ? '▲' : '▾'}
          </span>
        </button>

        {currentCategoryId && (
          <button
            type="button"
            className="nav-cat-quick-clear"
            onClick={handleClearCategory}
            title="Clear category filter"
            aria-label="Clear category filter"
          >
            ✕
          </button>
        )}

        {/* ── Dropdown Flyout Panel ──────────────────────────────── */}
        {dropdownOpen && (
          <div className="nav-cat-flyout" role="menu">
            <div className="nav-cat-flyout-header">
              <span>Filter by Category</span>
              {currentCategoryId && (
                <button
                  type="button"
                  className="nav-cat-flyout-clear"
                  onClick={handleClearCategory}
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="nav-cat-flyout-body">
              {/* Left Column: Subcategories */}
              <div className="nav-cat-sub-col">
                <button
                  type="button"
                  className={`nav-cat-item nav-cat-item--all ${!currentCategoryId ? 'nav-cat-item--active' : ''}`}
                  onClick={() => handleSelectCategory('', '')}
                >
                  <span>All Categories</span>
                </button>

                <div className="nav-cat-divider" />

                {loadingCategories ? (
                  <div className="nav-cat-loading">Loading categories...</div>
                ) : (
                  subcategories.map((sub) => {
                    const isHovered = sub.id === activeSubId;
                    const isSelected = sub.id === currentCategoryId;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        className={`nav-cat-item ${isHovered ? 'nav-cat-item--hovered' : ''} ${isSelected ? 'nav-cat-item--active' : ''}`}
                        onMouseEnter={() => setHoveredSubId(sub.id)}
                        onClick={() => setHoveredSubId(sub.id)}
                      >
                        <span className="nav-cat-item-text">{sub.name}</span>
                        <span className="nav-cat-item-arrow" aria-hidden="true">›</span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right Column: Topics under the hovered subcategory */}
              {activeSub && (
                <div className="nav-cat-topics-col">
                  <div className="nav-cat-topics-header">
                    <strong>{activeSub.name}</strong>
                    <button
                      type="button"
                      className="nav-cat-all-sub-btn"
                      onClick={() => handleSelectCategory(activeSub.id, activeSub.name)}
                      title={`Filter by all ${activeSub.name} courses`}
                    >
                      All {activeSub.name} →
                    </button>
                  </div>

                  <div className="nav-cat-topics-list">
                    {topics.length === 0 ? (
                      <div className="nav-cat-empty-topics">No sub-topics</div>
                    ) : (
                      topics.map((topic) => {
                        const isTopicSelected = topic.id === currentCategoryId;
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            className={`nav-topic-item ${isTopicSelected ? 'nav-topic-item--selected' : ''}`}
                            onClick={() =>
                              handleSelectCategory(topic.id, `${activeSub.name} > ${topic.name}`)
                            }
                          >
                            <span>{topic.name}</span>
                            {isTopicSelected && (
                              <span className="nav-topic-check" aria-hidden="true">✓</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Search Input Box ─────────────────────────────────────── */}
      <div className="nav-search-box">
        <span className="nav-search-icon" aria-hidden="true">🔍</span>
        <input
          ref={searchInputRef}
          type="text"
          className="nav-search-input"
          placeholder={placeholder}
          value={currentSearch}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          aria-label="Search courses and instructors"
        />
        {currentSearch && (
          <button
            type="button"
            className="nav-search-clear-btn"
            onClick={handleClearSearch}
            title="Clear search query"
            aria-label="Clear search query"
          >
            ✕
          </button>
        )}
        <button
          type="button"
          className="nav-search-enter-badge"
          onClick={handleTriggerSearch}
          title="Press Enter to search & focus map"
          aria-label="Submit search"
        >
          ↵
        </button>
      </div>
    </div>
  );
}
