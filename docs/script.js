// === CONFIGURATION ===
const CONFIG_URL = './config.json';

// === COMMENTS MANAGER ===
class CommentsManager {
    constructor() {
        this.commentsSection = document.getElementById('commentsSection');
        this.commentsContainer = document.getElementById('commentsContainer');
        this.config = null;
    }

    setConfig(config) {
        this.config = config;
    }

    async load(documentSlug) {
        if (!this.config || !this.config.comments || !this.config.comments.enabled) {
            this.commentsSection.style.display = 'none';
            return;
        }

        this.commentsSection.style.display = 'block';
        this.commentsContainer.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading comments...</p></div>';

        const provider = this.config.comments.provider;

        try {
            if (provider === 'giscus') {
                await this.loadGiscus(documentSlug);
            } else if (provider === 'utterances') {
                await this.loadUtterances(documentSlug);
            } else if (provider === 'disqus') {
                await this.loadDisqus(documentSlug);
            }
        } catch (error) {
            console.error('Comments loading error:', error);
            this.showError();
        }
    }

    async loadGiscus(documentSlug) {
        const settings = this.config.comments.giscus;
        if (!settings || !settings.repo) {
            this.showError('Giscus not configured properly');
            return;
        }

        // Clear container
        this.commentsContainer.innerHTML = '';

        // Create script
        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.setAttribute('data-repo', settings.repo);
        script.setAttribute('data-repo-id', settings.repoId || '');
        script.setAttribute('data-category', settings.category || 'General');
        script.setAttribute('data-category-id', settings.categoryId || '');
        script.setAttribute('data-mapping', settings.mapping || 'pathname');
        script.setAttribute('data-strict', settings.strict || '0');
        script.setAttribute('data-reactions-enabled', settings.reactionsEnabled || '1');
        script.setAttribute('data-emit-metadata', '0');
        script.setAttribute('data-input-position', settings.inputPosition || 'bottom');
        script.setAttribute('data-theme', this.getGiscusTheme());
        script.setAttribute('data-lang', settings.lang || 'en');
        script.setAttribute('data-loading', 'lazy');
        script.crossOrigin = 'anonymous';
        script.async = true;

        this.commentsContainer.appendChild(script);

        // Listen for theme changes
        this.setupThemeListener();
    }

    async loadUtterances(documentSlug) {
        const settings = this.config.comments.utterances;
        if (!settings || !settings.repo) {
            this.showError('Utterances not configured properly');
            return;
        }

        this.commentsContainer.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://utteranc.es/client.js';
        script.setAttribute('repo', settings.repo);
        script.setAttribute('issue-term', settings.issueTerm || 'pathname');
        script.setAttribute('label', settings.label || 'comment');
        script.setAttribute('theme', this.getUtterancesTheme());
        script.crossOrigin = 'anonymous';
        script.async = true;

        this.commentsContainer.appendChild(script);
        this.setupThemeListener();
    }

    async loadDisqus(documentSlug) {
        const settings = this.config.comments.disqus;
        if (!settings || !settings.shortname) {
            this.showError('Disqus not configured properly');
            return;
        }

        this.commentsContainer.innerHTML = '<div id="disqus_thread"></div>';

        window.disqus_config = function () {
            this.page.url = window.location.href;
            this.page.identifier = documentSlug;
        };

        const script = document.createElement('script');
        script.src = `https://${settings.shortname}.disqus.com/embed.js`;
        script.setAttribute('data-timestamp', +new Date());
        (document.head || document.body).appendChild(script);
    }

    getGiscusTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        const settings = this.config.comments.giscus;
        return isDark ? (settings.darkTheme || 'dark') : (settings.lightTheme || 'light');
    }

    getUtterancesTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        const settings = this.config.comments.utterances;
        return isDark ? (settings.darkTheme || 'github-dark') : (settings.lightTheme || 'github-light');
    }

    setupThemeListener() {
        const observer = new MutationObserver(() => {
            this.updateTheme();
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    updateTheme() {
        const provider = this.config?.comments?.provider;
        
        if (provider === 'giscus') {
            const iframe = document.querySelector('iframe.giscus-frame');
            if (iframe) {
                const theme = this.getGiscusTheme();
                iframe.contentWindow.postMessage(
                    { giscus: { setConfig: { theme } } },
                    'https://giscus.app'
                );
            }
        } else if (provider === 'utterances') {
            const iframe = document.querySelector('.utterances-frame');
            if (iframe) {
                const theme = this.getUtterancesTheme();
                iframe.contentWindow.postMessage(
                    { type: 'set-theme', theme },
                    'https://utteranc.es'
                );
            }
        }
    }

    showError(message = 'Unable to load comments') {
        this.commentsContainer.innerHTML = `
            <div class="error-state">
                <p>${message}</p>
            </div>
        `;
    }

    hide() {
        this.commentsSection.style.display = 'none';
    }
}

const commentsManager = new CommentsManager();

// === STATE MANAGEMENT ===
class AppState {
    constructor() {
        this.config = null;
        this.currentDocument = null;
        this.view = 'home';
        this.documents = [];
    }

    async loadConfig() {
        try {
            const response = await fetch(CONFIG_URL);
            if (!response.ok) throw new Error('Failed to load config');
            this.config = await response.json();
            this.documents = this.config.documents || [];
            this.applyThemeColors();
            commentsManager.setConfig(this.config);
            return true;
        } catch (error) {
            console.error('Config load error:', error);
            this.showConfigError();
            return false;
        }
    }

    applyThemeColors() {
        if (this.config.theme) {
            const root = document.documentElement;
            const theme = this.config.theme;
            
            if (theme.accent) root.style.setProperty('--accent', theme.accent);
            if (theme.accentHover) root.style.setProperty('--accent-hover', theme.accentHover);
            if (theme.accentLight) root.style.setProperty('--accent-light', theme.accentLight);
        }
    }

    setDocument(doc) {
        this.currentDocument = doc;
        this.view = 'document';
        this.updateUI();
    }

    setHome() {
        this.currentDocument = null;
        this.view = 'home';
        this.updateUI();
    }

    show404() {
        this.view = '404';
        this.updateUI();
    }

    updateUI() {
        const homeScreen = document.getElementById('homeScreen');
        const documentView = document.getElementById('documentView');
        const error404 = document.getElementById('error404');
        const tocToggle = document.getElementById('tocMobileToggle');
        const printBtn = document.getElementById('printBtn');
        const shareBtn = document.getElementById('shareBtn');
        const footer = document.getElementById('siteFooter');
        
        homeScreen.style.display = 'none';
        documentView.classList.remove('active');
        error404.style.display = 'none';
        
        if (this.view === 'home') {
            homeScreen.style.display = 'block';
            tocToggle.style.display = 'none';
            printBtn.style.display = 'none';
            shareBtn.style.display = 'none';
            document.getElementById('readingProgress').style.display = 'none';
            footer.style.display = 'block';
        } else if (this.view === 'document') {
            documentView.classList.add('active');
            tocToggle.style.display = 'flex';
            printBtn.style.display = 'flex';
            shareBtn.style.display = 'flex';
            document.getElementById('readingProgress').style.display = 'block';
            footer.style.display = 'block';
        } else if (this.view === '404') {
            error404.style.display = 'flex';
            tocToggle.style.display = 'none';
            printBtn.style.display = 'none';
            shareBtn.style.display = 'none';
            document.getElementById('readingProgress').style.display = 'none';
            footer.style.display = 'none';
        }
    }

    showConfigError() {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center;">
                <div>
                    <h1 style="font-size: 2rem; margin-bottom: 1rem;">Configuration Error</h1>
                    <p style="color: #666; margin-bottom: 1.5rem;">Unable to load blog configuration. Please check the config.json file.</p>
                    <button onclick="location.reload()" style="padding: 0.75rem 1.5rem; background: #cd7c53; color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>
                </div>
            </div>
        `;
    }
}

const appState = new AppState();

// === ROUTER ===
class Router {
    constructor() {
        this.routes = {};
        this.init();
    }

    init() {
        window.addEventListener('popstate', () => this.handleRoute());
        this.handleRoute();
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        history.pushState(null, '', path);
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        const search = window.location.search;
        const basePath = '/blog';
        
        // Handle GitHub Pages SPA redirect format: /?/path&query=value
        if (search && search.startsWith('?/')) {
            // Parse the encoded format
            const parts = search.slice(2).split('&');
            const pathPart = parts[0];
            const queryParts = parts.slice(1);
            
            // Reconstruct the proper URL
            const properPath = basePath + '/' + pathPart;
            const properQuery = queryParts.length > 0 ? '?' + queryParts.map(p => p.replace(/~and~/g, '&')).join('&') : '';
            
            // Replace the URL without reloading
            window.history.replaceState(null, '', properPath + properQuery);
            
            // Now route to the proper path
            this.routeToPath(properPath, properQuery);
            return;
        }
        
        // Normal routing
        this.routeToPath(path, search);
    }
    
    routeToPath(path, search) {
        const basePath = '/blog';
        
        // Remove base path for GitHub Pages
        let route = path.replace(basePath, '') || '/';
        if (route !== '/' && route.endsWith('/')) {
            route = route.slice(0, -1);
        }

        // Remove query parameters from route matching
        const cleanRoute = route.split('?')[0];

        if (cleanRoute === '/' || cleanRoute === '') {
            appState.setHome();
        } else {
            const slug = cleanRoute.substring(1);
            const doc = appState.documents.find(d => d.slug === slug);
            
            if (doc) {
                appState.setDocument(doc);
                new DocumentLoader().load(doc.url);
            } else {
                appState.show404();
            }
        }
    }

    getBasePath() {
        return '/blog';
    }
}

const router = new Router();

// === THEME MANAGER ===
class ThemeManager {
    constructor() {
        this.html = document.documentElement;
        this.toggleBtn = document.getElementById('themeToggle');
        this.sunIcon = document.querySelector('.sun-icon');
        this.moonIcon = document.querySelector('.moon-icon');
        this.init();
    }

    init() {
        const savedTheme = this.getSavedTheme();
        this.applyTheme(savedTheme);
        this.toggleBtn.addEventListener('click', () => this.toggle());
    }

    getSavedTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    applyTheme(theme) {
        const isDark = theme === 'dark';
        this.html.classList.toggle('dark', isDark);
        this.sunIcon.classList.toggle('icon-hidden', isDark);
        this.moonIcon.classList.toggle('icon-hidden', !isDark);
    }

    toggle() {
        const isDark = this.html.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        this.applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }
}

// === SEARCH MANAGER ===
class SearchManager {
    constructor() {
        this.searchBtn = document.getElementById('searchBtn');
        this.searchOverlay = document.getElementById('searchOverlay');
        this.searchInput = document.getElementById('searchInput');
        this.searchClose = document.getElementById('searchClose');
        this.searchResults = document.getElementById('searchResults');
        this.init();
    }

    init() {
        this.searchBtn.addEventListener('click', () => this.open());
        this.searchClose.addEventListener('click', () => this.close());
        this.searchOverlay.addEventListener('click', (e) => {
            if (e.target === this.searchOverlay) this.close();
        });
        
        this.searchInput.addEventListener('input', (e) => this.search(e.target.value));
        
        // Keyboard shortcuts
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
        this.searchOverlay.classList.add('active');
        this.searchInput.focus();
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.searchOverlay.classList.remove('active');
        this.searchInput.value = '';
        this.searchResults.innerHTML = '';
        document.body.style.overflow = '';
    }

    search(query) {
        if (!query.trim()) {
            this.searchResults.innerHTML = '';
            return;
        }

        const results = appState.documents.filter(doc => {
            const searchText = `${doc.title} ${doc.description} ${doc.tags?.join(' ') || ''}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
            return;
        }

        this.searchResults.innerHTML = results.map(doc => `
            <div class="search-result-item" data-slug="${doc.slug}">
                <div class="search-result-title">${doc.title}</div>
                <div class="search-result-description">${doc.description}</div>
            </div>
        `).join('');

        this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const slug = item.dataset.slug;
                router.navigate(`${router.getBasePath()}/${slug}`);
                this.close();
            });
        });
    }
}

// === SHARE MANAGER ===
class ShareManager {
    constructor() {
        this.shareBtn = document.getElementById('shareBtn');
        this.init();
    }

    init() {
        this.shareBtn.addEventListener('click', () => this.share());
    }

    async share() {
        const title = appState.currentDocument?.title || 'Blog Post';
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

    fallbackShare(url) {
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Link copied to clipboard!');
        }).catch(() => {
            this.showToast('Could not copy link');
        });
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <svg class="toast-icon" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// === TEXT SIZE CONTROL ===
class TextSizeControl {
    constructor() {
        this.contentEl = document.getElementById('content');
        this.sizes = [14, 16, 18, 20];
        this.currentIndex = 1;
        
        document.getElementById('decreaseText').addEventListener('click', () => this.decrease());
        document.getElementById('increaseText').addEventListener('click', () => this.increase());
        document.getElementById('resetText').addEventListener('click', () => this.reset());
        
        this.loadSavedSize();
    }

    loadSavedSize() {
        const saved = localStorage.getItem('textSize');
        if (saved) {
            const index = this.sizes.indexOf(parseInt(saved));
            if (index !== -1) {
                this.currentIndex = index;
                this.apply();
            }
        }
    }

    decrease() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.apply();
        }
    }

    increase() {
        if (this.currentIndex < this.sizes.length - 1) {
            this.currentIndex++;
            this.apply();
        }
    }

    reset() {
        this.currentIndex = 1;
        this.apply();
    }

    apply() {
        const size = this.sizes[this.currentIndex];
        this.contentEl.style.fontSize = `${size}px`;
        localStorage.setItem('textSize', size);
    }
}

// === TABLE OF CONTENTS ===
class TableOfContents {
    constructor() {
        this.desktopContainer = document.getElementById('tocDesktopContent');
        this.mobileContainer = document.getElementById('tocMobileContent');
        this.mobileToggle = document.getElementById('tocMobileToggle');
        this.mobileOverlay = document.getElementById('tocMobileOverlay');
        this.mobilePanel = document.getElementById('tocMobilePanel');
        this.mobileClose = document.getElementById('tocMobileClose');
        this.headings = [];
        this.initMobileHandlers();
    }

    initMobileHandlers() {
        this.mobileToggle.addEventListener('click', () => this.openMobile());
        this.mobileClose.addEventListener('click', () => this.closeMobile());
        this.mobileOverlay.addEventListener('click', () => this.closeMobile());
    }

    openMobile() {
        this.mobileOverlay.classList.add('active');
        this.mobilePanel.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMobile() {
        this.mobileOverlay.classList.remove('active');
        this.mobilePanel.classList.remove('active');
        document.body.style.overflow = '';
    }

    generate() {
        const contentEl = document.getElementById('content');
        this.headings = Array.from(contentEl.querySelectorAll('h2, h3'));
        
        if (this.headings.length === 0) {
            document.getElementById('tocSidebar').style.display = 'none';
            return;
        }

        document.getElementById('tocSidebar').style.display = 'block';
        const list = this.createTOCList();
        
        this.desktopContainer.innerHTML = '';
        this.mobileContainer.innerHTML = '';
        this.desktopContainer.appendChild(list.cloneNode(true));
        this.mobileContainer.appendChild(list.cloneNode(true));

        this.initActiveTracking();
        this.initClickHandlers();
    }

    createTOCList() {
        const list = document.createElement('ul');
        list.className = 'toc-list';
        
        this.headings.forEach((heading, index) => {
            const id = heading.id || `heading-${index}`;
            heading.id = id;
            
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${id}`;
            a.textContent = heading.textContent;
            a.className = heading.tagName === 'H2' ? 'toc-h2' : 'toc-h3';
            a.dataset.id = id;
            
            li.appendChild(a);
            list.appendChild(li);
        });

        return list;
    }

    initClickHandlers() {
        const links = document.querySelectorAll('.toc-list a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const targetId = link.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);
                if (target) {
                    this.closeMobile();
                    setTimeout(() => {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            });
        });
    }

    initActiveTracking() {
        const links = document.querySelectorAll('.toc-list a');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    links.forEach(link => link.classList.remove('active'));
                    const activeLinks = document.querySelectorAll(`a[data-id="${entry.target.id}"]`);
                    activeLinks.forEach(link => link.classList.add('active'));
                }
            });
        }, { 
            rootMargin: '-100px 0px -66%',
            threshold: 0
        });

        this.headings.forEach(heading => observer.observe(heading));
    }
}

// === READING PROGRESS ===
class ReadingProgress {
    constructor() {
        this.bar = document.getElementById('readingProgress');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.update());
        this.update();
    }

    update() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
        
        this.bar.style.width = `${Math.min(scrollPercent, 100)}%`;
    }
}

// === SCROLL TO TOP ===
class ScrollToTop {
    constructor() {
        this.btn = document.getElementById('scrollTop');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.toggle());
        this.btn.addEventListener('click', () => this.scrollToTop());
    }

    toggle() {
        if (window.pageYOffset > 300) {
            this.btn.classList.add('visible');
        } else {
            this.btn.classList.remove('visible');
        }
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// === READING TIME ESTIMATOR ===
class ReadingTime {
    constructor() {
        this.wordsPerMinute = 200;
    }

    calculate(text) {
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / this.wordsPerMinute);
        return minutes;
    }

    display(minutes) {
        const contentEl = document.getElementById('content');
        const firstHeading = contentEl.querySelector('h1, h2');
        
        if (firstHeading) {
            const readingTime = document.createElement('div');
            readingTime.className = 'reading-time';
            readingTime.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>${minutes} min read</span>
            `;
            firstHeading.insertAdjacentElement('afterend', readingTime);
        }
    }
}

// === PRINT MANAGER ===
class PrintManager {
    constructor() {
        document.getElementById('printBtn').addEventListener('click', () => this.print());
    }

    print() {
        window.print();
    }
}

// === DOCUMENT LOADER ===
class DocumentLoader {
    constructor() {
        this.contentEl = document.getElementById('content');
    }

    async load(url) {
        try {
            this.contentEl.className = 'loading-state';
            this.contentEl.innerHTML = '<div class="loading-spinner"></div><p>Hang tight, loading your content...</p>';
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const markdown = await response.text();
            this.render(markdown);
            this.initEnhancements(markdown);
        } catch (error) {
            this.showError(error);
        }
    }

    render(markdown) {
        marked.setOptions({
            headerIds: true,
            mangle: false,
            breaks: false,
            gfm: true
        });

        const html = marked.parse(markdown);
        this.contentEl.innerHTML = html;
        this.contentEl.classList.remove('loading-state');
    }

    initEnhancements(markdown) {
        const toc = new TableOfContents();
        toc.generate();

        const readingTime = new ReadingTime();
        const minutes = readingTime.calculate(markdown);
        readingTime.display(minutes);

        // Load comments if enabled
        if (appState.currentDocument) {
            commentsManager.load(appState.currentDocument.slug);
        }

        window.scrollTo({ top: 0 });
    }

    showError(error) {
        console.error('Failed to load content:', error);
        this.contentEl.className = 'error-state';
        this.contentEl.innerHTML = `
            <p>Oops! This is awkward..</p>
            <p style="margin-top: 0.5rem;">Check your internet connection and give it another shot!</p>
        `;
    }
}

// === HOME SCREEN MANAGER ===
class HomeScreenManager {
    constructor() {
        this.gridEl = document.getElementById('documentGrid');
        this.loader = new DocumentLoader();
    }

    init() {
        this.renderDocuments();
    }

    renderDocuments() {
        this.gridEl.innerHTML = '';
        
        appState.documents.forEach((doc) => {
            const card = document.createElement('div');
            card.className = 'document-card';
            
            const tagsHTML = doc.tags ? `
                <div class="document-meta">
                    <div class="document-tags">
                        ${doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            ` : '';
            
            const dateHTML = doc.date ? `
                <div class="document-meta">
                    <div class="document-date">${new Date(doc.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
            ` : '';
            
            card.innerHTML = `
                <div class="document-icon">
                    <svg viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                    </svg>
                </div>
                <h3>${doc.title}</h3>
                <p>${doc.description}</p>
                ${dateHTML}
                ${tagsHTML}
            `;
            
            card.addEventListener('click', () => this.openDocument(doc));
            this.gridEl.appendChild(card);
        });
    }

    openDocument(doc) {
        router.navigate(`${router.getBasePath()}/${doc.slug}`);
    }
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', async () => {
    // Load configuration first
    const configLoaded = await appState.loadConfig();
    if (!configLoaded) return;
    
    // Update UI with config
    document.getElementById('siteTitle').textContent = appState.config.siteTitle || 'Blog';
    document.getElementById('heroTitle').textContent = appState.config.heroTitle || 'Welcome';
    document.getElementById('heroSubtitle').textContent = appState.config.heroSubtitle || 'Select a post to read';
    document.getElementById('footerText').innerHTML = appState.config.footer || '© 2025';
    
    // Update page title
    document.title = appState.config.siteTitle || 'Blog';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && appState.config.siteDescription) {
        metaDescription.content = appState.config.siteDescription;
    }
    
    // Initialize theme first
    new ThemeManager();
    
    // Initialize utilities
    new ReadingProgress();
    new ScrollToTop();
    new PrintManager();
    new TextSizeControl();
    new SearchManager();
    new ShareManager();
    
    // Initialize home screen
    const homeManager = new HomeScreenManager();
    homeManager.init();
    
    // Initialize navigation
    document.getElementById('siteTitle').addEventListener('click', () => {
        router.navigate(router.getBasePath() + '/');
    });
    
    document.getElementById('backButton').addEventListener('click', () => {
        router.navigate(router.getBasePath() + '/');
    });
    
    document.getElementById('errorHomeBtn').addEventListener('click', () => {
        router.navigate(router.getBasePath() + '/');
    });
});
