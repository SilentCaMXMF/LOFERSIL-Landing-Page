# 08. Extract Navigation Manager

meta:
id: refactor-index-js-monolith-08
feature: refactor-index-js-monolith
priority: P2
depends_on: [refactor-index-js-monolith-03]
tags: [modularization, navigation, ui]

objective:

- Extract navigation functionality into a dedicated NavigationManager module
- Separate mobile menu handling, navigation state, and UI interactions
- Create a clean API for navigation management

deliverables:

- New src/scripts/modules/NavigationManager.ts class
- Methods for mobile menu, navigation state, and event handling
- Integration with main application class

steps:

- Create src/scripts/modules/NavigationManager.ts
- Extract setupNavigation method logic
- Extract toggleMobileMenu method
- Extract handleKeydown method (Escape key handling)
- Extract handleResize method
- Extract handleOutsideClick method
- Extract setActiveNavigation method
- Extract handleMobileMenuState method
- Create proper constructor and DOM element setup
- Update index.ts to use NavigationManager instance

tests:

- Unit: Mobile menu toggles correctly
- Unit: Navigation state updates properly
- Integration: Keyboard and touch interactions work

acceptance_criteria:

- NavigationManager.ts class created with all navigation functionality
- Mobile menu opens/closes correctly
- Navigation highlighting works for current page
- Keyboard accessibility (Escape key) functions
- Touch/click outside closes menu
- Responsive behavior on window resize

validation:

- Mobile menu can be opened and closed
- Navigation links highlight current page
- Menu closes on Escape key press
- Menu closes when clicking outside
- Menu state resets on window resize

notes:

- Keep navigation manager focused on UI interactions
- Handle accessibility concerns (ARIA attributes, keyboard navigation)
- Consider touch gestures for mobile devices
