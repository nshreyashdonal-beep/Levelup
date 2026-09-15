// src/App.jsx
// Defines which "page" component shows for which URL path.
// Only one route exists so far — more get added as we build each page
// (auth pages, course browse, dashboards, etc.) as separate pieces.

import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

export default App
