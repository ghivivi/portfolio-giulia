/* ============================================
   Portfolio Giulia - Main Script
   ============================================ */

(function() {
    'use strict';

    // ---- CONFIG ----
    var CATEGORIES = ['giornalismo', 'documentari', 'iniziative'];

    // ---- 1. DOM REFERENCES ----
    var sidebar = document.getElementById('sidebar');
    var navToggle = document.querySelector('.nav-toggle');
    var videoModal = document.getElementById('video-modal');
    var modalVideoWrapper = videoModal ? videoModal.querySelector('.modal-video-wrapper') : null;
    var videoModalClose = videoModal ? videoModal.querySelector('.modal-close') : null;
    var videoModalOverlay = videoModal ? videoModal.querySelector('.modal-overlay') : null;

    // ---- 2. LANGUAGE DETECTION ----
    function detectLanguage() {
        var path = window.location.pathname;
        if (path.indexOf('/it/') !== -1) return 'it';
        if (path.indexOf('/en/') !== -1) return 'en';
        if (path.indexOf('/fr/') !== -1) return 'fr';
        return 'it';
    }

    // ---- 3. LOAD AND RENDER PROJECTS BY CATEGORY ----
    async function loadAndRenderByCategory(language) {
        var configPath = '../config/';
        var mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = '';

        for (var i = 0; i < CATEGORIES.length; i++) {
            try {
                var response = await fetch(configPath + CATEGORIES[i] + '.json');
                var data = await response.json();

                var visibleProjects = data.projects.filter(function(p) {
                    return p.visible !== false;
                });

                if (visibleProjects.length === 0) continue;

                var categoryName = data.category[language] || data.category.it;
                var categoryId = CATEGORIES[i];

                var sectionHTML = '<section class="category-section fade-in" id="' + categoryId + '">' +
                    '<h2 class="category-title">' + categoryName + '</h2>' +
                    '<div class="category-row">';

                visibleProjects.sort(function(a, b) {
                    return (a.order || 999) - (b.order || 999);
                });

                visibleProjects.forEach(function(project) {
                    if (!project.category) project.category = data.category;
                    sectionHTML += createProjectCard(project, language);
                });

                sectionHTML += '</div></section>';
                mainContent.insertAdjacentHTML('beforeend', sectionHTML);
            } catch (error) {
                console.error('Error loading ' + CATEGORIES[i] + ':', error);
            }
        }

        initVideoListeners();
        initScrollAnimations();
        initThumbnailFallbacks();
    }

    // ---- 4. CREATE PROJECT CARD HTML ----
    function createProjectCard(project, language) {
        var categoryText = '';
        if (project.category) {
            categoryText = project.category[language] || project.category.it || '';
        }
        var title = project.title[language] || project.title.it || '';
        var description = '';
        if (project.description) {
            description = project.description[language] || project.description.it || '';
        }

        var hasVideo = project.video && project.video.type;
        var videoAttrs = '';

        if (hasVideo) {
            if (project.video.type === 'local') {
                videoAttrs = 'data-video-type="local" data-video-src="' + project.video.src + '"';
            } else {
                videoAttrs = 'data-video-type="' + project.video.type + '" data-video-id="' + project.video.id + '"';
            }
        }

        var thumbnailStyle = '';
        if (project.thumbnail && project.thumbnail.url) {
            thumbnailStyle = "background-image: url('" + project.thumbnail.url + "'); background-size: cover; background-position: center;";
        } else if (project.thumbnail && project.thumbnail.fallbackGradient) {
            thumbnailStyle = 'background: ' + project.thumbnail.fallbackGradient + ';';
        } else {
            thumbnailStyle = 'background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);';
        }

        var playLabels = {
            it: 'Riproduci video',
            en: 'Play video',
            fr: 'Lire la vidéo'
        };
        var readLabels = {
            it: 'Leggi articolo',
            en: 'Read article',
            fr: "Lire l'article"
        };

        var cardAttrs = 'class="project-card"';
        if (hasVideo) {
            cardAttrs += ' ' + videoAttrs;
        } else if (project.articleUrl) {
            cardAttrs += ' data-article-url="' + project.articleUrl + '"';
        }

        var actionBtnHTML = '';
        if (hasVideo) {
            actionBtnHTML = '<button class="play-btn" aria-label="' + playLabels[language] + '">' +
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
            '</button>';
        } else if (project.articleUrl) {
            actionBtnHTML = '<a href="' + project.articleUrl + '" target="_blank" rel="noopener" class="article-link-btn" aria-label="' + readLabels[language] + '">' +
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zm-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7H12z"/></svg>' +
            '</a>';
        }

        return '<article ' + cardAttrs + '>' +
            '<div class="video-container">' +
                '<div class="video-thumbnail" style="' + thumbnailStyle + '"></div>' +
                actionBtnHTML +
            '</div>' +
            '<div class="project-info">' +
                '<h3 class="project-title">' + title + '</h3>' +
                (categoryText ? '<p class="project-category">' + categoryText + '</p>' : '') +
                (description ? '<p class="project-description">' + description + '</p>' : '') +
            '</div>' +
        '</article>';
    }

    // ---- 5. MOBILE SIDEBAR TOGGLE ----
    function initMobileSidebar() {
        if (!navToggle || !sidebar) return;

        navToggle.addEventListener('click', function() {
            var isActive = navToggle.classList.toggle('is-active');
            sidebar.classList.toggle('is-active');
            navToggle.setAttribute('aria-expanded', isActive);
            document.body.style.overflow = isActive ? 'hidden' : '';
        });

        // Close sidebar when clicking a link
        sidebar.querySelectorAll('.sidebar-link').forEach(function(link) {
            link.addEventListener('click', function() {
                navToggle.classList.remove('is-active');
                sidebar.classList.remove('is-active');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // ---- 6. CONTENT MODALS (About / Contact) ----
    function initContentModals() {
        var modalLinks = document.querySelectorAll('[data-modal]');

        modalLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var modalId = link.getAttribute('data-modal') + '-modal';
                var modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('is-active');
                    modal.setAttribute('aria-hidden', 'false');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        // Close buttons and overlays for content modals
        document.querySelectorAll('.content-modal').forEach(function(modal) {
            var closeBtn = modal.querySelector('.modal-close');
            var overlay = modal.querySelector('.modal-overlay');

            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    closeContentModal(modal);
                });
            }
            if (overlay) {
                overlay.addEventListener('click', function() {
                    closeContentModal(modal);
                });
            }
        });

        // ESC key for content modals
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.content-modal.is-active').forEach(function(modal) {
                    closeContentModal(modal);
                });
            }
        });
    }

    function closeContentModal(modal) {
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
        // Only restore scroll if no other modals are open
        if (!document.querySelector('.content-modal.is-active') &&
            !(videoModal && videoModal.classList.contains('is-active'))) {
            document.body.style.overflow = '';
        }
    }

    // ---- 7. VIDEO MODAL ----
    function openVideoModal(card) {
        if (!videoModal || !modalVideoWrapper) return;

        var type = card.dataset.videoType;
        var videoId = card.dataset.videoId;
        var videoSrc = card.dataset.videoSrc;

        var content = '';

        switch (type) {
            case 'youtube':
                content = '<iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
                break;
            case 'vimeo':
                content = '<iframe src="https://player.vimeo.com/video/' + videoId + '?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>';
                break;
            case 'local':
                content = '<video controls autoplay><source src="' + videoSrc + '" type="video/mp4">Your browser does not support the video tag.</video>';
                break;
        }

        modalVideoWrapper.innerHTML = content;
        videoModal.classList.add('is-active');
        videoModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeVideoModal() {
        if (!videoModal || !modalVideoWrapper) return;

        videoModal.classList.remove('is-active');
        videoModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        modalVideoWrapper.innerHTML = '';
    }

    function initVideoListeners() {
        document.querySelectorAll('.play-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var card = btn.closest('.project-card');
                if (card.dataset.videoType && videoModal) {
                    openVideoModal(card);
                }
            });
        });

        document.querySelectorAll('.video-container').forEach(function(container) {
            var card = container.closest('.project-card');
            if (card.dataset.videoType && videoModal) {
                container.addEventListener('click', function() {
                    openVideoModal(card);
                });
                container.style.cursor = 'pointer';
            } else if (card.dataset.articleUrl) {
                container.addEventListener('click', function() {
                    window.open(card.dataset.articleUrl, '_blank');
                });
                container.style.cursor = 'pointer';
            }
        });
    }

    function initVideoModalClose() {
        if (!videoModal) return;

        if (videoModalClose) {
            videoModalClose.addEventListener('click', closeVideoModal);
        }
        if (videoModalOverlay) {
            videoModalOverlay.addEventListener('click', closeVideoModal);
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && videoModal.classList.contains('is-active')) {
                closeVideoModal();
            }
        });
    }

    // ---- 8. SCROLL ANIMATIONS ----
    function initScrollAnimations() {
        var fadeEls = document.querySelectorAll('.fade-in:not(.is-visible)');
        if (fadeEls.length === 0) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });

        fadeEls.forEach(function(el) {
            observer.observe(el);
        });
    }

    // ---- 9. THUMBNAIL FALLBACK ----
    function initThumbnailFallbacks() {
        document.querySelectorAll('.video-thumbnail').forEach(function(thumb) {
            var bgImage = thumb.style.backgroundImage;
            if (bgImage && bgImage !== 'none' && bgImage.indexOf('url') !== -1) {
                var img = new Image();
                img.onerror = function() {
                    thumb.style.backgroundImage = 'none';
                    thumb.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)';
                };
                var match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match) {
                    img.src = match[1];
                }
            }
        });
    }

    // ---- 10. SIDEBAR ACTIVE LINK TRACKING ----
    function initSidebarActiveTracking() {
        var sections = document.querySelectorAll('.category-section[id]');
        var sidebarLinks = document.querySelectorAll('.sidebar-link[href^="#"]');
        if (sections.length === 0 || sidebarLinks.length === 0) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var id = entry.target.getAttribute('id');
                    sidebarLinks.forEach(function(link) {
                        link.classList.toggle('active',
                            link.getAttribute('href') === '#' + id
                        );
                    });
                }
            });
        }, {
            rootMargin: '-20% 0px -60% 0px'
        });

        sections.forEach(function(section) {
            observer.observe(section);
        });
    }

    // ---- 11. INITIALIZATION ----
    async function init() {
        // Mobile sidebar
        initMobileSidebar();

        // Content modals (About / Contact)
        initContentModals();

        // Video modal close handlers
        initVideoModalClose();

        // Load and render projects by category
        var mainContent = document.getElementById('main-content');
        if (mainContent) {
            var language = detectLanguage();
            await loadAndRenderByCategory(language);
            initSidebarActiveTracking();
        }

        // Initialize scroll animations for existing elements
        initScrollAnimations();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
