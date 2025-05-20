// Custom cursor
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');

document.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
    cursorFollower.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
});

document.addEventListener('mousedown', () => {
    cursor.style.transform += ' scale(0.8)';
    cursorFollower.style.transform += ' scale(0.8)';
});

document.addEventListener('mouseup', () => {
    cursor.style.transform = cursor.style.transform.replace(' scale(0.8)', '');
    cursorFollower.style.transform = cursorFollower.style.transform.replace(' scale(0.8)', '');
});

// GSAP Animations
gsap.registerPlugin(ScrollTrigger);

// Hero section animations
gsap.from('.hero-content', {
    duration: 1,
    y: 100,
    opacity: 0,
    ease: 'power4.out'
});

gsap.from('.hero h1', {
    duration: 1.5,
    y: 100,
    opacity: 0,
    ease: 'power4.out',
    delay: 0.2
});

gsap.from('.subtitle', {
    duration: 1.5,
    y: 50,
    opacity: 0,
    ease: 'power4.out',
    delay: 0.4
});

gsap.from('.cta-buttons', {
    duration: 1.5,
    y: 50,
    opacity: 0,
    ease: 'power4.out',
    delay: 0.6
});

// Floating element animation
gsap.to('.floating-element', {
    duration: 2,
    y: 20,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut'
});

// Feature cards animation
gsap.utils.toArray('.feature-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: {
            trigger: card,
            start: 'top bottom-=100',
            toggleActions: 'play none none reverse'
        },
        duration: 1,
        y: 100,
        opacity: 0,
        ease: 'power4.out',
        delay: i * 0.2
    });
});

// Download section animation
gsap.from('.download h2', {
    scrollTrigger: {
        trigger: '.download',
        start: 'top bottom-=100',
        toggleActions: 'play none none reverse'
    },
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power4.out'
});

gsap.from('.download p', {
    scrollTrigger: {
        trigger: '.download',
        start: 'top bottom-=100',
        toggleActions: 'play none none reverse'
    },
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power4.out',
    delay: 0.2
});

gsap.from('.download-buttons', {
    scrollTrigger: {
        trigger: '.download',
        start: 'top bottom-=100',
        toggleActions: 'play none none reverse'
    },
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power4.out',
    delay: 0.4
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
                ease: 'power4.inOut'
            });
        }
    });
});

// Navbar background animation
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(15, 23, 42, 0.95)';
    } else {
        nav.style.background = 'rgba(15, 23, 42, 0.8)';
    }
}); 