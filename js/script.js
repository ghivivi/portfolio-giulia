/* ============================================
   Portfolio Giulia - Main Script
   ============================================ */

(function() {
    'use strict';

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

    // ---- 3. LOAD AND RENDER PROJECTS ----
    async function loadAndRenderProjects(language) {
        var mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = '';

        try {
            var response = await fetch('../config/projects.json');
            var data = await response.json();

            var categories = data.categories;
            var categoryOrder = data.categoryOrder;
            var projects = data.projects.filter(function(p) {
                return p.visible !== false;
            });

            // Render each category section
            for (var i = 0; i < categoryOrder.length; i++) {
                var catId = categoryOrder[i];
                var catName = categories[catId] ? (categories[catId][language] || categories[catId].it) : catId;

                // Filter projects for this category
                var catProjects = projects.filter(function(p) {
                    return p.categories && p.categories.indexOf(catId) !== -1;
                });

                if (catProjects.length === 0) continue;

                catProjects.sort(function(a, b) {
                    return (a.order || 999) - (b.order || 999);
                });

                var sectionHTML = '<section class="category-section fade-in" id="' + catId + '">' +
                    '<h2 class="category-title">' + catName + '</h2>' +
                    '<div class="category-row">';

                catProjects.forEach(function(project) {
                    sectionHTML += createProjectCard(project, language, categories);
                });

                sectionHTML += '</div></section>';
                mainContent.insertAdjacentHTML('beforeend', sectionHTML);
            }

            // Render TOTAG category if any
            var totagProjects = projects.filter(function(p) {
                return p.categories && p.categories.indexOf('TODO') !== -1;
            });

            if (totagProjects.length > 0) {
                var totagLabels = { it: 'Da Categorizzare', en: 'To Tag', fr: 'À Catégoriser' };
                var totagHTML = '<section class="category-section fade-in" id="totag">' +
                    '<h2 class="category-title">' + (totagLabels[language] || totagLabels.it) + '</h2>' +
                    '<div class="category-row">';

                totagProjects.forEach(function(project) {
                    totagHTML += createProjectCard(project, language, categories);
                });

                totagHTML += '</div></section>';
                mainContent.insertAdjacentHTML('beforeend', totagHTML);
            }

            // Update dropdown counters and hide empty links
            updateDropdownCounts(projects, categoryOrder, totagProjects.length);

            initVideoListeners();
            initScrollAnimations();
            initThumbnailFallbacks();
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    // ---- 4. CREATE PROJECT CARD HTML ----
    function createProjectCard(project, language, categories) {
        var title = project.title[language] || project.title.it || '';
        var description = '';
        if (project.description) {
            description = project.description[language] || project.description.it || '';
        }

        // Build category tags from categories array
        var categoryLabels = [];
        if (project.categories) {
            project.categories.forEach(function(catId) {
                if (catId !== 'TODO' && categories[catId]) {
                    categoryLabels.push(categories[catId][language] || categories[catId].it);
                }
            });
        }
        var categoryText = categoryLabels.join(' / ');

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

    // ---- 4b. UPDATE DROPDOWN COUNTS & HIDE EMPTY ----
    function updateDropdownCounts(projects, categoryOrder, totagCount) {
        var dropdownLinks = document.querySelectorAll('.dropdown-link');
        var totalVisible = 0;

        dropdownLinks.forEach(function(link) {
            var href = link.getAttribute('href');
            var filter = link.getAttribute('data-filter');

            if (filter === 'all') return; // handle "All" separately

            // Extract category id from href (e.g. "#documentary-films" -> "documentary-films")
            var catId = href ? href.replace('#', '') : '';
            var count = 0;

            if (catId === 'totag') {
                count = totagCount;
            } else {
                count = projects.filter(function(p) {
                    return p.visible !== false && p.categories && p.categories.indexOf(catId) !== -1;
                }).length;
            }

            if (count === 0) {
                // Hide dropdown link for empty categories
                link.closest('li').style.display = 'none';
            } else {
                totalVisible += count;
                // Append count badge
                link.insertAdjacentHTML('beforeend', ' <span class="dropdown-count">' + count + '</span>');
            }
        });

        // Update "All Projects" count
        var allLink = document.querySelector('.dropdown-link[data-filter="all"]');
        if (allLink) {
            allLink.insertAdjacentHTML('beforeend', ' <span class="dropdown-count">' + totalVisible + '</span>');
        }
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

        // Close sidebar when clicking a link (including dropdown links)
        sidebar.querySelectorAll('.sidebar-link, .dropdown-link').forEach(function(link) {
            link.addEventListener('click', function() {
                if (link.classList.contains('dropdown-toggle')) return;
                navToggle.classList.remove('is-active');
                sidebar.classList.remove('is-active');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // ---- 6. WORKS DROPDOWN ----
    function initWorksDropdown() {
        var dropdownToggle = document.querySelector('.dropdown-toggle');
        var dropdown = dropdownToggle ? dropdownToggle.closest('.sidebar-dropdown') : null;

        if (!dropdownToggle || !dropdown) return;

        // Open dropdown by default on desktop
        if (window.innerWidth >= 768) {
            dropdown.classList.add('is-open');
        }

        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            dropdown.classList.toggle('is-open');
        });

        // Close dropdown when clicking a sub-link
        dropdown.querySelectorAll('.dropdown-link').forEach(function(link) {
            link.addEventListener('click', function() {
                dropdown.classList.remove('is-open');
            });
        });
    }

    // ---- 7. CONTENT MODALS (About / Contact / Services) ----
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
        if (!document.querySelector('.content-modal.is-active') &&
            !(videoModal && videoModal.classList.contains('is-active'))) {
            document.body.style.overflow = '';
        }
    }

    // ---- 8. VIDEO MODAL ----
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

    // ---- 9. SCROLL ANIMATIONS ----
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

    // ---- 10. THUMBNAIL FALLBACK ----
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

    // ---- 11. SIDEBAR ACTIVE LINK TRACKING ----
    function initSidebarActiveTracking() {
        var sections = document.querySelectorAll('.category-section[id]');
        var sidebarLinks = document.querySelectorAll('.sidebar-link[href^="#"], .dropdown-link[href^="#"]');
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

    // ---- 12. INITIALIZATION ----
    async function init() {
        initMobileSidebar();
        initWorksDropdown();
        initContentModals();
        initVideoModalClose();

        var mainContent = document.getElementById('main-content');
        if (mainContent) {
            var language = detectLanguage();
            await loadAndRenderProjects(language);
            initSidebarActiveTracking();
        }

        initScrollAnimations();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
