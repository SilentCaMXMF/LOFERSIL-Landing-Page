/**
 * PWA Update Manager
 * Handles service worker updates gracefully
 */
export class PWAUpdater {
  private updateAvailable: boolean = false;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializeUpdateHandling();
  }

  private initializeUpdateHandling(): void {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        this.registration = registration;

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                this.showUpdateNotification();
              }
            });
          }
        });
      });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  }

  private showUpdateNotification(): void {
    this.updateAvailable = true;

    // Create update banner
    const banner = document.createElement("div") as unknown as HTMLDivElement;
    banner.id = "pwa-update-banner";
    banner.innerHTML = `
      <div class="update-banner-content">
        <span>Nova versão disponível!</span>
        <button id="update-btn">Atualizar</button>
        <button id="dismiss-btn">Depois</button>
      </div>
    `;

    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #2563eb;
      color: white;
      padding: 0.5rem;
      text-align: center;
      z-index: 1000;
      font-family: 'Inter', sans-serif;
    `;

    document.body.appendChild(banner as unknown as Node);

    // Handle update button
    document.getElementById("update-btn")?.addEventListener("click", () => {
      this.applyUpdate();
    });

    // Handle dismiss button
    document.getElementById("dismiss-btn")?.addEventListener("click", () => {
      this.dismissUpdate();
    });
  }

  private applyUpdate(): void {
    if (this.registration && this.registration.waiting) {
      // Tell the new SW to skip waiting
      this.registration.waiting.postMessage({ action: "skipWaiting" });
    }
  }

  private dismissUpdate(): void {
    const banner = document.getElementById("pwa-update-banner");
    if (banner) {
      banner.remove();
    }
    this.updateAvailable = false;
  }

  /**
   * Check for updates manually
   */
  public async checkForUpdates(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  /**
   * Get update availability status
   */
  public isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }
}
