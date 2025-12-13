// Toast Notification System
class ToastManager {
    constructor() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.createContainer();
        }
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toastContainer';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getIcon(type);
        
        toast.innerHTML = `
            ${icon}
            <span class="toast-message">${message}</span>
            <button class="toast-close">
                <svg viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        this.container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.hide(toast));

        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }

        return toast;
    }

    hide(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }

    getIcon(type) {
        const icons = {
            success: '<svg class="toast-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
            error: '<svg class="toast-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
            warning: '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg class="toast-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        return icons[type] || icons.info;
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Search Manager
class SearchManager {
    constructor() {
        this.overlay = document.getElementById('searchOverlay');
        this.input = document.getElementById('searchInput');
        this.results = document.getElementById('searchResults');
        this.searchBtn = document.getElementById('searchBtn');
        this.closeBtn = document.getElementById('searchClose');
        this.posts = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.searchBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        this.input.addEventListener('input', (e) => this.search(e.target.value));

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.open();
            }
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }

    open() {
        this.overlay.classList.add('active');
        this.input.focus();
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.overlay.classList.remove('active');
        this.input.value = '';
        this.results.innerHTML = '';
        document.body.style.overflow = '';
    }

    setPosts(posts) {
        this.posts = posts;
    }

    search(query) {
        if (!query.trim()) {
            this.results.innerHTML = '';
            return;
        }

        const lowerQuery = query.toLowerCase();
        const matches = this.posts.filter(post => {
            const searchText = `${post.title} ${post.description} ${post.tags?.join(' ') || ''}`.toLowerCase();
            return searchText.includes(lowerQuery);
        });

        this.displayResults(matches);
    }

    displayResults(matches) {
        if (matches.length === 0) {
            this.results.innerHTML = `
                <div class="search-no-results">
                    <svg viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <p>No articles found</p>
                </div>
            `;
            return;
        }

        this.results.innerHTML = matches.map(post => `
            <div class="search-result-item" data-slug="${post.slug}">
                <div class="search-result-title">${this.escapeHtml(post.title)}</div>
                <div class="search-result-description">${this.escapeHtml(post.description)}</div>
                ${post.tags ? `
                    <div class="search-result-meta">
                        <span>${post.tags.join(' • ')}</span>
                    </div>
                ` : ''}
            </div>
        `).join('');

        this.results.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const slug = item.dataset.slug;
                window.router.navigate(`/${slug}`);
                this.close();
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Mobile TOC Manager
class MobileTOCManager {
    constructor() {
        this.overlay = document.getElementById('tocOverlay');
        this.panel = document.getElementById('tocPanel');
        this.openBtn = document.getElementById('mobileTocBtn');
        this.closeBtn = document.getElementById('tocClose');
        this.mobileNav = document.getElementById('tocMobileNav');
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.openBtn) {
            this.openBtn.addEventListener('click', () => this.open());
        }
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
    }

    open() {
        if (this.overlay && this.panel) {
            this.overlay.classList.add('active');
            this.panel.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    close() {
        if (this.overlay && this.panel) {
            this.overlay.classList.remove('active');
            this.panel.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    update(tocHTML) {
        if (this.mobileNav) {
            this.mobileNav.innerHTML = tocHTML;
        }
    }

    show() {
        if (this.openBtn) {
            this.openBtn.style.display = 'flex';
        }
    }

    hide() {
        if (this.openBtn) {
            this.openBtn.style.display = 'none';
        }
    }
}

// Table of Contents Manager
class TOCManager {
    constructor() {
        this.desktopNav = document.getElementById('tocNav');
        this.mobileNav = document.getElementById('tocMobileNav');
        this.sidebar = document.getElementById('tocSidebar');
        this.headings = [];
        this.observer = null;
    }

    generate(contentElement) {
        this.headings = Array.from(contentElement.querySelectorAll('h2, h3'));
        
        if (this.headings.length === 0) {
            if (this.sidebar) this.sidebar.style.display = 'none';
            if (window.mobileTOC) window.mobileTOC.hide();
            return;
        }

        if (this.sidebar) this.sidebar.style.display = 'block';
        if (window.mobileTOC) window.mobileTOC.show();
        
        const tocHTML = this.createTOCHTML();
        
        if (this.desktopNav) this.desktopNav.innerHTML = tocHTML;
        if (window.mobileTOC) window.mobileTOC.update(tocHTML);
        
        // Setup click handlers first, then active tracking
        this.setupClickHandlers();
        setTimeout(() => this.setupActiveTracking(), 200);
    }

    createTOCHTML() {
        return this.headings.map((heading, index) => {
            const id = heading.id || `heading-${index}`;
            heading.id = id;
            
            const level = heading.tagName === 'H2' ? 2 : 3;
            const text = heading.textContent;
            
            return `
                <a href="#${id}" class="toc-link level-${level}" data-id="${id}">
                    ${this.escapeHtml(text)}
                </a>
            `;
        }).join('');
    }

    setupClickHandlers() {
        const links = document.querySelectorAll('.toc-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.dataset.id;
                const target = document.getElementById(targetId);
                
                if (target) {
                    // Get header height for offset
                    const header = document.querySelector('.site-header');
                    const headerHeight = header ? header.offsetHeight : 64;
                    
                    // Calculate position with offset
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = targetPosition - headerHeight - 20; // 20px extra padding
                    
                    // Smooth scroll to position
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update active link immediately
                    links.forEach(l => l.classList.remove('active'));
                    document.querySelectorAll(`[data-id="${targetId}"]`).forEach(l => {
                        l.classList.add('active');
                    });
                    
                    // Close mobile TOC if open
                    if (window.mobileTOC) {
                        window.mobileTOC.close();
                    }
                }
            });
        });
    }

    setupActiveTracking() {
        // Disconnect previous observer if exists
        if (this.observer) {
            this.observer.disconnect();
        }

        const links = document.querySelectorAll('.toc-link');
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Remove active from all links
                    links.forEach(link => link.classList.remove('active'));
                    
                    // Add active to current section links
                    const activeLinks = document.querySelectorAll(`[data-id="${entry.target.id}"]`);
                    activeLinks.forEach(link => link.classList.add('active'));
                }
            });
        }, {
            rootMargin: '-100px 0px -66%',
            threshold: 0
        });

        this.headings.forEach(heading => {
            if (heading.id) {
                this.observer.observe(heading);
            }
        });
    }

    clear() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        if (this.desktopNav) this.desktopNav.innerHTML = '';
        if (this.mobileNav) this.mobileNav.innerHTML = '';
        if (this.sidebar) this.sidebar.style.display = 'none';
        if (window.mobileTOC) window.mobileTOC.hide();
        
        this.headings = [];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Reading Progress Manager
class ReadingProgressManager {
    constructor() {
        this.bar = document.getElementById('readingProgress');
        this.setupScrollListener();
    }

    setupScrollListener() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.update();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    update() {
        if (!this.bar || this.bar.style.display === 'none') return;
        
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
        
        this.bar.style.width = `${Math.min(Math.max(scrollPercent, 0), 100)}%`;
    }

    show() {
        if (this.bar) {
            this.bar.style.display = 'block';
            this.update();
        }
    }

    hide() {
        if (this.bar) {
            this.bar.style.display = 'none';
        }
    }
}

// Scroll to Top Manager
class ScrollToTopManager {
    constructor() {
        this.button = document.getElementById('scrollTopBtn');
        this.setupScrollListener();
        this.setupClickHandler();
    }

    setupScrollListener() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.toggle();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    setupClickHandler() {
        if (this.button) {
            this.button.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    toggle() {
        if (!this.button) return;
        
        if (window.pageYOffset > 300) {
            this.button.classList.add('visible');
        } else {
            this.button.classList.remove('visible');
        }
    }
}

// Share Manager
class ShareManager {
    constructor() {
        this.button = document.getElementById('shareBtn');
        this.toast = new ToastManager();
        this.setupClickHandler();
    }

    setupClickHandler() {
        if (this.button) {
            this.button.addEventListener('click', () => this.share());
        }
    }

    async share() {
        const title = document.title;
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    this.fallbackShare(url);
                }
            }
        } else {
            this.fallbackShare(url);
        }
    }

    async fallbackShare(url) {
        try {
            await navigator.clipboard.writeText(url);
            this.toast.success('Link copied to clipboard!');
        } catch (error) {
            this.toast.error('Could not copy link');
        }
    }
}

// Print Manager
class PrintManager {
    constructor() {
        this.button = document.getElementById('printBtn');
        this.setupClickHandler();
    }

    setupClickHandler() {
        if (this.button) {
            this.button.addEventListener('click', () => window.print());
        }
    }
}

// Text Size Controller
class TextSizeController {
    constructor() {
        this.increaseBtn = document.getElementById('textSizeIncrease');
        this.decreaseBtn = document.getElementById('textSizeDecrease');
        this.resetBtn = document.getElementById('textSizeReset');
        this.contentArea = document.querySelector('.content-area');
        this.setupClickHandlers();
        this.applySavedSize();
    }

    setupClickHandlers() {
        if (this.increaseBtn) {
            this.increaseBtn.addEventListener('click', () => this.increase());
        }
        
        if (this.decreaseBtn) {
            this.decreaseBtn.addEventListener('click', () => this.decrease());
        }
        
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.reset());
        }
    }

    applySavedSize() {
        if (this.contentArea) {
            const size = window.textSize.getCurrentSize();
            this.contentArea.style.fontSize = `${size}px`;
        }
    }

    increase() {
        const newSize = window.textSize.increase();
        if (this.contentArea) {
            this.contentArea.style.fontSize = `${newSize}px`;
        }
        window.toast.info(`Text size: ${newSize}px`, 1000);
    }

    decrease() {
        const newSize = window.textSize.decrease();
        if (this.contentArea) {
            this.contentArea.style.fontSize = `${newSize}px`;
        }
        window.toast.info(`Text size: ${newSize}px`, 1000);
    }

    reset() {
        const newSize = window.textSize.reset();
        if (this.contentArea) {
            this.contentArea.style.fontSize = `${newSize}px`;
        }
        window.toast.info(`Text size reset`, 1000);
    }
}

// Initialize UI managers
window.toast = new ToastManager();
window.search = new SearchManager();
window.mobileTOC = new MobileTOCManager();
window.toc = new TOCManager();
window.readingProgress = new ReadingProgressManager();
window.scrollToTop = new ScrollToTopManager();
window.share = new ShareManager();
window.print = new PrintManager();
window.textSizeController = new TextSizeController();
