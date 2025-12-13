// LocalStorage Utilities
class StorageManager {
    constructor() {
        this.prefix = 'blog_';
    }

    // Get item from localStorage
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    // Set item in localStorage
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    // Remove item from localStorage
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    // Clear all items with prefix
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    // Check if key exists
    has(key) {
        return localStorage.getItem(this.prefix + key) !== null;
    }

    // Get all keys with prefix
    keys() {
        try {
            const keys = Object.keys(localStorage);
            return keys
                .filter(key => key.startsWith(this.prefix))
                .map(key => key.substring(this.prefix.length));
        } catch (error) {
            console.error('Storage keys error:', error);
            return [];
        }
    }
}

// Bookmarks Manager
class BookmarksManager {
    constructor(storage) {
        this.storage = storage;
        this.key = 'bookmarks';
    }

    // Get all bookmarks
    getAll() {
        return this.storage.get(this.key, []);
    }

    // Add bookmark
    add(slug) {
        const bookmarks = this.getAll();
        if (!bookmarks.includes(slug)) {
            bookmarks.push(slug);
            this.storage.set(this.key, bookmarks);
        }
        return true;
    }

    // Remove bookmark
    remove(slug) {
        const bookmarks = this.getAll();
        const filtered = bookmarks.filter(b => b !== slug);
        this.storage.set(this.key, filtered);
        return true;
    }

    // Toggle bookmark
    toggle(slug) {
        if (this.has(slug)) {
            this.remove(slug);
            return false;
        } else {
            this.add(slug);
            return true;
        }
    }

    // Check if bookmarked
    has(slug) {
        return this.getAll().includes(slug);
    }

    // Clear all bookmarks
    clear() {
        this.storage.set(this.key, []);
        return true;
    }
}

// Reading History Manager
class ReadingHistoryManager {
    constructor(storage) {
        this.storage = storage;
        this.key = 'reading_history';
        this.maxItems = 50;
    }

    // Get all history
    getAll() {
        return this.storage.get(this.key, []);
    }

    // Add to history
    add(post) {
        const history = this.getAll();
        
        // Remove if already exists
        const filtered = history.filter(item => item.slug !== post.slug);
        
        // Add to beginning
        filtered.unshift({
            slug: post.slug,
            title: post.title,
            timestamp: Date.now()
        });

        // Limit size
        const trimmed = filtered.slice(0, this.maxItems);
        
        this.storage.set(this.key, trimmed);
        return true;
    }

    // Remove from history
    remove(slug) {
        const history = this.getAll();
        const filtered = history.filter(item => item.slug !== slug);
        this.storage.set(this.key, filtered);
        return true;
    }

    // Clear history
    clear() {
        this.storage.set(this.key, []);
        return true;
    }

    // Get recent items
    getRecent(count = 10) {
        return this.getAll().slice(0, count);
    }
}

// Text Size Manager
class TextSizeManager {
    constructor(storage) {
        this.storage = storage;
        this.key = 'text_size';
        this.sizes = [14, 16, 18, 20, 22];
        this.defaultIndex = 1; // 16px
    }

    // Get current index
    getCurrentIndex() {
        return this.storage.get(this.key, this.defaultIndex);
    }

    // Get current size
    getCurrentSize() {
        return this.sizes[this.getCurrentIndex()];
    }

    // Increase size
    increase() {
        const currentIndex = this.getCurrentIndex();
        if (currentIndex < this.sizes.length - 1) {
            const newIndex = currentIndex + 1;
            this.storage.set(this.key, newIndex);
            return this.sizes[newIndex];
        }
        return this.getCurrentSize();
    }

    // Decrease size
    decrease() {
        const currentIndex = this.getCurrentIndex();
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            this.storage.set(this.key, newIndex);
            return this.sizes[newIndex];
        }
        return this.getCurrentSize();
    }

    // Reset to default
    reset() {
        this.storage.set(this.key, this.defaultIndex);
        return this.sizes[this.defaultIndex];
    }

    // Set specific size
    setSize(size) {
        const index = this.sizes.indexOf(size);
        if (index !== -1) {
            this.storage.set(this.key, index);
            return size;
        }
        return this.getCurrentSize();
    }
}

// Export instances
window.storage = new StorageManager();
window.bookmarks = new BookmarksManager(window.storage);
window.readingHistory = new ReadingHistoryManager(window.storage);
window.textSize = new TextSizeManager(window.storage);
