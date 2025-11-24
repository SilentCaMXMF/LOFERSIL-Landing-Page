/**
 * PWA Installation Handler
 * Manages PWA installation prompts and user experience
 */

// Extend Window interface for PWA types
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export class PWAInstaller {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installButton: HTMLElement | null = null;

  constructor() {
    this.initializeInstallPrompt();
    this.createInstallButton();
  }

  private initializeInstallPrompt(): void {
    window.addEventListener("beforeinstallprompt", (event) => {
      // Prevent the default mini-infobar
      event.preventDefault();

      // Store the event for later use
      this.deferredPrompt = event as BeforeInstallPromptEvent;

      // Show custom install button
      this.showInstallButton();
    });

    window.addEventListener("appinstalled", (event) => {
      console.log("[PWA] App was installed");

      // Hide install button
      this.hideInstallButton();

      // Track installation
      this.trackInstallation();
    });
  }

  private createInstallButton(): void {
    this.installButton = document.createElement("button");
    this.installButton.id = "pwa-install-btn";
    this.installButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
      </svg>
      Instalar App
    `;
    this.installButton.className = "pwa-install-button";
    this.installButton.style.display = "none";

    this.installButton.addEventListener("click", () => {
      this.installApp();
    });

    // Add to page header
    const header = document.querySelector("header");
    if (header) {
      header.appendChild(this.installButton);
    }
  }

  private showInstallButton(): void {
    if (this.installButton && !this.isInstalled()) {
      this.installButton.style.display = "flex";

      // Auto-hide after 30 seconds if not clicked
      setTimeout(() => {
        this.hideInstallButton();
      }, 30000);
    }
  }

  private hideInstallButton(): void {
    if (this.installButton) {
      this.installButton.style.display = "none";
    }
  }

  private async installApp(): Promise<void> {
    if (!this.deferredPrompt) return;

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;

    console.log(`[PWA] User ${outcome} the install prompt`);

    // Clear the deferred prompt
    this.deferredPrompt = null;

    // Hide the install button
    this.hideInstallButton();

    // Track the result
    this.trackInstallPromptResult(outcome);
  }

  private isInstalled(): boolean {
    // Check if app is already installed
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    );
  }

  private trackInstallation(): void {
    // Track successful installation
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", "pwa_install", {
        event_category: "engagement",
        event_label: "PWA Installation",
      });
    }
  }

  private trackInstallPromptResult(outcome: "accepted" | "dismissed"): void {
    // Track install prompt result
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", "pwa_install_prompt", {
        event_category: "engagement",
        event_label: outcome,
      });
    }
  }

  /**
   * Check if PWA features are supported
   */
  public static isSupported(): boolean {
    return "serviceWorker" in navigator && "BeforeInstallPromptEvent" in window;
  }

  /**
   * Get PWA installation status
   */
  public getInstallStatus(): "installed" | "installable" | "unsupported" {
    if (this.isInstalled()) {
      return "installed";
    }

    if (PWAInstaller.isSupported() && this.deferredPrompt) {
      return "installable";
    }

    return "unsupported";
  }
}
