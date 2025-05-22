import React, { useState, useEffect, useRef } from 'react';
import { MdDeleteSweep, MdCheck, MdPreview, MdInfo, MdAdd, MdClose } from 'react-icons/md';
import { useTheme, themes } from '../contexts/ThemeContext';
import { APP_VERSION, APP_AUTHOR } from '../constants/appInfo';

const SettingsPage = () => {
  const { currentTheme, setCurrentTheme } = useTheme();
  const [settings, setSettings] = useState({
    showCompletedTasks: true,
    notificationsEnabled: true,
    autoSave: true,
    notificationThresholds: [60, 30, 5] // Default thresholds: 1 hour, 30 minutes, 5 minutes
  });
  
  // Add state for notification threshold input
  const [thresholdUnit, setThresholdUnit] = useState('minutes'); // 'minutes', 'hours', or 'days'
  const thresholdInputRef = useRef(null);
  
  // Add state for delete confirmation
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false);

  // Log available theme keys
  useEffect(() => {
    console.log("Available theme keys in SettingsPage:", Object.keys(themes));
  }, []); // Empty dependency array ensures this runs once on mount

  // Load settings from localStorage
  useEffect(() => {
    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        
        // Ensure notificationThresholds always has a default value if missing
        if (!parsedSettings.notificationThresholds) {
          parsedSettings.notificationThresholds = [60, 30, 5]; // Default thresholds
        }
        
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    // Ensure notificationThresholds exists before saving
    const settingsToSave = {
      ...settings,
      notificationThresholds: settings.notificationThresholds || [60, 30, 5]
    };
    localStorage.setItem('settings', JSON.stringify(settingsToSave));
  }, [settings]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Delete All Tasks handlers
  const handleDeleteAllTasks = () => {
    setShowDeleteAllConfirmation(true);
  };
  
  const handleDeleteAllConfirm = () => {
    // Get tasks from localStorage
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      try {
        // Count the tasks for the confirmation message
        const tasksCount = JSON.parse(storedTasks).length;
        console.log(`Deleted ${tasksCount} tasks`);
      } catch (error) {
        console.error('Error parsing tasks:', error);
      }
    }
    
    // Clear all tasks
    localStorage.setItem('tasks', '[]');
    
    // Close confirmation
    setShowDeleteAllConfirmation(false);
  };
  
  const handleDeleteAllCancel = () => {
    setShowDeleteAllConfirmation(false);
  };
  
  // Handle theme change
  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
  };
  
  // Notification threshold handlers
  const handleRemoveThreshold = (threshold) => {
    const newThresholds = settings.notificationThresholds.filter(t => t !== threshold);
    handleSettingChange('notificationThresholds', newThresholds);
  };
  
  const formatThreshold = (minutes) => {
    if (minutes >= 1440) { // 1440 minutes = 1 day
      // Handle days
      const days = Math.floor(minutes / 1440);
      const remainingMinutes = minutes % 1440;
      
      if (remainingMinutes === 0) {
        // Exact days
        return `${days} day${days !== 1 ? 's' : ''}`;
      } else if (remainingMinutes >= 60) {
        // Days and hours
        const hours = Math.floor(remainingMinutes / 60);
        const mins = remainingMinutes % 60;
        
        if (mins === 0) {
          // Days and exact hours
          return `${days}d ${hours}h`;
        } else {
          // Days, hours, and minutes
          return `${days}d ${hours}h ${mins}m`;
        }
      } else {
        // Days and minutes
        return `${days}d ${remainingMinutes}m`;
      }
    } else if (minutes >= 60) {
      // Handle hours
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      if (mins === 0) {
        // Exact hours
        return hours === 1 ? '1 hour' : `${hours} hours`;
      } else {
        // Hours and minutes
        return `${hours}h ${mins}m`;
      }
    } else {
      // Handle minutes only
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    }
  };

  const SettingItem = ({ title, description, children }) => (
    <div style={{ 
      marginBottom: 24, 
      padding: 16, 
      background: 'var(--surface)',
      borderRadius: 8,
      borderLeft: '3px solid var(--primary)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 8
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{title}</h3>
        {children}
      </div>
      {description && (
        <p style={{ fontSize: 14, color: 'var(--textSecondary)', marginTop: 8 }}>{description}</p>
      )}
    </div>
  );

  // Get task count
  const getTaskCount = () => {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      try {
        const parsedTasks = JSON.parse(storedTasks);
        return parsedTasks.length;
      } catch (error) {
        console.error('Error parsing tasks:', error);
      }
    }
    return 0;
  };
  
  // Theme option component
  const ThemeOption = ({ themeKey }) => {
    const themeData = themes[themeKey];
    const isActive = currentTheme === themeKey;
    
    return (
      <div 
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 10px',
          cursor: 'pointer',
          opacity: isActive ? 1 : 0.8,
          transform: `scale(${isActive ? 1.05 : 1})`,
          transition: 'all 0.2s ease'
        }}
      >
        {/* Theme color preview */}
        <div 
          style={{
            width: 80,
            height: 80,
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
            boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
            position: 'relative'
          }}
          onClick={() => handleThemeChange(themeKey)}
        >
          {/* Header */}
          <div style={{
            backgroundColor: themeData.primary,
            height: '30%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ 
              width: '40%', 
              height: 4, 
              backgroundColor: themeData.text,
              borderRadius: 2
            }}></div>
          </div>
          
          {/* Content */}
          <div style={{
            backgroundColor: themeData.background,
            height: '70%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: 4
          }}>
            <div style={{ 
              width: '80%', 
              height: 3, 
              backgroundColor: themeData.accent,
              borderRadius: 2,
              marginBottom: 3
            }}></div>
            <div style={{ 
              width: '60%', 
              height: 3, 
              backgroundColor: themeData.text,
              opacity: 0.7,
              borderRadius: 2,
              marginBottom: 3
            }}></div>
            <div style={{ 
              width: '70%', 
              height: 3, 
              backgroundColor: themeData.text,
              opacity: 0.5,
              borderRadius: 2
            }}></div>
          </div>
          
          {/* Selected indicator */}
          {isActive && (
            <div style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              backgroundColor: themeData.success,
              borderRadius: '50%',
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MdCheck size={12} color="#fff" />
            </div>
          )}
        </div>
        
        <div style={{ 
          marginTop: 8, 
          fontSize: 14, 
          fontWeight: isActive ? 500 : 400,
          color: isActive ? 'var(--accent)' : 'var(--text)'
        }}>
          {themeData.name}
        </div>
      </div>
    );
  };

  // Get app version from constants instead of electron API
  const [appVersion, setAppVersion] = useState(APP_VERSION);
  const appAuthor = APP_AUTHOR;
  
  // Add useEffect to get version from electronAPI if available
  useEffect(() => {
    // Prioritize getAppVersion as it calls the main process
    if (window.electronAPI && window.electronAPI.getAppVersion) {
      window.electronAPI.getAppVersion()
        .then(version => {
          if (version && version !== 'Unknown') {
            setAppVersion(version);
          }
        })
        .catch(err => console.error('Failed to get app version:', err));
    }
  }, []);

  return (
    <div style={{ 
      padding: 32, 
      color: 'var(--text)',
      maxWidth: 800,
      margin: '0 auto',
      position: 'relative',
      minHeight: 'calc(100vh - 80px)' // Allow space for footer
    }}
    className="settings-page"
    >
      <h2 style={{ 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 32,
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}>
        Settings
      </h2>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16, color: 'var(--textSecondary)' }}>Appearance</h3>
        
        <SettingItem 
          title="Theme" 
          description="Choose a theme for the application"
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            gap: '16px',
            margin: '16px 0'
          }}>
            {Object.keys(themes).map(themeKey => (
              <ThemeOption key={themeKey} themeKey={themeKey} />
            ))}
          </div>
        </SettingItem>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16, color: 'var(--textSecondary)' }}>Task Preferences</h3>

        <SettingItem 
          title="Show Completed Tasks" 
          description="Display completed tasks in the list"
        >
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.showCompletedTasks}
              onChange={(e) => handleSettingChange('showCompletedTasks', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </SettingItem>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16, color: 'var(--textSecondary)' }}>Notifications</h3>
        
        <SettingItem 
          title="Enable Notifications" 
          description="Get notified about upcoming task due dates"
        >
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </SettingItem>
        
        {settings.notificationsEnabled && (
          <SettingItem 
            title="Notification Timing" 
            description="Set when you want to be notified before a task is due"
          >
            <div style={{ marginTop: 16 }}>
              {/* Current notification thresholds - displayed as tags */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 8,
                marginBottom: 16
              }}>
                {settings.notificationThresholds.map(threshold => (
                  <div 
                    key={threshold}
                    id={`threshold-${threshold}`}
                    style={{ 
                      backgroundColor: 'var(--accent)',
                      color: 'white',
                      padding: '6px 10px',
                      borderRadius: 20,
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'background-color 0.3s'
                    }}
                    className="threshold-tag"
                  >
                    <span>{formatThreshold(threshold)}</span>
                    <button 
                      onClick={() => handleRemoveThreshold(threshold)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                      aria-label={`Remove ${formatThreshold(threshold)} threshold`}
                    >
                      <MdClose size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Add new threshold */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 8 
              }}>
                <div style={{ 
                  display: 'flex',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  flex: 1
                }}>
                  <input
                    ref={thresholdInputRef}
                    type="text" 
                    inputMode="numeric"
                    placeholder="Add a time threshold..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'var(--surfaceLight)',
                      color: 'var(--text)'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        // Get the value directly from the ref
                        const inputValue = thresholdInputRef.current.value;
                        if (inputValue && !isNaN(inputValue) && parseInt(inputValue) > 0) {
                          // Convert to minutes from whatever unit was selected
                          let minutes = parseInt(inputValue);
                          if (thresholdUnit === 'hours') {
                            minutes = minutes * 60;
                          } else if (thresholdUnit === 'days') {
                            minutes = minutes * 60 * 24;
                          }
                          
                          // Check if this threshold already exists
                          if (settings.notificationThresholds.includes(minutes)) {
                            // Flash the existing threshold
                            const thresholdElement = document.getElementById(`threshold-${minutes}`);
                            if (thresholdElement) {
                              thresholdElement.classList.add('flash-highlight');
                              setTimeout(() => {
                                thresholdElement.classList.remove('flash-highlight');
                              }, 1000);
                            }
                          } else {
                            // Add the new threshold and sort in descending order
                            const newThresholds = [...settings.notificationThresholds, minutes].sort((a, b) => b - a);
                            handleSettingChange('notificationThresholds', newThresholds);
                          }
                          
                          // Clear the input field
                          thresholdInputRef.current.value = '';
                        }
                      }
                    }}
                  />
                  <select
                    value={thresholdUnit}
                    onChange={(e) => setThresholdUnit(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderLeft: '1px solid var(--border)',
                      outline: 'none',
                      backgroundColor: 'var(--surfaceLight)',
                      color: 'var(--text)'
                    }}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
                
                <button
                  onClick={() => {
                    // Get the value directly from the ref
                    const inputValue = thresholdInputRef.current.value;
                    if (inputValue && !isNaN(inputValue) && parseInt(inputValue) > 0) {
                      // Convert to minutes from whatever unit was selected
                      let minutes = parseInt(inputValue);
                      if (thresholdUnit === 'hours') {
                        minutes = minutes * 60;
                      } else if (thresholdUnit === 'days') {
                        minutes = minutes * 60 * 24;
                      }
                      
                      // Check if this threshold already exists
                      if (settings.notificationThresholds.includes(minutes)) {
                        // Flash the existing threshold
                        const thresholdElement = document.getElementById(`threshold-${minutes}`);
                        if (thresholdElement) {
                          thresholdElement.classList.add('flash-highlight');
                          setTimeout(() => {
                            thresholdElement.classList.remove('flash-highlight');
                          }, 1000);
                        }
                      } else {
                        // Add the new threshold and sort in descending order
                        const newThresholds = [...settings.notificationThresholds, minutes].sort((a, b) => b - a);
                        handleSettingChange('notificationThresholds', newThresholds);
                      }
                      
                      // Clear the input field and refocus
                      thresholdInputRef.current.value = '';
                      thresholdInputRef.current.focus();
                    }
                  }}
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <MdAdd size={18} />
                  <span>Add</span>
                </button>
              </div>
              
              <div style={{ 
                marginTop: 8, 
                fontSize: 12, 
                color: 'var(--textSecondary)',
                fontStyle: 'italic'
              }}>
                You'll be notified at each of these times before a task is due
              </div>
            </div>
          </SettingItem>
        )}
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16, color: 'var(--textSecondary)' }}>Data Management</h3>
        
        <SettingItem 
          title="Auto-Save" 
          description="Automatically save your tasks as you make changes"
        >
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </SettingItem>
        
        <SettingItem 
          title="Delete All Tasks" 
          description={`Permanently delete all your tasks (${getTaskCount()} tasks)`}
        >
          <button 
            onClick={handleDeleteAllTasks}
            style={{
              background: 'var(--error)',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <MdDeleteSweep size={18} />
            <span>Delete All</span>
          </button>
        </SettingItem>
      </div>
      
      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 8,
            padding: 20,
            width: 330,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            color: 'var(--text)'
          }}>
            <div style={{ 
              marginBottom: 16,
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 12px 0' }}>Delete All Tasks</h3>
              <p style={{ margin: 0, color: 'var(--textSecondary)' }}>
                Are you sure you want to delete all tasks? This action cannot be undone.
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: 10, 
              justifyContent: 'center'
            }}>
              <button 
                onClick={handleDeleteAllCancel}
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  width: 120
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAllConfirm}
                style={{
                  background: 'var(--error)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 500,
                  width: 120
                }}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        marginTop: 60,
        paddingTop: 20,
        borderTop: '1px solid var(--border)',
        color: 'var(--textSecondary)',
        fontSize: 13,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8
        }}>
          <MdInfo size={16} />
          <span>DoThat</span>
        </div>
        <div>Version {appVersion}</div>
        <div>Created by {appAuthor}</div>
        
        <div style={{ 
          marginTop: 12, 
          fontSize: 12, 
          opacity: 0.7 
        }}>
          © {new Date().getFullYear()} All Rights Reserved
        </div>
      </div>
      
      {/* Add some CSS for the flash animation and to hide number input controls */}
      <style>
        {`
          @keyframes flash-highlight {
            0%, 100% { background-color: var(--accent); }
            50% { background-color: var(--warning); }
          }
          
          .flash-highlight {
            animation: flash-highlight 1s ease;
          }
          
          /* Remove number input appearance in all browsers */
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button,
          input[type="text"][inputmode="numeric"]::-webkit-inner-spin-button,
          input[type="text"][inputmode="numeric"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          
          /* For Firefox */
          input[type="number"],
          input[type="text"][inputmode="numeric"] {
            -moz-appearance: textfield;
            appearance: textfield;
          }
          
          /* For Edge and IE */
          input::-ms-clear,
          input::-ms-reveal {
            display: none;
          }
        `}
      </style>
    </div>
  );
};

export default SettingsPage; 