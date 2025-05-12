// Function to check if notifications are supported
const areNotificationsSupported = () => {
  return 'Notification' in window;
};

// Function to request notification permissions
export const requestNotificationPermission = async () => {
  if (!areNotificationsSupported()) {
    console.warn('Notifications are not supported in this browser');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// Function to show a notification
export const showNotification = (title, options = {}) => {
  // Check if settings allows notifications
  const settings = JSON.parse(localStorage.getItem('settings') || '{}');
  if (!settings.notificationsEnabled) {
    return false;
  }
  
  if (!areNotificationsSupported()) {
    console.warn('Notifications are not supported in this browser');
    return false;
  }
  
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }
  
  try {
    // Default options
    const defaultOptions = {
      icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzQyYzM5NyIgZD0iTTE5IDNoLTRjMC0xLjY2LTEuMzQtMy0zLTMtMS42NiAwLTMgMS4zNC0zIDNoLTRjLTEuMSAwLTIgLjktMiAydjE0YzAgMS4xLjkgMiAyIDJoMTRjMS4xIDAgMi0uOSAyLTJWNWMwLTEuMS0uOS0yLTItMnptLTcgMGMuNTUgMCAxIC40NSAxIDFzLS40NSAxLTEgMS0xLS40NS0xLTEgLjQ1LTEgMS0xem0tMiAxNGMtLjU1IDAtMS0uNDUtMS0xczAtMiAxLTJzMSAxLjQ1IDEgMi0uNDUgMS0xIDF6bTQgMGMtLjU1IDAtMS0uNDUtMS0xdi00YzAtLjU1LjQ1LTEgMS0xcy4xIDIgLjEgMnMuOS0xIC45LTEgLjEgMiAuMSAyLS40NSAxLTEgMXoiLz48L3N2Zz4=', // Default task icon
      body: '',
      silent: false
    };
    
    // Create and show notification
    const notification = new Notification(title, { ...defaultOptions, ...options });
    
    // Add click handler
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

// In-app toast notification system
let toastTimeout = null;

export const showToast = (message, duration = 3000) => {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '20px';
    toastContainer.style.left = '50%';
    toastContainer.style.transform = 'translateX(-50%)';
    toastContainer.style.zIndex = '9999';
    toastContainer.style.transition = 'opacity 0.3s, transform 0.3s';
    document.body.appendChild(toastContainer);
  }
  
  // Clear any existing toast
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  
  // Create toast message
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  toast.style.backgroundColor = 'var(--primary)';
  toast.style.color = 'var(--text)';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '6px';
  toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = '500';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'opacity 0.3s, transform 0.3s';
  
  // Clear container and add new toast
  toastContainer.innerHTML = '';
  toastContainer.appendChild(toast);
  
  // Animate toast in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);
  
  // Set timeout to remove toast
  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, duration);
  
  return true;
};

// Default notification thresholds in minutes
const DEFAULT_NOTIFICATION_THRESHOLDS = [60, 30, 5]; // 1 hour, 30 minutes, 5 minutes

// Get notification thresholds from user settings
const getNotificationThresholds = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    // If the user has custom notification thresholds, use those
    if (settings.notificationThresholds && Array.isArray(settings.notificationThresholds) && settings.notificationThresholds.length > 0) {
      return settings.notificationThresholds.sort((a, b) => b - a); // Sort in descending order
    }
  } catch (error) {
    console.error('Error loading notification thresholds:', error);
  }
  
  // Fall back to default thresholds
  return DEFAULT_NOTIFICATION_THRESHOLDS;
};

// Store the last notified time for each task
let notifiedTasks = {};

// Load notified tasks from localStorage
const loadNotifiedTasks = () => {
  try {
    const storedNotifiedTasks = localStorage.getItem('notifiedTasks');
    if (storedNotifiedTasks) {
      notifiedTasks = JSON.parse(storedNotifiedTasks);
    }
  } catch (error) {
    console.error('Error loading notified tasks:', error);
    notifiedTasks = {};
  }
};

// Save notified tasks to localStorage
const saveNotifiedTasks = () => {
  try {
    localStorage.setItem('notifiedTasks', JSON.stringify(notifiedTasks));
  } catch (error) {
    console.error('Error saving notified tasks:', error);
  }
};

// Clean up old tasks from notifiedTasks
const cleanupNotifiedTasks = (tasks) => {
  // Get all current task IDs
  const currentTaskIds = tasks.filter(task => task.dueDate && !task.isCompleted).map(task => task.id);
  
  // Clean up notifiedTasks object
  const updatedNotifiedTasks = {};
  
  // Only keep entries for tasks that still exist and are not completed
  Object.keys(notifiedTasks).forEach(taskId => {
    if (currentTaskIds.includes(taskId)) {
      updatedNotifiedTasks[taskId] = notifiedTasks[taskId];
    }
  });
  
  notifiedTasks = updatedNotifiedTasks;
  saveNotifiedTasks();
};

// Function to check for upcoming tasks and send notifications at specific thresholds
export const checkForDueTasks = (tasks) => {
  if (!tasks || tasks.length === 0) return;
  
  const settings = JSON.parse(localStorage.getItem('settings') || '{}');
  if (!settings.notificationsEnabled) {
    return;
  }
  
  // Load previously notified tasks
  loadNotifiedTasks();
  
  // Clean up old entries from notifiedTasks
  cleanupNotifiedTasks(tasks);
  
  const now = new Date();
  
  // Get notification thresholds from settings
  const thresholds = getNotificationThresholds();
  
  // Find tasks that are due soon
  tasks.filter(task => {
    // Skip if no due date or task is completed
    if (!task.dueDate || task.isCompleted) return false;
    
    const dueDate = new Date(task.dueDate);
    
    // Skip if due date is in the past
    if (dueDate <= now) return false;
    
    // Calculate minutes until due
    const minutesUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60));
  
    // Check each threshold
    for (const threshold of thresholds) {
      // If minutes until due is within 1 minute of our threshold
      if (minutesUntilDue > threshold - 1 && minutesUntilDue <= threshold) {
        // Check if we've already notified for this task at this threshold
        const taskNotifications = notifiedTasks[task.id] || {};
        
        if (!taskNotifications[threshold]) {
          // Format the time threshold for display
          let thresholdText;
          if (threshold === 60) {
            thresholdText = 'in 1 hour';
          } else if (threshold >= 60) {
            const hours = Math.floor(threshold / 60);
            thresholdText = `in ${hours} hour${hours > 1 ? 's' : ''}`;
          } else {
            thresholdText = `in ${threshold} minute${threshold > 1 ? 's' : ''}`;
          }
          
          // Send notification
          showNotification(`Task Due ${thresholdText}: ${task.title}`, {
            body: `Task "${task.title}" is due ${thresholdText}`,
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2Y1YzEwNyIgZD0iTTExLjk5IDJDNi40NyAyIDIgNi40OCAyIDEyczQuNDcgMTAgOS45OSAxMEMxNy41MiAyMiAyMiAxNy41MiAyMiAxMlMxNy41MiAyIDExLjk5IDJ6TTEyIDIwYy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA4LTggOHptLjUtNEgxMXYtNmg1djJoLTMuNXoiLz48L3N2Zz4=' // Clock icon
          });
          
          // Mark as notified for this threshold
          notifiedTasks[task.id] = {...taskNotifications, [threshold]: true};
          saveNotifiedTasks();
        }
      }
    }
  });
};

export default {
  requestNotificationPermission,
  showNotification,
  showToast,
  checkForDueTasks
}; 