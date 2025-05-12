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

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '@fontsource/outfit';  // Import Outfit font
import Sidebar from './components/Sidebar';
import TodoListPage from './pages/TodoListPage';
import SettingsPage from './pages/SettingsPage';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [page, setPage] = React.useState('todo');
  const [collapsed, setCollapsed] = React.useState(true); // Collapsed by default
  const [hovered, setHovered] = React.useState(false);
  const SIDEBAR_WIDTH = 200;
  const SIDEBAR_COLLAPSED_WIDTH = 60;
  const isCollapsed = collapsed && !hovered;

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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
