// components/CategorySelector.jsx
// 3-level cascading dropdown selector (Category -> Subcategory -> Topic)
// Used in course creation and course management forms to force valid leaf
// topic selection.

import { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import './CategorySelector.css';

// Helper: recursively finds root, sub, and topic IDs for a given leaf value in the tree
function findCategoryPathIds(tree, targetId) {
  if (!targetId || !tree || tree.length === 0) return null;
  for (const root of tree) {
    for (const sub of root.children || []) {
      for (const topic of sub.children || []) {
        if (topic.id === targetId) {
          return { rootId: root.id, subId: sub.id, topicId: topic.id };
        }
      }
    }
  }
  return null;
}

export default function CategorySelector({
  value = '',
  onChange,
  disabled = false,
  required = false,
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [selectedRootId, setSelectedRootId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');

  // 1. Fetch categories tree on mount
  useEffect(() => {
    let ignore = false;

    async function fetchTree() {
      setLoading(true);
      setFetchError('');

      try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const data = await response.json();

        if (ignore) return;

        if (!response.ok) {
          setFetchError(data.error || 'Failed to load categories');
          return;
        }

        const tree = data.categories || [];
        setCategories(tree);

        // Pre-populate if initial value exists, or default root if single root
        if (value) {
          const match = findCategoryPathIds(tree, value);
          if (match) {
            setSelectedRootId(match.rootId);
            setSelectedSubId(match.subId);
            setSelectedTopicId(match.topicId);
          }
        } else if (tree.length === 1) {
          setSelectedRootId(tree[0].id);
        }
      } catch {
        if (!ignore) {
          setFetchError('Could not reach the server to load categories.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchTree();

    return () => {
      ignore = true;
    };
  }, [value]);

  // Derived current level items
  const currentRoot = categories.find((c) => c.id === selectedRootId);
  const subcategories = currentRoot?.children || [];
  const currentSub = subcategories.find((s) => s.id === selectedSubId);
  const topics = currentSub?.children || [];

  // Check if current subcategory auto-resolves (e.g. named "Other" or has only "Other")
  const subcategoryIsOther =
    currentSub &&
    (currentSub.name.toLowerCase() === 'other' ||
      (topics.length === 1 && topics[0].name.toLowerCase() === 'other'));

  // Handlers for user interactions
  function handleRootChange(e) {
    const rootId = e.target.value;
    setSelectedRootId(rootId);
    setSelectedSubId('');
    setSelectedTopicId('');

    if (onChange) {
      onChange({ categoryId: '', categoryName: '', categoryPath: '' });
    }
  }

  function handleSubChange(e) {
    const subId = e.target.value;
    setSelectedSubId(subId);

    const chosenSub = subcategories.find((s) => s.id === subId);
    const subTopics = chosenSub?.children || [];

    // Cascading "Other" rule: if the subcategory itself is "Other", auto-resolve to its leaf
    if (
      chosenSub &&
      (chosenSub.name.toLowerCase() === 'other' ||
        (subTopics.length === 1 && subTopics[0].name.toLowerCase() === 'other'))
    ) {
      const autoTopic = subTopics[0];
      setSelectedTopicId(autoTopic.id);
      if (onChange) {
        const path = [currentRoot.name, chosenSub.name, autoTopic.name].join(' > ');
        onChange({
          categoryId: autoTopic.id,
          categoryName: autoTopic.name,
          categoryPath: path,
        });
      }
      return;
    }

    // Otherwise, clear topic and wait for topic selection
    setSelectedTopicId('');
    if (onChange) {
      onChange({ categoryId: '', categoryName: '', categoryPath: '' });
    }
  }

  function handleTopicChange(e) {
    const topicId = e.target.value;
    setSelectedTopicId(topicId);

    const chosenTopic = topics.find((t) => t.id === topicId);

    if (onChange) {
      if (chosenTopic && currentRoot && currentSub) {
        const path = [currentRoot.name, currentSub.name, chosenTopic.name].join(' > ');
        onChange({
          categoryId: chosenTopic.id,
          categoryName: chosenTopic.name,
          categoryPath: path,
        });
      } else {
        onChange({ categoryId: '', categoryName: '', categoryPath: '' });
      }
    }
  }

  const currentTopic = topics.find((t) => t.id === selectedTopicId);
  const selectedPath =
    currentRoot && currentSub && currentTopic
      ? `${currentRoot.name} > ${currentSub.name} > ${currentTopic.name}`
      : '';

  if (fetchError) {
    return (
      <div className="category-selector">
        <p className="category-selector-status error">{fetchError}</p>
      </div>
    );
  }

  return (
    <div className="category-selector">
      <div className="category-selector-grid">
        {/* Dropdown 1: Category (Root) */}
        <label className="category-selector-field">
          <span>Category {required && '*'}</span>
          <select
            value={selectedRootId}
            onChange={handleRootChange}
            disabled={disabled || loading || categories.length === 0}
            required={required}
          >
            <option value="">
              {loading ? 'Loading categories...' : 'Select Category'}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        {/* Dropdown 2: Subcategory */}
        <label className="category-selector-field">
          <span>Subcategory {required && '*'}</span>
          <select
            value={selectedSubId}
            onChange={handleSubChange}
            disabled={disabled || !selectedRootId || subcategories.length === 0}
            required={required}
          >
            <option value="">
              {!selectedRootId ? 'Select Category first' : 'Select Subcategory'}
            </option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </label>

        {/* Dropdown 3: Topic (Leaf) */}
        <label className="category-selector-field">
          <span>Topic {required && '*'}</span>
          <select
            value={selectedTopicId}
            onChange={handleTopicChange}
            disabled={
              disabled ||
              !selectedSubId ||
              topics.length === 0 ||
              subcategoryIsOther
            }
            required={required}
          >
            <option value="">
              {subcategoryIsOther
                ? 'Other (Auto-selected)'
                : !selectedSubId
                ? 'Select Subcategory first'
                : 'Select Topic'}
            </option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedPath && (
        <div className="category-selector-path">
          <span>Breadcrumb:</span>
          <strong>{selectedPath}</strong>
        </div>
      )}
    </div>
  );
}
