/**
 * Background Sync Manager for PWA offline form submissions
 *
 * Provides comprehensive background sync functionality for contact forms
 * when the user is offline, with proper error handling and integration
 * with the existing ErrorManager and logging infrastructure.
 */

import { envLoader } from "./EnvironmentLoader.js";
import { ErrorManager } from "./ErrorManager.js";
import type { ContactRequest } from "../types.js";

/**
 * Background sync configuration interface
 */
interface BackgroundSyncConfig {
  maxRetries: number;
  retryDelay: number;
  storageQuota: number; // Maximum storage quota in bytes
  enableLogging: boolean;
}

/**
 * Stored form data with metadata
 */
interface StoredFormData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  timestamp: number;
  retryCount: number;
  lastAttempt: number;
}

/**
 * Background sync status information
 */
interface SyncStatus {
  isSupported: boolean;
  isRegistered: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  storageUsed: number;
  storageQuota: number;
}

/**
 * Background Sync Manager
 *
 * Handles offline form submissions using the Background Sync API
 * with fallback to IndexedDB for broader browser support.
 */
export class BackgroundSync {
  private static readonly CONTACT_FORM_TAG = "contact-form-sync";
  private static readonly STORAGE_KEY = "background_sync_forms";
  private static readonly MAX_STORAGE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  private static config: BackgroundSyncConfig = {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    storageQuota: 5 * 1024 * 1024, // 5MB
    enableLogging: true,
  };

  private static errorManager: ErrorManager = new ErrorManager({
    showUserMessages: false,
    logToConsole: true,
    monitoring: {
      enabled: true,
      enableConsoleLogging: true,
      metricsRetentionHours: 24,
      alertConfigs: [],
      logLevel: "info",
      enableFileLogging: false,
    },
  });

  /**
   * Initialize the background sync system
   */
  public static async initialize(): Promise<void> {
    try {
      if (!this.isSupported()) {
        this.log("Background sync not supported in this browser", "warn");
        return;
      }

      // Clean up old stored forms
      await this.cleanupOldForms();

      // Register for sync events if service worker is ready
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;

        // Set up message listener for service worker communication
        navigator.serviceWorker.addEventListener(
          "message",
          this.handleServiceWorkerMessage.bind(this),
        );

        this.log("Background sync initialized successfully", "info");
      }
    } catch (error) {
      this.errorManager.handleError(
        error,
        "BackgroundSync initialization failed",
        {
          component: "BackgroundSync",
          operation: "initialize",
          timestamp: new Date(),
        },
      );
    }
  }

  /**
   * Register a contact form for background sync
   */
  public static async registerContactForm(
    formData: ContactRequest,
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Background sync not supported");
    }

    try {
      // Store form data with metadata
      const storedData: StoredFormData = {
        ...formData,
        id: this.generateFormId(),
        timestamp: Date.now(),
        retryCount: 0,
        lastAttempt: 0,
      };

      await this.storeFormData(storedData);

      // Register background sync if service worker is available
      if (
        "serviceWorker" in navigator &&
        "sync" in (navigator as any).serviceWorker
      ) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register(this.CONTACT_FORM_TAG);
        this.log("Background sync registered for contact form", "info");
      } else {
        // Fallback: set up periodic sync attempt
        this.setupFallbackSync();
        this.log("Using fallback sync mechanism", "warn");
      }

      // Record metrics
      this.errorManager
        .getMetricsCollector()
        .incrementCounter("background_sync_registered", {
          formType: "contact",
        });
    } catch (error) {
      this.errorManager.handleError(
        error,
        "Failed to register contact form for background sync",
        {
          component: "BackgroundSync",
          operation: "registerContactForm",
          timestamp: new Date(),
          metadata: {
            formData: { name: formData.name, email: formData.email },
          },
        },
      );
      throw error;
    }
  }

  /**
   * Check if background sync is supported
   */
  public static isSupported(): boolean {
    return (
      "serviceWorker" in navigator &&
      ("sync" in (navigator as any).serviceWorker || "indexedDB" in window)
    );
  }

  /**
   * Get current sync status
   */
  public static async getSyncStatus(): Promise<SyncStatus> {
    const pendingCount = await this.getPendingCount();
    const storageUsed = await this.getStorageUsed();

    return {
      isSupported: this.isSupported(),
      isRegistered: await this.isSyncRegistered(),
      pendingCount,
      lastSyncTime: await this.getLastSyncTime(),
      storageUsed,
      storageQuota: this.config.storageQuota,
    };
  }

  /**
   * Get pending form submissions count
   */
  public static async getPendingCount(): Promise<number> {
    try {
      const storedForms = await this.getStoredForms();
      return storedForms.length;
    } catch {
      return 0;
    }
  }

  /**
   * Get all pending form submissions
   */
  public static async getPendingForms(): Promise<StoredFormData[]> {
    try {
      return await this.getStoredForms();
    } catch (error) {
      this.errorManager.handleError(error, "Failed to get pending forms", {
        component: "BackgroundSync",
        operation: "getPendingForms",
        timestamp: new Date(),
      });
      return [];
    }
  }

  /**
   * Manually trigger sync for pending forms
   */
  public static async triggerSync(): Promise<void> {
    if (!navigator.onLine) {
      this.log("Cannot sync while offline", "warn");
      return;
    }

    try {
      const pendingForms = await this.getPendingForms();
      let successCount = 0;
      let failureCount = 0;

      for (const form of pendingForms) {
        try {
          const success = await this.submitForm(form);
          if (success) {
            await this.removeStoredForm(form.id);
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          failureCount++;
          this.errorManager.handleError(
            error,
            "Failed to sync individual form",
            {
              component: "BackgroundSync",
              operation: "triggerSync",
              timestamp: new Date(),
              metadata: { formId: form.id },
            },
          );
        }
      }

      // Record metrics
      this.errorManager
        .getMetricsCollector()
        .incrementCounter("background_sync_manual", {
          success: successCount.toString(),
          failure: failureCount.toString(),
        });

      this.log(
        `Manual sync completed: ${successCount} success, ${failureCount} failures`,
        "info",
      );
    } catch (error) {
      this.errorManager.handleError(error, "Manual sync failed", {
        component: "BackgroundSync",
        operation: "triggerSync",
        timestamp: new Date(),
      });
    }
  }

  /**
   * Clear all pending form submissions
   */
  public static async clearPending(): Promise<void> {
    try {
      await this.clearStoredForms();
      this.log("All pending forms cleared", "info");

      // Record metrics
      this.errorManager
        .getMetricsCollector()
        .incrementCounter("background_sync_cleared");
    } catch (error) {
      this.errorManager.handleError(error, "Failed to clear pending forms", {
        component: "BackgroundSync",
        operation: "clearPending",
        timestamp: new Date(),
      });
    }
  }

  /**
   * Update configuration
   */
  public static updateConfig(newConfig: Partial<BackgroundSyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log("Background sync configuration updated", "info");
  }

  /**
   * Store form data for later sync
   */
  private static async storeFormData(formData: StoredFormData): Promise<void> {
    try {
      const storedForms = await this.getStoredForms();

      // Check storage quota
      const currentSize = await this.getStorageUsed();
      const newSize = currentSize + JSON.stringify(formData).length;

      if (newSize > this.config.storageQuota) {
        // Remove oldest forms to make space
        await this.cleanupOldForms();
      }

      storedForms.push(formData);
      await this.saveStoredForms(storedForms);

      this.log(`Form data stored for background sync: ${formData.id}`, "info");
    } catch (error) {
      this.errorManager.handleError(error, "Failed to store form data", {
        component: "BackgroundSync",
        operation: "storeFormData",
        timestamp: new Date(),
        metadata: { formId: formData.id },
      });
      throw error;
    }
  }

  /**
   * Submit a form to the server
   */
  private static async submitForm(formData: StoredFormData): Promise<boolean> {
    try {
      const endpoint = envLoader.get("CONTACT_API_ENDPOINT") || "/api/contact";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Background-Sync": "true",
          "X-Form-ID": formData.id,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          phone: formData.phone,
        }),
      });

      if (response.ok) {
        this.log(`Form successfully submitted: ${formData.id}`, "info");
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.log(`Failed to submit form ${formData.id}: ${error}`, "error");

      // Update retry count
      formData.retryCount++;
      formData.lastAttempt = Date.now();

      if (formData.retryCount < this.config.maxRetries) {
        await this.updateStoredForm(formData);
        return false;
      } else {
        // Max retries reached, remove the form
        await this.removeStoredForm(formData.id);
        this.log(`Form ${formData.id} removed after max retries`, "warn");
        return false;
      }
    }
  }

  /**
   * Get stored forms from IndexedDB or localStorage
   */
  private static async getStoredForms(): Promise<StoredFormData[]> {
    try {
      if ("indexedDB" in window) {
        return await this.getFromIndexedDB();
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      }
    } catch {
      return [];
    }
  }

  /**
   * Save stored forms to IndexedDB or localStorage
   */
  private static async saveStoredForms(forms: StoredFormData[]): Promise<void> {
    try {
      if ("indexedDB" in window) {
        await this.saveToIndexedDB(forms);
      } else {
        // Fallback to localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(forms));
      }
    } catch (error) {
      this.errorManager.handleError(error, "Failed to save stored forms", {
        component: "BackgroundSync",
        operation: "saveStoredForms",
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get forms from IndexedDB
   */
  private static async getFromIndexedDB(): Promise<StoredFormData[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("BackgroundSyncDB", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["forms"], "readonly");
        const store = transaction.objectStore("forms");
        const getRequest = store.getAll();

        getRequest.onerror = () => reject(getRequest.error);
        getRequest.onsuccess = () => resolve(getRequest.result || []);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("forms")) {
          db.createObjectStore("forms", { keyPath: "id" });
        }
      };
    });
  }

  /**
   * Save forms to IndexedDB
   */
  private static async saveToIndexedDB(forms: StoredFormData[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("BackgroundSyncDB", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["forms"], "readwrite");
        const store = transaction.objectStore("forms");

        // Clear existing forms
        store.clear();

        // Add all forms
        forms.forEach((form) => store.add(form));

        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
      };
    });
  }

  /**
   * Remove a specific stored form
   */
  private static async removeStoredForm(formId: string): Promise<void> {
    try {
      const forms = await this.getStoredForms();
      const filteredForms = forms.filter((form) => form.id !== formId);
      await this.saveStoredForms(filteredForms);
    } catch (error) {
      this.errorManager.handleError(error, "Failed to remove stored form", {
        component: "BackgroundSync",
        operation: "removeStoredForm",
        timestamp: new Date(),
        metadata: { formId },
      });
    }
  }

  /**
   * Update a specific stored form
   */
  private static async updateStoredForm(
    formData: StoredFormData,
  ): Promise<void> {
    try {
      const forms = await this.getStoredForms();
      const index = forms.findIndex((form) => form.id === formData.id);
      if (index !== -1) {
        forms[index] = formData;
        await this.saveStoredForms(forms);
      }
    } catch (error) {
      this.errorManager.handleError(error, "Failed to update stored form", {
        component: "BackgroundSync",
        operation: "updateStoredForm",
        timestamp: new Date(),
        metadata: { formId: formData.id },
      });
    }
  }

  /**
   * Clear all stored forms
   */
  private static async clearStoredForms(): Promise<void> {
    try {
      if ("indexedDB" in window) {
        const request = indexedDB.open("BackgroundSyncDB", 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(["forms"], "readwrite");
          const store = transaction.objectStore("forms");
          store.clear();
        };
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      this.errorManager.handleError(error, "Failed to clear stored forms", {
        component: "BackgroundSync",
        operation: "clearStoredForms",
        timestamp: new Date(),
      });
    }
  }

  /**
   * Clean up old forms
   */
  private static async cleanupOldForms(): Promise<void> {
    try {
      const forms = await this.getStoredForms();
      const now = Date.now();
      const filteredForms = forms.filter(
        (form) =>
          now - form.timestamp < this.MAX_STORAGE_AGE &&
          form.retryCount < this.config.maxRetries,
      );

      if (filteredForms.length !== forms.length) {
        await this.saveStoredForms(filteredForms);
        this.log(
          `Cleaned up ${forms.length - filteredForms.length} old forms`,
          "info",
        );
      }
    } catch (error) {
      this.errorManager.handleError(error, "Failed to cleanup old forms", {
        component: "BackgroundSync",
        operation: "cleanupOldForms",
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get storage usage
   */
  private static async getStorageUsed(): Promise<number> {
    try {
      const forms = await this.getStoredForms();
      return JSON.stringify(forms).length;
    } catch {
      return 0;
    }
  }

  /**
   * Check if sync is registered
   */
  private static async isSyncRegistered(): Promise<boolean> {
    try {
      if (
        !("serviceWorker" in navigator) ||
        !("sync" in (navigator as any).serviceWorker)
      ) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const tags = await (registration as any).sync.getTags();
      return tags.includes(this.CONTACT_FORM_TAG);
    } catch {
      return false;
    }
  }

  /**
   * Get last sync time
   */
  private static async getLastSyncTime(): Promise<number | null> {
    try {
      const lastSync = localStorage.getItem("background_sync_last_sync");
      return lastSync ? parseInt(lastSync, 10) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set up fallback sync mechanism
   */
  private static setupFallbackSync(): void {
    // Set up periodic sync attempts when online
    const syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        await this.triggerSync();
      }
    }, 30000); // Try every 30 seconds

    // Clear interval when page is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearInterval(syncInterval);
      }
    });
  }

  /**
   * Handle messages from service worker
   */
  private static handleServiceWorkerMessage(event: MessageEvent): void {
    if (event.data && event.data.type === "BACKGROUND_SYNC_COMPLETE") {
      localStorage.setItem("background_sync_last_sync", Date.now().toString());
      this.log("Background sync completed via service worker", "info");
    }
  }

  /**
   * Generate unique form ID
   */
  private static generateFormId(): string {
    return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log messages with consistent formatting
   */
  private static log(
    message: string,
    level: "info" | "warn" | "error" = "info",
  ): void {
    if (!this.config.enableLogging) return;

    const timestamp = new Date().toISOString();
    const prefix = `[BackgroundSync ${timestamp}]`;

    switch (level) {
      case "info":
        console.log(`${prefix} ${message}`);
        break;
      case "warn":
        console.warn(`${prefix} ${message}`);
        break;
      case "error":
        console.error(`${prefix} ${message}`);
        break;
    }
  }
}
