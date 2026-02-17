/* ============================================
   Portfolio Giulia Bertoluzzi - Main Script
   Design: Light Editorial with Section Navigation
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

    // Carousel state
    var currentSlide = 0;
    var totalSlides = 0;
    var allProjects = [];
    var allSections = {};
    var currentFilterCat = null;
    var autoplayTimer = null;
    var AUTOPLAY_INTERVAL = 6000;
    var previousSection = 'portfolio';

    // i18n
    var translations = {};

    // ---- 2. LANGUAGE DETECTION ----
    function detectLanguage() {
        var path = window.location.pathname;
        if (path.indexOf('/it/') !== -1) return 'it';
        if (path.indexOf('/en/') !== -1) return 'en';
        if (path.indexOf('/fr/') !== -1) return 'fr';
        return 'it';
    }

    // ---- 2b. i18n SYSTEM ----
    function getNestedValue(obj, keyPath) {
        var keys = keyPath.split('.');
        var current = obj;
        for (var i = 0; i < keys.length; i++) {
            if (current == null) return null;
            current = current[keys[i]];
        }
        return current;
    }

    function t(key) {
        return getNestedValue(translations, key) || key;
    }

    async function loadTranslations(language) {
        try {
            var response = await fetch('../config/i18n/' + language + '.json');
            translations = await response.json();
            applyTranslations();
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(function(el) {
            var key = el.getAttribute('data-i18n');
            var value = getNestedValue(translations, key);
            if (value) {
                if (el.tagName === 'META') {
                    el.setAttribute('content', value);
                } else if (el.id === 'project-detail-back') {
                    el.innerHTML = '&larr; ' + value;
                } else {
                    el.textContent = value;
                }
            }
        });
    }

    // ---- 3. VIDEO THUMBNAIL HELPER ----
    function getVideoThumbnailUrl(project) {
        if (!project.video || !project.video.type) return '';
        if (project.video.type === 'youtube' && project.video.id) {
            return 'https://img.youtube.com/vi/' + project.video.id + '/hqdefault.jpg';
        }
        if (project.video.type === 'vimeo' && project.video.id) {
            return 'https://vumbnail.com/' + project.video.id + '.jpg';
        }
        return '';
    }

    function getProjectThumbnailUrl(project) {
        if (project.thumbnail && project.thumbnail.url && project.thumbnail.url !== '') {
            return project.thumbnail.url;
        }
        return getVideoThumbnailUrl(project);
    }

    // ---- 3b. PROJECT DETAIL HELPER ----
    function projectHasDetail(project) {
        var hasTesto = project.testo && (project.testo.it || project.testo.en || project.testo.fr);
        var hasAllegati = project.allegati && project.allegati.length > 0;
        return hasTesto || hasAllegati;
    }

    // ---- 4. SECTION NAVIGATION ----
    function navTo(sectionId) {
        document.querySelectorAll('.page-section').forEach(function(section) {
            section.classList.remove('is-active');
        });

        var target = document.getElementById('section-' + sectionId);
        if (target) {
            target.classList.add('is-active');
        }

        // Cleanup detail page video when navigating away
        if (sectionId !== 'project-detail') {
            var detailContent = document.getElementById('project-detail-content');
            if (detailContent) detailContent.innerHTML = '';
        }

        updateActiveNav(sectionId);
        closeMobileSidebar();
    }

    function updateActiveNav(sectionId) {
        document.querySelectorAll('.sidebar-link').forEach(function(link) {
            link.classList.remove('active');
        });

        var navId = sectionId;
        if (navId === 'all-projects' || navId === 'project-detail') navId = 'portfolio';

        // For portfolio, highlight the dropdown toggle that matches current section filter
        if (navId === 'portfolio') {
            document.querySelectorAll('.sidebar-link[data-nav="portfolio"]').forEach(function(link) {
                link.classList.add('active');
            });
        } else {
            var activeLink = document.querySelector('.sidebar-link[data-nav="' + navId + '"]');
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }

    function closeMobileSidebar() {
        if (navToggle && sidebar) {
            navToggle.classList.remove('is-active');
            sidebar.classList.remove('is-active');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    }

    // ---- 5. EVENT DELEGATION ----
    function initEventDelegation() {
        document.addEventListener('click', function(e) {
            // Handle [data-nav] clicks
            var navLink = e.target.closest('[data-nav]');
            if (navLink) {
                var isDropdownToggle = navLink.classList.contains('dropdown-toggle');
                var navTarget = navLink.getAttribute('data-nav');

                // Dropdown toggles: only open/close the submenu, don't navigate
                if (isDropdownToggle) {
                    return;
                }

                e.preventDefault();

                if (navTarget === 'all-projects') {
                    showAllProjectsGrid();
                    navTo('all-projects');
                } else {
                    navTo(navTarget);
                }
                return;
            }

            // Handle [data-filter-cat] clicks
            var filterLink = e.target.closest('[data-filter-cat]');
            if (filterLink) {
                e.preventDefault();
                var catId = filterLink.getAttribute('data-filter-cat');
                filterByCategory(catId);
                return;
            }

            // Handle [data-open-project] clicks (all-projects grid)
            var projectBox = e.target.closest('[data-open-project]');
            if (projectBox) {
                e.preventDefault();
                var url = projectBox.getAttribute('data-open-project');
                if (url) {
                    window.open(url, '_blank', 'noopener');
                }
                return;
            }

            // Handle [data-play-video] clicks (all-projects grid video buttons)
            var videoBtn = e.target.closest('[data-play-video]');
            if (videoBtn) {
                e.preventDefault();
                e.stopPropagation();
                openVideoModal(videoBtn);
                return;
            }

            // Handle [data-show-detail] clicks
            var detailBtn = e.target.closest('[data-show-detail]');
            if (detailBtn) {
                e.preventDefault();
                e.stopPropagation();
                var projectId = detailBtn.getAttribute('data-show-detail');
                if (projectId) {
                    showProjectDetail(projectId);
                }
                return;
            }
        });
    }

    // ---- 6. CAROUSEL ----
    function initCarousel() {
        var prevBtn = document.getElementById('carousel-prev');
        var nextBtn = document.getElementById('carousel-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                goToSlide(currentSlide - 1);
                resetAutoplay();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                goToSlide(currentSlide + 1);
                resetAutoplay();
            });
        }

        document.addEventListener('keydown', function(e) {
            var carouselSection = document.getElementById('section-portfolio');
            if (!carouselSection || !carouselSection.classList.contains('is-active')) return;

            if (e.key === 'ArrowLeft') {
                goToSlide(currentSlide - 1);
                resetAutoplay();
            } else if (e.key === 'ArrowRight') {
                goToSlide(currentSlide + 1);
                resetAutoplay();
            }
        });

        startAutoplay();
    }

    function goToSlide(index) {
        if (totalSlides === 0) return;

        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;

        var slides = document.querySelectorAll('.carousel-slide');
        slides.forEach(function(slide, i) {
            slide.classList.toggle('is-active', i === index);
        });
        document.querySelectorAll('.carousel-dot').forEach(function(dot, i) {
            dot.classList.toggle('is-active', i === index);
        });

        currentSlide = index;

        // Toggle dark theme for arrows/dots on view-all slide
        var carousel = document.getElementById('projects-carousel');
        if (carousel) {
            var isViewAll = slides[index] && slides[index].classList.contains('carousel-slide--view-all');
            carousel.classList.toggle('is-view-all', isViewAll);
        }
    }

    // ---- 6b. CAROUSEL AUTOPLAY ----
    function startAutoplay() {
        stopAutoplay();
        autoplayTimer = setInterval(function() {
            var carouselSection = document.getElementById('section-portfolio');
            if (carouselSection && carouselSection.classList.contains('is-active')) {
                goToSlide(currentSlide + 1);
            }
        }, AUTOPLAY_INTERVAL);
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function resetAutoplay() {
        startAutoplay();
    }

    // ---- 7. LOAD AND RENDER PROJECTS ----
    async function loadAndRenderProjects(language) {
        try {
            var response = await fetch('../config/projects.json');
            var data = await response.json();

            allSections = data.sections || {};
            var projects = data.projects.filter(function(p) {
                return p.visible !== false;
            });

            projects.sort(function(a, b) {
                return (a.order || 999) - (b.order || 999);
            });

            allProjects = projects;

            // Build carousel with mainpage projects only
            var mainpageProjects = projects.filter(function(p) {
                return p.mainpage === true;
            });
            buildCarousel(mainpageProjects, language);

            // Populate sidebar dropdown menus (journalism + ngo)
            populateMenuDropdowns(projects);

            // Init video listeners for carousel
            initVideoListenersForCarousel();
            initThumbnailFallbacks();

        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    function buildCarousel(projects, language) {
        var slidesContainer = document.getElementById('carousel-slides');
        var dotsContainer = document.getElementById('carousel-dots');

        if (!slidesContainer) return;

        slidesContainer.innerHTML = '';
        if (dotsContainer) dotsContainer.innerHTML = '';

        projects.forEach(function(project, index) {
            slidesContainer.insertAdjacentHTML('beforeend',
                createCarouselSlide(project, language, index));
        });

        // Append "view all" slide as last page
        var viewAllSlide = '<div class="carousel-slide carousel-slide--view-all">' +
            '<div class="view-all-slide-content">' +
                '<a href="#" class="view-all-link" data-nav="all-projects">' +
                    t('ui.viewAllProjects') + ' &rarr;' +
                '</a>' +
            '</div>' +
        '</div>';
        slidesContainer.insertAdjacentHTML('beforeend', viewAllSlide);

        totalSlides = projects.length + 1;
        currentSlide = 0;

        if (dotsContainer) {
            for (var i = 0; i < totalSlides; i++) {
                var dot = document.createElement('button');
                dot.className = 'carousel-dot' + (i === 0 ? ' is-active' : '');
                dot.setAttribute('aria-label', 'Slide ' + (i + 1));
                (function(idx) {
                    dot.addEventListener('click', function() {
                        goToSlide(idx);
                        resetAutoplay();
                    });
                })(i);
                dotsContainer.appendChild(dot);
            }
        }
    }

    // ---- 8. CREATE CAROUSEL SLIDE ----
    function createCarouselSlide(project, language, index) {
        var title = project.title[language] || project.title.it || '';
        var description = '';
        if (project.description) {
            description = project.description[language] || project.description.it || '';
        }

        var categoryLabels = [];
        if (project.categories && project.categories.length > 0) {
            categoryLabels = project.categories.filter(function(c) { return c !== 'TODO'; });
        }
        var tagText = '';
        if (project.date) {
            var year = project.date.substring(0, 4);
            tagText = year;
            if (categoryLabels.length > 0) {
                var catName = t('categories.' + categoryLabels[0]);
                if (catName !== 'categories.' + categoryLabels[0]) {
                    tagText += ' &bull; ' + catName.toUpperCase();
                } else {
                    tagText += ' &bull; ' + categoryLabels[0].replace(/-/g, ' ').toUpperCase();
                }
            }
        }

        // Background style — use video thumbnail if no custom thumbnail
        var thumbUrl = getProjectThumbnailUrl(project);
        var bgStyle = '';
        if (thumbUrl) {
            bgStyle = "background-image: url('" + thumbUrl + "');";
        } else if (project.thumbnail && project.thumbnail.fallbackGradient) {
            bgStyle = 'background: ' + project.thumbnail.fallbackGradient + ';';
        } else {
            bgStyle = 'background: linear-gradient(135deg, #E5DDD4 0%, #FAF8F5 100%);';
        }

        // Video data attributes
        var hasVideo = project.video && project.video.type;
        var videoAttrs = '';
        if (hasVideo) {
            if (project.video.type === 'local') {
                videoAttrs = 'data-video-type="local" data-video-src="' + project.video.src + '"';
            } else {
                videoAttrs = 'data-video-type="' + project.video.type + '" data-video-id="' + project.video.id + '"';
            }
        }

        var actionHTML = '';
        if (hasVideo) {
            actionHTML = '<button class="slide-play-btn" ' + videoAttrs + '>&#9654; ' + t('ui.watch') + '</button>';
        } else if (project.articleUrl) {
            actionHTML = '<a href="' + project.articleUrl + '" target="_blank" rel="noopener" class="slide-read-btn">' + t('ui.readArticle') + ' &rarr;</a>';
        }

        // Add detail button if project has text or attachments
        if (projectHasDetail(project)) {
            actionHTML += ' <button class="slide-detail-btn" data-show-detail="' + project.id + '">' + t('ui.details') + ' &rarr;</button>';
        }

        return '<div class="carousel-slide' + (index === 0 ? ' is-active' : '') + '" style="' + bgStyle + '">' +
            '<div class="carousel-slide-overlay"></div>' +
            '<div class="carousel-slide-content">' +
                (tagText ? '<p class="slide-tag">' + tagText + '</p>' : '') +
                '<h2 class="slide-title">' + title + '</h2>' +
                (description ? '<p class="slide-description">' + description + '</p>' : '') +
                actionHTML +
            '</div>' +
        '</div>';
    }

    // ---- 9. POPULATE MENU DROPDOWNS (journalism + ngo) ----
    function populateMenuDropdowns(projects) {
        ['journalism', 'ngo'].forEach(function(sectionId) {
            var dropdown = document.getElementById(sectionId + '-dropdown');
            if (!dropdown || !allSections[sectionId]) return;

            dropdown.innerHTML = '';

            var sectionCats = allSections[sectionId].order || [];
            sectionCats.forEach(function(catId) {
                var catName = t('categories.' + catId);
                if (catName === 'categories.' + catId) {
                    catName = catId.replace(/-/g, ' ');
                }

                var count = projects.filter(function(p) {
                    return p.categories && p.categories.indexOf(catId) !== -1;
                }).length;

                if (count === 0) return;

                var li = document.createElement('li');
                var a = document.createElement('a');
                a.className = 'dropdown-link';
                a.href = '#';
                a.setAttribute('data-filter-cat', catId);
                a.setAttribute('data-section', sectionId);
                a.innerHTML = catName + ' <span class="dropdown-count">' + count + '</span>';
                li.appendChild(a);
                dropdown.appendChild(li);
            });
        });
    }

    // ---- 10. CATEGORY FILTERING ----
    function filterByCategory(catId) {
        var language = detectLanguage();

        currentFilterCat = catId;

        var filtered = allProjects.filter(function(p) {
            return p.categories && p.categories.indexOf(catId) !== -1;
        });

        buildCarousel(filtered, language);
        initVideoListenersForCarousel();
        initThumbnailFallbacks();
        navTo('portfolio');
    }

    // ---- 11. SHOW MAINPAGE PROJECTS (Portfolio click) ----
    function showMainpageProjects() {
        var language = detectLanguage();
        currentFilterCat = null;

        var mainpageProjects = allProjects.filter(function(p) {
            return p.mainpage === true;
        });

        buildCarousel(mainpageProjects, language);
        initVideoListenersForCarousel();
        initThumbnailFallbacks();
        navTo('portfolio');
    }

    // ---- 12. ALL PROJECTS GRID ----
    function showAllProjectsGrid() {
        var language = detectLanguage();
        var gridContainer = document.getElementById('all-projects-grid');
        if (!gridContainer) return;

        // Show all visible projects, optionally filtered by current category
        var projects = allProjects;
        if (currentFilterCat && currentFilterCat !== 'all') {
            projects = allProjects.filter(function(p) {
                return p.categories && p.categories.indexOf(currentFilterCat) !== -1;
            });
        }

        gridContainer.innerHTML = '';

        projects.forEach(function(project) {
            var title = project.title[language] || project.title.it || '';
            if (!title) return;

            var thumbUrl = getProjectThumbnailUrl(project);
            var bgStyle = '';
            if (thumbUrl) {
                bgStyle = "background-image: url('" + thumbUrl + "');";
            } else if (project.thumbnail && project.thumbnail.fallbackGradient) {
                bgStyle = 'background: ' + project.thumbnail.fallbackGradient + ';';
            } else {
                bgStyle = 'background: linear-gradient(135deg, #E5DDD4 0%, #FAF8F5 100%);';
            }

            var hasVideo = project.video && project.video.type;
            var linkUrl = hasVideo ? '' : (project.articleUrl || '');
            var videoAttrs = '';
            if (hasVideo) {
                if (project.video.type === 'local') {
                    videoAttrs = 'data-video-type="local" data-video-src="' + project.video.src + '"';
                } else {
                    videoAttrs = 'data-video-type="' + project.video.type + '" data-video-id="' + project.video.id + '"';
                }
            }

            var year = project.date ? project.date.substring(0, 4) : '';
            var catLabel = '';
            if (project.categories && project.categories.length > 0) {
                var firstCat = project.categories.filter(function(c) { return c !== 'TODO'; })[0];
                if (firstCat) {
                    var translated = t('categories.' + firstCat);
                    catLabel = (translated !== 'categories.' + firstCat) ? translated : '';
                }
            }

            var actionHtml = '';
            if (hasVideo) {
                actionHtml = '<button class="project-box-action" data-play-video="1" ' + videoAttrs + '>&#9654;</button>';
            }

            var box = '<div class="project-box" ' + (linkUrl ? 'data-open-project="' + linkUrl + '"' : '') + '>' +
                '<div class="project-box-thumb" style="' + bgStyle + '">' +
                    actionHtml +
                '</div>' +
                '<div class="project-box-info">' +
                    '<h3 class="project-box-title">' + title + '</h3>' +
                    (year || catLabel ? '<p class="project-box-meta">' + (year ? year : '') + (year && catLabel ? ' &bull; ' : '') + catLabel + '</p>' : '') +
                '</div>' +
            '</div>';

            gridContainer.insertAdjacentHTML('beforeend', box);
        });

        // Update heading with category name if filtered
        var heading = document.querySelector('#section-all-projects .section-heading');
        if (heading) {
            if (currentFilterCat && currentFilterCat !== 'all') {
                var catName = t('categories.' + currentFilterCat);
                heading.textContent = (catName !== 'categories.' + currentFilterCat) ? catName : t('sections.allProjects');
            } else {
                heading.textContent = t('sections.allProjects');
            }
        }
    }

    // ---- 12b. PROJECT DETAIL ----
    function showProjectDetail(projectId) {
        var language = detectLanguage();
        var project = allProjects.find(function(p) { return p.id === projectId; });
        if (!project) return;

        var contentEl = document.getElementById('project-detail-content');
        if (!contentEl) return;

        // Track where we came from for the back button
        var activeSections = document.querySelectorAll('.page-section.is-active');
        if (activeSections.length > 0) {
            previousSection = activeSections[0].id.replace('section-', '');
        }

        // Title
        var title = project.title[language] || project.title.it || '';

        // Meta (year + categories)
        var year = project.date ? project.date.substring(0, 4) : '';
        var catLabels = [];
        if (project.categories && project.categories.length > 0) {
            project.categories.forEach(function(catId) {
                if (catId !== 'TODO') {
                    var translated = t('categories.' + catId);
                    if (translated !== 'categories.' + catId) {
                        catLabels.push(translated);
                    }
                }
            });
        }
        var metaText = year;
        if (catLabels.length > 0) {
            metaText += (metaText ? ' \u2022 ' : '') + catLabels.join(', ');
        }

        // Video embed
        var videoHTML = '';
        if (project.video && project.video.type) {
            var embedContent = '';
            switch (project.video.type) {
                case 'youtube':
                    embedContent = '<iframe src="https://www.youtube.com/embed/' + project.video.id + '?rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
                    break;
                case 'vimeo':
                    embedContent = '<iframe src="https://player.vimeo.com/video/' + project.video.id + '" allow="autoplay; fullscreen" allowfullscreen></iframe>';
                    break;
                case 'local':
                    embedContent = '<video controls><source src="' + project.video.src + '" type="video/mp4"></video>';
                    break;
            }
            if (embedContent) {
                videoHTML = '<div class="project-detail-video"><div class="project-detail-video-wrapper">' + embedContent + '</div></div>';
            }
        }

        // Text content
        var textContent = '';
        if (project.testo) {
            textContent = project.testo[language] || project.testo.it || '';
        }
        var textHTML = textContent ? '<div class="project-detail-text">' + textContent + '</div>' : '';

        // Attachments
        var attachHTML = '';
        if (project.allegati && project.allegati.length > 0) {
            var items = project.allegati.map(function(url) {
                var filename = url.split('/').pop();
                return '<li><a href="' + url + '" target="_blank" rel="noopener">' + filename + '</a></li>';
            }).join('');
            attachHTML = '<div class="project-detail-attachments">' +
                '<h3>' + t('ui.attachments') + '</h3>' +
                '<ul>' + items + '</ul>' +
            '</div>';
        }

        // Article link
        var articleHTML = '';
        if (project.articleUrl) {
            articleHTML = '<p style="margin-top: var(--space-sm);"><a href="' + project.articleUrl + '" target="_blank" rel="noopener" style="color: var(--color-text-secondary); text-decoration: underline; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">' + t('ui.readArticle') + ' &rarr;</a></p>';
        }

        // Assemble
        contentEl.innerHTML =
            '<h2 class="project-detail-title">' + title + '</h2>' +
            (metaText ? '<p class="project-detail-meta">' + metaText + '</p>' : '') +
            videoHTML +
            textHTML +
            attachHTML +
            articleHTML;

        navTo('project-detail');
    }

    // ---- 13. MOBILE SIDEBAR TOGGLE ----
    function initMobileSidebar() {
        if (!navToggle || !sidebar) return;

        navToggle.addEventListener('click', function() {
            var isActive = navToggle.classList.toggle('is-active');
            sidebar.classList.toggle('is-active');
            navToggle.setAttribute('aria-expanded', isActive);
        });
    }

    // ---- 14. DROPDOWNS ----
    function initDropdowns() {
        document.querySelectorAll('.dropdown-toggle').forEach(function(toggle) {
            var dropdown = toggle.closest('.sidebar-dropdown');
            if (!dropdown) return;

            toggle.addEventListener('click', function(e) {
                e.preventDefault();

                document.querySelectorAll('.sidebar-dropdown').forEach(function(d) {
                    if (d !== dropdown) d.classList.remove('is-open');
                });

                dropdown.classList.toggle('is-open');
            });
        });
    }

    // ---- 15. VIDEO MODAL ----
    function openVideoModal(element) {
        if (!videoModal || !modalVideoWrapper) return;

        var type = element.dataset.videoType;
        var videoId = element.dataset.videoId;
        var videoSrc = element.dataset.videoSrc;

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
    }

    function closeVideoModal() {
        if (!videoModal || !modalVideoWrapper) return;

        videoModal.classList.remove('is-active');
        videoModal.setAttribute('aria-hidden', 'true');
        modalVideoWrapper.innerHTML = '';
    }

    function initVideoListenersForCarousel() {
        document.querySelectorAll('.slide-play-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (btn.dataset.videoType && videoModal) {
                    openVideoModal(btn);
                }
            });
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

    // ---- 16. THUMBNAIL FALLBACK ----
    function initThumbnailFallbacks() {
        document.querySelectorAll('.carousel-slide').forEach(function(slide) {
            var bgImage = slide.style.backgroundImage;
            if (bgImage && bgImage !== 'none' && bgImage.indexOf('url') !== -1) {
                var img = new Image();
                img.onerror = function() {
                    slide.style.backgroundImage = 'none';
                    slide.style.background = 'linear-gradient(135deg, #E5DDD4 0%, #FAF8F5 100%)';
                };
                var match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match) {
                    img.src = match[1];
                }
            }
        });
    }

    // ---- 17. INITIALIZATION ----
    async function init() {
        initMobileSidebar();
        initDropdowns();
        initVideoModalClose();
        initEventDelegation();
        initCarousel();

        // Back button for project detail
        var detailBackBtn = document.getElementById('project-detail-back');
        if (detailBackBtn) {
            detailBackBtn.addEventListener('click', function() {
                navTo(previousSection);
            });
        }

        var mainContent = document.getElementById('main-content');
        if (mainContent) {
            var language = detectLanguage();
            await loadTranslations(language);
            await loadAndRenderProjects(language);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
