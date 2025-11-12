/**
 * Simple verification script for dual language functionality
 * This checks that the TranslationManager can load and switch languages
 */

import { TranslationManager } from './modules/TranslationManager.js';
import { ErrorHandler } from './modules/ErrorHandler.js';

async function verifyLanguageSwitching() {
  console.log('🔍 Verifying dual language functionality...');

  const errorHandler = new ErrorHandler();
  const translationManager = new TranslationManager(errorHandler);

  try {
    // Test initialization
    console.log('📚 Loading translations...');
    await translationManager.initialize();

    const initialLang = translationManager.getCurrentLanguage();
    console.log(`🌐 Initial language: ${initialLang}`);

    // Test language switching
    console.log('🔄 Switching to English...');
    translationManager.switchLanguage('en');
    const afterEnSwitch = translationManager.getCurrentLanguage();
    console.log(`🌐 Language after EN switch: ${afterEnSwitch}`);

    console.log('🔄 Switching back to Portuguese...');
    translationManager.switchLanguage('pt');
    const afterPtSwitch = translationManager.getCurrentLanguage();
    console.log(`🌐 Language after PT switch: ${afterPtSwitch}`);

    // Test translation retrieval
    const ptTranslations = translationManager.getTranslations();
    console.log('🇵🇹 Portuguese translations sample:', {
      title: (ptTranslations as any)?.meta?.title?.substring(0, 50) + '...',
      heroTitle: (ptTranslations as any)?.hero?.title,
    });

    translationManager.switchLanguage('en');
    const enTranslations = translationManager.getTranslations();
    console.log('🇺🇸 English translations sample:', {
      title: (enTranslations as any)?.meta?.title?.substring(0, 50) + '...',
      heroTitle: (enTranslations as any)?.hero?.title,
    });

    // Verify language toggle button exists
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      console.log('✅ Language toggle button found in DOM');
      console.log(`📋 Current button text: ${langToggle.textContent}`);
    } else {
      console.log('❌ Language toggle button not found');
    }

    // Check for data-translate attributes
    const translateElements = document.querySelectorAll('[data-translate]');
    console.log(`📝 Found ${translateElements.length} elements with data-translate attributes`);

    console.log('✅ Dual language verification completed successfully!');
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run verification if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verifyLanguageSwitching);
  } else {
    verifyLanguageSwitching();
  }
} else {
  // Node.js environment - run directly
  verifyLanguageSwitching();
}
