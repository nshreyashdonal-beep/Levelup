// src/components/ScrollToTop.jsx
// BrowserRouter does not reset scroll position on navigation by itself —
// that's only built into react-router's newer data-router APIs (via
// <ScrollRestoration />), which this app doesn't use. Without this, the
// browser keeps whatever scroll offset the previous page had: e.g. scroll
// down on My Courses' card grid, then click "Manage Course" or "Dashboard"
// in the nav, and the shorter/differently-laid-out page you land on renders
// at that same old offset, then visibly jumps/reflows as content loads.
// That's the page-switch "jitter" — not a rendering bug, a missing scroll
// reset. Mounted once in App.jsx; renders nothing itself.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
