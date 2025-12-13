// Enhanced Markdown Parser with Custom Media Support
class EnhancedMarkdown {
    constructor(config) {
        this.config = config;
        this.setupMarked();
    }

    setupMarked() {
        marked.setOptions({
            headerIds: true,
            mangle: false,
            breaks: false,
            gfm: true
        });
    }

    parse(markdown) {
        // Pre-process custom syntax before marked parsing
        markdown = this.preprocessCustomSyntax(markdown);
        
        // Parse with marked
        let html = marked.parse(markdown);
        
        // Post-process for any final touches
        html = this.postprocessHTML(html);
        
        return html;
    }

    preprocessCustomSyntax(markdown) {
        if (!this.config?.markdown?.enhancedMedia) return markdown;

        const { enhancedMedia } = this.config.markdown;

        // Process custom image syntax: ![type](url)
        markdown = markdown.replace(/!\[(\w+)\]\(([^)]+)\)/g, (match, type, url) => {
            type = type.toLowerCase();
            
            switch(type) {
                case 'download':
                    return enhancedMedia.downloadBoxes ? this.createDownloadBox(url) : match;
                case 'music':
                    return enhancedMedia.musicPlayer ? this.createMusicPlayer(url) : match;
                case 'pdf':
                    return enhancedMedia.pdfViewer ? this.createPDFViewer(url) : match;
                case 'video':
                    return enhancedMedia.videoPlayer ? this.createVideoPlayer(url) : match;
                case 'gallery':
                    return enhancedMedia.imageGallery ? this.createImageGallery(url) : match;
                default:
                    return match; // Keep original if not recognized
            }
        });

        return markdown;
    }

    createDownloadBox(url) {
        const filename = url.split('/').pop() || 'Download';
        const extension = filename.split('.').pop()?.toUpperCase() || 'FILE';
        
        return `
<div class="enhanced-media download-box" data-type="download">
    <div class="download-icon">
        <svg viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
    </div>
    <div class="download-info">
        <div class="download-name">${this.escapeHtml(filename)}</div>
        <div class="download-type">${extension} File</div>
    </div>
    <a href="${this.escapeHtml(url)}" download class="download-btn" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Download</span>
    </a>
</div>`;
    }

    createMusicPlayer(url) {
        const filename = url.split('/').pop() || 'Audio File';
        const id = 'audio-' + Math.random().toString(36).substr(2, 9);
        
        return `
<div class="enhanced-media music-player" data-type="music" data-audio-id="${id}">
    <audio id="${id}" src="${this.escapeHtml(url)}" preload="metadata"></audio>
    <div class="player-controls">
        <button class="play-btn" data-target="${id}">
            <svg class="play-icon" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <svg class="pause-icon hidden" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            </svg>
        </button>
        <div class="player-info">
            <div class="track-name">${this.escapeHtml(filename)}</div>
            <div class="track-time">
                <span class="current-time">0:00</span>
                <span class="separator">/</span>
                <span class="duration">0:00</span>
            </div>
        </div>
        <div class="progress-container">
            <div class="progress-bar" data-target="${id}">
                <div class="progress-filled"></div>
            </div>
        </div>
        <button class="volume-btn" data-target="${id}">
            <svg class="volume-on" viewBox="0 0 24 24">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            <svg class="volume-off hidden" viewBox="0 0 24 24">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
        </button>
    </div>
</div>`;
    }

    createPDFViewer(url) {
        const filename = url.split('/').pop() || 'PDF Document';
        const id = 'pdf-' + Math.random().toString(36).substr(2, 9);
        
        return `
<div class="enhanced-media pdf-viewer" data-type="pdf" id="${id}">
    <div class="pdf-header">
        <div class="pdf-info">
            <svg class="pdf-icon" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span class="pdf-name">${this.escapeHtml(filename)}</span>
        </div>
        <div class="pdf-actions">
            <button class="pdf-btn" onclick="window.open('${this.escapeHtml(url)}', '_blank')">
                <svg viewBox="0 0 24 24">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Open
            </button>
            <a href="${this.escapeHtml(url)}" download class="pdf-btn">
                <svg viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
            </a>
        </div>
    </div>
    <div class="pdf-embed">
        <iframe src="${this.escapeHtml(url)}" frameborder="0" loading="lazy"></iframe>
    </div>
</div>`;
    }

    createVideoPlayer(url) {
        const id = 'video-' + Math.random().toString(36).substr(2, 9);
        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
        const isVimeo = url.includes('vimeo.com');
        
        if (isYouTube) {
            const videoId = this.extractYouTubeId(url);
            return `
<div class="enhanced-media video-player" data-type="video">
    <div class="video-embed">
        <iframe 
            src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
            loading="lazy">
        </iframe>
    </div>
</div>`;
        } else if (isVimeo) {
            const videoId = this.extractVimeoId(url);
            return `
<div class="enhanced-media video-player" data-type="video">
    <div class="video-embed">
        <iframe 
            src="https://player.vimeo.com/video/${videoId}" 
            frameborder="0" 
            allow="autoplay; fullscreen; picture-in-picture" 
            allowfullscreen
            loading="lazy">
        </iframe>
    </div>
</div>`;
        } else {
            return `
<div class="enhanced-media video-player" data-type="video">
    <video controls preload="metadata" id="${id}">
        <source src="${this.escapeHtml(url)}">
        Your browser does not support the video tag.
    </video>
</div>`;
        }
    }

    createImageGallery(urls) {
        const images = urls.split(',').map(url => url.trim());
        const id = 'gallery-' + Math.random().toString(36).substr(2, 9);
        
        const imagesHTML = images.map((url, index) => `
            <div class="gallery-item" data-index="${index}">
                <img src="${this.escapeHtml(url)}" alt="Gallery image ${index + 1}" loading="lazy">
            </div>
        `).join('');
        
        return `
<div class="enhanced-media image-gallery" data-type="gallery" id="${id}">
    <div class="gallery-grid">
        ${imagesHTML}
    </div>
    <div class="gallery-lightbox" style="display: none;">
        <button class="lightbox-close">×</button>
        <button class="lightbox-prev">‹</button>
        <button class="lightbox-next">›</button>
        <img class="lightbox-image" src="" alt="">
        <div class="lightbox-counter"></div>
    </div>
</div>`;
    }

    postprocessHTML(html) {
        // Wrap tables for responsiveness
        html = html.replace(/<table>/g, '<div class="table-wrapper"><table>');
        html = html.replace(/<\/table>/g, '</table></div>');
        
        return html;
    }

    extractYouTubeId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : '';
    }

    extractVimeoId(url) {
        const regex = /vimeo\.com\/(\d+)/;
        const match = url.match(regex);
        return match ? match[1] : '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize music players after DOM insertion
function initializeMusicPlayers() {
    document.querySelectorAll('.music-player').forEach(player => {
        const audioId = player.dataset.audioId;
        const audio = document.getElementById(audioId);
        const playBtn = player.querySelector('.play-btn');
        const progressBar = player.querySelector('.progress-bar');
        const volumeBtn = player.querySelector('.volume-btn');
        
        if (!audio) return;

        // Play/Pause
        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                player.querySelector('.play-icon').classList.add('hidden');
                player.querySelector('.pause-icon').classList.remove('hidden');
            } else {
                audio.pause();
                player.querySelector('.play-icon').classList.remove('hidden');
                player.querySelector('.pause-icon').classList.add('hidden');
            }
        });

        // Update time and progress
        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            player.querySelector('.progress-filled').style.width = `${progress}%`;
            player.querySelector('.current-time').textContent = formatTime(audio.currentTime);
        });

        // Load metadata
        audio.addEventListener('loadedmetadata', () => {
            player.querySelector('.duration').textContent = formatTime(audio.duration);
        });

        // Progress bar click
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audio.currentTime = percent * audio.duration;
        });

        // Volume toggle
        volumeBtn.addEventListener('click', () => {
            audio.muted = !audio.muted;
            player.querySelector('.volume-on').classList.toggle('hidden');
            player.querySelector('.volume-off').classList.toggle('hidden');
        });

        // Reset on end
        audio.addEventListener('ended', () => {
            player.querySelector('.play-icon').classList.remove('hidden');
            player.querySelector('.pause-icon').classList.add('hidden');
            audio.currentTime = 0;
        });
    });
}

// Initialize image galleries
function initializeImageGalleries() {
    document.querySelectorAll('.image-gallery').forEach(gallery => {
        const items = gallery.querySelectorAll('.gallery-item');
        const lightbox = gallery.querySelector('.gallery-lightbox');
        const lightboxImg = lightbox.querySelector('.lightbox-image');
        const counter = lightbox.querySelector('.lightbox-counter');
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        
        let currentIndex = 0;

        items.forEach((item, index) => {
            item.addEventListener('click', () => {
                currentIndex = index;
                showLightbox();
            });
        });

        function showLightbox() {
            const img = items[currentIndex].querySelector('img');
            lightboxImg.src = img.src;
            counter.textContent = `${currentIndex + 1} / ${items.length}`;
            lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function hideLightbox() {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }

        closeBtn.addEventListener('click', hideLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) hideLightbox();
        });

        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            showLightbox();
        });

        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % items.length;
            showLightbox();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (lightbox.style.display === 'flex') {
                if (e.key === 'Escape') hideLightbox();
                if (e.key === 'ArrowLeft') prevBtn.click();
                if (e.key === 'ArrowRight') nextBtn.click();
            }
        });
    });
}

// Helper function
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Export for use in app.js
window.EnhancedMarkdown = EnhancedMarkdown;
window.initializeMusicPlayers = initializeMusicPlayers;
window.initializeImageGalleries = initializeImageGalleries;
