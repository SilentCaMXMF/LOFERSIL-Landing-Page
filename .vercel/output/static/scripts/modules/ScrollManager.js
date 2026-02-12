/**
 * ScrollManager - Handles scroll-based effects and optimizations
 * Uses Intersection Observer for efficient scroll handling
 */
const SCROLL_THRESHOLD = 100;
export class ScrollManager {
    constructor(navigationManager) {
        this.hero = null;
        this.heroImage = null;
        this.observers = [];
        this.ticking = false;
        this.isMobileDevice = false;
        this.navigationManager = navigationManager;
        this.detectMobileDevice();
        this.setupDOMElements();
        this.setupScrollEffects();
        this.setupIntersectionObservers();
        this.setupResizeListener();
    }
    /**
     * Detect if current device is mobile/touch device
     */
    detectMobileDevice() {
        // Check for touch capability and screen size
        this.isMobileDevice =
            "ontouchstart" in window ||
                navigator.maxTouchPoints > 0 ||
                window.innerWidth <= 768;
    }
    /**
     * Setup resize listener to handle device changes
     */
    setupResizeListener() {
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const wasMobile = this.isMobileDevice;
                this.detectMobileDevice();
                // If device type changed, reset parallax state
                if (wasMobile !== this.isMobileDevice && this.heroImage) {
                    if (this.isMobileDevice) {
                        this.heroImage.style.transform = "";
                        this.heroImage.style.willChange = "auto";
                    }
                    else {
                        this.heroImage.style.willChange = "transform";
                    }
                }
            }, 250);
        };
        window.addEventListener("resize", handleResize, { passive: true });
    }
    /**
     * Cache DOM elements to avoid repeated queries
     */
    setupDOMElements() {
        this.hero = document.getElementById("hero");
        if (this.hero) {
            this.heroImage = this.hero.querySelector(".hero-img");
        }
    }
    /**
     * Setup optimized scroll effects with throttling
     */
    setupScrollEffects() {
        const updateScrollEffects = () => {
            const scrollY = window.scrollY;
            // Update navbar scroll state
            this.navigationManager.updateNavbarOnScroll(SCROLL_THRESHOLD);
            // Parallax effect for hero section (desktop only)
            if (this.heroImage && !this.isMobileDevice) {
                const parallaxOffset = scrollY * 0.5;
                this.heroImage.style.transform = `translateY(${parallaxOffset}px)`;
            }
            this.ticking = false;
        };
        const requestScrollUpdate = () => {
            if (!this.ticking) {
                requestAnimationFrame(updateScrollEffects);
                this.ticking = true;
            }
        };
        window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    }
    /**
     * Setup Intersection Observer for elements that come into view
     */
    setupIntersectionObservers() {
        // Observe elements for lazy loading or animations
        const lazyElements = document.querySelectorAll("[data-lazy]");
        if (lazyElements.length > 0) {
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        // Add visible class for animations
                        element.classList.add("visible");
                        // Stop observing once visible
                        lazyObserver.unobserve(element);
                    }
                });
            }, {
                rootMargin: "50px",
            });
            lazyElements.forEach((element) => {
                lazyObserver.observe(element);
            });
            this.observers.push(lazyObserver);
        }
        // Observe elements for scroll-triggered animations
        const animateElements = document.querySelectorAll("[data-animate]");
        if (animateElements.length > 0) {
            const animateObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const animationType = element.getAttribute("data-animate");
                        if (animationType === "scale-in" ||
                            animationType === "slide-up") {
                            // For grids, animate children with stagger
                            const children = element.children;
                            Array.from(children).forEach((child, index) => {
                                const delay = index * 150; // 150ms stagger
                                setTimeout(() => {
                                    child.classList.add("animate-in");
                                }, delay);
                            });
                        }
                        else {
                            // Single element animation
                            element.classList.add("animate-in");
                        }
                        // Stop observing once animated
                        animateObserver.unobserve(element);
                    }
                });
            }, {
                rootMargin: "0px 0px -100px 0px", // Trigger when element is 100px from bottom
                threshold: 0.1,
            });
            animateElements.forEach((element) => {
                animateObserver.observe(element);
            });
            this.observers.push(animateObserver);
        }
        // Setup lazy loading for images
        this.setupLazyLoading();
        // Observe hero section for performance optimizations
        if (this.hero) {
            const heroObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Hero is visible, could enable parallax
                        this.enableParallax();
                    }
                    else {
                        // Hero is not visible, could disable parallax for performance
                        this.disableParallax();
                    }
                });
            }, {
                threshold: 0.1,
            });
            heroObserver.observe(this.hero);
            this.observers.push(heroObserver);
        }
    }
    /**
     * Setup lazy loading for images
     */
    setupLazyLoading() {
        const lazyImages = document.querySelectorAll("img[data-src]");
        if (lazyImages.length > 0) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.getAttribute("data-src");
                        if (src) {
                            img.src = src;
                            img.classList.remove("lazy");
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });
            lazyImages.forEach((img) => {
                imageObserver.observe(img);
            });
            this.observers.push(imageObserver);
        }
    }
    /**
     * Enable parallax effect (desktop only)
     */
    enableParallax() {
        if (this.heroImage && !this.isMobileDevice) {
            this.heroImage.style.willChange = "transform";
        }
    }
    /**
     * Disable parallax effect for performance
     */
    disableParallax() {
        if (this.heroImage) {
            this.heroImage.style.willChange = "auto";
            // Reset transform on mobile devices
            if (this.isMobileDevice) {
                this.heroImage.style.transform = "";
            }
        }
    }
    /**
     * Smooth scroll to element
     */
    scrollToElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }
    /**
     * Get current scroll position
     */
    getScrollPosition() {
        return window.scrollY;
    }
    /**
     * Check if element is in viewport
     */
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth));
    }
    /**
     * Cleanup observers and event listeners
     */
    destroy() {
        this.observers.forEach((observer) => {
            observer.disconnect();
        });
        this.observers = [];
        // Reset will-change properties
        if (this.heroImage) {
            this.heroImage.style.willChange = "auto";
        }
    }
}
//# sourceMappingURL=ScrollManager.js.map