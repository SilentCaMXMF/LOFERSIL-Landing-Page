/**
 * Theme Manager for LOFERSIL Landing Page
 * Handles theme switching, persistence, and system preference detection
 */

export class ThemeManager {
  private currentTheme: "light" | "dark" = "light";
  private themeToggle: HTMLElement | null = null;
  private readonly THEME_KEY = "lofersil-theme";

  constructor() {
    this.initializeTheme();
    this.setupThemeToggle();
    this.setupSystemPreferenceListener();
  }

  /**
   * Initialize theme based on saved preference or system preference
   */
  private initializeTheme(): void {
    const savedTheme = this.getSavedTheme();
    const systemTheme = this.getSystemTheme();

    // Use saved theme if available, otherwise use system theme
    this.currentTheme = savedTheme || systemTheme;
    this.applyTheme(this.currentTheme);
  }

  /**
   * Get saved theme from localStorage
   */
  private getSavedTheme(): "light" | "dark" | null {
    try {
      const saved = localStorage.getItem(this.THEME_KEY);
      return saved === "dark" || saved === "light" ? saved : null;
    } catch (error) {
      console.warn("Failed to read theme from localStorage:", error);
      return null;
    }
  }

  /**
   * Get system theme preference
   */
  private getSystemTheme(): "light" | "dark" {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: "light" | "dark"): void {
    this.currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "dark" ? "#0f172a" : "#ffffff",
      );
    }

    // Dispatch custom event for other components to react
    window.dispatchEvent(new CustomEvent("themeChange", { detail: { theme } }));
  }

  /**
   * Setup theme toggle button
   */
  private setupThemeToggle(): void {
    this.themeToggle = document.getElementById("theme-toggle");
    if (this.themeToggle) {
      this.themeToggle.addEventListener("click", () => this.toggleTheme());
      this.updateToggleButton();
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";
    this.applyTheme(newTheme);
    this.saveTheme(newTheme);
    this.updateToggleButton();
  }

  /**
   * Save theme preference to localStorage
   */
  private saveTheme(theme: "light" | "dark"): void {
    try {
      localStorage.setItem(this.THEME_KEY, theme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }
  }

  /**
   * Update toggle button appearance
   */
  private updateToggleButton(): void {
    if (this.themeToggle) {
      const sunIcon = this.themeToggle.querySelector(".theme-toggle-icon.sun");
      const moonIcon = this.themeToggle.querySelector(
        ".theme-toggle-icon.moon",
      );

      if (sunIcon && moonIcon) {
        if (this.currentTheme === "dark") {
          sunIcon.setAttribute("aria-hidden", "true");
          moonIcon.setAttribute("aria-hidden", "false");
        } else {
          sunIcon.setAttribute("aria-hidden", "false");
          moonIcon.setAttribute("aria-hidden", "true");
        }
      }

      // Update ARIA label
      this.themeToggle.setAttribute(
        "aria-label",
        `Switch to ${this.currentTheme === "light" ? "dark" : "light"} theme`,
      );
    }
  }

  /**
   * Setup listener for system theme preference changes
   */
  private setupSystemPreferenceListener(): void {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", (e) => {
        // Only update if no saved preference exists
        if (!this.getSavedTheme()) {
          const newTheme = e.matches ? "dark" : "light";
          this.applyTheme(newTheme);
          this.updateToggleButton();
        }
      });
    } else {
      // Fallback for older browsers
      mediaQuery.addListener((e) => {
        if (!this.getSavedTheme()) {
          const newTheme = e.matches ? "dark" : "light";
          this.applyTheme(newTheme);
          this.updateToggleButton();
        }
      });
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): "light" | "dark" {
    return this.currentTheme;
  }

  /**
   * Set theme programmatically
   */
  setTheme(theme: "light" | "dark"): void {
    this.applyTheme(theme);
    this.saveTheme(theme);
    this.updateToggleButton();
  }

  /**
   * Reset to system preference
   */
  resetToSystemPreference(): void {
    try {
      localStorage.removeItem(this.THEME_KEY);
    } catch (error) {
      console.warn("Failed to remove theme from localStorage:", error);
    }

    const systemTheme = this.getSystemTheme();
    this.applyTheme(systemTheme);
    this.updateToggleButton();
  }
}
