// src/pages/Home.jsx
// Landing page: hero image/text, a tabbed "journey" walkthrough for
// students vs teachers, a how-it-works section, and student reviews.
// Styling lives in Home.css (colocated), following the same pattern
// as Navbar.css / Footer.css.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Home.css'

const studentSteps = [
  { icon: "🔍", label: "Search",            sub: "Find teachers near you" },
  { icon: "👤", label: "Browse Profile",    sub: "Check ratings & subjects" },
  { icon: "💻", label: "Join Online Class", sub: "Attend live sessions" },
  { icon: "🤝", label: "Book Offline",      sub: "Clear doubts locally" },
  { icon: "📊", label: "Track Progress",    sub: "Stay consistent" },
  { icon: "🏆", label: "Level Up",          sub: "Achieve your goal", final: true },
]

const teacherSteps = [
  { icon: "📝", label: "Create Profile",    sub: "Set up in minutes" },
  { icon: "📦", label: "Upload Course",     sub: "Build curriculum" },
  { icon: "🎙️", label: "Go Live",           sub: "Start teaching" },
  { icon: "🧑‍🎓", label: "Students Enroll",  sub: "Grow audience" },
  { icon: "📍", label: "Meet Locally",      sub: "Build connections" },
  { icon: "🚀", label: "Earn & Grow",       sub: "Independent & thriving", final: true },
]

const reviews = [
  {
    text: "I used to regularly follow YouTube videos but struggled with consistency. With local guidance and structured classes, I improved a lot.",
    name: "Anmol Rathore",
    tag: "UPSC",
  },
  {
    text: "Hybrid learning helped me balance everything. Online classes + offline doubt solving made a huge difference.",
    name: "Raja Majhi",
    tag: "GATE",
  },
  {
    text: "I improved my accuracy and speed because I could directly meet my teacher for guidance when needed.",
    name: "Amit Kumar Mandal",
    tag: "BANKING",
  },
]

// One row of step "nodes" connected by a dashed line. `variant` picks
// which color scheme (student = indigo, teacher = emerald) via CSS
// classes instead of Tailwind's inline color utilities.
function JourneyTrack({ steps, variant }) {
  return (
    <div className={`journey-track journey-track--${variant}`}>
      <div className="journey-track-line" />
      {steps.map((step, i) => (
        <div key={i} className="journey-step">
          <div className={`journey-node ${step.final ? 'journey-node--final' : ''}`}>
            <span>{step.icon}</span>
            {!step.final && <span className="journey-badge">{i + 1}</span>}
          </div>
          <p className="journey-step-label">{step.label}</p>
          <p className="journey-step-sub">{step.sub}</p>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('student')
  const navigate = useNavigate()

  return (
    <div className="home-page">
      <Navbar />

      <main className="home-main">

        {/* Hero panel */}
        <section className="home-hero-panel">
          <div className="home-hero-content">
            <p className="home-hero-eyebrow">LEARN LOCALLY. GROW TOGETHER.</p>
            <h1>Learn from the best in your neighborhood.</h1>
            <p className="home-hero-description">
              Build practical skills with passionate instructors, flexible
              courses, and a learning community that moves with you.
            </p>
            <div className="home-hero-actions">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="home-hero-action home-hero-action--student"
              >
                Start learning
                <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/become-instructor')}
                className="home-hero-action home-hero-action--instructor"
              >
                Teach on LevelUp
              </button>
            </div>
          </div>

          <div className="home-hero-visual">
            <div className="home-hero-accent home-hero-accent--top" aria-hidden="true" />
            <div className="home-hero-image">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644"
                alt="Students learning together"
              />
            </div>
            <div className="home-hero-note home-hero-note--top">
              <span aria-hidden="true">✦</span>
              Learn something new
            </div>
            <div className="home-hero-note home-hero-note--bottom">
              <span className="home-hero-note-avatar">4.9</span>
              <span>
                <strong>Trusted learning</strong>
                <small>By local communities</small>
              </span>
            </div>
          </div>
        </section>

        {/* Journey section */}
        <section className="home-journey">
          <h2>Your Journey on LevelUp</h2>
          <p className="home-section-subtitle">
            Follow your path — whether you're here to learn or to teach
          </p>

          <div className="journey-tabs">
            <button
              onClick={() => setActiveTab('student')}
              className={`journey-tab journey-tab--student ${activeTab === 'student' ? 'active' : ''}`}
            >
              Student's Path
            </button>
            <button
              onClick={() => setActiveTab('teacher')}
              className={`journey-tab journey-tab--teacher ${activeTab === 'teacher' ? 'active' : ''}`}
            >
              Teacher's Path
            </button>
          </div>

          {activeTab === 'student' && <JourneyTrack steps={studentSteps} variant="student" />}
          {activeTab === 'teacher' && <JourneyTrack steps={teacherSteps} variant="teacher" />}
        </section>

        {/* How it works */}
        <section className="home-how">
          <h2>How LevelUp Works</h2>
          <div className="how-cards">
            <div className="how-card">
              <h3>For Students</h3>
              <ul>
                {["Find teachers near you", "Attend online classes", "Meet offline for doubts", "Learn with guidance"].map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button onClick={() => navigate('/signup')} className="how-card-btn how-card-btn--student">
                Start Learning
              </button>
            </div>

            <div className="how-card">
              <h3>For Teachers</h3>
              <ul>
                {["Create your courses", "Teach online", "Meet students locally", "Grow independently"].map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button onClick={() => navigate('/become-instructor')} className="how-card-btn how-card-btn--teacher">
                Become Instructor
              </button>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="home-reviews">
          <h2>What Students Say</h2>
          <div className="reviews-grid">
            {reviews.map(r => (
              <div key={r.name} className="review-card">
                <span className="review-quote-mark">"</span>
                <p className="review-text">{r.text}</p>
                <div className="review-footer">
                  <p className="review-name">{r.name}</p>
                  <span className="review-tag">{r.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
