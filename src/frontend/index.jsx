import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Performance monitoring (defer heavy work)
if (process.env.NODE_ENV === 'production') {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      const loadTime = perfData.loadEventEnd - perfData.fetchStart;
      console.log(`App loaded in ${loadTime}ms`);
      const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
      idle(() => {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(console.log);
          getFID(console.log);
          getFCP(console.log);
          getLCP(console.log);
          getTTFB(console.log);
        });
      });
    });
  }
}

// Error boundary for production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('EchoTune AI Error:', error, errorInfo);
    if (process.env.NODE_ENV === 'production') {
      console.error('Production error reported:', { error, errorInfo });
    }
  }
  render() {
    if (this.state.hasError) {
      const errorPageStyle = {
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
        background: 'linear-gradient(135deg, #121212 0%, #191414 100%)',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      };
      const headingStyle = { fontSize: '2rem', marginBottom: '1rem', color: '#1db954' };
      const textStyle = { color: '#b3b3b3', marginBottom: '2rem' };
      const buttonStyle = {
        background: 'linear-gradient(135deg, #1db954, #1ed760)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '25px',
        fontSize: '1rem',
        cursor: 'pointer',
        fontWeight: '600',
      };
      return React.createElement(
        'div',
        { style: errorPageStyle },
        React.createElement('h1', { style: headingStyle }, '🎵 Oops! Something went wrong'),

        React.createElement(
          'p',
          { style: textStyle },
          "We're sorry, but something unexpected happened. Please refresh the page to try again."
        ),
        React.createElement(
          'button',
          {
            onClick: () => window.location.reload(),
            style: buttonStyle,
          },
          'Refresh Page'
        )
      );
    }
    return this.props.children;
  }
}

// Initialize the React application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(ErrorBoundary, null, React.createElement(App))
  )
);

// Add app loaded class to hide loading spinner
document.body.classList.add('app-loaded');

// Hot Module Replacement for development
if (import.meta.hot) {
  import.meta.hot.accept();
}
