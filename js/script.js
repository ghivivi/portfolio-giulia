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
    var allCategories = {};
    var allSections = {};
    var allSectionOrder = [];
    var currentFilterCat = null;
    var currentFilterSection = null;
    var autoplayTimer = null;
    var AUTOPLAY_INTERVAL = 6000;

    // ---- 2. LANGUAGE DETECTION (cached) ----
    var cachedLang = null;
    function detectLanguage() {
        if (cachedLang) return cachedLang;
        var path = window.location.pathname;
        if (path.indexOf('/it/') !== -1) cachedLang = 'it';
        else if (path.indexOf('/en/') !== -1) cachedLang = 'en';
        else if (path.indexOf('/fr/') !== -1) cachedLang = 'fr';
        else cachedLang = 'it';
        return cachedLang;
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

    // ---- 4. SECTION NAVIGATION ----
    function navTo(sectionId) {
        document.querySelectorAll('.page-section').forEach(function(section) {
            section.classList.remove('is-active');
        });

        var target = document.getElementById('section-' + sectionId);
        if (target) {
            target.classList.add('is-active');
        }

        updateActiveNav(sectionId);
        closeMobileSidebar();
    }

    function updateActiveNav(sectionId) {
        document.querySelectorAll('.sidebar-link').forEach(function(link) {
            link.classList.remove('active');
        });

        var navId = sectionId;
        if (navId === 'all-projects') navId = 'portfolio';

        var activeLink = document.querySelector('.sidebar-link[data-nav="' + navId + '"]');
        if (activeLink) {
            activeLink.classList.add('active');
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
                var sectionId = filterLink.getAttribute('data-filter-section') || null;
                filterByCategory(catId, sectionId);
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

            allCategories = data.categories;
            allSections = data.sections;
            allSectionOrder = data.sectionOrder || Object.keys(data.sections);
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

            // Populate sidebar section dropdowns
            populateSectionDropdowns(projects, language);

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

        // Batch all slides into a single HTML string
        var slidesHtml = '';
        projects.forEach(function(project, index) {
            slidesHtml += createCarouselSlide(project, language, index);
        });

        // Append "view all" slide as last page
        var viewAllLabels = {
            it: 'Vedi tutti i progetti',
            en: 'View all projects',
            fr: 'Voir tous les projets'
        };
        slidesHtml += '<div class="carousel-slide carousel-slide--view-all">' +
            '<div class="view-all-slide-content">' +
                '<a href="#" class="view-all-link" data-nav="all-projects">' +
                    (viewAllLabels[language] || viewAllLabels.it) + ' &rarr;' +
                '</a>' +
            '</div>' +
        '</div>';
        slidesContainer.innerHTML = slidesHtml;

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
                tagText += ' &bull; ' + categoryLabels[0].replace(/-/g, ' ').toUpperCase();
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

        var playLabels = { it: 'Guarda', en: 'Watch', fr: 'Regarder' };
        var readLabels = { it: 'Leggi articolo', en: 'Read article', fr: "Lire l'article" };

        var actionHTML = '';
        if (hasVideo) {
            actionHTML = '<button class="slide-play-btn" ' + videoAttrs + '>&#9654; ' + (playLabels[language] || 'Watch') + '</button>';
        } else if (project.articleUrl) {
            actionHTML = '<a href="' + project.articleUrl + '" target="_blank" rel="noopener" class="slide-read-btn">' + (readLabels[language] || 'Read') + ' &rarr;</a>';
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

    // ---- 9. POPULATE SECTION DROPDOWNS ----
    function getProjectsForSection(projects, sectionId) {
        var section = allSections[sectionId];
        if (!section) return [];
        var sectionCats = section.categoryOrder || [];
        // Collect all category IDs including children
        var allCatIds = [];
        sectionCats.forEach(function(catId) {
            allCatIds.push(catId);
            if (allCategories[catId] && allCategories[catId].children) {
                allCategories[catId].children.forEach(function(childId) {
                    allCatIds.push(childId);
                });
            }
        });
        return projects.filter(function(p) {
            return p.categories && p.categories.some(function(c) {
                return allCatIds.indexOf(c) !== -1;
            });
        });
    }

    function getCategoryCount(projects, catId) {
        var catIds = [catId];
        if (allCategories[catId] && allCategories[catId].children) {
            catIds = catIds.concat(allCategories[catId].children);
        }
        return projects.filter(function(p) {
            return p.categories && p.categories.some(function(c) {
                return catIds.indexOf(c) !== -1;
            });
        }).length;
    }

    function populateSectionDropdowns(projects, language) {
        allSectionOrder.forEach(function(sectionId) {
            var dropdown = document.getElementById('dropdown-' + sectionId);
            if (!dropdown) return;

            var section = allSections[sectionId];
            var sectionProjects = getProjectsForSection(projects, sectionId);

            dropdown.innerHTML = '';

            // "All" option for this section
            var allLi = document.createElement('li');
            var allA = document.createElement('a');
            allA.className = 'dropdown-link';
            allA.href = '#';
            allA.setAttribute('data-filter-section', sectionId);
            allA.setAttribute('data-filter-cat', 'all');
            var allLabel = section.allLabel ? (section.allLabel[language] || section.allLabel.it) : 'All';
            allA.innerHTML = allLabel + ' <span class="dropdown-count">' + sectionProjects.length + '</span>';
            allLi.appendChild(allA);
            dropdown.appendChild(allLi);

            // Separator
            var sepLi = document.createElement('li');
            var hr = document.createElement('hr');
            hr.className = 'dropdown-separator';
            sepLi.appendChild(hr);
            dropdown.appendChild(sepLi);

            // Categories for this section
            var categoryOrder = section.categoryOrder || [];
            categoryOrder.forEach(function(catId) {
                var cat = allCategories[catId];
                if (!cat) return;
                var catName = cat[language] || cat.it || catId;
                var count = getCategoryCount(sectionProjects, catId);

                if (count === 0) return;

                var li = document.createElement('li');
                var a = document.createElement('a');
                a.className = 'dropdown-link';
                a.href = '#';
                a.setAttribute('data-filter-section', sectionId);
                a.setAttribute('data-filter-cat', catId);
                a.innerHTML = catName + ' <span class="dropdown-count">' + count + '</span>';
                li.appendChild(a);
                dropdown.appendChild(li);

                // Render children (sub-categories) if present
                if (cat.children && cat.children.length > 0) {
                    var subUl = document.createElement('ul');
                    subUl.className = 'dropdown-subcategories';
                    cat.children.forEach(function(childId) {
                        var childCat = allCategories[childId];
                        if (!childCat) return;
                        var childName = childCat[language] || childCat.it || childId;
                        var childCount = projects.filter(function(p) {
                            return p.categories && p.categories.indexOf(childId) !== -1;
                        }).length;
                        if (childCount === 0) return;

                        var childLi = document.createElement('li');
                        var childA = document.createElement('a');
                        childA.className = 'dropdown-link';
                        childA.href = '#';
                        childA.setAttribute('data-filter-section', sectionId);
                        childA.setAttribute('data-filter-cat', childId);
                        childA.innerHTML = childName + ' <span class="dropdown-count">' + childCount + '</span>';
                        childLi.appendChild(childA);
                        subUl.appendChild(childLi);
                    });
                    li.appendChild(subUl);
                }
            });
        });
    }

    // ---- 10. CATEGORY FILTERING ----
    function getExpandedCatIds(catId) {
        var ids = [catId];
        if (allCategories[catId] && allCategories[catId].children) {
            ids = ids.concat(allCategories[catId].children);
        }
        return ids;
    }

    function filterByCategory(catId, sectionId) {
        var language = detectLanguage();
        var filtered;

        currentFilterCat = catId;
        currentFilterSection = sectionId || null;

        if (catId === 'all' && sectionId) {
            // All projects in a section
            filtered = getProjectsForSection(allProjects, sectionId);
        } else if (catId === 'all') {
            filtered = allProjects.filter(function(p) {
                return p.mainpage === true;
            });
        } else {
            var catIds = getExpandedCatIds(catId);
            filtered = allProjects.filter(function(p) {
                return p.categories && p.categories.some(function(c) {
                    return catIds.indexOf(c) !== -1;
                });
            });
        }

        buildCarousel(filtered, language);
        initVideoListenersForCarousel();
        initThumbnailFallbacks();
        navTo('portfolio');
    }

    // ---- 11. SHOW MAINPAGE PROJECTS (Portfolio click) ----
    function showMainpageProjects() {
        var language = detectLanguage();
        currentFilterCat = null;
        currentFilterSection = null;

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

        // Show projects filtered by current section and/or category
        var projects = allProjects;
        if (currentFilterSection && currentFilterCat === 'all') {
            projects = getProjectsForSection(allProjects, currentFilterSection);
        } else if (currentFilterCat && currentFilterCat !== 'all') {
            var catIds = getExpandedCatIds(currentFilterCat);
            projects = allProjects.filter(function(p) {
                return p.categories && p.categories.some(function(c) {
                    return catIds.indexOf(c) !== -1;
                });
            });
        }

        // Batch all project boxes into a single HTML string
        var gridHtml = '';
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
                if (firstCat && allCategories[firstCat]) {
                    catLabel = allCategories[firstCat][language] || allCategories[firstCat].it || '';
                }
            }

            var actionHtml = '';
            if (hasVideo) {
                actionHtml = '<button class="project-box-action" data-play-video="1" ' + videoAttrs + '>&#9654;</button>';
            }

            gridHtml += '<div class="project-box" ' + (linkUrl ? 'data-open-project="' + linkUrl + '"' : '') + '>' +
                '<div class="project-box-thumb" style="' + bgStyle + '">' +
                    actionHtml +
                '</div>' +
                '<div class="project-box-info">' +
                    '<h3 class="project-box-title">' + title + '</h3>' +
                    (year || catLabel ? '<p class="project-box-meta">' + (year ? year : '') + (year && catLabel ? ' &bull; ' : '') + catLabel + '</p>' : '') +
                '</div>' +
            '</div>';
        });
        gridContainer.innerHTML = gridHtml;

        // Update heading with category or section name if filtered
        var heading = document.querySelector('#section-all-projects .section-heading');
        if (heading) {
            if (currentFilterCat && currentFilterCat !== 'all' && allCategories[currentFilterCat]) {
                heading.textContent = allCategories[currentFilterCat][language] || allCategories[currentFilterCat].it;
            } else if (currentFilterSection && allSections[currentFilterSection]) {
                var sectionLabel = allSections[currentFilterSection].allLabel;
                heading.textContent = sectionLabel[language] || sectionLabel.it;
            } else {
                var headingLabels = { it: 'Tutti i Progetti', en: 'All Projects', fr: 'Tous les Projets' };
                heading.textContent = headingLabels[language] || headingLabels.it;
            }
        }
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

        var mainContent = document.getElementById('main-content');
        if (mainContent) {
            var language = detectLanguage();
            await loadAndRenderProjects(language);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
