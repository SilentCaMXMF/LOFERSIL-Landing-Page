/**
 * Background Sync Manager for offline form submissions
 */
export class BackgroundSync {
  private static readonly CONTACT_FORM_TAG = 'contact-form-sync';

  /**
   * Register a contact form for background sync
   */
  public static async registerContactForm(formData: ContactFormData): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Background sync not supported');
    }

    try {
      // Store form data in IndexedDB or Cache API
      await this.storeFormData(formData);

      // Register background sync
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(this.CONTACT_FORM_TAG);

      console.log('[BackgroundSync] Contact form registered for sync');
    } catch (error) {
      console.error('[BackgroundSync] Failed to register form:', error);
      throw error;
    }
  }

  /**
   * Check if background sync is supported
   */
  public static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'sync' in (navigator as any).serviceWorker;
  }

  /**
   * Store form data for later sync
   */
  private static async storeFormData(formData: ContactFormData): Promise<void> {
    const cache = await caches.open('contact-forms');
    const request = new Request('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    await cache.put(request, new Response(JSON.stringify(formData)));
  }

  /**
   * Get pending form submissions count
   */
  public static async getPendingCount(): Promise<number> {
    try {
      const cache = await caches.open('contact-forms');
      const keys = await cache.keys();
      return keys.length;
    } catch {
      return 0;
    }
  }

  /**
   * Clear all pending form submissions
   */
  public static async clearPending(): Promise<void> {
    try {
      await caches.delete('contact-forms');
    } catch (error) {
      console.error('[BackgroundSync] Failed to clear pending forms:', error);
    }
  }
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}
