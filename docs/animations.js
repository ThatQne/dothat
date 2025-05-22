// Custom cursor
const cursor = document.querySelector('.cursor');
const trailPath = document.querySelector('.trail-path');

// Trail settings
const maxPoints = 100; // Maximum number of points in the trail
const points = [];
let pathLength = 0;
const fadeSpeed = 0.01; // How quickly the trail fades
const minDistance = 2; // Minimum distance between points
let isMouseDown = false;
let clickTimeline = gsap.timeline({ paused: true });

// Initialize click animation timeline
clickTimeline
    .to(cursor, {
        scale: 0.5,
        duration: 0.2,
        ease: 'power2.out'
    })
    .to(cursor, {
        scale: 1,
        duration: 1,
        ease: 'elastic.out(1, 0.3)'
    });

// Mouse move handler
document.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;

    // Update cursor position
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;

    // Add new point if far enough from last point
    if (points.length === 0 || 
        Math.hypot(x - points[points.length - 1].x, y - points[points.length - 1].y) > minDistance) {
        points.push({ x, y, opacity: 1 });
        
        // Remove oldest point if we exceed maxPoints
        if (points.length > maxPoints) {
            points.shift();
        }

        // Update path
        updatePath();
    }
});

// Click animations
document.addEventListener('mousedown', () => {
    isMouseDown = true;
    gsap.killTweensOf(cursor);
    gsap.to(cursor, {
        scale: 0.5,
        duration: 0.2,
        ease: 'power2.out'
    });
});

document.addEventListener('mouseup', () => {
    isMouseDown = false;
    gsap.killTweensOf(cursor);
    gsap.to(cursor, {
        scale: 1,
        duration: 1,
        ease: 'elastic.out(1, 0.3)'
    });
});

// Handle mouse leaving window
document.addEventListener('mouseleave', () => {
    isMouseDown = false;
    gsap.killTweensOf(cursor);
    gsap.to(cursor, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out'
    });
});

function updatePath() {
    if (points.length < 2) return;

    // Create SVG path
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
    }

    // Update path
    trailPath.setAttribute('d', d);

    // Fade out points
    points.forEach((point, index) => {
        point.opacity = Math.max(0, point.opacity - fadeSpeed);
    });

    // Remove fully faded points
    while (points.length > 0 && points[0].opacity <= 0) {
        points.shift();
    }
}

// Animation loop
function animate() {
    updatePath();
    requestAnimationFrame(animate);
}

// Start animation loop
animate();

// GSAP Animations
gsap.registerPlugin(ScrollTrigger);

// Hero section animations
const heroTimeline = gsap.timeline({
    defaults: {
        ease: 'power3.out',
        duration: 1
    }
});

heroTimeline
    .from('.hero-content', {
        y: 50,
        opacity: 0
    })
    .from('.hero h1', {
        y: 30,
        opacity: 0
    }, '-=0.5')
    .from('.subtitle', {
        y: 30,
        opacity: 0
    }, '-=0.5')
    .from('.cta-buttons', {
        y: 30,
        opacity: 0
    }, '-=0.5');

// Feature cards animation
gsap.utils.toArray('.feature-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: {
            trigger: card,
            start: 'top bottom-=100',
            toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: i * 0.1
    });
});

// Download CTA section animation
gsap.from('.download-cta', {
    scrollTrigger: {
        trigger: '.download-cta',
        start: 'top bottom-=100',
        toggleActions: 'play none none reverse'
    },
    y: 50,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out'
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            gsap.to(window, {
                duration: 1,
                scrollTo: {
                    y: target,
                    offsetY: 70
                },
                ease: 'power3.inOut'
            });
        }
    });
});

// Navbar background animation
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        gsap.to(nav, {
            background: 'rgba(15, 23, 42, 0.95)',
            duration: 0.3,
            ease: 'power2.out'
        });
    } else {
        gsap.to(nav, {
            background: 'rgba(15, 23, 42, 0.8)',
            duration: 0.3,
            ease: 'power2.out'
        });
    }
});

// Smart Date Input Demo
const demoInput = document.querySelector('.demo-input');
const demoDateBadge = document.querySelector('.demo-date-badge');
const demoCursor = document.querySelector('.demo-cursor');

// Create a hidden span for text measurement
const measureSpan = document.createElement('span');
measureSpan.style.visibility = 'hidden';
measureSpan.style.position = 'absolute';
measureSpan.style.whiteSpace = 'pre';
measureSpan.style.font = window.getComputedStyle(demoInput).font;
document.body.appendChild(measureSpan);

const demoExamples = [
    { text: "Buy groceries tod", date: "Today" },
    { text: "Meeting may 12", date: "May 12" },
    { text: "Project due 5/12", date: "May 12" },
    { text: "Call mom tom", date: "Tomorrow" }
];

let currentExample = 0;
let isTyping = false;

function updateCursorPosition() {
    const text = demoInput.value;
    measureSpan.textContent = text;
    const textWidth = measureSpan.offsetWidth;
    const inputPadding = 12; // Left padding of input
    const cursorGap = 2; // Gap between text and cursor
    
    // Position cursor at the end of text with a gap
    const cursorPosition = textWidth + inputPadding + cursorGap;
    demoCursor.style.left = `${cursorPosition}px`;
}

function typeText(text, index = 0) {
    if (index <= text.length) {
        demoInput.value = text.substring(0, index);
        updateCursorPosition();
        
        if (index === text.length) {
            // Show date badge
            demoDateBadge.textContent = demoExamples[currentExample].date;
            demoDateBadge.classList.add('visible');
            
            // Wait before starting next example
            setTimeout(() => {
                demoDateBadge.classList.remove('visible');
                setTimeout(() => {
                    currentExample = (currentExample + 1) % demoExamples.length;
                    demoInput.value = '';
                    updateCursorPosition();
                    setTimeout(() => typeText(demoExamples[currentExample].text), 500);
                }, 500);
            }, 2000);
        } else {
            setTimeout(() => typeText(text, index + 1), 100);
        }
    }
}

// Start the demo when the feature card is in view
const featureCard = document.querySelector('.feature-card');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !isTyping) {
            isTyping = true;
            typeText(demoExamples[currentExample].text);
        }
    });
}, { threshold: 0.5 });

observer.observe(featureCard);

// Clean up measurement span when done
window.addEventListener('unload', () => {
    document.body.removeChild(measureSpan);
});

// Task Group Demo
const demoTasks = document.querySelectorAll('.demo-task');
const mockCursor = document.querySelector('.mock-cursor');
const taskGroup = document.querySelector('.demo-task-group');
let selectedTask = null;
let isAnimating = false;

function moveCursorTo(element, duration = 500) {
    const rect = element.getBoundingClientRect();
    const demoRect = document.querySelector('.task-group-demo').getBoundingClientRect();
    const x = rect.left + rect.width / 2 - demoRect.left;
    const y = rect.top + rect.height / 2 - demoRect.top;
    
    return new Promise(resolve => {
        gsap.to(mockCursor, {
            x: x,
            y: y,
            duration: duration / 1000,
            ease: 'power2.inOut',
            onComplete: resolve
        });
    });
}

function updateGroupOutline(task1, task2) {
    const rect1 = task1.getBoundingClientRect();
    const rect2 = task2.getBoundingClientRect();
    const demoRect = document.querySelector('.task-group-demo').getBoundingClientRect();
    
    const left = Math.min(rect1.left, rect2.left) - demoRect.left - 4;
    const top = Math.min(rect1.top, rect2.top) - demoRect.top - 4;
    const width = Math.max(rect1.right, rect2.right) - Math.min(rect1.left, rect2.left) + 8;
    const height = Math.max(rect1.bottom, rect2.bottom) - Math.min(rect1.top, rect2.top) + 8;
    
    gsap.set(taskGroup, {
        left: left,
        top: top,
        width: width,
        height: height
    });
}

async function animateTaskSelection() {
    if (isAnimating) return;
    isAnimating = true;
    
    // First task
    await moveCursorTo(demoTasks[0]);
    await new Promise(resolve => setTimeout(resolve, 300)); // Shorter initial pause
    
    // Simulate click on first task
    mockCursor.classList.add('clicking');
    const progressBar = demoTasks[0].querySelector('.progress-bar');
    progressBar.classList.add('active');
    
    await new Promise(resolve => setTimeout(resolve, 800)); // Hold duration
    mockCursor.classList.remove('clicking');
    
    demoTasks[0].classList.add('selected');
    selectedTask = demoTasks[0];
    
    await new Promise(resolve => setTimeout(resolve, 400)); // Reduced pause before moving to second task
    
    // Second task
    await moveCursorTo(demoTasks[1]);
    await new Promise(resolve => setTimeout(resolve, 300)); // Pause before clicking
    
    // Simulate click on second task
    mockCursor.classList.add('clicking');
    demoTasks[1].classList.add('selected');
    taskGroup.classList.add('visible');
    updateGroupOutline(demoTasks[0], demoTasks[1]);
    
    // Remove selection and progress bars from both tasks when grouped
    demoTasks[0].classList.remove('selected');
    demoTasks[1].classList.remove('selected');
    demoTasks[0].querySelector('.progress-bar').classList.remove('active');
    demoTasks[1].querySelector('.progress-bar').classList.remove('active');
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Brief click duration
    mockCursor.classList.remove('clicking');
    
    // Reset after shorter delay
    setTimeout(() => {
        taskGroup.classList.remove('visible');
        selectedTask = null;
        isAnimating = false;
        
        // Restart animation after a shorter delay
        setTimeout(animateTaskSelection, 1000);
    }, 1000);
}

// Start the animation when the feature card is in view
const featureCard2 = document.querySelector('.feature-card:nth-child(2)');
const observer2 = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !isAnimating) {
            animateTaskSelection();
        }
    });
}, { threshold: 0.5 });

observer2.observe(featureCard2);

// Task Reorder Demo
const reorderDemo = document.querySelector('.task-reorder-demo');
if (reorderDemo) {
    const reorderTasks = Array.from(reorderDemo.querySelectorAll('.reorder-task'));
    const reorderMockCursor = reorderDemo.querySelector('.mock-cursor');
    let reorderAnimating = false;

    function moveReorderCursorTo(element, duration = 500, offsetX = 0, offsetY = 0) {
        const rect = element.getBoundingClientRect();
        const demoRect = reorderDemo.getBoundingClientRect();
        const x = rect.left + (rect.width / 2) + offsetX - demoRect.left;
        const y = rect.top + (rect.height / 2) + offsetY - demoRect.top;

        return new Promise(resolve => {
            gsap.to(reorderMockCursor, {
                x: x,
                y: y,
                duration: duration / 1000,
                ease: 'power2.inOut',
                onComplete: resolve
            });
        });
    }

    async function animateTaskReorder() {
        if (reorderAnimating) return;
        reorderAnimating = true;

        const task1 = reorderTasks[0];
        const task2 = reorderTasks[1];

        gsap.set([task1, task2], { y: 0, opacity: 1 }); // Ensure opacity is 1 at start

        const yDelta = task2.offsetTop - task1.offsetTop;

        await moveReorderCursorTo(task1, 500, -10, 0);
        await new Promise(resolve => setTimeout(resolve, 300));

        reorderMockCursor.classList.add('clicking');
        reorderMockCursor.classList.add('dragging-cursor');
        task1.classList.add('dragging');
        gsap.set(task1, { zIndex: 10 });
        await new Promise(resolve => setTimeout(resolve, 400));

        // Drag Task Alpha and cursor together
        // Ensure cursor x remains relative to its own container, y moves with task1
        const cursorStartX = reorderMockCursor.offsetLeft;

        gsap.to(task1, {
            y: `+=${yDelta}`,
            duration: 0.8,
            ease: 'power2.inOut',
        });
        gsap.to(reorderMockCursor, {
            y: `+=${yDelta}`,
            duration: 0.8,
            ease: 'power2.inOut',
        });

        gsap.to(task2, {
            y: `-=${yDelta}`,
            duration: 0.8,
            ease: 'power2.inOut',
            delay: 0.1
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        reorderMockCursor.classList.remove('clicking');
        reorderMockCursor.classList.remove('dragging-cursor');
        task1.classList.remove('dragging');
        gsap.set(task1, { zIndex: 1 });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Reset with fade
        const tlReset = gsap.timeline({
            onComplete: () => {
                reorderAnimating = false;
                setTimeout(animateTaskReorder, 300);
            }
        });

        tlReset.to([task1, task2], { opacity: 0, duration: 0.3, ease: 'power2.inOut' })
               .set([task1, task2], { y: 0 }) // Instantly move to original y while invisible
               .to([task1, task2], { opacity: 1, duration: 0.3, ease: 'power2.inOut' });

    }

    const reorderObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !reorderAnimating) {
                animateTaskReorder();
            }
        });
    }, { threshold: 0.5 });

    reorderObserver.observe(reorderDemo);
}

// Subtask Management Demo
const subtaskDemoEl = document.querySelector('.subtask-demo');
if (subtaskDemoEl) {
    const subtaskMockCursor = subtaskDemoEl.querySelector('.mock-cursor');
    const mainTask = subtaskDemoEl.querySelector('.main-task');
    const subtaskToggle = subtaskDemoEl.querySelector('.subtask-toggle');
    const subtasksContainer = subtaskDemoEl.querySelector('.subtasks-container');
    const subtaskCounter = subtaskDemoEl.querySelector('.subtask-counter');
    let subtaskAnimating = false;
    const subtaskNames = ["Define Scope", "Create Mockups", "User Testing"];

    function moveSubtaskCursorTo(element, duration = 500, offsetX = 0, offsetY = 0) {
        const rect = element.getBoundingClientRect();
        const demoRect = subtaskDemoEl.getBoundingClientRect();
        const x = rect.left + (element.offsetWidth / 2) + offsetX - demoRect.left;
        const y = rect.top + (element.offsetHeight / 2) + offsetY - demoRect.top;
        return gsap.to(subtaskMockCursor, {
            x: x, y: y, duration: duration / 1000, ease: 'power2.inOut'
        });
    }

    function createSubtaskElement(name) {
        const div = document.createElement('div');
        div.classList.add('demo-subtask');
        div.textContent = name;
        return div;
    }

    async function animateSubtaskDemo() {
        if (subtaskAnimating) return;
        subtaskAnimating = true;

        // Reset state
        subtasksContainer.innerHTML = '';
        subtasksContainer.classList.remove('expanded');
        subtaskToggle.classList.remove('expanded');
        subtaskCounter.textContent = '0';
        subtaskCounter.classList.remove('visible');
        gsap.set(subtaskMockCursor, { autoAlpha: 1});

        // 1. Initial pause, maybe cursor moves to an "add subtask" area (not shown)
        await moveSubtaskCursorTo(mainTask, 500, 50, 20); // Move near where an add button might be
        await gsap.delayedCall(0.5, () => {});

        // 2. "Add" subtasks (they just appear for the demo, counter updates)
        let addedSubtasks = [];
        for (let i = 0; i < subtaskNames.length; i++) {
            subtaskMockCursor.classList.add('clicking');
            await gsap.delayedCall(0.15, () => subtaskMockCursor.classList.remove('clicking'));
            
            const subtaskEl = createSubtaskElement(subtaskNames[i]);
            subtasksContainer.appendChild(subtaskEl);
            addedSubtasks.push(subtaskEl);
            subtaskCounter.textContent = (i + 1).toString();
            if (i === 0) subtaskCounter.classList.add('visible');
            await gsap.delayedCall(0.3, () => {}); // Pause between adding
        }

        // 3. Move cursor to toggle and click to expand
        await moveSubtaskCursorTo(subtaskToggle, 300);
        subtaskMockCursor.classList.add('clicking');
        await gsap.delayedCall(0.2, () => {}); 
        subtaskToggle.classList.add('expanded');
        subtasksContainer.classList.add('expanded');
        subtaskMockCursor.classList.remove('clicking');

        // Animate subtasks appearing
        gsap.to(addedSubtasks, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.15,
            ease: 'power2.out'
        });

        await gsap.delayedCall(1.5, () => {}); // Keep expanded

        // 4. Move cursor to toggle and click to collapse
        await moveSubtaskCursorTo(subtaskToggle, 500);
        subtaskMockCursor.classList.add('clicking');
        await gsap.delayedCall(0.2, () => {});
        subtaskToggle.classList.remove('expanded');
        subtasksContainer.classList.remove('expanded');
        subtaskMockCursor.classList.remove('clicking');

        await gsap.delayedCall(1.0, () => {}); // Keep collapsed

        // Restart
        subtaskAnimating = false;
        setTimeout(animateSubtaskDemo, 1000);
    }

    const subtaskObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !subtaskAnimating) {
                animateSubtaskDemo();
            }
        });
    }, { threshold: 0.5 });

    if (subtaskDemoEl) subtaskObserver.observe(subtaskDemoEl);
}

// Theme Demo Switching
const themeDemo = document.querySelector('.theme-demo');
if (themeDemo) {
    const preview = themeDemo.querySelector('#themePreview');
    const buttons = themeDemo.querySelectorAll('.theme-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.theme === 'light') {
                preview.classList.add('light');
            } else {
                preview.classList.remove('light');
            }
        });
    });
    // Set default
    buttons[0].classList.add('active');
}

// ... rest of the existing code ... 