// src/main.jsx
// This is the true entry point of the whole React app — it's the first
// JS file that runs, and it renders <App /> into the actual HTML page.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter wraps the whole app so any page/component inside
        can use routing features (links, navigation, current page info). */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
