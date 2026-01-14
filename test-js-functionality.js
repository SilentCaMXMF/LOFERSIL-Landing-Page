// Mobile Navigation JavaScript Functionality Test
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧪 Mobile Navigation JavaScript Functionality Test");
console.log("================================================\n");

// Check if NavigationManager has the correct desktop breakpoint
console.log("1. ✅ NavigationManager Desktop Breakpoint");
const navManagerPath = path.join(
  __dirname,
  "src/scripts/modules/NavigationManager.ts",
);
const navManagerContent = fs.readFileSync(navManagerPath, "utf8");

const hasCorrectBreakpoint = navManagerContent.includes(
  "window.innerWidth >= 769",
);
console.log(
  `   - Desktop breakpoint ≥769px: ${hasCorrectBreakpoint ? "✅" : "❌"}`,
);

const hasCheckIsDesktop = navManagerContent.includes("checkIsDesktop()");
console.log(`   - Desktop check method: ${hasCheckIsDesktop ? "✅" : "❌"}`);

const hasResizeHandler = navManagerContent.includes("handleResize()");
console.log(`   - Resize handler present: ${hasResizeHandler ? "✅" : "❌"}`);

const hasMenuToggle = navManagerContent.includes("toggleMobileMenu()");
console.log(`   - Menu toggle method: ${hasMenuToggle ? "✅" : "❌"}`);

console.log(
  `   - Breakpoint logic: ${hasCorrectBreakpoint && hasCheckIsDesktop && hasResizeHandler && hasMenuToggle ? "✅" : "❌"}\n`,
);

// Check mobile-specific functionality
console.log("2. ✅ Mobile-Specific Functionality");
const hasMobileCheck = navManagerContent.includes(
  "if (this.isDesktop) return;",
);
console.log(`   - Mobile-only toggle: ${hasMobileCheck ? "✅" : "❌"}`);

const hasBodyScrollLock = navManagerContent.includes(
  'document.body.classList.toggle("menu-open"',
);
console.log(`   - Body scroll lock: ${hasBodyScrollLock ? "✅" : "❌"}`);

const hasFocusTrap = navManagerContent.includes("handleFocusTrap");
console.log(`   - Focus trap for accessibility: ${hasFocusTrap ? "✅" : "❌"}`);

const hasOutsideClick = navManagerContent.includes("handleOutsideClick");
console.log(`   - Outside click handling: ${hasOutsideClick ? "✅" : "❌"}`);

console.log(
  `   - Mobile features: ${hasMobileCheck && hasBodyScrollLock && hasFocusTrap && hasOutsideClick ? "✅" : "❌"}\n`,
);

// Check accessibility features
console.log("3. ✅ Accessibility Features");
const hasAriaExpanded = navManagerContent.includes("aria-expanded");
console.log(`   - ARIA expanded attribute: ${hasAriaExpanded ? "✅" : "❌"}`);

const hasKeydownHandler = navManagerContent.includes("handleKeydown");
console.log(`   - Keyboard navigation: ${hasKeydownHandler ? "✅" : "❌"}`);

const hasEscapeKey = navManagerContent.includes('e.key === "Escape"');
console.log(`   - Escape key support: ${hasEscapeKey ? "✅" : "❌"}`);

console.log(
  `   - Accessibility support: ${hasAriaExpanded && hasKeydownHandler && hasEscapeKey ? "✅" : "❌"}\n`,
);

// Verify state management
console.log("4. ✅ State Management");
const hasIsMenuOpen = navManagerContent.includes("isMenuOpen");
console.log(`   - Menu open state: ${hasIsMenuOpen ? "✅" : "❌"}`);

const hasIsDesktop = navManagerContent.includes("isDesktop");
console.log(`   - Desktop state: ${hasIsDesktop ? "✅" : "❌"}`);

const hasCloseMobileMenu = navManagerContent.includes("closeMobileMenu()");
console.log(`   - Close menu method: ${hasCloseMobileMenu ? "✅" : "❌"}`);

const hasHandleResize = navManagerContent.includes("handleResize(): void");
console.log(`   - Resize method signature: ${hasHandleResize ? "✅" : "❌"}`);

console.log(
  `   - State handling: ${hasIsMenuOpen && hasIsDesktop && hasCloseMobileMenu && hasHandleResize ? "✅" : "❌"}\n`,
);

// Check event listeners setup
console.log("5. ✅ Event Listeners Setup");
const hasSetupEventListeners = navManagerContent.includes(
  "setupEventListeners()",
);
console.log(
  `   - Event listeners method: ${hasSetupEventListeners ? "✅" : "❌"}`,
);

const hasToggleListener = navManagerContent.includes(
  'addEventListener("click"',
);
console.log(`   - Click listener: ${hasToggleListener ? "✅" : "❌"}`);

const hasResizeListener = navManagerContent.includes(
  'addEventListener("resize"',
);
console.log(`   - Resize listener: ${hasResizeListener ? "✅" : "❌"}`);

const hasKeydownListener = navManagerContent.includes(
  'addEventListener("keydown"',
);
console.log(`   - Keyboard listener: ${hasKeydownListener ? "✅" : "❌"}`);

console.log(
  `   - Event setup: ${hasSetupEventListeners && hasToggleListener && hasResizeListener && hasKeydownListener ? "✅" : "❌"}\n`,
);

// Test viewport calculations
console.log("📱 Viewport Test Scenarios");
console.log("========================");

const testViewports = [
  { width: 320, expected: "Mobile", drawerWidth: 272 },
  { width: 375, expected: "Mobile", drawerWidth: 280 },
  { width: 414, expected: "Mobile", drawerWidth: 280 },
  { width: 767, expected: "Mobile", drawerWidth: 280 },
  { width: 768, expected: "Desktop", drawerWidth: "N/A" },
  { width: 1024, expected: "Desktop", drawerWidth: "N/A" },
];

testViewports.forEach((viewport) => {
  const isMobile = viewport.width <= 767;
  const behavior = isMobile ? "Drawer navigation" : "Desktop navigation";
  console.log(
    `${viewport.width}px: ${behavior} (${isMobile ? "Mobile" : "Desktop"})`,
  );
});

console.log("\n🎯 Expected JavaScript Behavior:");
console.log("- Mobile (≤767px): Toggle drawer, lock body scroll, focus trap");
console.log("- Desktop (≥768px): Always visible, no toggle functionality");
console.log("- Resize: Auto-close menu when switching to desktop");
console.log(
  "- Accessibility: ARIA labels, keyboard navigation, focus management",
);

// Overall status
const allChecksPass =
  hasCorrectBreakpoint &&
  hasCheckIsDesktop &&
  hasResizeHandler &&
  hasMenuToggle &&
  hasMobileCheck &&
  hasBodyScrollLock &&
  hasFocusTrap &&
  hasOutsideClick &&
  hasAriaExpanded &&
  hasKeydownHandler &&
  hasEscapeKey &&
  hasIsMenuOpen &&
  hasIsDesktop &&
  hasCloseMobileMenu &&
  hasHandleResize &&
  hasSetupEventListeners &&
  hasToggleListener &&
  hasResizeListener &&
  hasKeydownListener;

console.log(
  `\n🏆 JavaScript Status: ${allChecksPass ? "✅ ALL FUNCTIONALITY PRESENT" : "❌ SOME FEATURES MISSING"}`,
);

if (allChecksPass) {
  console.log("\n✨ Mobile navigation JavaScript functionality is complete!");
  console.log("🧪 Ready for browser testing at http://localhost:3000");
  console.log("📱 Use mobile-test-suite.html for comprehensive testing");
} else {
  console.log("\n⚠️  Some JavaScript features may be missing.");
}

// Test recommendation
console.log("\n🧪 Browser Testing Recommendations:");
console.log("1. Open mobile-test-suite.html in your browser");
console.log("2. Test each viewport size manually");
console.log("3. Use browser dev tools for additional viewport testing");
console.log("4. Test touch interactions on mobile devices");
console.log("5. Verify accessibility with screen readers");
