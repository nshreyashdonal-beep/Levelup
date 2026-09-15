// src/components/Footer.jsx
// Site footer shown on every page: brand blurb, company links, and a
// newsletter signup box. Styling lives in Footer.css (colocated).

import './Footer.css'

const companyLinks = ["About Us", "Contact", "Privacy Policy"]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-brand-row">
            <div className="footer-logo-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z"
                  fill="white" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="footer-brand-name">Level Up</span>
          </div>
          <p className="footer-brand-blurb">
            Empowering learners worldwide with practical,<br />career-ready skills.
          </p>
          <div className="footer-socials">
            <a href="#" className="footer-social-link">Twitter</a>
            <span className="footer-dot">•</span>
            <a href="#" className="footer-social-link">LinkedIn</a>
            <span className="footer-dot">•</span>
            <a href="#" className="footer-social-link">YouTube</a>
          </div>
        </div>

        {/* Company links */}
        <div>
          <h3 className="footer-heading">Company</h3>
          <ul className="footer-list">
            {companyLinks.map(link => (
              <li key={link}>
                <a href="#" className="footer-list-link">{link}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-newsletter">
          <h3 className="footer-heading">Newsletter</h3>
          <div className="footer-newsletter-row">
            <input
              type="email"
              placeholder="Email address"
              className="footer-newsletter-input"
            />
            <button className="footer-newsletter-btn">
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">© 2026 Level Up. All Rights Reserved.</p>
      </div>
    </footer>
  )
}
