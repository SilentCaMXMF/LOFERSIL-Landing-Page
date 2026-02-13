/**
 * Translation Manager for LOFERSIL Landing Page
 * Handles loading and applying translations for multiple languages
 */
export class TranslationManager {
    constructor(errorHandler) {
        this.defaultLanguage = "pt";
        this.supportedLanguages = ["pt", "en"];
        this.isInitialized = false;
        this.isSwitchingLanguage = false;
        this.translations = {};
        this.currentLanguage = this.detectLanguage();
        this.errorHandler = errorHandler;
    }
    /**
     * Detect the user's preferred language
     */
    detectLanguage() {
        // Check localStorage first
        const stored = localStorage.getItem("language");
        if (stored && this.supportedLanguages.includes(stored)) {
            return stored;
        }
        // Check browser language
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith("pt")) {
            return "pt";
        }
        else if (browserLang.startsWith("en")) {
            return "en";
        }
        // Default to Portuguese
        return this.defaultLanguage;
    }
    /**
     * Initialize the translation system
     */
    async initialize() {
        if (this.isInitialized) {
            return; // Prevent multiple initializations
        }
        await this.loadTranslations();
        this.applyTranslations();
        this.updateMetaTagsForLanguage();
        this.setupHreflangTags();
        this.updateHtmlLangAttribute();
        this.isInitialized = true;
    }
    /**
     * Load translations for all supported languages
     */
    async loadTranslations() {
        console.log(`Loading translations for languages: ${this.supportedLanguages.join(", ")}`);
        try {
            const promises = this.supportedLanguages.map(async (lang) => {
                const response = await fetch(`/locales/${lang}.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load ${lang} translations: ${response.status} ${response.statusText}`);
                }
                return { lang, data: await response.json() };
            });
            const results = await Promise.all(promises);
            this.translations = results.reduce((acc, { lang, data }) => {
                acc[lang] = data;
                return acc;
            }, {});
            console.log(`Translations loaded for:`, Object.keys(this.translations));
        }
        catch (error) {
            console.error("Failed to load translations:", error);
            // Fallback to empty translations if loading fails
            this.translations = {};
        }
    }
    /**
     * Apply translations to DOM elements
     */
    applyTranslations() {
        const elements = document.querySelectorAll("[data-translate]");
        console.log(`Applying ${this.currentLanguage} translations: Found ${elements.length} elements`);
        const currentTranslations = this.translations[this.currentLanguage];
        if (!currentTranslations) {
            console.warn(`No translations available for language: ${this.currentLanguage}`);
            return;
        }
        elements.forEach((element) => {
            const key = element.getAttribute("data-translate");
            if (key) {
                const translation = this.getNestedTranslation(currentTranslations, key);
                if (translation && element instanceof HTMLElement) {
                    // Handle different element types
                    if (element.tagName === "META") {
                        element.setAttribute("content", translation);
                    }
                    else if (element.tagName === "TITLE") {
                        element.textContent = translation;
                    }
                    else {
                        element.textContent = translation;
                    }
                }
            }
        });
        console.log(`${this.currentLanguage} translations applied`);
    }
    /**
     * Get nested translation value
     */
    getNestedTranslation(obj, path) {
        return path.split(".").reduce((current, key) => {
            return current && typeof current === "object" ? current[key] : "";
        }, obj);
    }
    /**
     * Update meta tags for current language
     */
    updateMetaTagsForLanguage() {
        const currentTranslations = this.translations[this.currentLanguage];
        if (!currentTranslations)
            return;
        const metaKeys = [
            "title",
            "description",
            "ogTitle",
            "ogDescription",
            "twitterTitle",
            "twitterDescription",
        ];
        metaKeys.forEach((key) => {
            const translation = this.getNestedTranslation(currentTranslations, `meta.${key}`);
            if (translation) {
                switch (key) {
                    case "title":
                        document.title = translation;
                        break;
                    case "description":
                        this.updateMetaTag("description", translation);
                        break;
                    case "ogTitle":
                        this.updateMetaTag("og:title", translation);
                        break;
                    case "ogDescription":
                        this.updateMetaTag("og:description", translation);
                        break;
                    case "twitterTitle":
                        this.updateMetaTag("twitter:title", translation);
                        break;
                    case "twitterDescription":
                        this.updateMetaTag("twitter:description", translation);
                        break;
                }
            }
        });
    }
    /**
     * Update a specific meta tag
     */
    updateMetaTag(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`) ||
            document.querySelector(`meta[property="${name}"]`);
        if (meta) {
            meta.setAttribute("content", content);
        }
    }
    /**
     * Setup hreflang tags for all supported languages
     */
    setupHreflangTags() {
        // Remove existing hreflang tags
        const existingTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
        existingTags.forEach((tag) => tag.remove());
        // Add hreflang tags for each supported language
        const baseUrl = window.location.origin;
        this.addHreflangTag("pt-PT", `${baseUrl}/`);
        this.addHreflangTag("en-US", `${baseUrl}/`);
        // Default language
        this.addHreflangTag("x-default", `${baseUrl}/`);
    }
    /**
     * Add a single hreflang tag
     */
    addHreflangTag(hreflang, url) {
        const link = document.createElement("link");
        link.rel = "alternate";
        link.hreflang = hreflang;
        link.href = url;
        document.head.appendChild(link);
    }
    /**
     * Update the HTML lang attribute
     */
    updateHtmlLangAttribute() {
        document.documentElement.lang =
            this.currentLanguage === "pt" ? "pt-PT" : "en-US";
    }
    /**
     * Update canonical link for SEO
     */
    updateCanonicalLink() {
        let canonical = document.querySelector('link[rel="canonical"]');
        const baseUrl = window.location.origin;
        if (!canonical) {
            canonical = document.createElement("link");
            canonical.rel = "canonical";
            document.head.appendChild(canonical);
        }
        // Set canonical URL for Portuguese
        canonical.href = `${baseUrl}${window.location.pathname}`;
    }
    /**
     * Switch to a different language
     */
    switchLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.warn(`Unsupported language: ${lang}`);
            return;
        }
        if (this.isSwitchingLanguage) {
            return; // Prevent rapid switching
        }
        this.isSwitchingLanguage = true;
        this.currentLanguage = lang;
        localStorage.setItem("language", lang);
        this.applyTranslations();
        this.updateMetaTagsForLanguage();
        this.updateHtmlLangAttribute();
        console.log(`Switched to language: ${lang}`);
        // Reset the flag after a short delay to allow subsequent switches
        setTimeout(() => {
            this.isSwitchingLanguage = false;
        }, 100);
    }
    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    /**
     * Get current translations (for debugging/testing)
     */
    getTranslations() {
        return this.translations[this.currentLanguage] || {};
    }
}
//# sourceMappingURL=TranslationManager.js.map