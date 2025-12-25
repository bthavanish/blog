// CONFIG STUFF
// where the config lives, duh
const CONFIG_URL = './config.json';


// COMMENTS MANAGER
// handles comments - supports giscus, utterances, and disqus
// honestly giscus is the best one imo
class CommentsManager {
    constructor() {
        this.commentsSection = document.getElementById('commentsSection');
        this.commentsContainer = document.getElementById('commentsContainer');
        this.config = null;
    }

    setConfig(config) {
        this.config = config;
    }

    // load comments for a specific post
    async load(documentSlug) {
        // if comments are disabled just hide the whole thing
        if (!this.config || !this.config.comments || !this.config.comments.enabled) {
            this.commentsSection.style.display = 'none';
            return;
        }

        // show loading spinner while we load
        this.commentsSection.style.display = 'block';
        this.commentsContainer.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading comments...</p></div>';

        const provider = this.config.comments.provider;

        try {
            // figure out which comment system we're using
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

    // load giscus comments (github discussions based)
    async loadGiscus(documentSlug) {
        const settings = this.config.comments.giscus;
        if (!settings || !settings.repo) {
            this.showError('Giscus not configured properly');
            return;
        }

        this.commentsContainer.innerHTML = '';

        // create the giscus script with all its settings
        // there's a LOT of attributes here lol
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

        // watch for theme changes so comments match
        this.setupThemeListener();
    }

    // load utterances comments (github issues based)
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

    // load disqus comments (the old reliable)
    async loadDisqus(documentSlug) {
        const settings = this.config.comments.disqus;
        if (!settings || !settings.shortname) {
            this.showError('Disqus not configured properly');
            return;
        }

        this.commentsContainer.innerHTML = '<div id="disqus_thread"></div>';

        // disqus needs this global config function
        window.disqus_config = function () {
            this.page.url = window.location.href;
            this.page.identifier = documentSlug;
        };

        const script = document.createElement('script');
        script.src = `https://${settings.shortname}.disqus.com/embed.js`;
        script.setAttribute('data-timestamp', +new Date());
        (document.head || document.body).appendChild(script);
    }

    // get the right giscus theme based on dark mode
    getGiscusTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        const settings = this.config.comments.giscus;
        return isDark ? (settings.darkTheme || 'dark') : (settings.lightTheme || 'light');
    }

    // get the right utterances theme based on dark mode
    getUtterancesTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        const settings = this.config.comments.utterances;
        return isDark ? (settings.darkTheme || 'github-dark') : (settings.lightTheme || 'github-light');
    }

    // watch for theme changes
    setupThemeListener() {
        const observer = new MutationObserver(() => {
            this.updateTheme();
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // update comment theme when site theme changes
    updateTheme() {
        const provider = this.config?.comments?.provider;
        
        if (provider === 'giscus') {
            const iframe = document.querySelector('iframe.giscus-frame');
            if (iframe) {
                const theme = this.getGiscusTheme();
                // send message to giscus iframe to change theme
                iframe.contentWindow.postMessage(
                    { giscus: { setConfig: { theme } } },
                    'https://giscus.app'
                );
            }
        } else if (provider === 'utterances') {
            const iframe = document.querySelector('.utterances-frame');
            if (iframe) {
                const theme = this.getUtterancesTheme();
                // send message to utterances iframe
                iframe.contentWindow.postMessage(
                    { type: 'set-theme', theme },
                    'https://utteranc.es'
                );
            }
        }
    }

    // show error message when comments fail to load
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

// create global instance
const commentsManager = new CommentsManager();

// ========================================
// APP STATE
// ========================================
// keeps track of what's currently being shown
class AppState {
    constructor() {
        this.config = null;
        this.currentDocument = null;
        this.view = 'home'; // can be 'home', 'document', or '404'
        this.documents = [];
    }

    // load the config file
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

    // apply custom theme colors from config
    applyThemeColors() {
        if (this.config.theme) {
            const root = document.documentElement;
            const theme = this.config.theme;
            
            // set CSS variables for accent colors
            if (theme.accent) root.style.setProperty('--accent', theme.accent);
            if (theme.accentHover) root.style.setProperty('--accent-hover', theme.accentHover);
            if (theme.accentLight) root.style.setProperty('--accent-light', theme.accentLight);
        }
    }

    // switch to document view
    setDocument(doc) {
        this.currentDocument = doc;
        this.view = 'document';
        this.updateUI();
    }

    // switch to home view
    setHome() {
        this.currentDocument = null;
        this.view = 'home';
        this.updateUI();
    }

    // show 404 page
    show404() {
        this.view = '404';
        this.updateUI();
    }

    // update what's visible based on current view
    updateUI() {
        const homeScreen = document.getElementById('homeScreen');
        const documentView = document.getElementById('documentView');
        const error404 = document.getElementById('error404');
        const tocToggle = document.getElementById('tocMobileToggle');
        const printBtn = document.getElementById('printBtn');
        const shareBtn = document.getElementById('shareBtn');
        const footer = document.getElementById('siteFooter');
        
        // hide everything first
        homeScreen.style.display = 'none';
        documentView.classList.remove('active');
        error404.style.display = 'none';
        
        // show the right stuff for current view
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

    // show error page if config fails to load
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

// global app state
const appState = new AppState();

// ========================================
// ROUTER
// ========================================
// handles URL navigation and routing
// this was a bitch to get working with github pages
class Router {
    constructor() {
        this.routes = {};
    }

    init() {
        // wait a tick for the redirect script in index.html to run first
        // otherwise we get weird race conditions
        setTimeout(() => {
            window.addEventListener('popstate', () => this.handleRoute());
            this.handleRoute();
        }, 0);
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    // navigate to a new path
    navigate(path) {
        history.pushState(null, '', path);
        this.handleRoute();
    }

    // figure out what to show based on current URL
    handleRoute() {
        // check if we have redirect params from 404.html
        // github pages doesn't do SPAs natively so we have to hack it
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('p')) {
            const path = urlParams.get('p');
            const query = urlParams.get('q');
            const newUrl = '/blog' + path + (query ? '?' + query.replace(/~and~/g, '&') : '');
            
            window.history.replaceState(null, '', newUrl);
            // recursively call to handle the corrected URL
            this.handleRoute();
            return;
        }
        
        const path = window.location.pathname;
        const basePath = '/blog';
        
        // remove base path for github pages
        let route = path.replace(basePath, '') || '/';
        if (route !== '/' && route.endsWith('/')) {
            route = route.slice(0, -1);
        }

        // strip query params for matching
        const cleanRoute = route.split('?')[0];

        if (cleanRoute === '/' || cleanRoute === '') {
            // show home page
            appState.setHome();
        } else {
            // try to find document by slug
            const slug = cleanRoute.substring(1);
            const doc = appState.documents.find(d => d.slug === slug);
            
            if (doc) {
                appState.setDocument(doc);
                new DocumentLoader().load(doc.url);
            } else {
                // document not found, show 404
                appState.show404();
            }
        }
    }

    getBasePath() {
        return '/blog';
    }
}

const router = new Router();

// ========================================
// THEME MANAGER
// ========================================
// handles light/dark mode switching
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

    // get theme from localStorage or default to light
    getSavedTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    // apply theme and switch icons
    applyTheme(theme) {
        const isDark = theme === 'dark';
        this.html.classList.toggle('dark', isDark);
        this.sunIcon.classList.toggle('icon-hidden', isDark);
        this.moonIcon.classList.toggle('icon-hidden', !isDark);
    }

    // toggle between light and dark
    toggle() {
        const isDark = this.html.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        this.applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }
}

// ========================================
// SEARCH MANAGER
// ========================================
// handles the search modal and searching through posts
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
        
        // keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ctrl/cmd + k to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.open();
            }
            // escape to close
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }

    open() {
        this.searchOverlay.classList.add('active');
        this.searchInput.focus();
        document.body.style.overflow = 'hidden'; // prevent scrolling behind modal
    }

    close() {
        this.searchOverlay.classList.remove('active');
        this.searchInput.value = '';
        this.searchResults.innerHTML = '';
        document.body.style.overflow = '';
    }

    // search through documents
    search(query) {
        if (!query.trim()) {
            this.searchResults.innerHTML = '';
            return;
        }

        // filter docs by title, description, and tags
        const results = appState.documents.filter(doc => {
            const searchText = `${doc.title} ${doc.description} ${doc.tags?.join(' ') || ''}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
            return;
        }

        // render results
        this.searchResults.innerHTML = results.map(doc => `
            <div class="search-result-item" data-slug="${doc.slug}">
                <div class="search-result-title">${doc.title}</div>
                <div class="search-result-description">${doc.description}</div>
            </div>
        `).join('');

        // add click handlers to results
        this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const slug = item.dataset.slug;
                router.navigate(`${router.getBasePath()}/${slug}`);
                this.close();
            });
        });
    }
}

// ========================================
// SHARE MANAGER
// ========================================
// handles sharing posts (web share API or clipboard fallback)
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

        // try to use native share if available (mobile mostly)
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch (error) {
                // user probably just cancelled
                if (error.name !== 'AbortError') {
                    this.fallbackShare(url);
                }
            }
        } else {
            // fallback to copying link
            this.fallbackShare(url);
        }
    }

    // copy link to clipboard
    fallbackShare(url) {
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Link copied to clipboard!');
        }).catch(() => {
            this.showToast('Could not copy link');
        });
    }

    // show toast notification
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

// ========================================
// TEXT SIZE CONTROL
// ========================================
// lets users adjust font size
class TextSizeControl {
    constructor() {
        this.contentEl = document.getElementById('content');
        this.sizes = [14, 16, 18, 20]; // available font sizes
        this.currentIndex = 1; // default to 16px
        
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
        this.currentIndex = 1; // back to 16px
        this.apply();
    }

    apply() {
        const size = this.sizes[this.currentIndex];
        this.contentEl.style.fontSize = `${size}px`;
        localStorage.setItem('textSize', size);
    }
}

// ========================================
// TABLE OF CONTENTS
// ========================================
// generates TOC from headings and tracks active section
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

    // generate TOC from h2 and h3 headings
    generate() {
        const contentEl = document.getElementById('content');
        this.headings = Array.from(contentEl.querySelectorAll('h2, h3'));
        
        // if no headings, hide TOC
        if (this.headings.length === 0) {
            document.getElementById('tocSidebar').style.display = 'none';
            return;
        }

        document.getElementById('tocSidebar').style.display = 'block';
        const list = this.createTOCList();
        
        // add to both desktop and mobile containers
        this.desktopContainer.innerHTML = '';
        this.mobileContainer.innerHTML = '';
        this.desktopContainer.appendChild(list.cloneNode(true));
        this.mobileContainer.appendChild(list.cloneNode(true));

        this.initActiveTracking();
        this.initClickHandlers();
    }

    // create the actual TOC list
    createTOCList() {
        const list = document.createElement('ul');
        list.className = 'toc-list';
        
        this.headings.forEach((heading, index) => {
            // make sure heading has an id
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

    // make TOC links clickable
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
                    // wait a bit before scrolling on mobile
                    setTimeout(() => {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            });
        });
    }

    // track which section is currently visible
    initActiveTracking() {
        const links = document.querySelectorAll('.toc-list a');
        
        // use intersection observer to detect visible headings
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // remove active from all links
                    links.forEach(link => link.classList.remove('active'));
                    // add active to current section
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

// ========================================
// READING PROGRESS
// ========================================
// shows progress bar at top while reading
class ReadingProgress {
    constructor() {
        this.bar = document.getElementById('readingProgress');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.update());
        this.update();
    }

    // calculate and update progress
    update() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
        
        this.bar.style.width = `${Math.min(scrollPercent, 100)}%`;
    }
}

// ========================================
// SCROLL TO TOP BUTTON
// ========================================
// shows button to scroll back to top
class ScrollToTop {
    constructor() {
        this.btn = document.getElementById('scrollTop');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.toggle());
        this.btn.addEventListener('click', () => this.scrollToTop());
    }

    // show/hide button based on scroll position
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

// ========================================
// READING TIME ESTIMATOR
// ========================================
// calculates estimated reading time
class ReadingTime {
    constructor() {
        this.wordsPerMinute = 200; // average reading speed
    }

    // count words and calculate time
    calculate(text) {
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / this.wordsPerMinute);
        return minutes;
    }

    // show reading time below title
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

// ========================================
// PRINT MANAGER
// ========================================
// handles printing
class PrintManager {
    constructor() {
        document.getElementById('printBtn').addEventListener('click', () => this.print());
    }

    print() {
        window.print();
    }
}

// ========================================
// DOCUMENT LOADER
// ========================================
// loads and renders markdown documents
class DocumentLoader {
    constructor() {
        this.contentEl = document.getElementById('content');
    }

    // fetch and render a markdown file
    async load(url) {
        try {
            // show loading state
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

    // convert markdown to HTML
    render(markdown) {
        marked.setOptions({
            headerIds: true,
            mangle: false,
            breaks: false,
            gfm: true // github flavored markdown
        });

        const html = marked.parse(markdown);
        this.contentEl.innerHTML = html;
        this.contentEl.classList.remove('loading-state');
    }

    // add TOC, reading time, comments after rendering
    initEnhancements(markdown) {
        const toc = new TableOfContents();
        toc.generate();

        const readingTime = new ReadingTime();
        const minutes = readingTime.calculate(markdown);
        readingTime.display(minutes);

        // load comments if article has them enabled
        if (appState.currentDocument) {
            commentsManager.load(appState.currentDocument.slug);
        }

        // scroll to top when new doc loads
        window.scrollTo({ top: 0 });
    }

    // show error if doc fails to load
    showError(error) {
        console.error('Failed to load content:', error);
        this.contentEl.className = 'error-state';
        this.contentEl.innerHTML = `
            <p>Oops! This is awkward..</p>
            <p style="margin-top: 0.5rem;">Check your internet connection and give it another shot!</p>
        `;
    }
}

// ========================================
// HOME SCREEN MANAGER
// ========================================
// manages the home page with all the article cards
class HomeScreenManager {
    constructor() {
        this.gridEl = document.getElementById('documentGrid');
        this.loader = new DocumentLoader();
    }

    init() {
        this.renderDocuments();
    }

    // render all document cards
    renderDocuments() {
        this.gridEl.innerHTML = '';
        
        appState.documents.forEach((doc) => {
            const card = document.createElement('div');
            card.className = 'document-card';
            
            // add tags if they exist
            const tagsHTML = doc.tags ? `
                <div class="document-meta">
                    <div class="document-tags">
                        ${doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            ` : '';
            
            // add date if it exists
            const dateHTML = doc.date ? `
                <div class="document-meta">
                    <div class="document-date">${new Date(doc.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
            ` : '';
            
            // build the card HTML
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
            
            // make card clickable
            card.addEventListener('click', () => this.openDocument(doc));
            this.gridEl.appendChild(card);
        });
    }

    // navigate to document
    openDocument(doc) {
        router.navigate(`${router.getBasePath()}/${doc.slug}`);
    }
}

// ========================================
// INITIALIZATION
// ========================================
// this runs when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    
    // load config first - everything depends on this
    const configLoaded = await appState.loadConfig();
    if (!configLoaded) {
        return; // config error page already shown
    }
    
    // update UI text from config
    document.getElementById('siteTitle').textContent = appState.config.siteTitle || 'Blog';
    document.getElementById('heroTitle').textContent = appState.config.heroTitle || 'Welcome';
    document.getElementById('heroSubtitle').textContent = appState.config.heroSubtitle || 'Select a post to read';
    document.getElementById('footerText').innerHTML = appState.config.footer || '© 2025';
    
    // update page title
    document.title = appState.config.siteTitle || 'Blog';
    
    // update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && appState.config.siteDescription) {
        metaDescription.content = appState.config.siteDescription;
    }
    
    // initialize theme first so it's ready immediately
    new ThemeManager();
    
    // initialize all the utility classes
    new ReadingProgress();
    new ScrollToTop();
    new PrintManager();
    new TextSizeControl();
    new SearchManager();
    new ShareManager();
    
    // set up home screen with document cards
    const homeManager = new HomeScreenManager();
    homeManager.init();
    
    // initialize router AFTER config is loaded
    // this handles URL routing and navigation
    router.init();
    
    // set up navigation handlers
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