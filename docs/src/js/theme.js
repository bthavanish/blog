// Theme Manager
class ThemeManager {
    constructor() {
        this.storageKey = 'theme';
        this.currentTheme = this.loadTheme();
        this.initializeTheme();
        this.setupEventListeners();
    }

    // Load theme from storage or system preference
    loadTheme() {
        const stored = window.storage.get(this.storageKey);
        if (stored) {
            return stored;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    // Initialize theme on page load
    initializeTheme() {
        this.applyTheme(this.currentTheme);
    }

    // Apply theme to document
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.updateToggleButton();
        this.updateGiscusTheme();
    }

    // Toggle between light and dark
    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        window.storage.set(this.storageKey, newTheme);
    }

    // Set specific theme
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
            window.storage.set(this.storageKey, theme);
        }
    }

    // Get current theme
    getTheme() {
        return this.currentTheme;
    }

    // Update toggle button icons
    updateToggleButton() {
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        
        if (sunIcon && moonIcon) {
            if (this.currentTheme === 'dark') {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            } else {
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            }
        }
    }

    // Update Giscus comments theme
    updateGiscusTheme() {
        const iframe = document.querySelector('iframe.giscus-frame');
        if (iframe) {
            const theme = this.currentTheme === 'dark' ? 'dark' : 'light';
            iframe.contentWindow.postMessage(
                { giscus: { setConfig: { theme } } },
                'https://giscus.app'
            );
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Theme toggle button
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!window.storage.has(this.storageKey)) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }

        // Keyboard shortcut: Ctrl/Cmd + Shift + T
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    // Apply custom theme colors from config
    applyCustomColors(config) {
        if (!config?.theme?.colors) return;

        const colors = config.theme.colors;
        const root = document.documentElement;

        // Apply light theme colors
        if (colors.light) {
            Object.entries(colors.light).forEach(([key, value]) => {
                root.style.setProperty(`--${this.kebabCase(key)}`, value);
            });
        }

        // Apply dark theme colors
        if (colors.dark && this.currentTheme === 'dark') {
            Object.entries(colors.dark).forEach(([key, value]) => {
                root.style.setProperty(`--${this.kebabCase(key)}`, value);
            });
        }
    }

    // Convert camelCase to kebab-case
    kebabCase(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }
}

// Initialize theme manager
window.themeManager = new ThemeManager();
