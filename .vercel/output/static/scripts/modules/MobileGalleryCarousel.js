/**
 * Mobile Gallery Carousel
 * Handles image carousel functionality for mobile devices
 * Includes touch support, navigation dots, and accessibility features
 */
export class MobileGalleryCarousel {
    constructor(gallerySelector, options = {}) {
        this.gallery = null;
        this.items = [];
        this.dots = [];
        this.prevButton = null;
        this.nextButton = null;
        this.currentIndex = 0;
        this.isTransitioning = false;
        this.touchStart = null;
        this.touchEnd = null;
        this.autoPlayInterval = null;
        this.userInteraction = false;
        // Configuration
        this.config = {
            autoPlay: false,
            autoPlayDelay: 5000,
            swipeThreshold: 50,
            transitionDuration: 500,
            showArrowsOnHover: true,
            enableTouch: true,
        };
        this.config = { ...this.config, ...options };
        this.init(gallerySelector);
    }
    /**
     * Initialize the carousel
     */
    init(gallerySelector) {
        this.gallery = document.querySelector(gallerySelector);
        if (!this.gallery) {
            console.warn(`Gallery element not found: ${gallerySelector}`);
            return;
        }
        // Only initialize on mobile devices
        if (!this.isMobile()) {
            return;
        }
        this.items = Array.from(this.gallery.querySelectorAll(".about-gallery-item"));
        if (this.items.length <= 1) {
            return; // No carousel needed for single image
        }
        this.createNavigation();
        this.setupEventListeners();
        this.showItem(0);
        this.setupAutoPlay();
        // Add swipe hint animation for better UX
        this.addSwipeHint();
    }
    /**
     * Check if current device is mobile
     */
    isMobile() {
        return window.innerWidth <= 767;
    }
    /**
     * Create navigation elements (dots and arrows)
     */
    createNavigation() {
        if (!this.gallery)
            return;
        // Create dots container
        const navContainer = document.createElement("div");
        navContainer.className = "about-gallery-nav";
        navContainer.setAttribute("role", "tablist");
        navContainer.setAttribute("aria-label", "Gallery navigation");
        this.items.forEach((item, index) => {
            const dot = document.createElement("button");
            dot.className = `about-gallery-dot ${index === 0 ? "active" : ""}`;
            dot.setAttribute("type", "button");
            dot.setAttribute("role", "tab");
            dot.setAttribute("aria-label", `Go to image ${index + 1}`);
            dot.setAttribute("aria-selected", index === 0 ? "true" : "false");
            dot.setAttribute("data-index", index.toString());
            dot.addEventListener("click", () => this.goToSlide(index));
            dot.addEventListener("keydown", (e) => this.handleDotKeydown(e, index));
            navContainer.appendChild(dot);
            this.dots.push(dot);
        });
        // Create arrow buttons
        this.prevButton = document.createElement("button");
        this.prevButton.className = "about-gallery-arrow prev";
        this.prevButton.setAttribute("type", "button");
        this.prevButton.setAttribute("aria-label", "Previous image");
        this.prevButton.innerHTML = "‹";
        this.prevButton.addEventListener("click", () => this.prev());
        this.nextButton = document.createElement("button");
        this.nextButton.className = "about-gallery-arrow next";
        this.nextButton.setAttribute("type", "button");
        this.nextButton.setAttribute("aria-label", "Next image");
        this.nextButton.innerHTML = "›";
        this.nextButton.addEventListener("click", () => this.next());
        // Append navigation to gallery
        this.gallery.appendChild(navContainer);
        this.gallery.appendChild(this.prevButton);
        this.gallery.appendChild(this.nextButton);
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.gallery || !this.config.enableTouch)
            return;
        // Touch events
        this.gallery.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: true });
        this.gallery.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: true });
        this.gallery.addEventListener("touchend", this.handleTouchEnd.bind(this), {
            passive: true,
        });
        // Mouse events (for desktop testing)
        this.gallery.addEventListener("mousedown", this.handleMouseDown.bind(this));
        this.gallery.addEventListener("mousemove", this.handleMouseMove.bind(this));
        this.gallery.addEventListener("mouseup", this.handleMouseUp.bind(this));
        this.gallery.addEventListener("mouseleave", this.handleMouseUp.bind(this));
        // Keyboard navigation
        this.gallery.addEventListener("keydown", this.handleKeydown.bind(this));
        // Pause auto-play on user interaction
        this.gallery.addEventListener("mouseenter", () => this.pauseAutoPlay());
        this.gallery.addEventListener("mouseleave", () => this.resumeAutoPlay());
        // Handle window resize
        window.addEventListener("resize", this.handleResize.bind(this));
    }
    /**
     * Touch event handlers
     */
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.touchStart = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
            this.userInteraction = true;
        }
    }
    handleTouchMove(e) {
        if (e.touches.length === 1 && this.touchStart) {
            this.touchEnd = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        }
    }
    handleTouchEnd(e) {
        if (!this.touchStart || !this.touchEnd)
            return;
        const deltaX = this.touchStart.x - this.touchEnd.x;
        const deltaY = this.touchStart.y - this.touchEnd.y;
        // Check if it's a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) &&
            Math.abs(deltaX) > this.config.swipeThreshold) {
            if (deltaX > 0) {
                this.next(); // Swipe left -> next
            }
            else {
                this.prev(); // Swipe right -> prev
            }
        }
        this.touchStart = null;
        this.touchEnd = null;
    }
    /**
     * Mouse event handlers (for desktop testing)
     */
    handleMouseDown(e) {
        this.touchStart = {
            x: e.clientX,
            y: e.clientY,
        };
        this.userInteraction = true;
    }
    handleMouseMove(e) {
        if (this.touchStart) {
            this.touchEnd = {
                x: e.clientX,
                y: e.clientY,
            };
        }
    }
    handleMouseUp() {
        if (!this.touchStart || !this.touchEnd)
            return;
        const deltaX = this.touchStart.x - this.touchEnd.x;
        const deltaY = this.touchStart.y - this.touchEnd.y;
        if (Math.abs(deltaX) > Math.abs(deltaY) &&
            Math.abs(deltaX) > this.config.swipeThreshold) {
            if (deltaX > 0) {
                this.next();
            }
            else {
                this.prev();
            }
        }
        this.touchStart = null;
        this.touchEnd = null;
    }
    /**
     * Keyboard navigation
     */
    handleKeydown(e) {
        switch (e.key) {
            case "ArrowLeft":
                e.preventDefault();
                this.prev();
                break;
            case "ArrowRight":
                e.preventDefault();
                this.next();
                break;
            case "Home":
                e.preventDefault();
                this.goToSlide(0);
                break;
            case "End":
                e.preventDefault();
                this.goToSlide(this.items.length - 1);
                break;
        }
    }
    /**
     * Handle dot keyboard navigation
     */
    handleDotKeydown(e, index) {
        switch (e.key) {
            case "ArrowLeft":
                e.preventDefault();
                this.goToSlide(Math.max(0, index - 1));
                break;
            case "ArrowRight":
                e.preventDefault();
                this.goToSlide(Math.min(this.items.length - 1, index + 1));
                break;
            case "Home":
                e.preventDefault();
                this.goToSlide(0);
                break;
            case "End":
                e.preventDefault();
                this.goToSlide(this.items.length - 1);
                break;
        }
    }
    /**
     * Navigate to specific slide
     */
    goToSlide(index) {
        if (this.isTransitioning || index === this.currentIndex)
            return;
        this.isTransitioning = true;
        const prevIndex = this.currentIndex;
        this.currentIndex = index;
        // Update items
        this.items.forEach((item, i) => {
            item.classList.remove("active", "prev");
            if (i === index) {
                item.classList.add("active");
            }
            else if (i < index) {
                item.classList.add("prev");
            }
        });
        // Update dots
        this.dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === index);
            dot.setAttribute("aria-selected", i === index ? "true" : "false");
        });
        // Reset transition state
        setTimeout(() => {
            this.isTransitioning = false;
        }, this.config.transitionDuration);
    }
    /**
     * Navigate to next slide
     */
    next() {
        const nextIndex = (this.currentIndex + 1) % this.items.length;
        this.goToSlide(nextIndex);
    }
    /**
     * Navigate to previous slide
     */
    prev() {
        const prevIndex = this.currentIndex === 0 ? this.items.length - 1 : this.currentIndex - 1;
        this.goToSlide(prevIndex);
    }
    /**
     * Show initial item
     */
    showItem(index) {
        this.items[index].classList.add("active");
    }
    /**
     * Setup auto-play functionality
     */
    setupAutoPlay() {
        if (!this.config.autoPlay)
            return;
        this.autoPlayInterval = window.setInterval(() => {
            if (!this.userInteraction) {
                this.next();
            }
        }, this.config.autoPlayDelay);
    }
    /**
     * Pause auto-play
     */
    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    /**
     * Resume auto-play
     */
    resumeAutoPlay() {
        if (!this.config.autoPlay || this.userInteraction)
            return;
        this.pauseAutoPlay();
        this.autoPlayInterval = window.setInterval(() => {
            if (!this.userInteraction) {
                this.next();
            }
        }, this.config.autoPlayDelay);
    }
    /**
     * Handle window resize
     */
    handleResize() {
        // Re-initialize on significant size change
        const isNowMobile = this.isMobile();
        const wasMobile = this.gallery?.classList.contains("mobile-carousel");
        if (isNowMobile && !wasMobile) {
            this.gallery?.classList.add("mobile-carousel");
        }
        else if (!isNowMobile && wasMobile) {
            this.destroy();
        }
    }
    /**
     * Add swipe hint animation
     */
    addSwipeHint() {
        if (!this.gallery)
            return;
        // Add swipe hint class
        this.gallery.classList.add("swipe-hint");
        // Remove hint after first interaction
        const removeHint = () => {
            this.gallery?.classList.remove("swipe-hint");
            document.removeEventListener("touchstart", removeHint);
            document.removeEventListener("click", removeHint);
        };
        document.addEventListener("touchstart", removeHint, { once: true });
        document.addEventListener("click", removeHint, { once: true });
    }
    /**
     * Destroy carousel and cleanup
     */
    destroy() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
        // Remove event listeners
        if (this.gallery) {
            this.gallery.removeEventListener("touchstart", this.handleTouchStart.bind(this));
            this.gallery.removeEventListener("touchmove", this.handleTouchMove.bind(this));
            this.gallery.removeEventListener("touchend", this.handleTouchEnd.bind(this));
            this.gallery.removeEventListener("keydown", this.handleKeydown.bind(this));
            window.removeEventListener("resize", this.handleResize.bind(this));
        }
        // Remove navigation elements
        this.dots.forEach((dot) => dot.remove());
        this.prevButton?.remove();
        this.nextButton?.remove();
        // Reset items
        this.items.forEach((item) => {
            item.classList.remove("active", "prev");
        });
    }
}
// Auto-initialize on DOM load
let mobileCarousel = null;
const initMobileGalleryCarousel = () => {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            mobileCarousel = new MobileGalleryCarousel(".about-gallery", {
                autoPlay: false,
                enableTouch: true,
            });
        });
    }
    else {
        // DOM already loaded
        mobileCarousel = new MobileGalleryCarousel(".about-gallery", {
            autoPlay: false,
            enableTouch: true,
        });
    }
};
// Re-initialize on window resize for responsive behavior
const handleResizeForCarousel = () => {
    if (window.innerWidth <= 767 && !mobileCarousel) {
        initMobileGalleryCarousel();
    }
    else if (window.innerWidth > 767 && mobileCarousel) {
        mobileCarousel.destroy();
        mobileCarousel = null;
    }
};
// Initialize
initMobileGalleryCarousel();
window.addEventListener("resize", handleResizeForCarousel);
export default MobileGalleryCarousel;
//# sourceMappingURL=MobileGalleryCarousel.js.map