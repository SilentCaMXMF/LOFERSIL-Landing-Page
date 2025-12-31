/**
 * LOFERSIL Landing Page - Module Detection
 * Detects ES6 module support and loads appropriate scripts
 */

interface ModuleDetectionResult {
  supportsModules: boolean;
  supportsAsyncModules: boolean;
  browserInfo: {
    userAgent: string;
    ieVersion?: number;
    isLegacy: boolean;
  };
}

class ModuleDetector {
  private static instance: ModuleDetector;
  private detectionResult: ModuleDetectionResult | null = null;

  private constructor() {}

  static getInstance(): ModuleDetector {
    if (!ModuleDetector.instance) {
      ModuleDetector.instance = new ModuleDetector();
    }
    return ModuleDetector.instance;
  }

  /**
   * Detect ES6 module support
   */
  detectModuleSupport(): ModuleDetectionResult {
    if (this.detectionResult) {
      return this.detectionResult;
    }

    const userAgent = navigator.userAgent;
    const isLegacyIE = this.detectLegacyIE(userAgent);
    const isLegacySafari = this.detectLegacySafari(userAgent);
    const isLegacyFirefox = this.detectLegacyFirefox(userAgent);

    const supportsModules = "noModule" in HTMLScriptElement.prototype;
    const supportsAsyncModules = supportsModules && !isLegacyIE;

    const isLegacy = isLegacyIE || isLegacySafari || isLegacyFirefox;

    this.detectionResult = {
      supportsModules,
      supportsAsyncModules,
      browserInfo: {
        userAgent,
        ieVersion: isLegacyIE ? this.getIEVersion(userAgent) : undefined,
        isLegacy,
      },
    };

    return this.detectionResult;
  }

  /**
   * Detect legacy Internet Explorer
   */
  private detectLegacyIE(userAgent: string): boolean {
    const msie = userAgent.indexOf("MSIE ");
    if (msie > 0) {
      return true;
    }

    const trident = userAgent.indexOf("Trident/");
    if (trident > 0) {
      const rv = userAgent.indexOf("rv:");
      return rv > 0;
    }

    return false;
  }

  /**
   * Get IE version
   */
  private getIEVersion(userAgent: string): number {
    const msie = userAgent.indexOf("MSIE ");
    if (msie > 0) {
      return parseInt(
        userAgent.substring(msie + 5, userAgent.indexOf(".", msie)),
        10,
      );
    }

    const trident = userAgent.indexOf("Trident/");
    if (trident > 0) {
      const rv = userAgent.indexOf("rv:");
      return parseInt(
        userAgent.substring(rv + 3, userAgent.indexOf(".", rv)),
        10,
      );
    }

    return 0;
  }

  /**
   * Detect legacy Safari (before 10.1)
   */
  private detectLegacySafari(userAgent: string): boolean {
    const safari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    if (!safari) return false;

    const versionMatch = userAgent.match(/Version\/(\d+)/);
    if (!versionMatch) return false;

    const version = parseInt(versionMatch[1], 10);
    return version < 11; // Safari 10.1 and earlier don't support modules well
  }

  /**
   * Detect legacy Firefox (before 60)
   */
  private detectLegacyFirefox(userAgent: string): boolean {
    const firefox = /Firefox/.test(userAgent);
    if (!firefox) return false;

    const versionMatch = userAgent.match(/Firefox\/(\d+)/);
    if (!versionMatch) return false;

    const version = parseInt(versionMatch[1], 10);
    return version < 60;
  }

  /**
   * Load appropriate scripts based on browser support
   */
  loadAppropriateScripts(): void {
    const detection = this.detectModuleSupport();

    if (detection.supportsModules && !detection.browserInfo.isLegacy) {
      // Modern browser - load ES6 modules
      this.loadModernScripts();
    } else {
      // Legacy browser - load fallback scripts
      this.loadLegacyScripts();
    }
  }

  /**
   * Load modern ES6 module scripts
   */
  private loadModernScripts(): void {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "/scripts/bundle.js";
    document.head.appendChild(script);
  }

  /**
   * Load legacy script bundles
   */
  private loadLegacyScripts(): void {
    const script = document.createElement("script");
    script.src = "/scripts/bundle-legacy.js";
    script.defer = true;
    document.head.appendChild(script);
  }
}

// Export the module detector
export { ModuleDetector };
export type { ModuleDetectionResult };
