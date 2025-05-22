/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

// Log renderer initialization
console.log('Renderer process starting...');
console.log('Checking if preload is working:', window.electronAPI ? 'Yes' : 'No');

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '@fontsource/outfit';  // Import Outfit font
import Sidebar from './components/Sidebar';
import TodoListPage from './pages/TodoListPage';
import SettingsPage from './pages/SettingsPage';
import { ThemeProvider } from './contexts/ThemeContext';

// Error boundary component to catch rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('React error boundary caught an error:', error);
    console.error('Component stack:', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          color: 'white', 
          backgroundColor: '#BF616A', 
          borderRadius: '8px',
          margin: '20px',
          fontFamily: 'Outfit, sans-serif'
        }}>
          <h2>Something went wrong</h2>
          <details>
            <summary>View error details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [page, setPage] = React.useState('todo');
  const [collapsed, setCollapsed] = React.useState(true); // Collapsed by default
  const [hovered, setHovered] = React.useState(false);
  const SIDEBAR_WIDTH = 200;
  const SIDEBAR_COLLAPSED_WIDTH = 60;
  const isCollapsed = collapsed && !hovered;

  console.log('App component rendering');

  return (
    <div className="app-container">
      {/* Fixed sidebar */}
      <div 
        className="sidebar"
        style={{ 
          width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Sidebar
          onNavigate={setPage}
          activePage={page}
          collapsed={isCollapsed}
        />
      </div>
      
      {/* Main content (takes remaining space) */}
      <div className="content">
        {page === 'todo' && <TodoListPage />}
        {page === 'settings' && <SettingsPage />}
      </div>
    </div>
  );
}

// Make sure the root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found! Make sure index.html has a div with id="root"');
} else {
  console.log('Root element found, rendering React app');
  
  // Add fallback for electronAPI object if preload didn't work
  if (!window.electronAPI) {
    console.warn('Preload script did not initialize electronAPI, creating fallback');
    window.electronAPI = {
      platform: navigator.platform.toLowerCase().includes('win') ? 'win32' : 
                navigator.platform.toLowerCase().includes('mac') ? 'darwin' : 'linux',
      appVersion: '1.0.5',
      isPreloadWorking: false,
      checkForUpdates: () => Promise.resolve(false),
      onUpdateProgress: () => {},
      getAppVersion: () => Promise.resolve('1.0.5')
    };
  }
  
  try {
    const root = ReactDOM.createRoot(rootElement);
root.render(
      <ErrorBoundary>
  <ThemeProvider>
    <App />
  </ThemeProvider>
      </ErrorBoundary>
    );
    console.log('React render completed');
  } catch (error) {
    console.error('Error rendering React app:', error);
    rootElement.innerHTML = `<div style="color: white; padding: 20px;">
      <h2>Failed to render app</h2>
      <p>${error.message}</p>
    </div>`;
  }
}
