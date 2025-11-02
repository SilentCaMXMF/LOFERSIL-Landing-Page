# 12. Refactor Main App Class

meta:
id: refactor-index-js-monolith-12
feature: refactor-index-js-monolith
priority: P2
depends_on: [refactor-index-js-monolith-07, refactor-index-js-monolith-08, refactor-index-js-monolith-09, refactor-index-js-monolith-10, refactor-index-js-monolith-11]
tags: [refactoring, composition, main-class]

objective:

- Refactor the main LOFERSILLandingPage class to use the extracted modules
- Remove all extracted functionality from the main class
- Create a clean composition-based architecture

deliverables:

- Refactored LOFERSILLandingPage class that uses module instances
- Clean separation of concerns with dependency injection
- Simplified main class focused on orchestration

steps:

- Update LOFERSILLandingPage constructor to create module instances
- Remove all methods that were extracted to modules
- Keep only orchestration logic in main class
- Update setupEventListeners to delegate to appropriate modules
- Update initializeApp to initialize all modules
- Ensure proper module communication and data flow
- Remove any remaining global state or tightly coupled code

tests:

- Integration: Application initializes with all modules
- Integration: All functionality works through module interfaces
- Unit: Main class focuses only on orchestration

acceptance_criteria:

- LOFERSILLandingPage class is significantly smaller and focused
- All functionality works through module interfaces
- No direct DOM manipulation in main class (except module initialization)
- Clean dependency injection pattern
- Modules communicate through well-defined interfaces

validation:

- Application loads and functions normally
- All features work (navigation, i18n, routing, performance, SEO)
- No console errors or broken functionality
- Code is more maintainable and testable

notes:

- Main class should act as a composition root
- Consider using a dependency injection container for complex apps
- Keep main class focused on application lifecycle management
