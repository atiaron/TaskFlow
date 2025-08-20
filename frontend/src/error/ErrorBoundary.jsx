import { Component } from 'react';

/**
 * ErrorBoundary wraps the application to catch render/runtime errors in React subtree.
 * User-facing message kept minimal (Hebrew) while logging full diagnostics to console.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="gt-errorBoundary" dir="rtl" style={{ padding: '2rem', maxWidth: 600, margin: '4rem auto', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 1rem' }}>אירעה שגיאה</h2>
          <p style={{ margin: 0 }}>נסו לרענן את הדף. אם הבעיה חוזרת — עדכנו אותנו.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
