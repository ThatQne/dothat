import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { MdCalendarToday, MdStar, MdStarBorder, MdAccessTime, MdAdd, MdClose, MdOutlineRemoveCircle } from 'react-icons/md';
import { processDueDateText } from '../utils/dateParser';

// Custom time wheel picker component with drag support
const TimeWheelPicker = ({ selectedTime, onChange }) => {
  // Store a reference to the selectedTime to avoid creating dependencies for useEffect
  const timeRef = useRef(selectedTime || new Date());
  const [internalTime, setInternalTime] = useState(() => {
    const time = selectedTime || new Date();
    return {
      hours: time.getHours() % 12 || 12,
      minutes: Math.floor(time.getMinutes() / 5) * 5,
      period: time.getHours() >= 12 ? 'PM' : 'AM'
    };
  });
  
  // Update internalTime when selectedTime changes
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
    // Hour wheel event handling
    const handleHourWheelMouseDown = (e) => {
      dragState.current.hourDragging = true;
      dragState.current.hourStartY = e.clientY;
      dragState.current.hourStartValue = internalTime.hours;
      e.preventDefault();
    };
    
    const handleHourWheelTouchStart = (e) => {
      dragState.current.hourDragging = true;
      dragState.current.hourStartY = e.touches[0].clientY;
      dragState.current.hourStartValue = internalTime.hours;
      e.preventDefault();
    };
    
    // Minute wheel event handling
    const handleMinuteWheelMouseDown = (e) => {
      dragState.current.minuteDragging = true;
      dragState.current.minuteStartY = e.clientY;
      dragState.current.minuteStartValue = internalTime.minutes;
      e.preventDefault();
    };
    
    const handleMinuteWheelTouchStart = (e) => {
      dragState.current.minuteDragging = true;
      dragState.current.minuteStartY = e.touches[0].clientY;
      dragState.current.minuteStartValue = internalTime.minutes;
      e.preventDefault();
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
      const newPeriod = internalTime.period === 'AM' ? 'PM' : 'AM'; // Read latest internalTime for toggle logic
      setInternalTime(prev => {
        // Ensure we use the 'prev' for constructing newTime if period changed
        // but prefer the direct internalTime read for determining the toggle, 
        // as 'prev' inside setInternalTime might not be what we want for a simple toggle decision.
        // However, for consistency and to avoid stale closure, we can make newPeriod calculation inside.
        const newCalculatedPeriod = prev.period === 'AM' ? 'PM' : 'AM';
        const newTime = { ...prev, period: newCalculatedPeriod };
        notifyChange(newTime); // Call directly
        return newTime;
      });
    };
    
    // Global move and end handlers
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
    
    const handleTouchMove = (e) => {
      if (dragState.current.hourDragging || dragState.current.minuteDragging) {
        e.preventDefault();
      }
      
      if (dragState.current.hourDragging) {
        const deltaY = dragState.current.hourStartY - e.touches[0].clientY; // Reversed direction for touch
        const newHour = Math.max(1, Math.min(12, 
          dragState.current.hourStartValue + Math.round(deltaY / 20)
        ));
        
        setInternalTime(prev => ({
          ...prev,
          hours: newHour
        }));
      }
      
      if (dragState.current.minuteDragging) {
        const deltaY = dragState.current.minuteStartY - e.touches[0].clientY; // Reversed direction for touch
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
    
    // Add event listeners for the wheel events
    const hourWheel = hourWheelRef.current;
    const minuteWheel = minuteWheelRef.current;
    const periodSelector = periodSelectorRef.current;
    
    if (hourWheel) {
      hourWheel.addEventListener('mousedown', handleHourWheelMouseDown);
      hourWheel.addEventListener('touchstart', handleHourWheelTouchStart, { passive: false });
      hourWheel.addEventListener('wheel', handleHourWheel, { passive: false });
    }
    
    if (minuteWheel) {
      minuteWheel.addEventListener('mousedown', handleMinuteWheelMouseDown);
      minuteWheel.addEventListener('touchstart', handleMinuteWheelTouchStart, { passive: false });
      minuteWheel.addEventListener('wheel', handleMinuteWheel, { passive: false });
    }
    
    if (periodSelector) {
      periodSelector.addEventListener('wheel', handlePeriodWheel, { passive: false });
    }
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('mouseup', handleEndDrag);
    window.addEventListener('touchend', handleEndDrag);
    
    return () => {
      // Clean up listeners
      if (hourWheel) {
        hourWheel.removeEventListener('mousedown', handleHourWheelMouseDown);
        hourWheel.removeEventListener('touchstart', handleHourWheelTouchStart);
        hourWheel.removeEventListener('wheel', handleHourWheel);
      }
      
      if (minuteWheel) {
        minuteWheel.removeEventListener('mousedown', handleMinuteWheelMouseDown);
        minuteWheel.removeEventListener('touchstart', handleMinuteWheelTouchStart);
        minuteWheel.removeEventListener('wheel', handleMinuteWheel);
      }
      
      if (periodSelector) {
        periodSelector.removeEventListener('wheel', handlePeriodWheel);
      }
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleEndDrag);
      window.removeEventListener('touchend', handleEndDrag);
    };
  }, [onChange, selectedTime]);
  
  // Handle click events directly (not in useEffect)
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

// Helper function to check if a date is overdue
function isTaskOverdue(date) {
  if (!date) return false;
  
  const now = new Date();
  const taskDate = new Date(date);
  
  // If task has a time component, check including time
  if (taskDate.getHours() !== 0 || taskDate.getMinutes() !== 0) {
    return taskDate < now;
  }
  
  // Otherwise just check the date part
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return taskDate < today;
}

const TaskInput = ({ onAddTask }) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [isStarred, setIsStarred] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showNewSubtaskInput, setShowNewSubtaskInput] = useState(false);
  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState(-1);
  const [includeTime, setIncludeTime] = useState(false);
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [isAddAnimating, setIsAddAnimating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [includeDate, setIncludeDate] = useState(false);
  const [subtaskIncludeDate, setSubtaskIncludeDate] = useState(false);
  
  const inputRef = useRef(null);
  const datePickerButtonRef = useRef(null);
  const timePickerButtonRef = useRef(null);
  const datePickerRef = useRef(null);
  const subtaskInputRef = useRef(null);
  const subtaskDatePickerRefs = useRef([]);
  
  // Calculate position for date picker based on calendar button position
  const calculateDatePickerPosition = () => {
    const calendarButton = document.querySelector('.calendar-button');
    if (calendarButton) {
      const rect = calendarButton.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // Calculate a more centered position
      let leftPosition = rect.left;
      
      // If there's enough space on the right, center the calendar
      const calendarWidth = 550; // max width of calendar
      
      // Check if calendar would go off screen on the right
      if (leftPosition + calendarWidth > viewportWidth - 20) {
        // Align to the right of the screen with some padding
        leftPosition = Math.max(20, viewportWidth - calendarWidth - 20);
      }
      
      // Make sure calendar doesn't go off left edge either
      leftPosition = Math.max(20, leftPosition);
      
      return {
        top: rect.bottom + 5,
        left: leftPosition
      };
    }
    
    // Default to a centered position if button not found
    return {
      top: 160,
      left: Math.max(20, (window.innerWidth - 550) / 2)
    };
  };
  
  // Store date picker position
  const [datePickerPosition, setDatePickerPosition] = useState({ top: 160, left: 20 });
  
  // Update position when showing date picker
  useEffect(() => {
    if (showDatePicker) {
      setDatePickerPosition(calculateDatePickerPosition());
    }
  }, [showDatePicker]);
  
  // Update current time every minute to refresh relative time displays
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Handle clicks outside the date picker to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      const isInsideDatePicker = datePickerRef.current && datePickerRef.current.contains(e.target);
      const clickedCalendarButton = e.target.closest('.calendar-button');
      
      if (!isInsideDatePicker && !clickedCalendarButton && showDatePicker) {
        setShowDatePicker(false);
      }
    };
    
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showDatePicker) {
        setShowDatePicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showDatePicker]);
  
  // Handle input change with date parsing
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Update the task title without removing date text
    setTaskTitle(inputValue);
    
    // Check if the input contains a date reference to update preview
    const { dueDate: parsedDate } = processDueDateText(inputValue);
    
    // If a date was detected in the text, update the dueDate state for preview
    if (parsedDate) {
      setDueDate(parsedDate);
      setIncludeDate(true); // Show the date preview
    } else {
      // Clear the date if no valid date is found in the text
      setDueDate(null);
      setIncludeDate(false);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (taskTitle.trim() === '') return;
    
    setIsAddAnimating(true);
    
    // Process any date references in the title before submitting
    const { updatedText, dueDate: parsedDate } = processDueDateText(taskTitle);
    
    // Only use due date if include date is checked or if we just parsed a date
    let finalDueDate = null;
    if ((includeDate && dueDate) || parsedDate) {
      finalDueDate = parsedDate || new Date(dueDate);
      if (!includeTime) {
        finalDueDate.setHours(0, 0, 0, 0);
      }
    }
    
    // Create the task object with all properties
    const newTask = {
      id: Date.now().toString(),
      title: updatedText.trim() || taskTitle.trim(), // Fallback to original text if updatedText is empty
      dueDate: finalDueDate,
      isCompleted: false,
      isStarred,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Only add subtasks if there are any
    if (subtasks.length > 0) {
      newTask.subtasks = subtasks.map(subtask => ({
        ...subtask,
        id: subtask.id || Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)
      }));
    }
    
    // Reduced delay to just enough for visual feedback
    setTimeout(() => {
      // Add the task
      onAddTask(newTask);
      
      // Reset form
      setTaskTitle('');
      setDueDate(null);
      setIsStarred(false);
      setShowDatePicker(false);
      setShowTimePicker(false);
      setShowCustomTimePicker(false);
      setIsAddAnimating(false);
      setIncludeTime(false);
      setIncludeDate(false);
      setSubtasks([]);
      setNewSubtaskText('');
      setShowNewSubtaskInput(false);
      setEditingSubtaskIndex(-1);
      
      // Focus the input for the next task
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50); // Reduced from 200ms to 50ms
  };
  
  const toggleDateSelection = () => {
    if (!includeDate) {
      // When enabling date that was previously disabled
      setIncludeDate(true);
      
      // When enabling dates, initialize with today's date if not already set
      if (!dueDate) {
        setDueDate(new Date());
      }
      
      // New date selections default to no time
      setIncludeTime(false);
      setShowCustomTimePicker(false);
    } else {
      // When disabling date
      setIncludeDate(false);
    }
  };
  
  const toggleTimeSelection = (e) => {
    // Prevent event from bubbling up which could cause the picker to close
    e.stopPropagation();
    setIncludeTime(!includeTime);
    setShowCustomTimePicker(!includeTime);
  };
  
  const handleDateChange = (date) => {
    // Preserve time if we already had a date with time
    if (dueDate && includeTime) {
      const newDate = new Date(date);
      newDate.setHours(dueDate.getHours());
      newDate.setMinutes(dueDate.getMinutes());
      newDate.setSeconds(0);
      setDueDate(newDate);
    } else {
      // Just set the date directly
      setDueDate(date);
    }
  };
  
  const handleTimeChange = (date) => {
    // Ensure we update both dueDate and includeTime when time is changed
    setDueDate(date);
    setIncludeTime(true);
  };
  
  const handleRemoveDueDate = (e) => {
    e.stopPropagation();
    setDueDate(null);
    setIncludeDate(false); // Also disable include date
  };
  
  const isTomorrow = (date, now) => {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.getDate() === tomorrow.getDate() &&
           date.getMonth() === tomorrow.getMonth() && 
           date.getFullYear() === tomorrow.getFullYear();
  };
  
  const formatDisplayDate = (date, now = new Date()) => {
    if (!date) return '';
    
    // Check if date has time components
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
    
    // Check if date is in the past (overdue)
    // For dates with time, compare exact timestamps
    // For dates without time, only consider overdue if the day has passed
    const isOverdue = hasTime ? 
      date < now : 
      date < now && (
        date.getDate() !== now.getDate() || 
        date.getMonth() !== now.getMonth() || 
        date.getFullYear() !== now.getFullYear()
      );
    
    if (isOverdue) {
      const options = {
        month: 'short',
        day: 'numeric',
      };
      
      const dateStr = date.toLocaleDateString('en-US', options);
      
      if (includeTime) {
        const timeStr = date.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        // Calculate time difference
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
          return `${dateStr} at ${timeStr} (${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago)`;
        } else if (diffHours > 0) {
          return `${dateStr} at ${timeStr} (${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago)`;
        } else {
          return `${dateStr} at ${timeStr} (${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago)`;
        }
      }
      
      return dateStr;
    }
    
    const isToday = 
      date.getDate() === now.getDate() && 
      date.getMonth() === now.getMonth() && 
      date.getFullYear() === now.getFullYear();
    
    // Calculate time difference for countdown
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    // For today's tasks, show "Today" plus time if available
    if (isToday) {
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      // If due within the next hour
      if (includeTime && diffMinutes > 0 && diffMinutes < 60) {
        return `Today at ${timeStr} (in ${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'})`;
      }
      
      // If due within 24 hours but more than an hour away
      if (includeTime && diffHours > 0 && diffHours < 24) {
        return `Today at ${timeStr} (in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'})`;
      }
      
      if (includeTime) {
        return `Today at ${timeStr}`;
      }
      return 'Today';
    }
    
    // For tomorrow's tasks
    if (isTomorrow(date, now)) {
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      // If tomorrow but within 24 hours
      if (includeTime && diffHours > 0 && diffHours < 24) {
        return `Tomorrow at ${timeStr} (in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'})`;
      }
      
      if (includeTime) {
        return `Tomorrow at ${timeStr}`;
      }
      return 'Tomorrow';
    }
    
    // For future/past dates
    const options = {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    };
    
    if (includeTime) {
      options.hour = 'numeric';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('en-US', options);
  };

  const toggleSubtaskDateSelection = (e) => {
    setSubtaskIncludeDate(e.target.checked);
  };

  // Handle subtask input change with date parsing
  const handleSubtaskInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Update subtask text without removing date text
    setNewSubtaskText(inputValue);
    
    // Check if the input contains a date reference for preview
    const { dueDate: parsedDate } = processDueDateText(inputValue);
    
    // If a date was detected, update the preview
    if (parsedDate && editingSubtaskIndex !== -1) {
      const updatedSubtasks = [...subtasks];
      updatedSubtasks[editingSubtaskIndex].dueDate = parsedDate;
      setSubtasks(updatedSubtasks);
      setSubtaskIncludeDate(true);
    }
    // If no date was detected but we previously had one from text input, remove it
    else if (subtaskIncludeDate && editingSubtaskIndex !== -1 && 
             subtasks[editingSubtaskIndex]?.dueDate) {
      const updatedSubtasks = [...subtasks];
      updatedSubtasks[editingSubtaskIndex].dueDate = null;
      setSubtasks(updatedSubtasks);
      setSubtaskIncludeDate(false);
    }
  };

  return (
    <div className="task-input">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            ref={inputRef}
            value={taskTitle}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && taskTitle.trim()) {
                handleSubmit(e);
              }
            }}
            placeholder="Your task..."
            className="task-input-field"
            style={{ flex: 1 }}
          />
        </div>
        
        <div className="task-input-buttons">
          {/* Single Calendar Button */}
          <div 
            className="task-input-button calendar-button"
            onClick={() => {
              // Always open date picker when clicked
              setShowDatePicker(true);
              
              // Enable date if not already enabled
              if (!includeDate) {
                setIncludeDate(true);
                if (!dueDate) {
                  setDueDate(new Date());
                }
              }
              
              // Set time picker state
              setShowCustomTimePicker(includeTime);
            }}
            title="Set due date"
          >
            <MdCalendarToday size={18} color={includeDate ? 'var(--text)' : 'var(--textSecondary)'} />
          </div>
          
          {/* Star Button */}
          <div 
            className="task-input-button"
            onClick={() => setIsStarred(!isStarred)}
          >
            {isStarred ? <MdStar size={18} color="var(--warning)" /> : <MdStarBorder size={18} color="var(--text)" />}
          </div>
          
          {/* Add Button */}
          <button
            type="submit"
            className="add-button"
            style={{ opacity: isAddAnimating ? 0.7 : 1 }}
            disabled={isAddAnimating || !taskTitle.trim()}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MdAdd size={16} /> Add
            </span>
          </button>
        </div>
        
        {/* Display selected date if any */}
        {includeDate && dueDate && (
          <div style={{ 
            marginTop: '12px', 
            fontSize: '14px', 
            color: 'var(--textSecondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surfaceLight)',
            borderRadius: '4px',
            padding: '6px 10px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <MdCalendarToday size={16} />
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span>Due:</span>
                {isTaskOverdue(dueDate) && (
                  <span style={{ 
                    backgroundColor: 'var(--error)', 
                    color: 'var(--text)', 
                    padding: '1px 6px', 
                    borderRadius: '4px', 
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    marginRight: '4px'
                  }}>
                    Overdue
                  </span>
                )}
                <span style={{
                  color: isTaskDueToday(dueDate) ? 'var(--success)' : 
                         isTaskDueTomorrow(dueDate) ? 'var(--accentLight)' : 
                         isTaskOverdue(dueDate) ? 'var(--error)' : 'var(--text)',
                  fontWeight: (isTaskDueToday(dueDate) || isTaskDueTomorrow(dueDate) || isTaskOverdue(dueDate)) ? '500' : 'normal',
                }}>
                  {formatDisplayDate(dueDate, currentTime)}
                </span>
              </span>
            </div>
            
            <div
              onClick={handleRemoveDueDate}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '50%',
                color: 'var(--textSecondary)',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--error)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--textSecondary)'}
            >
              <MdOutlineRemoveCircle size={16} />
            </div>
          </div>
        )}
      </form>

      {/* Date picker modal */}
      {showDatePicker && (
        <div 
          className="date-picker-container"
          ref={datePickerRef}
          style={{
            position: 'absolute',
            zIndex: 9999,
            top: `${datePickerPosition.top}px`,
            left: `${datePickerPosition.left}px`,
            backgroundColor: 'var(--surface)',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border)',
            width: 'auto',
            animation: 'fadeIn 0.2s ease forwards',
            maxWidth: '550px'
          }}
        >
          <div className="date-time-layout">
            {/* Calendar */}
            <div>
              <DatePicker
                selected={dueDate || new Date()}
                onChange={handleDateChange}
                inline
                calendarClassName="custom-calendar"
                showTimeSelect={false}
              />
            </div>
            
            {/* Time wheel picker */}
            {showCustomTimePicker && (
              <TimeWheelPicker 
                selectedTime={dueDate || new Date()} 
                onChange={handleTimeChange}
              />
            )}
          </div>
          
          {/* Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginTop: '16px',
            justifyContent: 'space-between',
            padding: '0 10px' 
          }}>
            {/* Time toggle button */}
            <button 
              type="button" 
              style={{
                backgroundColor: 'var(--surfaceLight)',
                border: 'none',
                borderRadius: '4px',
                color: 'var(--text)',
                padding: '8px 12px',
                flex: '1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
              onClick={toggleTimeSelection}
            >
              <MdAccessTime size={16} />
              {includeTime ? 'Remove Time' : 'Add Time'}
            </button>
            
            {/* Done button */}
            <button
              type="button"
              onClick={() => setShowDatePicker(false)}
              style={{
                background: 'var(--primary)',
                color: 'var(--text)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to check if a date is today
function isTaskDueToday(date) {
  if (!date) return false;
  
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Helper function to check if a date is tomorrow
function isTaskDueTomorrow(date) {
  if (!date) return false;
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

export default TaskInput; 