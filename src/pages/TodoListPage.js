import React, { useState, useEffect, useRef, useCallback } from 'react';
import TaskInput from '../components/TaskInput';
import TaskList from '../components/TaskList';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { MdCalendarToday, MdClose, MdEdit, MdAccessTime, MdToday } from 'react-icons/md';
import { checkForDueTasks, requestNotificationPermission } from '../utils/notifications';

// Import the TimeWheelPicker component from TaskInput.js
const TimeWheelPicker = ({ selectedTime, onChange }) => {
  // We need to copy this component here since it's not exported from TaskInput.js
  const [internalTime, setInternalTime] = useState(() => {
    const time = selectedTime || new Date();
    return {
      hours: time.getHours() % 12 || 12,
      minutes: Math.floor(time.getMinutes() / 5) * 5,
      period: time.getHours() >= 12 ? 'PM' : 'AM'
    };
  });
  
  // Add this useEffect to synchronize with selectedTime prop changes
  useEffect(() => {
    if (selectedTime) {
      setInternalTime({
        hours: selectedTime.getHours() % 12 || 12,
        minutes: Math.floor(selectedTime.getMinutes() / 5) * 5,
        period: selectedTime.getHours() >= 12 ? 'PM' : 'AM'
      });
    }
  }, [selectedTime]);
  
  // Refs for drag handling
  const hourWheelRef = useRef(null);
  const minuteWheelRef = useRef(null);
  const periodSelectorRef = useRef(null);
  
  // Track drag state without using state
  const dragState = useRef({
    hourDragging: false,
    hourStartY: 0,
    hourStartValue: 0,
    minuteDragging: false,
    minuteStartY: 0,
    minuteStartValue: 0
  });
  
  // Generate hours and minutes options
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);
  
  // Function to notify parent of changes
  const notifyChange = (updatedInternalTime) => { // Accepts updatedInternalTime
    if (!selectedTime) return;

    const newDate = new Date(selectedTime); // Start with current selectedTime for the date part

    // Use the passed updatedInternalTime
    const newHours = updatedInternalTime.period === 'PM'
      ? (updatedInternalTime.hours === 12 ? 12 : updatedInternalTime.hours + 12)
      : (updatedInternalTime.hours === 12 ? 0 : updatedInternalTime.hours);

    newDate.setHours(newHours);
    newDate.setMinutes(updatedInternalTime.minutes);
    newDate.setSeconds(0);

    onChange(newDate);
  };
  
  // Set up wheel event listeners
  useEffect(() => {
    // Event handling functions
    const handleHourWheelMouseDown = (e) => {
      dragState.current.hourDragging = true;
      dragState.current.hourStartY = e.clientY;
      dragState.current.hourStartValue = internalTime.hours;
      e.preventDefault();
    };
    
    const handleMinuteWheelMouseDown = (e) => {
      dragState.current.minuteDragging = true;
      dragState.current.minuteStartY = e.clientY;
      dragState.current.minuteStartValue = internalTime.minutes;
      e.preventDefault();
    };
    
    const handleMouseMove = (e) => {
      if (dragState.current.hourDragging) {
        const deltaY = e.clientY - dragState.current.hourStartY; 
        const newHour = Math.max(1, Math.min(12, 
          dragState.current.hourStartValue + Math.round(deltaY / 20)
        ));
        
        setInternalTime(prev => ({
          ...prev,
          hours: newHour
        }));
      }
      
      if (dragState.current.minuteDragging) {
        const deltaY = e.clientY - dragState.current.minuteStartY; 
        const newMinutes = Math.max(0, Math.min(55, 
          dragState.current.minuteStartValue + Math.round(deltaY / 20) * 5
        ));
        
        setInternalTime(prev => ({
          ...prev,
          minutes: newMinutes
        }));
      }
    };
    
    const handleEndDrag = () => {
      if (dragState.current.hourDragging || dragState.current.minuteDragging) {
        // Only notify parent component when drag ends
        notifyChange(internalTime);
      }
      
      dragState.current.hourDragging = false;
      dragState.current.minuteDragging = false;
    };
    
    // Handle wheel scroll events
    const handleHourWheel = (e) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      setInternalTime(prev => {
        const currentHour = prev.hours;
        const newHour = Math.max(1, Math.min(12, currentHour + direction));
        if (newHour !== currentHour) {
          const newTime = { ...prev, hours: newHour };
          notifyChange(newTime); // Call directly
          return newTime;
        }
        return prev;
      });
    };
    
    const handleMinuteWheel = (e) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      setInternalTime(prev => {
        const currentMinute = prev.minutes;
        const newMinute = Math.max(0, Math.min(55, currentMinute + (direction * 5)));
        if (newMinute !== currentMinute) {
          const newTime = { ...prev, minutes: newMinute };
          notifyChange(newTime); // Call directly
          return newTime;
        }
        return prev;
      });
    };
    
    const handlePeriodWheel = (e) => {
      e.preventDefault();
      setInternalTime(prev => {
        const newCalculatedPeriod = prev.period === 'AM' ? 'PM' : 'AM';
        const newTime = { ...prev, period: newCalculatedPeriod };
        notifyChange(newTime); // Call directly
        return newTime;
      });
    };
    
    // Add event listeners
    const hourWheel = hourWheelRef.current;
    const minuteWheel = minuteWheelRef.current;
    
    if (hourWheel) {
      hourWheel.addEventListener('mousedown', handleHourWheelMouseDown);
      hourWheel.addEventListener('wheel', handleHourWheel, { passive: false });
    }
    
    if (minuteWheel) {
      minuteWheel.addEventListener('mousedown', handleMinuteWheelMouseDown);
      minuteWheel.addEventListener('wheel', handleMinuteWheel, { passive: false });
    }
    
    // Get the period selector
    const periodSelector = periodSelectorRef.current;
    if (periodSelector) {
      periodSelector.addEventListener('wheel', handlePeriodWheel, { passive: false });
    }
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEndDrag);
    
    return () => {
      // Clean up listeners
      if (hourWheel) {
        hourWheel.removeEventListener('mousedown', handleHourWheelMouseDown);
        hourWheel.removeEventListener('wheel', handleHourWheel);
      }
      
      if (minuteWheel) {
        minuteWheel.removeEventListener('mousedown', handleMinuteWheelMouseDown);
        minuteWheel.removeEventListener('wheel', handleMinuteWheel);
      }
      
      if (periodSelector) {
        periodSelector.removeEventListener('wheel', handlePeriodWheel);
      }
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEndDrag);
    };
  }, [onChange, selectedTime]); // MODIFIED: Removed internalTime from dependencies
  
  // Handle click events directly
  const handleHourClick = (hour) => {
    const newTime = { ...internalTime, hours: hour };
    setInternalTime(newTime);
    notifyChange(newTime); // Pass newTime directly
  };
  
  const handleMinuteClick = (minute) => {
    const newTime = { ...internalTime, minutes: minute };
    setInternalTime(newTime);
    notifyChange(newTime); // Pass newTime directly
  };
  
  const handlePeriodClick = (newPeriod) => {
    const newTime = { ...internalTime, period: newPeriod };
    setInternalTime(newTime);
    notifyChange(newTime); // Pass newTime directly
  };
  
  return (
    <div className="time-wheel-container">
      <div className="time-wheel-header">
        Select Time
      </div>
      <div className="time-wheel-picker">
        {/* Hours wheel */}
        <div className="time-wheel" ref={hourWheelRef}>
          <div className="time-wheel-indicator"></div>
          {hourOptions.map(hour => (
            <div 
              key={`hour-${hour}`}
              className={`time-wheel-item ${internalTime.hours === hour ? 'time-wheel-selected' : ''}`}
              style={{ 
                transform: `translateY(${(internalTime.hours - hour) * 40}px)`,
                opacity: Math.abs(internalTime.hours - hour) > 2 ? 0.3 : 1
              }}
              onClick={() => handleHourClick(hour)}
            >
              {hour}
            </div>
          ))}
        </div>
        
        <div className="time-wheel-separator">:</div>
        
        {/* Minutes wheel */}
        <div className="time-wheel" ref={minuteWheelRef}>
          <div className="time-wheel-indicator"></div>
          {minuteOptions.map(min => (
            <div 
              key={`min-${min}`}
              className={`time-wheel-item ${internalTime.minutes === min ? 'time-wheel-selected' : ''}`}
              style={{ 
                transform: `translateY(${(internalTime.minutes - min) / 5 * 40}px)`,
                opacity: Math.abs(internalTime.minutes - min) > 15 ? 0.3 : 1
              }}
              onClick={() => handleMinuteClick(min)}
            >
              {min.toString().padStart(2, '0')}
            </div>
          ))}
        </div>
        
        {/* AM/PM selector */}
        <div className="time-period-selector" ref={periodSelectorRef}>
          <div 
            className={`time-period-option ${internalTime.period === 'AM' ? 'time-period-selected' : ''}`}
            onClick={() => handlePeriodClick('AM')}
          >
            AM
          </div>
          <div 
            className={`time-period-option ${internalTime.period === 'PM' ? 'time-period-selected' : ''}`}
            onClick={() => handlePeriodClick('PM')}
          >
            PM
          </div>
        </div>
      </div>
    </div>
  );
};

const TodoListPage = () => {
  const [tasks, setTasks] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState('');
  const [editedTaskDueDate, setEditedTaskDueDate] = useState(null);
  const [editedTaskIsStarred, setEditedTaskIsStarred] = useState(false);
  const [editIncludeDate, setEditIncludeDate] = useState(true);
  const [editIncludeTime, setEditIncludeTime] = useState(true);
  const [showEditCustomTimePicker, setShowEditCustomTimePicker] = useState(true);
  
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  
  // New state for subtasks
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [parentTaskId, setParentTaskId] = useState(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDueDate, setSubtaskDueDate] = useState(null);
  const [subtaskIncludeTime, setSubtaskIncludeTime] = useState(true);
  const [showSubtaskTimePicker, setShowSubtaskTimePicker] = useState(true);
  
  // Add new state for optional date in add subtask - default to false
  const [subtaskIncludeDate, setSubtaskIncludeDate] = useState(false);
  
  // New state for editing subtasks
  const [showEditSubtaskModal, setShowEditSubtaskModal] = useState(false);
  const [parentTaskIdForEdit, setParentTaskIdForEdit] = useState(null);
  const [subtaskToEdit, setSubtaskToEdit] = useState(null);
  const [editedSubtaskTitle, setEditedSubtaskTitle] = useState('');
  const [editedSubtaskDueDate, setEditedSubtaskDueDate] = useState(null);
  const [editSubtaskIncludeDate, setEditSubtaskIncludeDate] = useState(true);
  const [editSubtaskIncludeTime, setEditSubtaskIncludeTime] = useState(true);
  const [showEditSubtaskTimePicker, setShowEditSubtaskTimePicker] = useState(true);
  
  // Add state for settings
  const [settings, setSettings] = useState({
    showCompletedTasks: true,
    notificationsEnabled: true,
    autoSave: true,
    notificationThresholds: [60, 30, 5] // Default thresholds: 1 hour, 30 minutes, 5 minutes
  });
  
  // Add task grouping state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [longPressTaskId, setLongPressTaskId] = useState(null);
  const [taskGroups, setTaskGroups] = useState([]);
  const [showGroupRenameModal, setShowGroupRenameModal] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  
  // Add current date and time state
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Add state for group delete confirmation
  const [showGroupDeleteConfirmation, setShowGroupDeleteConfirmation] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  
  // Define the current version of the data structure
  const CURRENT_DATA_VERSION = 2;

  // Migration functions for each version upgrade
  const migrations = {
    // Migrate from unversioned to version 1
    0: (data) => {
      // Handle original unversioned data
      const tasks = Array.isArray(data) ? data : [];
      return {
        version: 1,
        tasks: tasks.map(task => ({
          ...task,
          id: task.id || Date.now().toString(),
          customOrder: task.customOrder !== undefined ? task.customOrder : null,
          subtasks: (task.subtasks || []).map(subtask => ({
            ...subtask,
            id: subtask.id || Date.now().toString(),
            parentId: task.id
          }))
        }))
      };
    },
    // Migrate from version 1 to version 2 (adding groups)
    1: (data) => {
      return {
        version: 2,
        tasks: data.tasks.map(task => ({
          ...task,
          groupOrder: task.groupOrder || {},
          subtasks: (task.subtasks || []).map(subtask => ({
            ...subtask,
            customOrder: subtask.customOrder !== undefined ? subtask.customOrder : null
          }))
        })),
        taskGroups: []
      };
    },
    // Template for future migrations
    // 2: (data) => {
    //   return {
    //     version: 3,
    //     // ... migrate data to version 3 format
    //   };
    // },
  };

  const migrateData = (storedData) => {
      try {
      // If data is just an array, it's the original unversioned format
      let currentData = Array.isArray(storedData) ? { version: 0, tasks: storedData } : storedData;
      
      // If no version property, assume version 0
      if (!currentData.version) {
        currentData = { version: 0, tasks: currentData.tasks || currentData };
      }

      // Apply migrations in sequence until we reach the current version
      while (currentData.version < CURRENT_DATA_VERSION) {
        const migrationFn = migrations[currentData.version];
        if (!migrationFn) {
          throw new Error(`No migration function found for version ${currentData.version}`);
        }
        console.log(`Migrating data from version ${currentData.version} to ${currentData.version + 1}`);
        currentData = migrationFn(currentData);
      }
      // Ensure isSubtasksOpen exists after all migrations
      if (currentData.tasks) {
        currentData.tasks = currentData.tasks.map(task => ({
          ...task,
          isSubtasksOpen: task.isSubtasksOpen || false
        }));
      }

      return currentData;
    } catch (error) {
      console.error('Error during data migration:', error);
      // Return a safe default state with current version
      return {
        version: CURRENT_DATA_VERSION,
        tasks: [],
        taskGroups: []
      };
    }
  };

  // Modify the useEffect that loads data to use the versioned migration
  useEffect(() => {
    try {
      // Load tasks
      const storedTasksData = localStorage.getItem('tasks');
      let migratedData = { version: CURRENT_DATA_VERSION, tasks: [], taskGroups: [] };

      if (storedTasksData) {
        const parsedData = JSON.parse(storedTasksData);
        migratedData = migrateData(parsedData);
        
        // Convert date strings back to Date objects
        const tasksWithDatesAndState = migratedData.tasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          isSubtasksOpen: task.isSubtasksOpen || false, // Ensure default here too for safety
          subtasks: task.subtasks?.map(subtask => ({
            ...subtask,
            dueDate: subtask.dueDate ? new Date(subtask.dueDate) : null
          })) || []
        }));
        
        setTasks(tasksWithDatesAndState);
      }

      // Load groups - only if they exist in storage
      const storedGroups = localStorage.getItem('taskGroups');
      if (storedGroups) {
        try {
          const parsedGroups = JSON.parse(storedGroups);
          setTaskGroups(parsedGroups);
      } catch (error) {
          console.error('Error parsing task groups:', error);
          setTaskGroups(migratedData.taskGroups);
        }
      } else {
        setTaskGroups(migratedData.taskGroups);
      }

      // Save migrated data back to storage
      if (storedTasksData) {
        localStorage.setItem('tasks', JSON.stringify({
          version: CURRENT_DATA_VERSION,
          tasks: migratedData.tasks
        }));
        if (!storedGroups) {
          localStorage.setItem('taskGroups', JSON.stringify(migratedData.taskGroups));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setTasks([]);
      setTaskGroups([]);
    }
  }, []);

  // Modify the save effect to use current version
  useEffect(() => {
    if (settings.autoSave) {
      const dataToSave = {
        version: CURRENT_DATA_VERSION,
        tasks: tasks
      };
      localStorage.setItem('tasks', JSON.stringify(dataToSave));
      localStorage.setItem('taskGroups', JSON.stringify(taskGroups));
    }
  }, [tasks, taskGroups, settings.autoSave]);

  // Request notification permission on component mount
  useEffect(() => {
    if (settings.notificationsEnabled) {
      requestNotificationPermission();
    }
  }, [settings.notificationsEnabled]);
  
  // Check for due tasks every minute if notifications are enabled
  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    
    // Check for due tasks immediately
    checkForDueTasks(tasks);
    
    // Set up interval to check for due tasks every minute
    const interval = setInterval(() => {
      checkForDueTasks(tasks);
    }, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, [tasks, settings.notificationsEnabled]);

  // Update current time every minute
  useEffect(() => {
    const timerID = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // 60000 ms = 1 minute
    
    return () => {
      clearInterval(timerID);
    };
  }, []);
  
  // Format date for display
  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };
  
  // Format time for display
  const formatTime = (date) => {
    const options = { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    };
    return date.toLocaleTimeString(undefined, options);
  };

  const handleAddTask = (newTask) => {
    setTasks(prevTasks => {
      // Check if we're in custom sort mode
      const isCustomSort = localStorage.getItem('taskSortOrder') === 'custom';
      const taskWithSubtaskState = { ...newTask, isSubtasksOpen: false }; // Add isSubtasksOpen
      
      // If in custom sort mode, find the minimum customOrder value and use a lower one
      if (isCustomSort) {
        // Find the minimum customOrder value of all tasks (completed and uncompleted)
        const minOrder = prevTasks.reduce((min, task) => {
          if (task.customOrder !== undefined) {
            return Math.min(min, task.customOrder);
          }
          return min;
        }, 0);
        
        // Add a customOrder property to place this task at the top
        const customOrderValue = minOrder - 10; // Use a lower value to ensure it's at the top
        
        // Add the new task with the lowest order value
        return [{ ...taskWithSubtaskState, customOrder: customOrderValue }, ...prevTasks];
      }
      
      // If not in custom sort mode, just add to the top
      return [taskWithSubtaskState, ...prevTasks];
    });
  };

  const toggleEditDateSelection = (e) => {
    e.stopPropagation();
    
    if (!editIncludeDate) {
      // When enabling date that was previously disabled
      setEditIncludeDate(true);
      // New date selections default to no time
      setEditIncludeTime(false);
      setShowEditCustomTimePicker(false);
    } else {
      // When disabling date
      setEditIncludeDate(false);
    }
  };
  
  const toggleEditTimeSelection = (e) => {
    // Prevent event from bubbling up which could cause the picker to close
    e.stopPropagation();
    setEditIncludeTime(!editIncludeTime);
    setShowEditCustomTimePicker(!editIncludeTime);
  };

  const toggleSubtaskTimeSelection = (e) => {
    // Prevent event from bubbling up which could cause the picker to close
    e.stopPropagation();
    setSubtaskIncludeTime(!subtaskIncludeTime);
    setShowSubtaskTimePicker(!subtaskIncludeTime);
  };

  // Edit Task Handlers
  const handleEditTask = (taskId) => {
    // Find the task to edit
    const taskToEdit = tasks.find(task => task.id === taskId);
    
    if (taskToEdit) {
      // Set the task to edit and populate the form
      setTaskToEdit(taskToEdit);
      setEditedTaskTitle(taskToEdit.title);
      setEditedTaskDueDate(taskToEdit.dueDate);
      setEditedTaskIsStarred(taskToEdit.isStarred);
      
      // Set date inclusion state based on task's due date
      setEditIncludeDate(!!taskToEdit.dueDate);
      
      // Set time inclusion state based on task's due date
      if (taskToEdit.dueDate) {
        const hasTime = taskToEdit.dueDate.getHours() !== 0 || taskToEdit.dueDate.getMinutes() !== 0;
        setEditIncludeTime(hasTime);
        setShowEditCustomTimePicker(hasTime);
      } else {
        // Default to no time for new tasks
        setEditIncludeTime(false);
        setShowEditCustomTimePicker(false);
      }
      
      // Show the edit modal
      setShowEditModal(true);
    }
  };
  
  const handleEditConfirm = () => {
    if (!taskToEdit || !editedTaskTitle.trim()) return;
    
    // Only use due date if include date is checked
    let updatedDueDate = null;
    if (editIncludeDate && editedTaskDueDate) {
      updatedDueDate = new Date(editedTaskDueDate);
      if (!editIncludeTime) {
        updatedDueDate.setHours(0, 0, 0, 0);
      }
    }
    
    // Update the task
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskToEdit.id 
          ? { 
              ...task, 
              title: editedTaskTitle.trim(),
              dueDate: updatedDueDate,
              isStarred: editedTaskIsStarred
            } 
          : task
      )
    );
    
    // Reset state
    setShowEditModal(false);
    setTaskToEdit(null);
    setEditedTaskTitle('');
    setEditedTaskDueDate(null);
    setEditedTaskIsStarred(false);
    setEditIncludeDate(true);
    setEditIncludeTime(true);
    setShowEditCustomTimePicker(true);
  };
  
  const handleEditCancel = () => {
    // Reset state without making changes
    setShowEditModal(false);
    setTaskToEdit(null);
    setEditedTaskTitle('');
    setEditedTaskDueDate(null);
    setEditedTaskIsStarred(false);
    setEditIncludeDate(true);
    setEditIncludeTime(true);
    setShowEditCustomTimePicker(true);
  };
  
  // Delete Task Handlers
  const handleDeleteTask = (taskId) => {
    // Find the task to delete
    const taskToDelete = tasks.find(task => task.id === taskId);
    
    if (taskToDelete) {
      // Set the task to delete and show the confirmation dialog
      setTaskToDelete(taskToDelete);
      setShowDeleteConfirmation(true);
    }
  };
  
  // Function to delete a task without confirmation (for batch operations)
  const deleteTaskWithoutConfirmation = (taskId) => {
    // Delete the task directly without confirmation
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };
  
  const handleDeleteConfirm = () => {
    if (!taskToDelete) return;
    
    // Delete the task
    deleteTaskWithoutConfirmation(taskToDelete.id);
    
    // Reset state
    setShowDeleteConfirmation(false);
    setTaskToDelete(null);
  };
  
  const handleDeleteCancel = () => {
    // Reset state without making changes
    setShowDeleteConfirmation(false);
    setTaskToDelete(null);
  };

  const handleToggleTaskComplete = (taskId) => {
    // Exit selection mode if active
    if (isSelectionMode) {
      exitSelectionMode();
    }
    
    setTasks(prevTasks => {
      // Find the task
      const taskIndex = prevTasks.findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) return prevTasks;
      
      const task = prevTasks[taskIndex];
      const isCurrentlyCompleted = task.isCompleted;
      
      // Create a new array without the task
      const tasksWithoutCurrent = prevTasks.filter(task => task.id !== taskId);
      
      // Check if we're in custom sort mode - get current sort from task list
      const isCustomSort = localStorage.getItem('taskSortOrder') === 'custom';
      
      // If unchecking a task in custom sort mode, need to assign lowest customOrder
      let customOrderValue;
      if (isCurrentlyCompleted && isCustomSort) {
        // Find the minimum customOrder value of all uncompleted tasks
        const minOrder = tasksWithoutCurrent.reduce((min, t) => {
          if (!t.isCompleted && t.customOrder !== undefined) {
            return Math.min(min, t.customOrder);
          }
          return min;
        }, 0);
        
        // Make this task appear at the top by giving it a lower order value
        customOrderValue = minOrder - 1;
      }
      
      // Update the task's completion status
      const updatedTask = { 
        ...task, 
        isCompleted: !isCurrentlyCompleted,
        // Add completedAt timestamp when completing a task, remove when unchecking
        completedAt: !isCurrentlyCompleted ? Date.now() : undefined,
        // If we're unchecking a completed task, update the ID to be the newest
        id: (!isCurrentlyCompleted) 
            ? task.id // Keep the same ID if completing a task
            : Date.now().toString(), // Give a new ID if unchecking to move to top
        // Add custom order property if we're in custom sort and unchecking
        ...(isCurrentlyCompleted && isCustomSort ? { customOrder: customOrderValue } : {})
      };
      
      // If a task is being unchecked (was completed and now is not),
      // put it at the top of the list. Otherwise, just update it in place.
      if (isCurrentlyCompleted) {
        return [updatedTask, ...tasksWithoutCurrent];
      } else {
        // If completing a task, just update it in place
        return [
          ...tasksWithoutCurrent.slice(0, taskIndex),
          updatedTask,
          ...tasksWithoutCurrent.slice(taskIndex)
        ];
      }
    });
  };

  const handleToggleSubtasks = (taskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, isSubtasksOpen: !task.isSubtasksOpen } 
          : task
      )
    );
  };

  // Handler for reordering tasks via drag-and-drop
  const handleTaskReorder = (result) => {
    // Handle the special case where we're preserving order during sort change
    if (result.type === 'preserveOrder') {
      // Update tasks with custom order values while maintaining their current state
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => {
          // Find if this task has a new custom order
          const taskWithOrder = result.tasks.find(t => t.id === task.id);
          if (taskWithOrder) {
            // Update with new custom order
            return {
              ...task,
              customOrder: taskWithOrder.customOrder
            };
          }
          // Leave completed tasks as they are
          return task;
        });
        
        // Sort the tasks by customOrder to ensure they're in the right order
        return updatedTasks.sort((a, b) => {
          if (a.isCompleted && !b.isCompleted) return 1;
          if (!a.isCompleted && b.isCompleted) return -1;
          if (a.isCompleted && b.isCompleted) {
            return (b.completedAt || 0) - (a.completedAt || 0);
          }
          return (a.customOrder ?? Infinity) - (b.customOrder ?? Infinity);
        });
      });
      return;
    }
    
    // Handle task updates for group reordering
    if (result.type === 'updateTasks') {
      setTasks(result.tasks);
      return;
    }
    
    // If dropped outside the list or no movement, do nothing
    if (!result.destination || result.source.index === result.destination.index) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    const reorderedTasks = [...tasks];
    // Get only the uncompleted tasks, as we only allow reordering of uncompleted tasks
    const uncompletedTasks = reorderedTasks.filter(task => !task.isCompleted);
    const completedTasks = reorderedTasks.filter(task => task.isCompleted);
    
    // Get the task that's being moved
    const [movedTask] = uncompletedTasks.splice(sourceIndex, 1);
    
    // Insert at the new position
    uncompletedTasks.splice(destinationIndex, 0, movedTask);
    
    // Add custom order property to tasks
    const updatedUncompletedTasks = uncompletedTasks.map((task, index) => ({
      ...task,
      customOrder: index // Add customOrder property for sorting
    }));
    
    // Combine uncompleted and completed tasks
    setTasks([...updatedUncompletedTasks, ...completedTasks]);
  };

  // Add Subtask Handlers
  const handleAddSubtask = (taskId) => {
    const parentTask = tasks.find(task => task.id === taskId);
    if (parentTask) {
      setParentTaskId(taskId);
      
      // Initialize with parent task's due date if it exists, but don't include date by default
      if (parentTask.dueDate) {
        setSubtaskDueDate(new Date(parentTask.dueDate));
        // Check if parent has time component
        const hasTime = parentTask.dueDate.getHours() !== 0 || parentTask.dueDate.getMinutes() !== 0;
        setSubtaskIncludeTime(hasTime);
        setShowSubtaskTimePicker(hasTime);
      } else {
        setSubtaskDueDate(new Date());
        setSubtaskIncludeTime(false);
        setShowSubtaskTimePicker(false);
      }
      
      setSubtaskTitle('');
      setSubtaskIncludeDate(false); // Always default to no due date for subtasks
      setShowSubtaskModal(true);
    }
  };
  
  const toggleSubtaskDateSelection = (e) => {
    e.stopPropagation();
    
    if (!subtaskIncludeDate) {
      // When enabling date that was previously disabled
      setSubtaskIncludeDate(true);
      // New date selections default to no time
      setSubtaskIncludeTime(false);
      setShowSubtaskTimePicker(false);
    } else {
      // When disabling date
      setSubtaskIncludeDate(false);
    }
  };
  
  const toggleEditSubtaskDateSelection = (e) => {
    e.stopPropagation();
    
    if (!editSubtaskIncludeDate) {
      // When enabling date that was previously disabled
      setEditSubtaskIncludeDate(true);
      // New date selections default to no time
      setEditSubtaskIncludeTime(false);
      setShowEditSubtaskTimePicker(false);
    } else {
      // When disabling date
      setEditSubtaskIncludeDate(false);
    }
  };
  
  const handleSubtaskConfirm = () => {
    if (!parentTaskId || !subtaskTitle.trim()) return;
    
    // Only use due date if include date is checked
    let dueDate = null;
    if (subtaskIncludeDate && subtaskDueDate) {
      dueDate = new Date(subtaskDueDate);
      if (!subtaskIncludeTime) {
        dueDate.setHours(0, 0, 0, 0);
      }
    }
    
    // Create new subtask
    const newSubtask = {
      id: Date.now().toString(),
      title: subtaskTitle.trim(),
      dueDate: dueDate,
      isCompleted: false,
      parentId: parentTaskId
    };
    
    // Add the subtask to the parent task
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === parentTaskId 
          ? { 
              ...task, 
              subtasks: [...(task.subtasks || []), newSubtask]
            } 
          : task
      )
    );
    
    // Reset state
    handleSubtaskCancel();
  };
  
  const handleSubtaskCancel = () => {
    setShowSubtaskModal(false);
    setParentTaskId(null);
    setSubtaskTitle('');
    setSubtaskDueDate(null);
    setSubtaskIncludeTime(true);
    setShowSubtaskTimePicker(true);
    setSubtaskIncludeDate(false); // Reset to false when canceling
  };
  
  const handleToggleSubtaskComplete = (taskId, subtaskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              subtasks: task.subtasks.map(subtask => 
                subtask.id === subtaskId 
                  ? { ...subtask, isCompleted: !subtask.isCompleted }
                  : subtask
              )
            } 
          : task
      )
    );
  };
  
  const handleDeleteSubtask = (taskId, subtaskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId)
            } 
          : task
      )
    );
  };
  
  const handleSubtaskReorder = useCallback((taskId, result) => {
    // If dropped outside the list or no movement, do nothing
    if (!result.destination || (result.source.droppableId === result.destination.droppableId && result.source.index === result.destination.index)) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id !== taskId) return task;
        
        const updatedSubtasks = task.subtasks ? [...task.subtasks] : [];
        const [movedSubtask] = updatedSubtasks.splice(sourceIndex, 1);
        // Ensure movedSubtask exists before splicing it back in
        if (movedSubtask) {
          updatedSubtasks.splice(destinationIndex, 0, movedSubtask);
        }
        
        // Add custom order property to subtasks
        const reorderedSubtasks = updatedSubtasks.map((subtask, index) => ({
          ...subtask,
          customOrder: index
        }));
        
        return {
          ...task,
          subtasks: reorderedSubtasks
        };
      })
    );
  }, [setTasks]); // setTasks from useState is stable

  // Add edit subtask handlers
  const handleEditSubtask = (taskId, subtaskId) => {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;
    
    const subtask = task.subtasks.find(subtask => subtask.id === subtaskId);
    if (!subtask) return;
    
    setParentTaskIdForEdit(taskId);
    setSubtaskToEdit(subtask);
    setEditedSubtaskTitle(subtask.title);
    setEditedSubtaskDueDate(subtask.dueDate);
    
    // Set date inclusion state based on subtask's due date
    setEditSubtaskIncludeDate(!!subtask.dueDate);
    
    if (subtask.dueDate) {
      const hasTime = subtask.dueDate.getHours() !== 0 || subtask.dueDate.getMinutes() !== 0;
      setEditSubtaskIncludeTime(hasTime);
      setShowEditSubtaskTimePicker(hasTime);
    } else {
      // Default to no time for subtasks without a date
      setEditSubtaskIncludeTime(false);
      setShowEditSubtaskTimePicker(false);
    }
    
    setShowEditSubtaskModal(true);
  };
  
  const handleEditSubtaskConfirm = () => {
    if (!parentTaskIdForEdit || !subtaskToEdit || !editedSubtaskTitle.trim()) return;
    
    // Only use due date if include date is checked
    let updatedDueDate = null;
    if (editSubtaskIncludeDate && editedSubtaskDueDate) {
      updatedDueDate = new Date(editedSubtaskDueDate);
      if (!editSubtaskIncludeTime) {
        updatedDueDate.setHours(0, 0, 0, 0);
      }
    }
    
    // Update the subtask
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === parentTaskIdForEdit 
          ? { 
              ...task, 
              subtasks: task.subtasks.map(subtask => 
                subtask.id === subtaskToEdit.id 
                  ? {
                      ...subtask,
                      title: editedSubtaskTitle.trim(),
                      dueDate: updatedDueDate
                    } 
                  : subtask
              )
            } 
          : task
      )
    );
    
    // Reset state
    handleEditSubtaskCancel();
  };
  
  const handleEditSubtaskCancel = () => {
    setShowEditSubtaskModal(false);
    setParentTaskIdForEdit(null);
    setSubtaskToEdit(null);
    setEditedSubtaskTitle('');
    setEditedSubtaskDueDate(null);
    setEditSubtaskIncludeDate(true);
    setEditSubtaskIncludeTime(true);
    setShowEditSubtaskTimePicker(true);
  };
  
  const toggleEditSubtaskTimeSelection = (e) => {
    e.stopPropagation();
    setEditSubtaskIncludeTime(!editSubtaskIncludeTime);
    setShowEditSubtaskTimePicker(!editSubtaskIncludeTime);
  };

  // Filter tasks based on settings
  const getFilteredTasks = () => {
    if (settings.showCompletedTasks) {
      return tasks;
    } else {
      return tasks.filter(task => !task.isCompleted);
    }
  };

  // Task Group Management Functions
  const handleTaskLongPress = (taskId) => {
    if (isSelectionMode) return;
    
    // Set the task that initiated the long press
    setLongPressTaskId(taskId);
    
    // Enter selection mode
    setIsSelectionMode(true);
    
    // Add the long-pressed task to selected tasks
    setSelectedTaskIds([taskId]);
  };

  const handleTaskSelection = (taskId) => {
    if (!isSelectionMode) return;
    
    // If the task is already the long-pressed task, cancel selection mode
    if (taskId === longPressTaskId) {
      exitSelectionMode();
      return;
    }
    
    // Add or remove the task from selection
    setSelectedTaskIds(prev => {
      // If the task is already selected, remove it
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      }
      
      // If this is a second task being selected, add it and later create a group
      if (prev.length === 1 && !prev.includes(taskId)) {
        // Add the task to selection
        const newSelection = [...prev, taskId];
        
        // Create a group immediately
        setTimeout(() => {
          // Create a new group
          const newGroup = {
            id: Date.now().toString(),
            name: `Group ${taskGroups.length + 1}`,
            taskIds: [...newSelection]
          };
          
          // Add the new group
          setTaskGroups(prevGroups => [...prevGroups, newGroup]);
          
          // Exit selection mode
          exitSelectionMode();
        }, 0);
        
        return newSelection;
      }
      
      return prev;
    });
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedTaskIds([]);
    setLongPressTaskId(null);
  };

  const handleOpenGroupRename = (groupId) => {
    const group = taskGroups.find(g => g.id === groupId);
    if (!group) return;
    
    setCurrentGroupId(groupId);
    setGroupNameInput(group.name);
    setShowGroupRenameModal(true);
  };

  const handleGroupRename = () => {
    if (!currentGroupId || !groupNameInput.trim()) return;
    
    setTaskGroups(prev => prev.map(group => 
      group.id === currentGroupId 
        ? { ...group, name: groupNameInput.trim() } 
        : group
    ));
    
    setShowGroupRenameModal(false);
    setCurrentGroupId(null);
    setGroupNameInput('');
  };

  const handleCancelGroupRename = () => {
    setShowGroupRenameModal(false);
    setCurrentGroupId(null);
    setGroupNameInput('');
  };

  const handleAddTaskToGroup = (taskId, groupId) => {
    setTaskGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, taskIds: [...group.taskIds, taskId] } 
        : group
    ));
  };

  const handleRemoveTaskFromGroup = (taskId, groupId) => {
    setTaskGroups(prev => {
      const updatedGroups = prev.map(group => {
        if (group.id === groupId) {
          const updatedTaskIds = group.taskIds.filter(id => id !== taskId);
          
          // Keep the group even if it has only one task
          return { ...group, taskIds: updatedTaskIds };
        }
        return group;
      });
      
      return updatedGroups;
    });
  };

  const handleDeleteGroup = (groupId) => {
    // Set the group to delete and show confirmation dialog
    const groupToDelete = taskGroups.find(group => group.id === groupId);
    if (groupToDelete) {
      setGroupToDelete(groupToDelete);
      setShowGroupDeleteConfirmation(true);
    }
  };
  
  const handleGroupDeleteConfirm = () => {
    if (!groupToDelete) return;
    
    // Delete the group
    setTaskGroups(prev => prev.filter(group => group.id !== groupToDelete.id));
    
    // Reset state
    setShowGroupDeleteConfirmation(false);
    setGroupToDelete(null);
  };
  
  const handleGroupDeleteCancel = () => {
    // Reset state without making changes
    setShowGroupDeleteConfirmation(false);
    setGroupToDelete(null);
  };

  const isTaskInAnyGroup = (taskId) => {
    return taskGroups.some(group => group.taskIds.includes(taskId));
  };

  const getTaskGroup = (taskId) => {
    return taskGroups.find(group => group.taskIds.includes(taskId));
  };

  const handleTabClick = (tabId) => {
    // Exit selection mode if active
    if (isSelectionMode) {
      exitSelectionMode();
    }
    
    // setActiveTab(tabId); // Assuming setActiveTab is defined elsewhere or this line is a placeholder
  };

  const [isDateTimeSticky, setIsDateTimeSticky] = useState(false);
  const stickyRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        setIsDateTimeSticky(!entry.isIntersecting);
      },
      { root: null, threshold: 0 }
    );
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => {
      if (sentinelRef.current) observer.unobserve(sentinelRef.current);
    };
  }, []);

  return (
    <div className="todo-page-container">
      {/* Sentinel for sticky detection - placed just above the sticky element */}
      <div ref={sentinelRef} style={{ height: 1, width: '100%' }} />
      {/* Current date and time display */}
      <div
        ref={stickyRef}
        className={`date-time-wrapper${isDateTimeSticky ? ' sticky-popped' : ''}`}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--textSecondary)',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          <MdToday size={16} />
          <span>{formatDate(currentDateTime)}</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--textSecondary)',
          fontSize: '14px'
        }}>
          <MdAccessTime size={16} />
          <span>{formatTime(currentDateTime)}</span>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h2 className="todo-list-title">TODO LIST</h2>
      </div>
      
      <TaskInput onAddTask={handleAddTask} />
      
      <TaskList 
        tasks={getFilteredTasks()} 
        onToggleTaskComplete={handleToggleTaskComplete} 
        onToggleSubtasks={handleToggleSubtasks}
        onDeleteTask={handleDeleteTask}
        onBulkDeleteTasks={deleteTaskWithoutConfirmation}
        onEditTask={handleEditTask}
        onTaskReorder={handleTaskReorder}
        onAddSubtask={handleAddSubtask}
        onToggleSubtaskComplete={handleToggleSubtaskComplete}
        onDeleteSubtask={handleDeleteSubtask}
        onSubtaskReorder={handleSubtaskReorder}
        onEditSubtask={handleEditSubtask}
        isSelectionMode={isSelectionMode}
        selectedTaskIds={selectedTaskIds}
        longPressTaskId={longPressTaskId}
        taskGroups={taskGroups}
        onTaskLongPress={handleTaskLongPress}
        onTaskSelection={handleTaskSelection}
        onCancelSelection={exitSelectionMode}
        onRenameGroup={handleOpenGroupRename}
        onDeleteGroup={handleDeleteGroup}
        onAddToGroup={handleAddTaskToGroup}
        onRemoveFromGroup={handleRemoveTaskFromGroup}
      />
      
      {/* Group rename modal */}
      {showGroupRenameModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '8px',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.2)',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '20px' 
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text)' }}>Rename Group</h2>
              <button 
                onClick={handleCancelGroupRename}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--textSecondary)'
                }}
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '8px', color: 'var(--textSecondary)', fontSize: '14px' }}>
                Group Name:
              </div>
              <input
                type="text"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && groupNameInput.trim()) {
                    handleGroupRename();
                  }
                }}
                placeholder="Enter group name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  backgroundColor: 'var(--surfaceLight)',
                  color: 'var(--text)',
                  fontSize: 16,
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end'
            }}>
              <button 
                onClick={handleCancelGroupRename}
                style={{
                  backgroundColor: 'var(--surfaceLight)',
                  color: 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleGroupRename}
                disabled={!groupNameInput.trim()}
                style={{
                  backgroundColor: !groupNameInput.trim() ? 'var(--surfaceLight)' : 'var(--primary)',
                  color: !groupNameInput.trim() ? 'var(--textSecondary)' : 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: !groupNameInput.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Group Delete Confirmation */}
      {showGroupDeleteConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '8px',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.2)',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid var(--border)'
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '20px', color: 'var(--text)' }}>Delete Group</h2>
            <p style={{ color: 'var(--textSecondary)', marginBottom: '24px' }}>
              Are you sure you want to delete the group "{groupToDelete?.name}"? 
              This will not delete the tasks in the group.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleGroupDeleteCancel}
                style={{
                  backgroundColor: 'var(--surfaceLight)',
                  color: 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleGroupDeleteConfirm}
                style={{
                  backgroundColor: 'var(--error)',
                  color: 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Task Modal with updated UI */}
      {showEditModal && taskToEdit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '8px',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.2)',
            padding: '24px',
            width: '90%',
            maxWidth: '550px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid var(--border)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '20px' 
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text)' }}>Edit Task</h2>
              <button 
                onClick={handleEditCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--textSecondary)'
                }}
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', color: 'var(--textSecondary)', fontSize: '14px' }}>
                Task Title:
              </div>
              <input
                type="text"
                value={editedTaskTitle}
                onChange={(e) => setEditedTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editedTaskTitle.trim()) {
                    handleEditConfirm();
                  }
                }}
                className="modal-input"
                autoFocus
              />
            </div>
            
            <div style={{ 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <input
                type="checkbox"
                id="editTaskIncludeDate"
                checked={editIncludeDate}
                onChange={(e) => {
                  e.stopPropagation();
                  if (!editIncludeDate) {
                    // When enabling date that was previously disabled
                    setEditIncludeDate(true);
                    if (!editedTaskDueDate) {
                      setEditedTaskDueDate(new Date());
                    }
                    setEditIncludeTime(false);
                    setShowEditCustomTimePicker(false);
                  } else {
                    // When disabling date
                    setEditIncludeDate(false);
                  }
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <label 
                htmlFor="editTaskIncludeDate"
                style={{ color: 'var(--text)', cursor: 'pointer' }}
              >
                Include due date
              </label>
            </div>
            
            {/* Calendar & time picker side by side - only shown if date is included */}
            {editIncludeDate && (
              <div className="date-time-layout">
                {/* Calendar */}
                <div>
                  <DatePicker
                    selected={editedTaskDueDate || new Date()}
                    onChange={(date) => setEditedTaskDueDate(date)}
                    inline
                    calendarClassName="custom-calendar"
                    showTimeSelect={false}
                  />
                </div>
                
                {/* Use the TimeWheelPicker component */}
                {showEditCustomTimePicker && (
                  <TimeWheelPicker 
                    selectedTime={editedTaskDueDate || new Date()} 
                    onChange={(date) => setEditedTaskDueDate(date)}
                  />
                )}
              </div>
            )}
            
            {/* Starred Checkbox */}
            <div style={{ 
              marginTop: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <input
                type="checkbox"
                id="editTaskStarred"
                checked={editedTaskIsStarred}
                onChange={(e) => setEditedTaskIsStarred(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <label 
                htmlFor="editTaskStarred"
                style={{ color: 'var(--text)', cursor: 'pointer' }}
              >
                Mark as important (starred)
              </label>
            </div>
            
            {/* Buttons row */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginTop: '24px',
              justifyContent: 'flex-end'
            }}>
              {editIncludeDate && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setEditIncludeTime(!editIncludeTime);
                    setShowEditCustomTimePicker(!editIncludeTime);
                  }}
                  style={{
                    backgroundColor: 'var(--surfaceLight)',
                    color: 'var(--text)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MdAccessTime size={18} />
                  {editIncludeTime ? 'Remove Time' : 'Add Time'}
                </button>
              )}
              
              <button
                onClick={handleEditCancel}
                style={{
                  backgroundColor: 'var(--surfaceLight)',
                  color: 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleEditConfirm}
                disabled={!editedTaskTitle.trim()}
                style={{
                  backgroundColor: !editedTaskTitle.trim() ? 'var(--surfaceLight)' : 'var(--primary)',
                  color: !editedTaskTitle.trim() ? 'var(--textSecondary)' : 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: !editedTaskTitle.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '8px',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.2)',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid var(--border)'
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '20px', color: 'var(--text)' }}>Confirm Delete</h2>
            <p style={{ color: 'var(--textSecondary)', marginBottom: '24px' }}>
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleDeleteCancel}
                style={{
                  backgroundColor: 'var(--surfaceLight)',
                  color: 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleDeleteConfirm}
                style={{
                  backgroundColor: 'var(--error)',
                  color: 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Subtask Modal - Modified to make date optional */}
      {showSubtaskModal && parentTaskId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '8px',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.2)',
            padding: '24px',
            width: '90%',
            maxWidth: '550px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid var(--border)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '20px' 
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text)' }}>Add Subtask</h2>
              <button 
                onClick={handleSubtaskCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--textSecondary)'
                }}
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', color: 'var(--textSecondary)', fontSize: '14px' }}>
                Subtask Title:
              </div>
              <input
                type="text"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && subtaskTitle.trim()) {
                    handleSubtaskConfirm();
                  }
                }}
                className="modal-input"
                autoFocus
              />
            </div>
            
            {/* Due Date Checkbox */}
            <div style={{ 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <input
                type="checkbox"
                id="subtaskIncludeDate"
                checked={subtaskIncludeDate}
                onChange={toggleSubtaskDateSelection}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <label 
                htmlFor="subtaskIncludeDate"
                style={{ color: 'var(--text)', cursor: 'pointer' }}
              >
                Include due date
              </label>
            </div>
            
            {/* Calendar & time picker side by side - only shown if date is included */}
            {subtaskIncludeDate && (
              <div className="date-time-layout">
                {/* Calendar */}
                <div>
                  <DatePicker
                    selected={subtaskDueDate || new Date()}
                    onChange={(date) => setSubtaskDueDate(date)}
                    inline
                    calendarClassName="custom-calendar"
                    showTimeSelect={false}
                  />
                </div>
                
                {/* Use the TimeWheelPicker component */}
                {showSubtaskTimePicker && (
                  <TimeWheelPicker 
                    selectedTime={subtaskDueDate || new Date()} 
                    onChange={(date) => setSubtaskDueDate(date)}
                  />
                )}
              </div>
            )}
            
            {/* Buttons row */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginTop: '24px',
              justifyContent: 'flex-end'
            }}>
              {subtaskIncludeDate && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setSubtaskIncludeTime(!subtaskIncludeTime);
                    setShowSubtaskTimePicker(!subtaskIncludeTime);
                  }}
                  style={{
                    backgroundColor: 'var(--surfaceLight)',
                    color: 'var(--text)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MdAccessTime size={18} />
                  {subtaskIncludeTime ? 'Remove Time' : 'Add Time'}
                </button>
              )}
              
              <button
                onClick={handleSubtaskCancel}
                style={{
                  backgroundColor: 'var(--surfaceLight)',
                  color: 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleSubtaskConfirm}
                disabled={!subtaskTitle.trim()}
                style={{
                  backgroundColor: !subtaskTitle.trim() ? 'var(--surfaceLight)' : 'var(--primary)',
                  color: !subtaskTitle.trim() ? 'var(--textSecondary)' : 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: !subtaskTitle.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                Add Subtask
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Subtask Modal */}
      {showEditSubtaskModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '8px',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.2)',
            padding: '24px',
            width: '90%',
            maxWidth: '550px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text)' }}>Edit Subtask</h2>
              <button
                onClick={handleEditSubtaskCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--textSecondary)'
                }}
              >
                <MdClose size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', color: 'var(--textSecondary)', fontSize: '14px' }}>
                Subtask Title:
              </div>
              <input
                type="text"
                value={editedSubtaskTitle}
                onChange={(e) => setEditedSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editedSubtaskTitle.trim()) {
                    handleEditSubtaskConfirm();
                  }
                }}
                className="modal-input"
                autoFocus
              />
            </div>

            <div style={{ 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <input
                type="checkbox"
                id="editSubtaskIncludeDate"
                checked={editSubtaskIncludeDate}
                onChange={toggleEditSubtaskDateSelection}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <label 
                htmlFor="editSubtaskIncludeDate"
                style={{ color: 'var(--text)', cursor: 'pointer' }}
              >
                Include due date
              </label>
            </div>
            
            {/* Calendar & time picker side by side - only shown if date is included */}
            {editSubtaskIncludeDate && (
              <div className="date-time-layout">
                {/* Calendar */}
                <div>
                  <DatePicker
                    selected={editedSubtaskDueDate || new Date()}
                    onChange={(date) => setEditedSubtaskDueDate(date)}
                    inline
                    calendarClassName="custom-calendar"
                    showTimeSelect={false}
                  />
                </div>
                
                {/* Use the TimeWheelPicker component */}
                {showEditSubtaskTimePicker && (
                  <TimeWheelPicker 
                    selectedTime={editedSubtaskDueDate || new Date()} 
                    onChange={(date) => setEditedSubtaskDueDate(date)}
                  />
                )}
              </div>
            )}
            
            {/* Buttons row */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginTop: '24px',
              justifyContent: 'flex-end'
            }}>
              {editSubtaskIncludeDate && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleEditSubtaskTimeSelection(e);
                  }}
                  style={{
                    backgroundColor: 'var(--surfaceLight)',
                    color: 'var(--text)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MdAccessTime size={18} />
                  {editSubtaskIncludeTime ? 'Remove Time' : 'Add Time'}
                </button>
              )}
              
              <button
                onClick={handleEditSubtaskCancel}
                style={{
                  backgroundColor: 'var(--surfaceLight)',
                  color: 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleEditSubtaskConfirm}
                disabled={!editedSubtaskTitle.trim()}
                style={{
                  backgroundColor: !editedSubtaskTitle.trim() ? 'var(--surfaceLight)' : 'var(--primary)',
                  color: !editedSubtaskTitle.trim() ? 'var(--textSecondary)' : 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: !editedSubtaskTitle.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoListPage; 