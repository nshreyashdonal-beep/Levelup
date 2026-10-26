// components/CategoryFilterBar.jsx
// Student-facing cascading category filter (Subcategory -> Topic).
// Emits the selected category_id (which can be a Subcategory UUID for subtree matching
// or a specific Topic UUID for leaf matching).

import { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import './CategoryFilterBar.css';

export default function CategoryFilterBar({
  selectedCategoryId = '',
  onCategoryChange,
  showLabel = true,
}) {
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSubId, setSelectedSubId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');

  // 1. Fetch categories tree on mount
  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const data = await response.json();
        if (ignore) return;
        if (response.ok && Array.isArray(data.categories)) {
          setCategoriesTree(data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories for filtering:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  // Sync internal dropdown state if parent clears selectedCategoryId externally
  useEffect(() => {
    if (!selectedCategoryId) {
      setSelectedSubId('');
      setSelectedTopicId('');
    }
  }, [selectedCategoryId]);

  // Top-level subcategories across all roots (e.g. Programming, Web Dev, etc.)
  const rootCategory = categoriesTree[0];
  const subcategories = rootCategory?.children || [];

  const currentSub = subcategories.find((s) => s.id === selectedSubId);
  const topics = currentSub?.children || [];

  function handleSubcategoryChange(e) {
    const subId = e.target.value;
    setSelectedSubId(subId);
    setSelectedTopicId('');

    if (!subId) {
      if (onCategoryChange) onCategoryChange('', '');
      return;
    }

    const sub = subcategories.find((s) => s.id === subId);
    // Emitting subId triggers recursive subtree matching on backend!
    if (onCategoryChange) {
      onCategoryChange(subId, sub ? sub.name : '');
    }
  }

  function handleTopicChange(e) {
    const topicId = e.target.value;
    setSelectedTopicId(topicId);

    if (!topicId) {
      // Revert to parent subcategory subtree
      const sub = subcategories.find((s) => s.id === selectedSubId);
      if (onCategoryChange) {
        onCategoryChange(selectedSubId, sub ? sub.name : '');
      }
      return;
    }

    const topic = topics.find((t) => t.id === topicId);
    if (onCategoryChange) {
      onCategoryChange(topicId, topic ? topic.name : '');
    }
  }

  function handleClear() {
    setSelectedSubId('');
    setSelectedTopicId('');
    if (onCategoryChange) onCategoryChange('', '');
  }

  // Active filter label
  const activeSub = subcategories.find((s) => s.id === selectedSubId);
  const activeTopic = topics.find((t) => t.id === selectedTopicId);
  const activeLabel = activeTopic
    ? `${activeSub?.name} > ${activeTopic.name}`
    : activeSub?.name;

  return (
    <div className="category-filter-bar">
      <div className="category-filter-controls">
        {showLabel && (
          <div className="category-filter-label">
            <svg
              className="category-filter-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                clipRule="evenodd"
              />
            </svg>
            <span>Filter by:</span>
          </div>
        )}

        {/* Dropdown 1: Subcategory */}
        <div className="category-filter-select-wrapper">
          <select
            className="category-filter-select"
            value={selectedSubId}
            onChange={handleSubcategoryChange}
            disabled={loading || subcategories.length === 0}
          >
            <option value="">All Categories</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 2: Topic (Enabled when Subcategory has topics) */}
        {subcategories.length > 0 && (
          <div className="category-filter-select-wrapper">
            <select
              className="category-filter-select"
              value={selectedTopicId}
              onChange={handleTopicChange}
              disabled={!selectedSubId || topics.length === 0}
            >
              <option value="">
                {!selectedSubId
                  ? 'All Topics'
                  : `All ${currentSub?.name || ''} Topics`}
              </option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedCategoryId && (
          <button
            type="button"
            className="category-filter-clear-btn"
            onClick={handleClear}
            title="Clear category filter"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {activeLabel && (
        <div className="category-filter-active-badge">
          <span>Active filter:</span>
          <strong>{activeLabel}</strong>
        </div>
      )}
    </div>
  );
}
