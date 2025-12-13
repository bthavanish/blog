// Client-Side Router
class Router {
    constructor() {
        this.basePath = this.detectBasePath();
        this.currentRoute = null;
        this.posts = [];
    }

    // Detect base path for GitHub Pages
    detectBasePath() {
        const path = window.location.pathname;
        // Check if running on GitHub Pages (e.g., /blog/)
        const match = path.match(/^\/([^\/]+)\//);
        return match ? `/${match[1]}` : '';
    }

    // Initialize router
    init() {
        this.setupEventListeners();
        // Small delay to ensure redirect script runs first
        setTimeout(() => this.handleRoute(), 0);
    }

    // Setup event listeners
    setupEventListeners() {
        // Handle browser back/forward
        window.addEventListener('popstate', () => this.handleRoute());

        // Handle internal links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href.startsWith(window.location.origin)) {
                const url = new URL(link.href);
                if (url.pathname.startsWith(this.basePath)) {
                    e.preventDefault();
                    this.navigate(url.pathname);
                }
            }
        });
    }

    // Set posts data
    setPosts(posts) {
        this.posts = posts;
    }

    // Navigate to a route
    navigate(path) {
        // Normalize path
        path = path.replace(this.basePath, '') || '/';
        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        const fullPath = this.basePath + path;
        history.pushState(null, '', fullPath);
        this.handleRoute();
    }

    // Handle current route
    handleRoute() {
        let path = window.location.pathname;
        
        // Remove base path
        path = path.replace(this.basePath, '') || '/';
        
        // Remove trailing slash
        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        this.currentRoute = path;

        // Route to appropriate view
        if (path === '/') {
            this.showHome();
        } else {
            const slug = path.substring(1);
            this.showPost(slug);
        }

        // Scroll to top
        window.scrollTo({ top: 0 });
    }

    // Show home view
    showHome() {
        this.hideAllViews();
        
        const homeView = document.getElementById('homeView');
        if (homeView) {
            homeView.classList.add('active');
        }

        // Update page title
        if (window.appConfig) {
            document.title = window.appConfig.site.title;
        }

        // Hide reading progress
        if (window.readingProgress) {
            window.readingProgress.hide();
        }
        
        // Clear TOC
        if (window.toc) {
            window.toc.clear();
        }
        
        // Hide mobile TOC button
        if (window.mobileTOC) {
            window.mobileTOC.hide();
        }
    }

    // Show post view
    showPost(slug) {
        const post = this.posts.find(p => p.slug === slug);
        
        if (!post) {
            this.show404();
            return;
        }

        this.hideAllViews();
        
        const postView = document.getElementById('postView');
        if (postView) {
            postView.classList.add('active');
        }

        // Update page title
        document.title = `${post.title} - ${window.appConfig?.site?.title || 'Blog'}`;

        // Show reading progress
        if (window.readingProgress) {
            window.readingProgress.show();
        }

        // Load post content
        this.loadPostContent(post);

        // Add to reading history
        if (window.readingHistory) {
            window.readingHistory.add(post);
        }
    }

    // Show 404 view
    show404() {
        this.hideAllViews();
        
        const errorView = document.getElementById('errorView');
        if (errorView) {
            errorView.classList.add('active');
        }

        document.title = '404 - Page Not Found';

        // Hide reading progress
        if (window.readingProgress) {
            window.readingProgress.hide();
        }
    }

    // Hide all views
    hideAllViews() {
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.classList.remove('active'));
    }

    // Load post content
    async loadPostContent(post) {
        const contentArea = document.getElementById('postContent');
        if (!contentArea) return;

        // Show loading state
        contentArea.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading content...</p>
            </div>
        `;

        try {
            const response = await fetch(post.url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const markdown = await response.text();
            
            // Parse markdown with enhancements
            const parser = new EnhancedMarkdown(window.appConfig);
            const html = parser.parse(markdown);
            
            // Display content
            contentArea.innerHTML = html;

            // Add reading time if available
            if (post.readTime) {
                this.addReadingTime(post.readTime);
            }

            // Initialize enhanced media
            if (window.initializeMusicPlayers) {
                window.initializeMusicPlayers();
            }
            if (window.initializeImageGalleries) {
                window.initializeImageGalleries();
            }

            // Generate table of contents
            if (window.toc) {
                window.toc.generate(contentArea);
            }

            // Load comments if enabled
            this.loadComments(post);

            // Apply saved text size
            if (window.textSizeController) {
                window.textSizeController.applySavedSize();
            }

        } catch (error) {
            console.error('Failed to load post:', error);
            contentArea.innerHTML = `
                <div class="error-state">
                    <p>Failed to load content</p>
                    <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
                        ${error.message}
                    </p>
                </div>
            `;
        }
    }

    // Add reading time indicator
    addReadingTime(minutes) {
        const contentArea = document.getElementById('postContent');
        const firstHeading = contentArea.querySelector('h1, h2');
        
        if (firstHeading && !contentArea.querySelector('.reading-time')) {
            const readingTime = document.createElement('div');
            readingTime.className = 'reading-time';
            readingTime.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>${minutes} min read</span>
            `;
            firstHeading.insertAdjacentElement('afterend', readingTime);
        }
    }

    // Load comments
    loadComments(post) {
        const config = window.appConfig;
        const commentsSection = document.getElementById('commentsSection');
        const commentsContainer = document.getElementById('commentsContainer');
        
        if (!config?.features?.comments?.enabled || !commentsSection) {
            if (commentsSection) commentsSection.style.display = 'none';
            return;
        }

        commentsSection.style.display = 'block';
        commentsContainer.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading comments...</p>
            </div>
        `;

        const provider = config.features.comments.provider;

        try {
            if (provider === 'giscus') {
                this.loadGiscus(post);
            } else if (provider === 'utterances') {
                this.loadUtterances(post);
            } else if (provider === 'disqus') {
                this.loadDisqus(post);
            }
        } catch (error) {
            console.error('Failed to load comments:', error);
            commentsContainer.innerHTML = `
                <div class="error-state">
                    <p>Failed to load comments</p>
                </div>
            `;
        }
    }

    // Load Giscus comments
    loadGiscus(post) {
        const settings = window.appConfig.features.comments.giscus;
        const container = document.getElementById('commentsContainer');
        
        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.setAttribute('data-repo', settings.repo);
        script.setAttribute('data-repo-id', settings.repoId || '');
        script.setAttribute('data-category', settings.category || 'General');
        script.setAttribute('data-category-id', settings.categoryId || '');
        script.setAttribute('data-mapping', settings.mapping || 'pathname');
        script.setAttribute('data-strict', settings.strict ? '1' : '0');
        script.setAttribute('data-reactions-enabled', settings.reactionsEnabled ? '1' : '0');
        script.setAttribute('data-emit-metadata', '0');
        script.setAttribute('data-input-position', 'bottom');
        script.setAttribute('data-theme', window.themeManager.getTheme());
        script.setAttribute('data-lang', 'en');
        script.setAttribute('data-loading', 'lazy');
        script.crossOrigin = 'anonymous';
        script.async = true;

        container.appendChild(script);
    }

    // Load Utterances comments
    loadUtterances(post) {
        const settings = window.appConfig.features.comments.utterances;
        const container = document.getElementById('commentsContainer');
        
        container.innerHTML = '';

        const theme = window.themeManager.getTheme() === 'dark' ? 'github-dark' : 'github-light';

        const script = document.createElement('script');
        script.src = 'https://utteranc.es/client.js';
        script.setAttribute('repo', settings.repo);
        script.setAttribute('issue-term', settings.issueTerm || 'pathname');
        script.setAttribute('label', settings.label || 'comment');
        script.setAttribute('theme', theme);
        script.crossOrigin = 'anonymous';
        script.async = true;

        container.appendChild(script);
    }

    // Load Disqus comments
    loadDisqus(post) {
        const settings = window.appConfig.features.comments.disqus;
        const container = document.getElementById('commentsContainer');
        
        container.innerHTML = '<div id="disqus_thread"></div>';

        window.disqus_config = function() {
            this.page.url = window.location.href;
            this.page.identifier = post.slug;
        };

        const script = document.createElement('script');
        script.src = `https://${settings.shortname}.disqus.com/embed.js`;
        script.setAttribute('data-timestamp', +new Date());
        (document.head || document.body).appendChild(script);
    }

    // Get current route
    getCurrentRoute() {
        return this.currentRoute;
    }

    // Check if on home page
    isHome() {
        return this.currentRoute === '/';
    }
}

// Initialize router
window.router = new Router();
