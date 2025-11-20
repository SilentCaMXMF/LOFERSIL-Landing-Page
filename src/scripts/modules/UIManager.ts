/**
 * UIManager - Handles DOM manipulation, event listeners, and UI interactions
 * Manages UI state, scroll effects, and user interactions
 */

import { ErrorManager } from './ErrorManager.js';
import { validateContactForm, ContactFormValidator } from '../validation.js';
import { envLoader } from './EnvironmentLoader.js';

// API Types
interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

/**
 * UI configuration interface
 */
interface UIConfig {
  scrollThreshold: number;
  contactFormSelector?: string;
}

/**
 * UIManager class for handling UI interactions
 */
export class UIManager {
  private navbar: HTMLElement | null = null;
  private config: UIConfig;
  private errorHandler: ErrorManager;
  private ticking: boolean = false;

  constructor(config: UIConfig, errorHandler: ErrorManager) {
    this.config = config;
    this.errorHandler = errorHandler;
    this.setupDOMElements();
    this.setupScrollEffects();
    this.setupContactForm();
    this.setupServiceWorker();
    this.setupLazyLoading();
  }

  /**
   * Setup DOM element references with error handling
   */
  private setupDOMElements(): void {
    try {
      this.navbar = document.getElementById('navbar') as HTMLElement;
      // Additional critical DOM elements can be added here
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to setup DOM elements', {
        component: 'UIManager',
        operation: 'setupDOMElements',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Setup scroll effects
   */
  private setupScrollEffects(): void {
    const updateScrollEffects = (): void => {
      const scrollY = window.scrollY;

      // Navbar background on scroll
      if (this.navbar) {
        if (scrollY > this.config.scrollThreshold) {
          this.navbar.classList.add('scrolled');
        } else {
          this.navbar.classList.remove('scrolled');
        }
      }

      // Parallax effect for hero section
      const hero = document.getElementById('hero');
      if (hero) {
        const heroImage = hero.querySelector('.hero-img') as HTMLElement;
        if (heroImage) {
          const parallaxOffset = scrollY * 0.5;
          heroImage.style.transform = `translateY(${parallaxOffset}px)`;
        }
      }

      this.ticking = false;
    };

    const requestScrollUpdate = (): void => {
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
  private setupContactForm(): void {
    const contactForm = document.querySelector(
      this.config.contactFormSelector || 'form[action="/api/contact"]'
    ) as HTMLFormElement;
    if (contactForm) {
      contactForm.addEventListener('submit', e => this.handleContactFormSubmit(e));
    }
  }

  /**
   * Handle contact form submission
   */
  private async handleContactFormSubmit(e: Event): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    try {
      // Get form data
      const formData = new FormData(form);
      const contactRequest: ContactRequest = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        message: formData.get('message') as string,
      };

      // Submit form
      const response = await this.submitContact(contactRequest);

      if (response.success) {
        this.errorHandler.showSuccessMessage(
          "Message sent successfully! We'll get back to you soon."
        );
        form.reset();
      } else {
        this.errorHandler.showErrorMessage(
          response.error || 'Failed to send message. Please try again.'
        );
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to submit contact form');
      this.errorHandler.showErrorMessage('Failed to send message. Please try again.');
    }
  }

  /**
   * Submit contact form via API
   */
  private async submitContact(request: ContactRequest): Promise<ApiResponse<{ id: string }>> {
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
      const response = await fetch(envLoader.get('CONTACT_API_ENDPOINT') || '/api/contact', {
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
    } catch (error) {
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
  private setupServiceWorker(): void {
    // Temporarily disabled service worker registration for debugging
    /*
    const IS_DEVELOPMENT =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if ('serviceWorker' in navigator) {
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
    */
  }

  /**
   * Show loading state
   */
  public showLoading(element: HTMLElement, message: string = 'Loading...'): void {
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
        ${window.DOMPurify ? window.DOMPurify.sanitize(message) : message}
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    element.appendChild(loadingOverlay);
  }

  /**
   * Hide loading state
   */
  public hideLoading(element: HTMLElement): void {
    const loadingOverlay = element.querySelector('div[style*="position: absolute"]');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
  }

  /**
   * Toggle element visibility
   */
  public toggleVisibility(element: HTMLElement, show?: boolean): void {
    const willShow = show !== undefined ? show : element.style.display === 'none';
    element.style.display = willShow ? 'block' : 'none';
  }

  /**
   * Smooth scroll to element
   */
  public scrollToElement(selector: string, offset: number = 0): void {
    const element = document.querySelector(selector) as HTMLElement;
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
  public addTemporaryClass(element: HTMLElement, className: string, duration: number = 1000): void {
    element.classList.add(className);
    setTimeout(() => {
      element.classList.remove(className);
    }, duration);
  }

  /**
   * Animate element
   */
  public animateElement(
    element: HTMLElement,
    animation: string,
    duration: number = 300
  ): Promise<void> {
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
  private setupLazyLoading(): void {
    // Check if browser supports Intersection Observer
    if (!('IntersectionObserver' in window)) {
      console.warn('Intersection Observer not supported, falling back to native lazy loading');
      return;
    }

    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;

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
      },
      {
        // Start loading when image is 50px from viewport
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

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
  private observeDynamicImages(observer: IntersectionObserver): void {
    // Create a mutation observer to watch for new images
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Check if it's an image with data-src
            if (element.tagName === 'IMG' && element.hasAttribute('data-src')) {
              observer.observe(element as HTMLImageElement);
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
