import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { formatDistanceToNow, format, isToday, isPast, isAfter, addDays } from 'date-fns';
import { MdCheckCircle, MdRadioButtonUnchecked, MdMoreVert, MdExpandMore, MdAccessTime, MdDelete, MdEdit, MdAdd, MdStar, MdContentCopy, MdGroup } from 'react-icons/md';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useTheme } from '../contexts/ThemeContext';
import { showToast } from '../utils/notifications';

// Menu dropdown component using Portal
const MenuDropdown = ({ isOpen, onClose, position, task, isCompleted, onDelete, onEdit, menuButtonRef, onAddSubtask }) => {
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if clicking the menu button that opened this dropdown
      if (menuButtonRef && menuButtonRef.current && menuButtonRef.current.contains(e.target)) {
        return;
      }
      
      // Close if clicking outside the menu
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    const handleScroll = () => {
      // Close menu when scrolling occurs
      onClose();
    };
    
    if (isOpen) {
      // Use a slight delay to avoid immediate handling of the same click that opened the menu
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
      
      // Add scroll event listener to window and any scrollable elements
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
    
    return undefined;
  }, [isOpen, onClose, menuButtonRef]);
  
  if (!isOpen) return null;
  
  // Handle edit click
  const handleEditClick = () => {
    if (typeof onEdit === 'function') {
      onEdit(task.id);
    } else {
      console.error('onEdit is not a function', onEdit);
    }
    onClose();
  };
  
  // Handle delete click
  const handleDeleteClick = () => {
    if (typeof onDelete === 'function') {
      onDelete(task.id);
    } else {
      console.error('onDelete is not a function', onDelete);
    }
    onClose();
  };

  // Handle add subtask click
  const handleAddSubtaskClick = () => {
    if (typeof onAddSubtask === 'function') {
      onAddSubtask(task.id);
    } else {
      console.error('onAddSubtask is not a function', onAddSubtask);
    }
    onClose();
  };
  
  // Use portal to render outside of the normal DOM hierarchy
  return ReactDOM.createPortal(
    <div 
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        backgroundColor: 'var(--surface)',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        minWidth: '160px',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}
    >
      <div
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text)',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          borderBottom: '1px solid var(--borderLight)'
        }}
        onClick={handleEditClick}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surfaceLight)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <MdEdit size={16} />
        <span>Edit</span>
      </div>

      <div
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text)',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          borderBottom: '1px solid var(--borderLight)'
        }}
        onClick={handleAddSubtaskClick}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surfaceLight)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <MdAdd size={16} />
        <span>Add Subtask</span>
      </div>
      
      <div
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--error)',
          cursor: 'pointer',
          transition: 'background-color 0.15s'
        }}
        onClick={handleDeleteClick}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surfaceLight)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <MdDelete size={16} />
        <span>Delete</span>
      </div>
    </div>,
    document.body
  );
};

// Subtask menu dropdown component
const SubtaskMenuDropdown = ({ isOpen, onClose, position, taskId, subtaskId, onDelete, onEdit, menuButtonRef }) => {
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuButtonRef && menuButtonRef.current && menuButtonRef.current.contains(e.target)) {
        return;
      }
      
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    const handleScroll = () => {
      onClose();
    };
    
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
      
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
    
    return undefined;
  }, [isOpen, onClose, menuButtonRef]);
  
  if (!isOpen) return null;
  
  // Handle edit click
  const handleEditClick = () => {
    if (typeof onEdit === 'function') {
      onEdit(taskId, subtaskId);
    } else {
      console.error('onEdit is not a function', onEdit);
    }
    onClose();
  };
  
  // Handle delete click
  const handleDeleteClick = () => {
    if (typeof onDelete === 'function') {
      onDelete(taskId, subtaskId);
    } else {
      console.error('onDelete is not a function', onDelete);
    }
    onClose();
  };
  
  // Use portal to render outside of the normal DOM hierarchy
  return ReactDOM.createPortal(
    <div 
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        backgroundColor: 'var(--surface)',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        minWidth: '160px',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}
    >
      <div
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text)',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          borderBottom: '1px solid var(--borderLight)'
        }}
        onClick={handleEditClick}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surfaceLight)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <MdEdit size={16} />
        <span>Edit</span>
      </div>
      
      <div
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--error)',
          cursor: 'pointer',
          transition: 'background-color 0.15s'
        }}
        onClick={handleDeleteClick}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surfaceLight)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <MdDelete size={16} />
        <span>Delete</span>
      </div>
    </div>,
    document.body
  );
};

const TaskItem = ({ 
  task, 
  onToggleComplete, 
  onToggleSubtasks, 
  onDelete, 
  onEdit, 
  isDragging, 
  dragHandleProps, 
  onAddSubtask,
  onToggleSubtaskComplete,
  onDeleteSubtask,
  onEditSubtask,
  isSelectionMode = false,
  isSelected = false,
  isLongPressed = false,
  isInGroup = false,
  groupName = '',
  onLongPress = () => {},
  onSelectionClick = () => {},
  canDrag = true,
  onCancelSelection = () => {},
  longPressTaskId = null,
  subtasksOpen = false
}) => {
  const { id, title, dueDate, isCompleted, isStarred, subtasks = [] } = task;
  const [showMenu, setShowMenu] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef(null);
  const [subtaskMenuId, setSubtaskMenuId] = useState(null);
  const [subtaskMenuPosition, setSubtaskMenuPosition] = useState({ top: 0, left: 0 });
  const subtaskMenuButtonRef = useRef(null);
  const { currentTheme } = useTheme();
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const [showLongPressAnimation, setShowLongPressAnimation] = useState(false);
  const longPressRef = useRef(null);
  const ignoreNextClickRef = useRef(false);
  const initialDelayRef = useRef(null);
  const longPressDuration = 500; // Shortened to 300ms (original 800ms - 500ms delay)
  const initialDelay = 400; // 500ms delay before animation starts

  // Auto refresh times every minute
  useEffect(() => {
    // Initial update to set exact time
    setCurrentTime(new Date());
    
    // Set interval for future updates
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  const handleToggleComplete = () => {
    setIsAnimating(true);
    // Call immediately without delay
    onToggleComplete(id);
    setIsAnimating(false);
  };

  const toggleSubtasks = () => {
    if (onToggleSubtasks) {
      onToggleSubtasks(id);
    }
  };
  
  const handleMenuToggle = (e) => {
    // Stop event propagation to prevent any conflicts
    e.stopPropagation();
    e.preventDefault();
    
    // Toggle menu with a small delay to avoid race conditions
    if (showMenu) {
      setShowMenu(false);
    } else {
      // If menu is closed, calculate position and open it
      if (menuButtonRef.current) {
        const rect = menuButtonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 5,
          left: rect.right - 160 // Position menu to the far right
        });
        
        // Small delay to ensure we don't have conflicting events
        setTimeout(() => {
          setShowMenu(true);
        }, 10);
      }
    }
  };

  // Update handleContextMenu to check for selection mode
  const handleContextMenu = (e) => {
    // Don't show context menu in selection mode
    if (isSelectionMode) {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // Position the menu at the cursor position
    setMenuPosition({
      top: e.clientY,
      left: e.clientX
    });
    
    setShowMenu(true);
  };

  // Check if task is overdue
  const hasTime = dueDate ? (dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0) : false;
  const isOverdue = dueDate ? (
    hasTime 
      ? dueDate < currentTime 
      : isPast(dueDate) && !isToday(dueDate)
  ) : false;
  
  const isTomorrow = (date, now) => {
    const tomorrow = addDays(new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ), 1);
    
    return date.getDate() === tomorrow.getDate() && 
           date.getMonth() === tomorrow.getMonth() && 
           date.getFullYear() === tomorrow.getFullYear();
  };

  const formatDueDate = (date) => {
    if (!date) return null;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = currentTime;
    
    // Get time string if available
    const hasTime = dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0;
    const timeString = hasTime ? format(dateObj, 'h:mm a') : '';
    
    // Calculate time difference in minutes
    const diffMinutes = Math.floor((dateObj.getTime() - now.getTime()) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    // Check if it's overdue - for tasks with time, check exact time; for tasks without time, check only date
    // Don't mark as overdue if it's due today (without time) since the day isn't over yet
    const isOverdue = hasTime 
      ? dateObj < now 
      : isPast(dateObj) && !isToday(dateObj);
    
    // If the task is overdue
    if (isOverdue) {
      return (
        <span>
          <span style={{ 
            color: 'var(--error)', 
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {!isCompleted && (
              <span style={{ 
                backgroundColor: 'var(--error)', 
                color: 'var(--text)', 
                padding: '1px 6px', 
                borderRadius: '4px', 
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                Overdue
              </span>
            )}
            <span>
              Due: {format(dateObj, 'MMM d')}
              {hasTime && <span style={{ marginLeft: 4 }}>at {timeString}</span>}
              <span style={{ color: 'var(--error)', marginLeft: 4 }}>
                ({formatDistanceToNow(dateObj)} ago)
              </span>
            </span>
          </span>
        </span>
      );
    }
    
    // Check if it's today
    if (isToday(dateObj)) {
      // If due within the next hour
      if (diffMinutes > 0 && diffMinutes < 60) {
        return (
          <span>
            <span style={{ color: 'var(--success)', fontWeight: '500' }}>Today</span>
            {hasTime && (
              <span>
                <span style={{ margin: '0 4px' }}>at</span>
                <span style={{ fontWeight: '500' }}>{timeString}</span>
                <span style={{ 
                  marginLeft: '4px', 
                  color: diffMinutes < 15 ? 'var(--error)' : 'var(--warning)',
                  fontWeight: '500'
                }}>
                  (in {diffMinutes} {diffMinutes === 1 ? 'minute' : 'minutes'})
                </span>
              </span>
            )}
          </span>
        );
      }
      
      // If due within the next 24 hours but more than an hour away
      if (diffHours > 0 && diffHours < 24) {
        return (
          <span>
            <span style={{ color: 'var(--success)', fontWeight: '500' }}>Today</span>
            {hasTime && (
              <span>
                <span style={{ margin: '0 4px' }}>at</span>
                <span style={{ fontWeight: '500' }}>{timeString}</span>
                <span style={{ 
                  marginLeft: '4px', 
                  color: 'var(--warning)'
                }}>
                  (in {diffHours} {diffHours === 1 ? 'hour' : 'hours'})
                </span>
              </span>
            )}
          </span>
        );
      }
      
      // Default today format
      return (
        <span>
          <span style={{ color: 'var(--success)', fontWeight: '500' }}>Today</span>
          {hasTime && (
            <span>
              <span style={{ margin: '0 4px' }}>at</span>
              <span style={{ fontWeight: '500' }}>{timeString}</span>
            </span>
          )}
        </span>
      );
    }
    
    // Check if it's tomorrow
    if (isTomorrow(dateObj, now)) {
      // Calculate hours until tomorrow's task
      const hoursUntilTomorrow = diffHours;
      
      // If due within 24 hours
      if (hoursUntilTomorrow > 0 && hoursUntilTomorrow < 24) {
        return (
          <span>
            <span style={{ color: 'var(--accentLight)', fontWeight: '500' }}>Tomorrow</span>
            {hasTime && (
              <span>
                <span style={{ margin: '0 4px' }}>at</span>
                <span style={{ fontWeight: '500' }}>{timeString}</span>
                <span style={{ marginLeft: '4px', color: 'var(--warning)' }}>
                  (in {hoursUntilTomorrow} {hoursUntilTomorrow === 1 ? 'hour' : 'hours'})
                </span>
              </span>
            )}
          </span>
        );
      }
      
      // Default tomorrow format
      return (
        <span>
          <span style={{ color: 'var(--accentLight)', fontWeight: '500' }}>Tomorrow</span>
          {hasTime && (
            <span>
              <span style={{ margin: '0 4px' }}>at</span>
              <span style={{ fontWeight: '500' }}>{timeString}</span>
            </span>
          )}
        </span>
      );
    }
    
    // If the date is in the future
    if (isAfter(dateObj, now)) {
      return (
        <span>
          <span>Due: {format(dateObj, 'MMM d')}</span>
          {hasTime && <span style={{ marginLeft: 4 }}>at {timeString}</span>}
        </span>
      );
    }
    
    // Default case should never be reached
    return `Due: ${format(dateObj, 'MMM d, yyyy')}`;
  };

  const handleToggleSubtaskComplete = (subtaskId) => {
    if (onToggleSubtaskComplete) {
      onToggleSubtaskComplete(id, subtaskId);
    }
  };
  
  const handleSubtaskMenuToggle = (e, subtaskId) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (subtaskMenuId === subtaskId) {
      setSubtaskMenuId(null);
    } else {
      if (e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        setSubtaskMenuPosition({
          top: rect.bottom + 5,
          left: rect.right - 160 // Position menu to the far right
        });
        
        setTimeout(() => {
          setSubtaskMenuId(subtaskId);
        }, 10);
      }
    }
  };
  
  // Add handler for right-click on subtask
  const handleSubtaskContextMenu = (e, subtaskId) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position based on right-click location
    setSubtaskMenuPosition({
      top: e.clientY,
      left: e.clientX
    });
    
    // Open the subtask menu
    setSubtaskMenuId(subtaskId);
  };

  // Handle mouse down for long press
  const handleMouseDown = (e) => {
    // Skip if in selection mode or if right-clicking or if task is completed
    // Also skip if the task is already in a group
    if (isSelectionMode || e.button !== 0 || task.isCompleted || isInGroup) return;
    
    // First set up an initial delay timer
    const delayTimer = setTimeout(() => {
      // Only start the animation after the delay
      setShowLongPressAnimation(true);
      
      // Store the time when animation started
      const startTime = Date.now();
      
      // Create an interval to update the progress
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        // Calculate progress as percentage of longPressDuration
        const progress = Math.min(100, (elapsed / longPressDuration) * 100);
        setLongPressProgress(progress);
        
        // Only trigger the selection when we've reached exactly 100%
        if (progress >= 100) {
          // Clear the interval first
          clearInterval(interval);
          setLongPressTimer(null);
          
          // Wait for a small delay to ensure animation is visibly complete
          setTimeout(() => {
            onLongPress(task.id);
            ignoreNextClickRef.current = true;
          }, 50);
        }
      }, 16); // Update frequently for smoother animation
      
      setLongPressTimer(interval);
    }, initialDelay);
    
    initialDelayRef.current = delayTimer;
  };
  
  // Handle mouse up to cancel long press
  const handleMouseUp = () => {
    // Clear the initial delay timer if it exists
    if (initialDelayRef.current) {
      clearTimeout(initialDelayRef.current);
      initialDelayRef.current = null;
    }
    
    // Clear the progress interval if it exists
    if (longPressTimer) {
      clearInterval(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Reset animation states
    setLongPressProgress(0);
    setShowLongPressAnimation(false);
  };
  
  // Handle mouse leave to cancel long press
  const handleMouseLeave = () => {
    // Clear the initial delay timer if it exists
    if (initialDelayRef.current) {
      clearTimeout(initialDelayRef.current);
      initialDelayRef.current = null;
    }
    
    // Clear the progress interval if it exists
    if (longPressTimer) {
      clearInterval(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Reset animation states
    setLongPressProgress(0);
    setShowLongPressAnimation(false);
  };
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearInterval(longPressTimer);
      }
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current);
      }
    };
  }, [longPressTimer]);
  
  // Handle click in selection mode
  const handleTaskClick = (e) => {
    // Prevent propagation to avoid triggering other events
    e.stopPropagation();
    
    // If this click is the result of a long press release, ignore it
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }
    
    // If in selection mode
    if (isSelectionMode) {
      // If clicking on the long-pressed task, cancel selection mode
      if (task.id === longPressTaskId) {
        onCancelSelection();
      } else {
        // Otherwise, handle selection (which will create a group when selecting a second task)
        onSelectionClick(task.id);
      }
      return;
    }
    
    // If not in selection mode, normal click behavior can go here
  };

  // Add handleCopyTitle function BACK
  const handleCopyTitle = (title) => {
    navigator.clipboard.writeText(title)
      .then(() => {
        showToast('Title copied to clipboard!');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        showToast('Failed to copy title to clipboard');
      });
  };

  return (
    <div 
      style={{
        position: 'relative',
        marginBottom: 16,
        opacity: task.isCompleted ? 0.7 : 1,
        transition: 'opacity 0.3s, box-shadow 0.3s',
        borderRadius: 6,
      }}
    >
      {/* Long press progress indicator */}
      {showLongPressAnimation && longPressProgress > 0 && !isSelectionMode && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${longPressProgress}%`,
          backgroundColor: 'var(--primary)',
          opacity: 0.3,
          borderRadius: 6,
          zIndex: 1,
          pointerEvents: 'none',
          transition: 'width 0.05s linear' // Change to linear animation
        }} />
      )}
      
      <div className="task-item-container" style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        background: isDragging ? 'var(--surfaceLight)' : (isCompleted ? 'var(--surface)' : 'var(--surfaceLight)'),
        boxShadow: isDragging ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: isSelected || isLongPressed ? '2px solid' : '1px solid var(--borderLight)',
        borderColor: isSelected ? 'var(--accent)' : (isLongPressed ? 'var(--primary)' : 'var(--borderLight)')
      }}>
      <div 
          onClick={handleTaskClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
          className={`task-item ${isDragging ? 'is-dragging' : ''} ${task.isCompleted ? 'completed' : ''}`}
        style={{ 
          padding: '14px 16px', 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: subtasks && subtasks.length > 0 && subtasksOpen ? '1px solid var(--borderLight)' : 'none',
          cursor: isSelectionMode ? 'pointer' : (isCompleted ? 'default' : 'grab'),
          position: 'relative',
          opacity: isCompleted ? 0.9 : 1,
          userSelect: 'none'
        }}
          {...(canDrag && !task.isCompleted && !isSelectionMode ? dragHandleProps : {})}
      >
        <div 
          className="task-checkbox" 
          onClick={handleToggleComplete}
        >
          {isCompleted ? (
            <MdCheckCircle size={22} color="var(--success)" />
          ) : (
            <MdRadioButtonUnchecked size={22} color="var(--textSecondary)" />
          )}
        </div>
        
        <div style={{ flex: 1, paddingLeft: 8 }}>
          <div 
            style={{ 
              fontSize: 16, 
              fontWeight: 500, 
              color: isCompleted ? 'var(--textSecondary)' : 'var(--text)',
              textDecoration: isCompleted ? 'line-through' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isStarred && (
              <MdStar 
                size={16} 
                color={isCompleted ? '#b8a100' : 'var(--warning)'} 
                style={{ marginRight: '4px' }}
              />
            )}
            {title}
          </div>
          
          {dueDate && (
            <div 
              style={{ 
                fontSize: 14, 
                color: isCompleted ? 'var(--textSecondary)' : 'var(--textSecondary)', 
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <MdAccessTime size={14} />
              {formatDueDate(dueDate)}
            </div>
          )}
        </div>
        
          {/* Add the Copy Title button next to Add Subtask button */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: '8px',
              gap: '8px'
            }}
          >
        {!isCompleted && (
            <button
                className="add-subtask-button"
                onClick={() => onAddSubtask(task.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--textSecondary)',
                padding: 8,
                borderRadius: 4
              }}
              title="Add subtask"
            >
                <MdAdd size={20} />
            </button>
            )}
            
            <button
              className="copy-title-button"
              onClick={() => handleCopyTitle(title)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--textSecondary)',
                padding: 8,
                borderRadius: 4
              }}
              title="Copy title to clipboard"
            >
              <MdContentCopy size={18} />
            </button>
            </div>
        
          {/* Subtasks dropdown button */}
        {subtasks && subtasks.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ 
              fontSize: '12px', 
              color: 'var(--textSecondary)',
              backgroundColor: 'var(--surface)',
              padding: '2px 6px',
              borderRadius: '10px',
              border: '1px solid var(--borderLight)'
            }}>
              {subtasks.length}
            </span>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCompleted ? 'var(--textSecondary)' : 'var(--text)',
                padding: 8,
                borderRadius: 4
              }}
              onClick={toggleSubtasks}
              title={subtasksOpen ? 'Hide subtasks' : 'Show subtasks'}
            >
              <MdExpandMore 
                size={24} 
                style={{ transform: subtasksOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              />
            </button>
          </div>
        )}
        
          {/* Options menu button */}
        <div style={{ position: 'relative' }}>
          <button
            ref={menuButtonRef}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isCompleted ? 'var(--textSecondary)' : 'var(--text)',
              padding: 8,
              borderRadius: 4
            }}
            onClick={handleMenuToggle}
            title="More options"
          >
            <MdMoreVert size={24} />
          </button>
          
          {/* Menu using Portal */}
          <MenuDropdown 
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
            position={menuPosition}
            task={task}
            isCompleted={isCompleted}
            onDelete={onDelete}
            onEdit={onEdit}
            menuButtonRef={menuButtonRef}
            onAddSubtask={onAddSubtask}
          />
        </div>
      </div>
      
      {/* Subtasks section with drag-and-drop */}
      {subtasksOpen && subtasks && subtasks.length > 0 && (
          <div style={{ 
            background: 'var(--surface)',
            overflow: 'hidden'
          }}>
            <Droppable droppableId={`subtasks-${id}`} type="SUBTASK">
              {(providedDroppable) => (
                <div
                  {...providedDroppable.droppableProps}
                  ref={providedDroppable.innerRef}
                >
                  {subtasks.map((subtask, index) => (
                    <Draggable 
                      key={subtask.id} 
                      draggableId={subtask.id} 
                      index={index}
                      isDragDisabled={subtask.isCompleted}
                      type="SUBTASK"
                    >
                      {(providedDraggable, snapshot) => (
                        <div
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                          {...providedDraggable.dragHandleProps}
                          className={snapshot.isDragging ? 'task-dragging' : ''}
                          style={{
                            ...providedDraggable.draggableProps.style,
                            paddingLeft: 32,
                            background: subtask.isCompleted ? 'var(--background)' : (snapshot.isDragging ? 'var(--surfaceLight)' : 'var(--surface)'),
                            borderBottom: index < subtasks.length - 1 ? '1px solid var(--borderLight)' : 'none',
                            cursor: subtask.isCompleted ? 'default' : 'grab'
                          }}
                        >
                          <div 
                            style={{
                              padding: '10px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: subtask.isCompleted ? 0.9 : 1
                            }}
                            className="task-item"
                            onContextMenu={(e) => handleSubtaskContextMenu(e, subtask.id)}
                          >
                            <div 
                              className="task-checkbox" 
                              onClick={() => handleToggleSubtaskComplete(subtask.id)}
                              style={{ flexShrink: 0 }}
                            >
                              {subtask.isCompleted ? (
                                <MdCheckCircle size={18} color="var(--success)" />
                              ) : (
                                <MdRadioButtonUnchecked size={18} color="var(--textSecondary)" />
                              )}
                            </div>
                            
                            <div style={{ 
                              flex: 1, 
                              fontSize: 14, 
                              color: subtask.isCompleted ? 'var(--textSecondary)' : 'var(--text)',
                              textDecoration: subtask.isCompleted ? 'line-through' : 'none',
                              paddingLeft: 8,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {subtask.title}
                            </div>
                            
                            {subtask.dueDate && (
                              <div style={{ 
                                fontSize: 12, 
                                color: subtask.isCompleted ? 'var(--textSecondary)' : 'var(--textSecondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginRight: 8
                              }}>
                                <MdAccessTime size={12} />
                                {formatDueDate(subtask.dueDate)}
                              </div>
                            )}
                            
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <button
                                ref={subtaskMenuId === subtask.id ? subtaskMenuButtonRef : null}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: subtask.isCompleted ? 'var(--textSecondary)' : 'var(--text)',
                                  padding: 4,
                                  borderRadius: 4
                                }}
                                onClick={(e) => handleSubtaskMenuToggle(e, subtask.id)}
                                title="More options"
                              >
                                <MdMoreVert size={16} />
                              </button>
                              
                              {/* Subtask Menu using Portal */}
                              {subtaskMenuId === subtask.id && (
                                <SubtaskMenuDropdown 
                                  isOpen={true}
                                  onClose={() => setSubtaskMenuId(null)}
                                  position={subtaskMenuPosition}
                                  taskId={id}
                                  subtaskId={subtask.id}
                                  onDelete={onDeleteSubtask}
                                  onEdit={onEditSubtask}
                                  menuButtonRef={subtaskMenuButtonRef}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {providedDroppable.placeholder}
                </div>
              )}
            </Droppable>
        </div>
      )}
      </div>
    </div>
  );
};

export default TaskItem; 