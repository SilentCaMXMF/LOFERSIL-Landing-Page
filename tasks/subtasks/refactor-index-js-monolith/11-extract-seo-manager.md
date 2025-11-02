# 11. Extract SEO Manager

meta:
id: refactor-index-js-monolith-11
feature: refactor-index-js-monolith
priority: P2
depends_on: [refactor-index-js-monolith-03]
tags: [modularization, seo, metadata]

objective:

- Extract SEO functionality into a dedicated SEOManager module
- Separate meta tag management, structured data, and SEO enhancements
- Create a clean API for SEO management

deliverables:

- New src/scripts/modules/SEOManager.ts class
- Methods for meta tags, structured data, and SEO updates
- Integration with main application class

steps:

- Create src/scripts/modules/SEOManager.ts
- Extract setupSEO method logic
- Extract updateMetaTags method
- Extract addStructuredData method
- Extract updateMetaTag method
- Extract setupHreflangTags and updateHreflangTags methods
- Extract updateCanonicalLink method
- Create proper constructor and initialization
- Update index.ts to use SEOManager instance

tests:

- Unit: Meta tags update correctly
- Unit: Structured data is generated properly
- Integration: SEO elements update on page changes

acceptance_criteria:

- SEOManager.ts class created with all SEO functionality
- Meta tags update dynamically based on content
- Structured data (JSON-LD) is added to pages
- Hreflang tags are managed for internationalization
- Canonical links are set correctly

validation:

- Meta tags change when navigating between routes
- Structured data appears in page source
- Hreflang tags are present for language variants
- Canonical URLs are correct

notes:

- Keep SEO manager focused on metadata and structured data
- Handle dynamic content updates properly
- Consider SEO best practices for single-page applications
