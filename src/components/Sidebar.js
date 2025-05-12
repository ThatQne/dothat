import React from 'react';
import { MdChecklist, MdSettings, MdDashboard, MdCalendarToday } from 'react-icons/md';
import { useTheme } from '../contexts/ThemeContext';

const ICON_SIZE = 22;
const SIDEBAR_COLLAPSED_WIDTH = 60;

const navItems = [
  { key: 'todo', icon: <MdChecklist size={ICON_SIZE} />, label: 'Tasks' },
  { key: 'settings', icon: <MdSettings size={ICON_SIZE} />, label: 'Settings' },
];

const Sidebar = ({ onNavigate, activePage, collapsed }) => {
  const isCollapsed = collapsed;
  const { currentTheme } = useTheme();

  return (
    <div
      className="sidebar-content"
      style={{
        width: '100%', // Let parent container control width
        background: 'var(--surface)',
        color: 'var(--text)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxSizing: 'border-box',
        borderRight: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: 180,
          gap: 0,
        }}
      >
        {navItems.map(item => (
          <div
            className="sidebar-button"
            key={item.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              height: 48, // Height of the nav item
              margin: '8px 0',
              cursor: 'pointer',
              width: '100%',
            }}
            onClick={() => onNavigate(item.key)}
            title={item.label}
          >
            {/* Container that ensures icon is centered when collapsed */}
            <div 
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: SIDEBAR_COLLAPSED_WIDTH,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  background: activePage === item.key ? 'var(--primary)' : 'transparent',
                  borderRadius: 10,
                  boxShadow: activePage === item.key ? '0 0 8px rgba(0, 0, 0, 0.2)' : 'none',
                  border: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  color: activePage === item.key ? 'var(--text)' : 'var(--textSecondary)',
                }}
              >
                {item.icon}
              </div>
            </div>

            {/* Label that appears only when expanded */}
            <div
              style={{
                position: 'absolute',
                left: SIDEBAR_COLLAPSED_WIDTH, 
                top: 0,
                bottom: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isCollapsed ? 0 : 1,
                pointerEvents: isCollapsed ? 'none' : 'auto',
              }}
            >
              <span
                style={{
                  color: activePage === item.key ? 'var(--text)' : 'var(--textSecondary)',
                  fontSize: 16,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  paddingLeft: 5,
                }}
              >
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 