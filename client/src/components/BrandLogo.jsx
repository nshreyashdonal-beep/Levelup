// Shared LevelUp logo: three simple rising steps represent steady learning
// progress without adding visual clutter.

import './BrandLogo.css'

export default function BrandLogo({ variant = 'student', compact = false }) {
  const logoClassName = [
    'brand-logo',
    `brand-logo-${variant}`,
    compact ? 'brand-logo-compact' : '',
  ].filter(Boolean).join(' ')

  return (
    <span className={logoClassName} aria-label="Level Up">
      <span className="brand-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <rect x="6" y="21" width="5" height="5" rx="1.5" />
          <rect x="13.5" y="16" width="5" height="10" rx="1.5" />
          <rect x="21" y="10" width="5" height="16" rx="1.5" />
        </svg>
      </span>
      <span className="brand-logo-wordmark">
        <span className="brand-logo-level">Level</span>
        <span className="brand-logo-up">Up</span>
      </span>
    </span>
  )
}
