// =============================================
// Zoha Abdul Sattar - Portfolio Main JS
// Preserves: menu, year, active link
// New: auto gallery 1-20, lightbox, error handling
// =============================================

document.addEventListener('DOMContentLoaded', function () {

    // ---------- Current Year ----------
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // ---------- Mobile Menu Toggle ----------
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function () {
            const isOpen = navLinks.classList.toggle('open');
            navLinks.classList.toggle('show', isOpen);
            menuBtn.setAttribute('aria-expanded', isOpen);
            const icon = menuBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars', !isOpen);
                icon.classList.toggle('fa-xmark', isOpen);
            }
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open','show');
                menuBtn.setAttribute('aria-expanded','false');
                const icon = menuBtn.querySelector('i');
                if(icon){ icon.classList.remove('fa-xmark'); icon.classList.add('fa-bars'); }
            });
        });
        document.addEventListener('click', function (e) {
            if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
                navLinks.classList.remove('open','show');
                menuBtn.setAttribute('aria-expanded','false');
                const icon = menuBtn.querySelector('i');
                if(icon){ icon.classList.remove('fa-xmark'); icon.classList.add('fa-bars'); }
            }
        });
    }

    // ---------- Active Link ----------
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) link.classList.add('active');
        else link.classList.remove('active');
    });

    // =================== PROJECTS GALLERY SYSTEM ===================
    // Easy to change max count in one place
    const MAX_IMAGES_PER_PROJECT = 20;

    // Project configs — alt text and folder
    const PROJECTS = [
        { folder: 'assets/1', galleryId: 'gallery-1', name: 'Birthday & Engagement Cards' },
        { folder: 'assets/2', galleryId: 'gallery-2', name: 'Digital Mart E-commerce' },
        { folder: 'assets/3', galleryId: 'gallery-3', name: 'School Fee Management System' },
        { folder: 'assets/4', galleryId: 'gallery-4', name: 'School Management App' },
        { folder: 'assets/5', galleryId: 'gallery-5', name: 'My Next Project' },
    ];

    // Global list for lightbox navigation
    window._zohaLightboxImages = [];

    /**
     * Reusable function: load numbered images 1.jpg - 20.jpg
     * Handles JPG and PNG, lazy loading, graceful missing
     */
    function loadProjectGallery(folder, galleryId, projectName) {
        const galleryEl = document.getElementById(galleryId);
        if (!galleryEl) return;

        let loadedCount = 0;
        let checkedCount = 0;
        const totalToCheck = MAX_IMAGES_PER_PROJECT;

        for (let i = 1; i <= MAX_IMAGES_PER_PROJECT; i++) {
            // Try JPG first
            tryLoadImage(folder, i, 'jpg', galleryId, projectName, (success) => {
                if (!success) {
                    // If JPG fails, try PNG
                    tryLoadImage(folder, i, 'png', galleryId, projectName, (pngSuccess) => {
                        checkedCount++;
                        if (pngSuccess) loadedCount++;
                        if (checkedCount === totalToCheck && loadedCount === 0) showEmptyPlaceholder(galleryEl, folder);
                    });
                } else {
                    loadedCount++;
                    checkedCount++;
                    if (checkedCount === totalToCheck && loadedCount === 0) showEmptyPlaceholder(galleryEl, folder);
                }
            });
        }

        // If after 3 sec still 0, show placeholder (for slow network)
        setTimeout(() => {
            if (galleryEl && galleryEl.querySelectorAll('img').length === 0 && !galleryEl.querySelector('.gallery-empty')) {
                showEmptyPlaceholder(galleryEl, folder);
            }
        }, 3500);
    }

    function tryLoadImage(folder, index, ext, galleryId, projectName, callback) {
        const img = new Image();
        const src = `${folder}/${index}.${ext}`;
        img.loading = 'lazy';
        img.alt = `${projectName} - Image ${index}`;
        img.dataset.src = src;
        img.dataset.project = galleryId;

        img.onload = function () {
            const galleryEl = document.getElementById(galleryId);
            if (!galleryEl) return;
            // Create clickable wrapper
            const clone = document.createElement('img');
            clone.src = src;
            clone.alt = img.alt;
            clone.loading = 'lazy';
            clone.dataset.index = window._zohaLightboxImages.length;
            clone.addEventListener('click', () => openLightbox(clone.src, clone.alt, galleryId));
            clone.addEventListener('error', function(){ this.style.display='none'; });
            galleryEl.appendChild(clone);
            window._zohaLightboxImages.push({ src: src, alt: img.alt, galleryId: galleryId });
            callback(true);
        };
        img.onerror = function () { callback(false); };
        img.src = src;
    }

    function showEmptyPlaceholder(galleryEl, folder) {
        galleryEl.innerHTML = `<div class="gallery-empty"><i class="fa-solid fa-images"></i><strong>No images yet</strong><br>Add images as ${folder}/1.jpg to ${folder}/20.jpg<br>Supports JPG and PNG</div>`;
    }

    // Load all 5 galleries if on projects page
    if (document.querySelector('.projects-grid')) {
        PROJECTS.forEach(p => loadProjectGallery(p.folder, p.galleryId, p.name));
    }

    // =================== LIGHTBOX ===================
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    let currentLightboxIndex = 0;
    let currentGalleryId = null;

    function openLightbox(src, alt, galleryId) {
        if (!lightbox || !lightboxImg) return;
        currentGalleryId = galleryId;
        // Find index in global list filtered by gallery
        const galleryImages = window._zohaLightboxImages.filter(img => img.galleryId === galleryId);
        const idx = galleryImages.findIndex(img => img.src === src);
        currentLightboxIndex = idx >=0 ? idx : 0;
        window._currentGalleryImages = galleryImages;
        showLightboxImage();
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden','false');
        document.body.style.overflow = 'hidden';
    }

    function showLightboxImage() {
        const images = window._currentGalleryImages;
        if (!images || images.length === 0) return;
        const item = images[currentLightboxIndex];
        lightboxImg.src = item.src;
        lightboxImg.alt = item.alt;
        lightboxCaption.textContent = item.alt;
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden','true');
        document.body.style.overflow = '';
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => {
        if (!window._currentGalleryImages) return;
        currentLightboxIndex = (currentLightboxIndex - 1 + window._currentGalleryImages.length) % window._currentGalleryImages.length;
        showLightboxImage();
    });
    if (lightboxNext) lightboxNext.addEventListener('click', () => {
        if (!window._currentGalleryImages) return;
        currentLightboxIndex = (currentLightboxIndex + 1) % window._currentGalleryImages.length;
        showLightboxImage();
    });
    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft' && lightboxPrev) lightboxPrev.click();
        if (e.key === 'ArrowRight' && lightboxNext) lightboxNext.click();
    });

    // Expose for testing
    window.ZohaGallery = { loadProjectGallery, MAX_IMAGES_PER_PROJECT };
});