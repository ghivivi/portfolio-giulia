/* ============================================
   Portfolio Giulia - Main Script
   ============================================ */

(function() {
    'use strict';

    // ---- 1. DOM REFERENCES ----
    const header    = document.getElementById('site-header');
    const navToggle = document.querySelector('.nav-toggle');
    const navMain   = document.querySelector('.nav-main');
    const navItems  = document.querySelectorAll('.nav-link');
    const modal     = document.getElementById('video-modal');

    // Check if elements exist (landing page doesn't have all elements)
    const modalVideoWrapper = modal ? modal.querySelector('.modal-video-wrapper') : null;
    const modalClose = modal ? modal.querySelector('.modal-close') : null;
    const modalOverlay = modal ? modal.querySelector('.modal-overlay') : null;
    const playButtons = document.querySelectorAll('.play-btn');
    const fadeElements = document.querySelectorAll('.fade-in');

    // ---- 2. NAVIGATION: Scroll-based header styling ----
    function handleHeaderScroll() {
        if (!header) return;

        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    // ---- 3. NAVIGATION: Active link highlighting ----
    //     Uses IntersectionObserver to detect which section is in view
    function initActiveNavTracking() {
        const sections = document.querySelectorAll('section[id]');
        if (sections.length === 0 || navItems.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navItems.forEach(link => {
                        link.classList.toggle('active',
                            link.getAttribute('href') === `#${id}`
                        );
                    });
                }
            });
        }, {
            rootMargin: '-50% 0px -50% 0px' // trigger at center of viewport
        });

        sections.forEach(section => observer.observe(section));
    }

    // ---- 4. MOBILE MENU TOGGLE ----
    function initMobileMenu() {
        if (!navToggle || !navMain) return;

        navToggle.addEventListener('click', () => {
            const isActive = navToggle.classList.toggle('is-active');
            navMain.classList.toggle('is-active');
            navToggle.setAttribute('aria-expanded', isActive);
            document.body.style.overflow = isActive ? 'hidden' : '';
        });

        // Close menu on link click
        navItems.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('is-active');
                navMain.classList.remove('is-active');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // ---- 5. SCROLL ANIMATIONS (fade-in) ----
    function initScrollAnimations() {
        if (fadeElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // animate once only
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        fadeElements.forEach(el => observer.observe(el));
    }

    // ---- 6. VIDEO MODAL ----
    function openModal(card) {
        if (!modal || !modalVideoWrapper) return;

        const type    = card.dataset.videoType;
        const videoId = card.dataset.videoId;
        const videoSrc = card.dataset.videoSrc;

        let content = '';

        switch (type) {
            case 'youtube':
                content = `<iframe
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
                    allow="autoplay; encrypted-media"
                    allowfullscreen></iframe>`;
                break;
            case 'vimeo':
                content = `<iframe
                    src="https://player.vimeo.com/video/${videoId}?autoplay=1"
                    allow="autoplay; fullscreen"
                    allowfullscreen></iframe>`;
                break;
            case 'local':
                content = `<video controls autoplay>
                    <source src="${videoSrc}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>`;
                break;
        }

        modalVideoWrapper.innerHTML = content;
        modal.classList.add('is-active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal || !modalVideoWrapper) return;

        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // Destroy iframe/video to stop playback
        modalVideoWrapper.innerHTML = '';
    }

    function initVideoModal() {
        if (!modal) return;

        // Play buttons
        playButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const card = btn.closest('.project-card');
                openModal(card);
            });
        });

        // Also allow clicking the entire video-container area
        document.querySelectorAll('.video-container').forEach(container => {
            container.addEventListener('click', () => {
                const card = container.closest('.project-card');
                openModal(card);
            });
            container.style.cursor = 'pointer';
        });

        // Close modal
        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', closeModal);
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('is-active')) {
                closeModal();
            }
        });
    }

    // ---- 7. INITIALIZATION ----
    function init() {
        // Header scroll (works on all pages)
        if (header) {
            window.addEventListener('scroll', handleHeaderScroll, { passive: true });
            handleHeaderScroll(); // Initial check
        }

        // Only initialize portfolio-specific features if elements exist
        if (navItems.length > 0) {
            initActiveNavTracking();
        }

        if (navToggle && navMain) {
            initMobileMenu();
        }

        if (fadeElements.length > 0) {
            initScrollAnimations();
        }

        if (modal) {
            initVideoModal();
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
