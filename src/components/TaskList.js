import React, { useState, useEffect } from 'react';
import TaskItem from './TaskItem';
import { MdExpandMore, MdGroup, MdCheckCircle, MdEdit, MdDelete, MdKeyboardArrowDown, MdKeyboardArrowUp, MdDeleteSweep } from 'react-icons/md';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const sortOptions = [
  { value: 'recent', label: 'Recent' },
  { value: 'date-asc', label: 'Date Asc.' },
  { value: 'date-desc', label: 'Date Desc.' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'starred', label: 'Starred' },
  { value: 'custom', label: 'Custom Order' }
];

const TaskList = ({ 
  tasks, 
  onToggleTaskComplete, 
  onToggleSubtasks, 
  onDeleteTask, 
  onBulkDeleteTasks,
  onEditTask, 
  onTaskReorder,
  onAddSubtask,
  onToggleSubtaskComplete,
  onDeleteSubtask,
  onSubtaskReorder,
  onEditSubtask,
  isSelectionMode = false,
  selectedTaskIds = [],
  longPressTaskId = null,
  taskGroups = [],
  onTaskLongPress = () => {},
  onTaskSelection = () => {},
  onCreateGroup = () => {},
  onCancelSelection = () => {},
  onRenameGroup = () => {},
  onDeleteGroup = () => {},
  onAddToGroup = () => {},
  onRemoveFromGroup = () => {}
}) => {
  const [sortBy, setSortBy] = useState(() => {
    // Initialize from localStorage if available
    const savedSort = localStorage.getItem('taskSortOrder');
    return savedSort || 'recent';
  });
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    // Initialize collapsed groups state from localStorage if available
    try {
      const savedState = localStorage.getItem('collapsedGroups');
      return savedState ? JSON.parse(savedState) : {};
    } catch (error) {
      console.error('Error loading collapsed groups state:', error);
      return {};
    }
  });

  // Helper functions for task groups
  const isTaskInGroup = (taskId) => {
    return taskGroups.some(group => group.taskIds.includes(taskId));
  };

  const getTaskGroup = (taskId) => {
    return taskGroups.find(group => group.taskIds.includes(taskId));
  };

  // Save sort order to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('taskSortOrder', sortBy);
  }, [sortBy]);

  // Save collapsed groups state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('collapsedGroups', JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  // Function to toggle group collapse state
  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Clean up any collapsed groups that no longer exist
  useEffect(() => {
    if (taskGroups.length > 0) {
      // Get all current group IDs
      const currentGroupIds = taskGroups.map(group => group.id);
      
      // Check if we have any saved collapsed states for groups that no longer exist
      const updatedCollapsedGroups = { ...collapsedGroups };
      let hasChanges = false;
      
      Object.keys(collapsedGroups).forEach(groupId => {
        if (!currentGroupIds.includes(groupId)) {
          // This group no longer exists, remove it from collapsed state
          delete updatedCollapsedGroups[groupId];
          hasChanges = true;
        }
      });
      
      // Only update state if we made changes
      if (hasChanges) {
        setCollapsedGroups(updatedCollapsedGroups);
      }
    }
  }, [taskGroups]);

  const getSortedTasks = () => {
    if (!tasks || tasks.length === 0) return [];

    // Create a copy of the tasks array to avoid mutating the original
    let sortedTasks = [...tasks];

    // First separate completed and uncompleted tasks
    const completedTasks = sortedTasks.filter(task => task.isCompleted);
    const uncompletedTasks = sortedTasks.filter(task => !task.isCompleted);

    // If using custom sort, sort by customOrder property
    if (sortBy === 'custom') {
      const sortedUncompletedTasks = [...uncompletedTasks].sort((a, b) => {
        // If both have customOrder, use it
        if (a.customOrder !== undefined && b.customOrder !== undefined) {
          return a.customOrder - b.customOrder;
        }
        // If only one has customOrder, prioritize the one with it
        if (a.customOrder !== undefined) return -1;
        if (b.customOrder !== undefined) return 1;
        // Fall back to default sorting by ID
        return parseInt(b.id) - parseInt(a.id);
      });
      
      // Sort completed tasks by completedAt timestamp (most recent first)
      const sortedCompletedTasks = [...completedTasks].sort((a, b) => {
        if (a.completedAt && b.completedAt) {
          return b.completedAt - a.completedAt;
        }
        return parseInt(b.id) - parseInt(a.id); // Fallback to ID-based sorting
      });
      
      return [...sortedUncompletedTasks, ...sortedCompletedTasks];
    }

    // Sort each group based on the selected sort criteria
    const sortGroups = (group) => {
      return group.sort((a, b) => {
        switch (sortBy) {
          case 'recent':
            // Sort by ID (higher ID means more recent as IDs are generated with Date.now())
            return parseInt(b.id) - parseInt(a.id);
          case 'date-asc':
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
          case 'date-desc':
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(b.dueDate) - new Date(a.dueDate);
          case 'name-asc':
            return a.title.localeCompare(b.title);
          case 'name-desc':
            return b.title.localeCompare(a.title);
          case 'starred':
            return (a.isStarred === b.isStarred) ? 0 : a.isStarred ? -1 : 1;
          default:
            return 0;
        }
      });
    };

    // Sort uncompleted tasks
    const sortedUncompletedTasks = sortGroups(uncompletedTasks);
    
    // Sort completed tasks by completedAt timestamp (most recent first)
    // If completedAt doesn't exist, fall back to the regular sort
    const sortedCompletedTasks = completedTasks.sort((a, b) => {
      // Sort by completedAt timestamp if available (most recent first)
      if (a.completedAt && b.completedAt) {
        return b.completedAt - a.completedAt;
      }
      // Fall back to the selected sort method if completedAt isn't available
      switch (sortBy) {
        case 'recent':
          return parseInt(b.id) - parseInt(a.id);
        case 'date-asc':
        case 'date-desc':
        case 'name-asc':
        case 'name-desc':
        case 'starred':
          // Use the regular sort for these options
          return sortGroups([a, b])[0] === a ? -1 : 1;
        default:
          return 0;
      }
    });

    // Concatenate the groups: uncompleted tasks first, then completed tasks
    return [...sortedUncompletedTasks, ...sortedCompletedTasks];
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setShowSortOptions(false);
  };

  const handleDragStart = () => {
    // Switch to custom sort mode when user starts dragging
    if (sortBy !== 'custom') {
      // Before switching to custom sort, preserve the current order
      // by assigning customOrder values to uncompleted tasks
      const uncompletedTasks = sortedTasks.filter(task => !task.isCompleted);
      
      // Create a special result object to handle preserving order
      // without actually moving any tasks yet
      const preserveOrderResult = {
        type: 'preserveOrder',
        tasks: uncompletedTasks.map((task, index) => ({
          id: task.id,
          customOrder: index
        }))
      };
      
      // Tell the parent component to update tasks with the new order
      if (onTaskReorder) {
        onTaskReorder(preserveOrderResult);
      }
      
      // Now switch to custom sort mode
      setSortBy('custom');
    }
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId, type } = result;
    
    if (!destination) {
      return;
    }
    
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Handle SUBTASK reordering first
    if (type === "SUBTASK") {
      const parentId = source.droppableId.replace('subtasks-', '');
      if (onSubtaskReorder) {
        onSubtaskReorder(parentId, result);
      }
      return;
    }
    
    // Existing logic for TASK reordering (ensure it only runs for type === "TASK" or default)
    // It's safer to assume all subsequent logic is for tasks of type "TASK"

    // Handle reordering within the main task list
    if (source.droppableId === 'uncompleted-tasks' && destination.droppableId === 'uncompleted-tasks') {
      const visibleTasks = uncompletedTasks.filter(task => !isTaskInGroup(task.id));
      const sourceTask = visibleTasks[source.index];
      if (!sourceTask) return;
      const modifiedResult = {
        ...result,
        source: {
          ...source,
          index: tasks.findIndex(t => t.id === sourceTask.id)
        },
        destination: {
          ...destination,
          index: calculateDestinationIndex(destination.index, visibleTasks, tasks)
        }
      };
      if (onTaskReorder) {
        onTaskReorder(modifiedResult);
      }
      return;
    }
    
    // Handle reordering within a task group
    if (source.droppableId.startsWith('group-') && destination.droppableId === source.droppableId) {
      const groupId = source.droppableId.replace('group-', '');
      const group = taskGroups.find(g => g.id === groupId);
      if (!group) return;
      const tasksInGroup = tasks
        .filter(task => group.taskIds.includes(task.id) && !task.isCompleted)
        .sort((a, b) => {
          if (a.groupOrder?.[groupId] !== undefined && b.groupOrder?.[groupId] !== undefined) {
            return a.groupOrder[groupId] - b.groupOrder[groupId];
          }
          if (a.customOrder !== undefined && b.customOrder !== undefined) {
            return a.customOrder - b.customOrder;
          }
          return parseInt(a.id) - parseInt(b.id);
        });
      const reorderedTaskIds = [...tasksInGroup.map(t => t.id)];
      const [movedId] = reorderedTaskIds.splice(source.index, 1);
      if (movedId) {
        reorderedTaskIds.splice(destination.index, 0, movedId);
      }
      const updatedTasks = tasks.map(task => {
        if (group.taskIds.includes(task.id)) {
          const index = reorderedTaskIds.indexOf(task.id);
          if (index !== -1) {
            return {
              ...task,
              groupOrder: {
                ...(task.groupOrder || {}),
                [groupId]: index
              }
            };
          }
        }
        return task;
      });
      onTaskReorder({ type: 'updateTasks', tasks: updatedTasks });
      return;
    }
    
    // Handle moving a task from the main todo list to a group
    if (source.droppableId === 'uncompleted-tasks' && destination.droppableId.startsWith('group-')) {
      const groupId = destination.droppableId.replace('group-', '');
      const group = taskGroups.find(g => g.id === groupId);
      if (!group) return;
      const tasksInGroup = tasks
        .filter(task => group.taskIds.includes(task.id) && !task.isCompleted)
        .sort((a, b) => {
          if (a.groupOrder?.[groupId] !== undefined && b.groupOrder?.[groupId] !== undefined) {
            return a.groupOrder[groupId] - b.groupOrder[groupId];
          }
          if (a.customOrder !== undefined && b.customOrder !== undefined) {
            return a.customOrder - b.customOrder;
          }
          return parseInt(a.id) - parseInt(b.id);
        });
      const reorderedTaskIds = [...tasksInGroup.map(t => t.id)];
      if (tasks.find(t => t.id === draggableId)) {
        reorderedTaskIds.splice(destination.index, 0, draggableId);
      }
      const updatedTasks = tasks.map(task => {
        if (group.taskIds.includes(task.id) || task.id === draggableId) {
          const index = reorderedTaskIds.indexOf(task.id);
          if (index !== -1) {
            return {
              ...task,
              groupOrder: {
                ...(task.groupOrder || {}),
                [groupId]: index
              }
            };
          }
        }
        return task;
      });
      onTaskReorder({ type: 'updateTasks', tasks: updatedTasks });
      onAddToGroup(draggableId, groupId);
      return;
    }
    
    // Handle moving a task from a group to the main todo list
    if (source.droppableId.startsWith('group-') && destination.droppableId === 'uncompleted-tasks') {
      const groupId = source.droppableId.replace('group-', '');
      const movedTask = tasks.find(task => task.id === draggableId);
      if (!movedTask) return;
      const visibleTasks = uncompletedTasks.filter(task => !isTaskInGroup(task.id));
      let newCustomOrder;
      if (destination.index === 0) {
        const lowestOrder = visibleTasks.length > 0 ? visibleTasks.reduce((min, task) => task.customOrder !== undefined ? Math.min(min, task.customOrder) : min, visibleTasks[0]?.customOrder ?? 0) : 0;
        newCustomOrder = lowestOrder - 1;
      } else if (destination.index >= visibleTasks.length) {
        const highestOrder = visibleTasks.length > 0 ? visibleTasks.reduce((max, task) => task.customOrder !== undefined ? Math.max(max, task.customOrder) : max, visibleTasks[visibleTasks.length - 1]?.customOrder ?? 0) : 0;
        newCustomOrder = highestOrder + 1;
      } else {
        const prevTask = visibleTasks[destination.index - 1];
        const nextTask = visibleTasks[destination.index];
        const prevOrder = prevTask?.customOrder ?? (nextTask?.customOrder !== undefined ? nextTask.customOrder - 2 : 0);
        const nextOrder = nextTask?.customOrder ?? (prevOrder + 2);
        newCustomOrder = (prevOrder + nextOrder) / 2;
      }
      const updatedTask = { ...movedTask, customOrder: newCustomOrder };
      onRemoveFromGroup(draggableId, groupId);
      onTaskReorder({ type: 'updateTasks', tasks: tasks.map(task => task.id === draggableId ? updatedTask : task) });
      return;
    }
    
    // Handle moving a task from one group to another
    if (source.droppableId.startsWith('group-') && destination.droppableId.startsWith('group-')) {
      const sourceGroupId = source.droppableId.replace('group-', '');
      const destGroupId = destination.droppableId.replace('group-', '');
      onRemoveFromGroup(draggableId, sourceGroupId);
      const group = taskGroups.find(g => g.id === destGroupId);
      if (!group) return;
      const tasksInGroup = tasks
        .filter(task => group.taskIds.includes(task.id) && !task.isCompleted && task.id !== draggableId)
        .sort((a, b) => {
            if (a.groupOrder?.[destGroupId] !== undefined && b.groupOrder?.[destGroupId] !== undefined) return a.groupOrder[destGroupId] - b.groupOrder[destGroupId];
            if (a.customOrder !== undefined && b.customOrder !== undefined) return a.customOrder - b.customOrder;
            return parseInt(a.id) - parseInt(b.id);
        });
      const reorderedTaskIds = [...tasksInGroup.map(t => t.id)];
      if (tasks.find(t => t.id === draggableId)) {
        reorderedTaskIds.splice(destination.index, 0, draggableId);
      }
      const updatedTasks = tasks.map(task => {
        if (group.taskIds.includes(task.id) || task.id === draggableId) {
          const index = reorderedTaskIds.indexOf(task.id);
          if (index !== -1) {
            return { ...task, groupOrder: { ...(task.groupOrder || {}), [destGroupId]: index } };
          }
        }
        return task;
      });
      onTaskReorder({ type: 'updateTasks', tasks: updatedTasks });
      onAddToGroup(draggableId, destGroupId);
      return;
    }
  };

  // Helper function to calculate the real destination index in the full task array
  const calculateDestinationIndex = (visibleIndex, visibleTasks, allTasks) => {
    // If moving to the first position
    if (visibleIndex === 0) {
      return 0;
    }
    
    // If moving to the last position
    if (visibleIndex >= visibleTasks.length) {
      const lastVisibleTask = visibleTasks[visibleTasks.length - 1];
      return allTasks.findIndex(t => t.id === lastVisibleTask.id) + 1;
    }
    
    // Get the task that will be after the dropped task
    const taskAfterDrop = visibleTasks[visibleIndex];
    // Find its index in the full task array
    return allTasks.findIndex(t => t.id === taskAfterDrop.id);
  };

  const sortedTasks = getSortedTasks();
  
  // Split into uncompleted and completed tasks for separate rendering
  const uncompletedTasks = sortedTasks.filter(task => !task.isCompleted);
  const completedTasks = sortedTasks.filter(task => task.isCompleted);
  
  // Get visible tasks (not in groups) for the main task list
  const visibleUncompletedTasks = uncompletedTasks.filter(task => !isTaskInGroup(task.id));
  // Get visible completed tasks (not in groups)
  const visibleCompletedTasks = completedTasks.filter(task => !isTaskInGroup(task.id));
  
  const currentSortOption = sortOptions.find(option => option.value === sortBy);

  // Function to handle deleting all completed tasks
  const handleDeleteAllCompleted = () => {
    // Show the confirmation dialog with count of completed tasks
    setShowDeleteConfirmation(true);
  };
  
  const confirmDeleteAllCompleted = () => {
    // Get all completed task IDs
    const completedTaskIds = tasks
      .filter(task => task.isCompleted)
      .map(task => task.id);
    
    // Delete each completed task one by one using the bulk delete function
    // that doesn't trigger individual confirmations
    completedTaskIds.forEach(taskId => {
      onBulkDeleteTasks(taskId);
    });
    
    // Close the confirmation modal
    setShowDeleteConfirmation(false);
  };
  
  const cancelDeleteAllCompleted = () => {
    setShowDeleteConfirmation(false);
  };
  
  // Get number of completed tasks
  const completedTasksCount = tasks.filter(task => task.isCompleted).length;

  return (
    <div>
      <DragDropContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Task group section */}
        {taskGroups.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ 
              fontSize: 16, 
              marginBottom: 12, 
              color: 'var(--textSecondary)',
              fontWeight: 500
            }}>
              Task Groups
            </h3>
            
            {taskGroups.map(group => (
              <div 
                key={group.id}
                style={{
                  backgroundColor: 'transparent',
                  borderRadius: 8,
                  marginBottom: 12,
                  border: '1px solid var(--borderLight)',
                  overflow: 'hidden' // Ensure the header's solid background doesn't overflow
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 14,
                  backgroundColor: 'var(--surfaceLight)',
                  borderBottom: collapsedGroups[group.id] ? 'none' : '1px solid var(--borderLight)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--accent)',
                    fontWeight: 500
                  }}>
                    <button
                      onClick={() => toggleGroupCollapse(group.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 4
                      }}
                      aria-label={collapsedGroups[group.id] ? "Expand group" : "Collapse group"}
                    >
                      {collapsedGroups[group.id] ? 
                        <MdKeyboardArrowDown size={18} /> : 
                        <MdKeyboardArrowUp size={18} />
                      }
                    </button>
                    <MdGroup size={16} />
                    <span>{group.name}</span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: 'var(--textSecondary)',
                      backgroundColor: 'var(--surface)',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      border: '1px solid var(--borderLight)',
                      marginLeft: 4
                    }}>
                      {tasks.filter(task => group.taskIds.includes(task.id) && !task.isCompleted).length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => onRenameGroup(group.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--textSecondary)',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 4,
                        transition: 'color 0.2s, background-color 0.2s',
                        ':hover': {
                          color: 'var(--text)',
                          backgroundColor: 'rgba(0, 0, 0, 0.05)'
                        }
                      }}
                    >
                      <MdEdit size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteGroup(group.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 4,
                        transition: 'color 0.2s, background-color 0.2s',
                        ':hover': {
                          backgroundColor: 'rgba(255, 0, 0, 0.05)'
                        }
                      }}
                    >
                      <MdDelete size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Tasks in the group - make it a droppable area */}
                {!collapsedGroups[group.id] && (
                  <Droppable droppableId={`group-${group.id}`} type="TASK">
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{ 
                          marginLeft: 10,
                          marginRight: 10,
                          minHeight: 10,
                          padding: '14px 0',
                          transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                          backgroundColor: 'transparent'
                        }}
                      >
                        {tasks
                          .filter(task => group.taskIds.includes(task.id) && !task.isCompleted)
                          .sort((a, b) => {
                            // Sort by group-specific order if available
                            if (a.groupOrder?.[group.id] !== undefined && b.groupOrder?.[group.id] !== undefined) {
                              return a.groupOrder[group.id] - b.groupOrder[group.id];
                            }
                            // Fall back to customOrder if available
                            if (a.customOrder !== undefined && b.customOrder !== undefined) {
                              return a.customOrder - b.customOrder;
                            }
                            // Last resort - sort by ID
                            return parseInt(a.id) - parseInt(b.id);
                          })
                          .map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={isSelectionMode || task.isCompleted}
                              type="TASK"
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={snapshot.isDragging ? 'task-dragging' : ''}
                                  style={{
                                    ...provided.draggableProps.style,
                                    marginBottom: index < tasks.filter(t => group.taskIds.includes(t.id) && !t.isCompleted).length - 1 ? 8 : 0
                                  }}
                                >
                                  <TaskItem
                                    key={task.id}
                                    task={task}
                                    onToggleComplete={onToggleTaskComplete}
                                    onToggleSubtasks={onToggleSubtasks}
                                    onDelete={onDeleteTask}
                                    onEdit={onEditTask}
                                    onAddSubtask={onAddSubtask}
                                    onToggleSubtaskComplete={onToggleSubtaskComplete}
                                    onDeleteSubtask={onDeleteSubtask}
                                    onSubtaskReorder={onSubtaskReorder}
                                    onEditSubtask={onEditSubtask}
                                    isInGroup={true}
                                    groupName={group.name}
                                    canDrag={!isSelectionMode}
                                    isDragging={snapshot.isDragging}
                                    dragHandleProps={provided.dragHandleProps}
                                    subtasksOpen={task.isSubtasksOpen || false}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            ))}
          </div>
        )}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16
      }}>
        <div>
          {completedTasksCount > 0 && (
            <button
              onClick={handleDeleteAllCompleted}
              className="delete-completed-btn"
            >
              <MdDeleteSweep size={16} />
              <span>Delete Completed ({completedTasksCount})</span>
            </button>
          )}
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 14, color: 'var(--textSecondary)', marginRight: 8 }}>Sort by:</div>
          <div style={{ position: 'relative' }}>
            <button
              className="sort-dropdown"
              onClick={() => setShowSortOptions(!showSortOptions)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minWidth: 120,
              }}
            >
              <span>{currentSortOption?.label || 'Recent'}</span>
              <MdExpandMore 
                size={18} 
                style={{ 
                  marginLeft: 8,
                  transform: showSortOptions ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s'
                }} 
              />
            </button>
            
            {showSortOptions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: 'var(--surface)',
                borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                zIndex: 10,
                width: 150,
                border: '1px solid var(--border)'
              }}>
                {sortOptions.map(option => (
                  <div
                    key={option.value}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--borderLight)',
                      color: sortBy === option.value ? 'var(--text)' : 'var(--textSecondary)',
                      backgroundColor: sortBy === option.value ? 'var(--surfaceLight)' : 'transparent'
                    }}
                    onClick={() => handleSortChange(option.value)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="task-item-container">
        {sortedTasks.length > 0 ? (
            <div>
              <Droppable droppableId="uncompleted-tasks" type="TASK">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{ 
                      minHeight: '50px',
                      padding: '4px 0'
                    }}
                  >
                    {/* Uncompleted tasks - draggable */}
                    {visibleUncompletedTasks.map((task, index) => (
                      <Draggable 
                        key={task.id} 
                        draggableId={task.id} 
                        index={index}
                        isDragDisabled={isSelectionMode || task.isCompleted}
                        type="TASK"
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={snapshot.isDragging ? 'task-dragging' : ''}
                          >
                            <TaskItem
                              task={task}
                              onToggleComplete={onToggleTaskComplete}
                              onToggleSubtasks={onToggleSubtasks}
                              onDelete={onDeleteTask}
                              onEdit={onEditTask}
                              isDragging={snapshot.isDragging}
                              dragHandleProps={provided.dragHandleProps}
                              onAddSubtask={onAddSubtask}
                              onToggleSubtaskComplete={onToggleSubtaskComplete}
                              onDeleteSubtask={onDeleteSubtask}
                              onSubtaskReorder={onSubtaskReorder}
                              onEditSubtask={onEditSubtask}
                              isSelectionMode={isSelectionMode}
                              isSelected={selectedTaskIds.includes(task.id)}
                              isLongPressed={longPressTaskId === task.id}
                              onLongPress={onTaskLongPress}
                              onSelectionClick={onTaskSelection}
                              canDrag={!isSelectionMode}
                              onCancelSelection={onCancelSelection}
                              longPressTaskId={longPressTaskId}
                              subtasksOpen={task.isSubtasksOpen || false}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    
                    {/* Show message inside the droppable area when no uncompleted tasks are visible */}
                    {visibleUncompletedTasks.length === 0 && (
                      <div style={{ 
                        padding: 24, 
                        textAlign: 'center', 
                        color: 'var(--textSecondary)',
                        background: 'var(--surface)',
                        borderRadius: 8,
                        marginBottom: completedTasks.length > 0 ? '20px' : '0'
                      }}>
                        {taskGroups.length > 0 
                          ? "All uncompleted tasks are in groups. Add a new task or drag tasks from groups here."
                          : "No tasks yet. Add a task to get started!"}
                      </div>
                    )}
                    
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Completed tasks section - show ALL completed tasks, including those from groups */}
            {completedTasks.length > 0 && (
                <div style={{ 
                  marginTop: uncompletedTasks.length > 0 ? '20px' : '0'
                }}>
                  <div style={{
                    fontSize: 16,
                    color: 'var(--textSecondary)',
                    marginBottom: 12,
                    fontWeight: 500
                  }}>
                    Completed Tasks
                  </div>
                  {completedTasks.map((task) => (
                    <div key={task.id}>
                  <TaskItem
                    task={task}
                    onToggleComplete={onToggleTaskComplete}
                    onToggleSubtasks={onToggleSubtasks}
                    onDelete={onDeleteTask}
                    onEdit={onEditTask}
                    onAddSubtask={onAddSubtask}
                    onToggleSubtaskComplete={onToggleSubtaskComplete}
                    onDeleteSubtask={onDeleteSubtask}
                    onSubtaskReorder={onSubtaskReorder}
                    onEditSubtask={onEditSubtask}
                        isInGroup={isTaskInGroup(task.id)}
                        groupName={getTaskGroup(task.id)?.name}
                        subtasksOpen={task.isSubtasksOpen || false}
                  />
                    </div>
                ))}
              </div>
            )}
            </div>
        ) : (
          <div style={{ 
            padding: 24, 
            textAlign: 'center', 
            color: 'var(--textSecondary)',
            background: 'var(--surface)',
            borderRadius: 8 
          }}>
            No tasks yet. Add a task to get started!
          </div>
        )}
      </div>
      </DragDropContext>

      {/* Add CSS for hover effect */}
      <style>
        {`
          .delete-completed-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 0 12px;
            background-color: transparent;
            color: var(--error);
            border: 1px solid var(--error);
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            height: 32px;
            transition: background-color 0.3s ease, color 0.3s ease;
            outline: none;
          }
          
          .delete-completed-btn:hover {
            background-color: var(--error);
            color: white;
          }
          
          .sort-dropdown {
            height: 32px;
            padding: 0 12px;
            background-color: var(--surface);
            border: 1px solid var(--border);
            border-radius: 4px;
            color: var(--text);
            cursor: pointer;
            font-size: 14px;
          }
        `}
      </style>

      {/* Delete All Completed Tasks Confirmation Modal */}
      {showDeleteConfirmation && (
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
              <h3 style={{ margin: '0 0 12px 0' }}>Delete All Completed Tasks</h3>
              <p style={{ margin: 0, color: 'var(--textSecondary)' }}>
                Are you sure you want to delete all completed tasks? This action cannot be undone.
              </p>
              <p style={{ margin: '8px 0 0 0', color: 'var(--textSecondary)', fontWeight: 'bold' }}>
                {completedTasksCount} task(s) will be deleted.
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: 10, 
              justifyContent: 'center'
            }}>
              <button 
                onClick={cancelDeleteAllCompleted}
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
                onClick={confirmDeleteAllCompleted}
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
    </div>
  );
};

export default TaskList; 