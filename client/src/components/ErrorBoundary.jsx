// client/src/components/ErrorBoundary.jsx
// Top-level React error boundary that prevents unexpected render/effect crashes
// from unmounting the entire application to a blank white screen.

import { Component } from 'react';
import './ErrorBoundary.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LevelUp ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="levelup-error-boundary" role="alert">
          <div className="levelup-error-card">
            <div className="levelup-error-header">
              <span className="levelup-error-tag">LevelUp System Notice</span>
              <h1 className="levelup-error-title">Something unexpected happened</h1>
              <p className="levelup-error-subtitle">
                The application encountered an issue while rendering this section. Your progress and data are safe.
              </p>
            </div>

            <div className="levelup-error-actions">
              <button
                type="button"
                className="levelup-error-btn levelup-error-btn--primary"
                onClick={this.handleReload}
              >
                Reload page
              </button>
              <button
                type="button"
                className="levelup-error-btn levelup-error-btn--secondary"
                onClick={this.handleGoHome}
              >
                Return to home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
