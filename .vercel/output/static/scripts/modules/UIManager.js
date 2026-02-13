/**
 * UIManager - Handles DOM manipulation, event listeners, and UI interactions
 * Manages UI state, scroll effects, and user interactions
 */
import { validateContactForm } from '../validation.js';
// Simple error handling helper
class UIErrorHandler {
    static handleError(error, message, context) {
        console.warn(`[UI Error] ${message}:`, error, context);
        // Optionally send to analytics or monitoring service
    }
    static showSuccessMessage(message) {
        // Could be enhanced with a toast notification system
        console.log(`[Success] ${message}`);
        alert(message); // Simple fallback
    }
    static showErrorMessage(message) {
        // Could be enhanced with a toast notification system
        console.error(`[Error] ${message}`);
        alert(message); // Simple fallback
    }
}
/**
 * UIManager class for handling UI interactions
 */
export class UIManager {
    constructor(config) {
        this.navbar = null;
        this.ticking = false;
        this.config = config;
        this.setupDOMElements();
        this.setupScrollEffects();
        this.setupContactForm();
        this.setupServiceWorker();
        this.setupLazyLoading();
    }
    /**
     * Setup DOM element references with error handling
     */
    setupDOMElements() {
        try {
            this.navbar = document.getElementById('navbar');
            // Additional critical DOM elements can be added here
        }
        catch (error) {
            UIErrorHandler.handleError(error, 'Failed to setup DOM elements', {
                component: 'UIManager',
                action: 'setupDOMElements',
                timestamp: new Date().toISOString(),
            });
        }
    }
    /**
     * Setup scroll effects
     */
    setupScrollEffects() {
        const updateScrollEffects = () => {
            const scrollY = window.scrollY;
            // Navbar background on scroll
            if (this.navbar) {
                if (scrollY > this.config.scrollThreshold) {
                    this.navbar.classList.add('scrolled');
                }
                else {
                    this.navbar.classList.remove('scrolled');
                }
            }
            // Parallax effect for hero section
            const hero = document.getElementById('hero');
            if (hero) {
                const heroImage = hero.querySelector('.hero-img');
                if (heroImage) {
                    const parallaxOffset = scrollY * 0.5;
                    heroImage.style.transform = `translateY(${parallaxOffset}px)`;
                }
            }
            this.ticking = false;
        };
        const requestScrollUpdate = () => {
            if (!this.ticking) {
                requestAnimationFrame(updateScrollEffects);
                this.ticking = true;
            }
        };
        window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    }
    /**
     * Setup contact form handling
     */
    setupContactForm() {
        const contactForm = document.querySelector(this.config.contactFormSelector || 'form[action="/api/contact"]');
        if (contactForm) {
            contactForm.addEventListener('submit', e => this.handleContactFormSubmit(e));
        }
    }
    /**
     * Handle contact form submission
     */
    async handleContactFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        try {
            // Get form data
            const formData = new FormData(form);
            const contactRequest = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                message: formData.get('message'),
            };
            // Submit form
            const response = await this.submitContact(contactRequest);
            if (response.success) {
                UIErrorHandler.showSuccessMessage("Message sent successfully! We'll get back to you soon.");
                form.reset();
            }
            else {
                UIErrorHandler.showErrorMessage(response.error || 'Failed to send message. Please try again.');
            }
        }
        catch (error) {
            UIErrorHandler.handleError(error, 'Failed to submit contact form');
            UIErrorHandler.showErrorMessage('Failed to send message. Please try again.');
        }
    }
    /**
     * Submit contact form via API
     */
    async submitContact(request) {
        // Validate form data before submission
        const validation = validateContactForm(request);
        if (!validation.isValid) {
            return {
                success: false,
                data: { id: '' },
                error: `Validation failed: ${Object.values(validation.errors).join(', ')}`,
                timestamp: new Date().toISOString(),
            };
        }
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });
            if (!response.ok) {
                throw new Error('Failed to submit contact form');
            }
            return await response.json();
        }
        catch (error) {
            return {
                success: false,
                data: { id: '' },
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };
        }
    }
    /**
     * Setup service worker for PWA functionality
     */
    setupServiceWorker() {
        const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';
        if ('serviceWorker' in navigator && !IS_DEVELOPMENT) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then(registration => {
                    console.info('Service Worker registered successfully:', registration.scope);
                })
                    .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
            });
        }
    }
    /**
     * Show loading state
     */
    showLoading(element, message = 'Loading...') {
        element.style.position = 'relative';
        const loadingOverlay = document.createElement('div');
        loadingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #666;
    `;
        loadingOverlay.innerHTML = `
      <div style="text-align: center;">
        <div style="border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
        <span class="loading-message"></span>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
        // Safely set text content (not HTML) to prevent XSS
        const messageSpan = loadingOverlay.querySelector('.loading-message');
        if (messageSpan) {
            messageSpan.textContent = message;
        }
        element.appendChild(loadingOverlay);
    }
    /**
     * Hide loading state
     */
    hideLoading(element) {
        const loadingOverlay = element.querySelector('div[style*="position: absolute"]');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
    /**
     * Toggle element visibility
     */
    toggleVisibility(element, show) {
        const willShow = show !== undefined ? show : element.style.display === 'none';
        element.style.display = willShow ? 'block' : 'none';
    }
    /**
     * Smooth scroll to element
     */
    scrollToElement(selector, offset = 0) {
        const element = document.querySelector(selector);
        if (element) {
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
        }
    }
    /**
     * Add CSS class temporarily
     */
    addTemporaryClass(element, className, duration = 1000) {
        element.classList.add(className);
        setTimeout(() => {
            element.classList.remove(className);
        }, duration);
    }
    /**
     * Animate element
     */
    animateElement(element, animation, duration = 300) {
        return new Promise(resolve => {
            element.style.animation = `${animation} ${duration}ms ease-in-out`;
            setTimeout(() => {
                element.style.animation = '';
                resolve();
            }, duration);
        });
    }
    /**
     * Setup lazy loading for images using Intersection Observer
     */
    setupLazyLoading() {
        // Check if browser supports Intersection Observer
        if (!('IntersectionObserver' in window)) {
            console.warn('Intersection Observer not supported, falling back to native lazy loading');
            return;
        }
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    // Load the image if it has data-src
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        img.classList.add('lazy-loaded');
                        // Remove data-src to prevent re-processing
                        delete img.dataset.src;
                        // Stop observing this image
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            // Start loading when image is 50px from viewport
            rootMargin: '50px 0px',
            threshold: 0.01,
        });
        // Find all images with lazy loading
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
        // Also observe images that might be added dynamically
        this.observeDynamicImages(imageObserver);
    }
    /**
     * Observe images that might be added dynamically to the DOM
     */
    observeDynamicImages(observer) {
        // Create a mutation observer to watch for new images
        const mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node;
                        // Check if it's an image with data-src
                        if (element.tagName === 'IMG' && element.hasAttribute('data-src')) {
                            observer.observe(element);
                        }
                        // Also check child images
                        const images = element.querySelectorAll('img[data-src]');
                        images.forEach(img => observer.observe(img));
                    }
                });
            });
        });
        // Observe changes to the entire document
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
}
//# sourceMappingURL=UIManager.js.map