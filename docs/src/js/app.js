// Main Application
class BlogApp {
    constructor() {
        this.config = null;
        this.posts = [];
        this.initialized = false;
    }

    // Initialize the application
    async init() {
        try {
            console.log('Initializing blog...');
            
            // Load configuration
            await this.loadConfig();
            
            // Load posts
            await this.loadPosts();
            
            // Apply configuration
            this.applyConfig();
            
            // Setup UI
            this.setupUI();
            
            // Initialize router
            window.router.setPosts(this.posts);
            window.router.init();
            
            // Setup navigation
            this.setupNavigation();
            
            this.initialized = true;
            console.log('Blog initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize blog:', error);
            this.showError('Failed to load blog configuration. Please refresh the page.');
        }
    }

    // Load configuration file
    async loadConfig() {
        try {
            const response = await fetch('./config.json');
            if (!response.ok) {
                throw new Error('Failed to load config.json');
            }
            this.config = await response.json();
            window.appConfig = this.config;
            console.log('Config loaded:', this.config);
        } catch (error) {
            console.error('Config load error:', error);
            throw error;
        }
    }

    // Load posts file
    async loadPosts() {
        try {
            const response = await fetch('./posts.json');
            if (!response.ok) {
                throw new Error('Failed to load posts.json');
            }
            const data = await response.json();
            this.posts = data.posts || [];
            console.log('Posts loaded:', this.posts.length);
        } catch (error) {
            console.error('Posts load error:', error);
            throw error;
        }
    }

    // Apply configuration to the page
    applyConfig() {
        const { site, ui, theme } = this.config;

        // Update site metadata
        if (site) {
            document.title = site.title || 'Blog';
            
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc && site.description) {
                metaDesc.content = site.description;
            }
        }

        // Update UI elements
        if (ui) {
            // Header
            const siteTitle = document.getElementById('siteTitle');
            if (siteTitle) {
                siteTitle.textContent = site?.title || 'Blog';
            }

            // Apply logo icon
            this.applyLogoIcon();

            // Hero section
            const heroTitle = document.getElementById('heroTitle');
            const heroSubtitle = document.getElementById('heroSubtitle');
            
            if (heroTitle) {
                heroTitle.textContent = ui.hero?.title || 'Welcome';
            }
            if (heroSubtitle) {
                heroSubtitle.textContent = ui.hero?.subtitle || 'Select a blog to read';
            }

            // Footer
            const footerText = document.getElementById('footerText');
            const footerLinks = document.getElementById('footerLinks');
            
            if (footerText && ui.footer?.text) {
                footerText.innerHTML = ui.footer.text;
            }
            
            if (footerLinks && ui.footer?.links) {
                footerLinks.innerHTML = ui.footer.links.map(link => `
                    <a href="${link.url}" class="footer-link" target="_blank" rel="noopener noreferrer">
                        ${link.text}
                    </a>
                `).join('');
            }
        }

        // Apply custom theme colors
        if (theme && window.themeManager) {
            window.themeManager.applyCustomColors(this.config);
        }

        // Render posts grid
        this.renderPostsGrid();
    }

    // Apply logo icon from config
    applyLogoIcon() {
        const logoIcon = document.getElementById('logoIcon');
        const logoIconName = this.config?.ui?.header?.logoIcon || 'layers';
        
        if (logoIcon && this.config?.icons && this.config.icons[logoIconName]) {
            logoIcon.innerHTML = this.config.icons[logoIconName];
        }
    }

    // Setup UI components
    setupUI() {
        // Pass posts to search
        if (window.search) {
            window.search.setPosts(this.posts);
        }
    }

    // Render posts grid on home page
    renderPostsGrid() {
        const grid = document.getElementById('postsGrid');
        if (!grid) return;

        // Sort posts by date (newest first)
        const sortedPosts = [...this.posts].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        grid.innerHTML = sortedPosts.map(post => {
            const date = new Date(post.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const tagsHTML = post.tags ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : '';

            const featuredBadge = post.featured ? `
                <span class="featured-badge">
                    <svg viewBox="0 0 24 24">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Featured
                </span>
            ` : '';

            return `
                <div class="post-card" data-slug="${post.slug}">
                    ${featuredBadge}
                    <div class="post-card-header">
                        <div class="post-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                            </svg>
                        </div>
                    </div>
                    <h3 class="post-card-title">${this.escapeHtml(post.title)}</h3>
                    <p class="post-card-description">${this.escapeHtml(post.description)}</p>
                    <div class="post-card-meta">
                        <div class="post-date">
                            <svg viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            ${formattedDate}
                        </div>
                        ${tagsHTML}
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        grid.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.dataset.slug;
                window.router.navigate(`/${slug}`);
            });
        });
    }

    // Setup navigation handlers
    setupNavigation() {
        // Logo/Site title - navigate to home
        const logo = document.getElementById('logoBtn');
        if (logo) {
            logo.addEventListener('click', () => {
                window.router.navigate('/');
            });
        }

        const siteTitle = document.getElementById('siteTitle');
        if (siteTitle) {
            siteTitle.style.cursor = 'pointer';
            siteTitle.addEventListener('click', () => {
                window.router.navigate('/');
            });
        }

        // Back button
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.router.navigate('/');
            });
        }

        // Error page home button
        const errorHomeBtn = document.getElementById('errorHomeBtn');
        if (errorHomeBtn) {
            errorHomeBtn.addEventListener('click', () => {
                window.router.navigate('/');
            });
        }
    }

    // Show error message
    showError(message) {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="max-width: 500px;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                    <h1 style="font-size: 2rem; margin-bottom: 1rem; color: #1f2937;">Error</h1>
                    <p style="color: #6b7280; margin-bottom: 2rem;">${message}</p>
                    <button onclick="location.reload()" style="padding: 0.75rem 1.5rem; background: #cd7c53; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, starting app...');
    
    const app = new BlogApp();
    await app.init();
    
    // Make app globally available for debugging
    window.app = app;
});

// Service Worker registration (optional, for PWA)
if ('serviceWorker' in navigator && window.appConfig?.features?.pwa?.enabled) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered:', registration))
            .catch(error => console.log('SW registration failed:', error));
    });
}
