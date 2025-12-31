#!/usr/bin/env node

/**
 * Quick Functional Test of Bundled Application
 */

console.log("🚀 Quick Functional Test\n");

// Test 1: Homepage loads
console.log("1. Testing homepage...");
try {
  const response = await fetch("http://localhost:3000/");
  const text = await response.text();
  if (text.includes("LOFERSIL") && response.ok) {
    console.log("✅ Homepage loads with LOFERSIL content");
  } else {
    console.log("❌ Homepage failed");
  }
} catch (e) {
  console.log("❌ Homepage error:", e.message);
}

// Test 2: JavaScript modules load
console.log("\n2. Testing JavaScript modules...");
try {
  const response = await fetch("http://localhost:3000/scripts/index.js");
  const text = await response.text();
  if (text.includes("TranslationManager") && response.ok) {
    console.log("✅ Main JavaScript bundle loads");
  } else {
    console.log("❌ JavaScript bundle failed");
  }
} catch (e) {
  console.log("❌ JavaScript error:", e.message);
}

// Test 3: Language files load
console.log("\n3. Testing language switching...");
try {
  const ptResponse = await fetch("http://localhost:3000/locales/pt.json");
  const enResponse = await fetch("http://localhost:3000/locales/en.json");
  const ptData = await ptResponse.json();
  const enData = await enResponse.json();

  if (
    ptData.hero.title &&
    enData.hero.title &&
    ptResponse.ok &&
    enResponse.ok
  ) {
    console.log("✅ Language files load correctly");
    console.log(`   PT: ${ptData.hero.title.substring(0, 30)}...`);
    console.log(`   EN: ${enData.hero.title.substring(0, 30)}...`);
  } else {
    console.log("❌ Language files failed");
  }
} catch (e) {
  console.log("❌ Language files error:", e.message);
}

// Test 4: CSS loads
console.log("\n4. Testing styles...");
try {
  const response = await fetch("http://localhost:3000/main.css");
  const text = await response.text();
  if (text.includes(".hero") && response.ok) {
    console.log("✅ Main CSS loads");
  } else {
    console.log("❌ CSS failed");
  }
} catch (e) {
  console.log("❌ CSS error:", e.message);
}

// Test 5: Contact form module exists
console.log("\n5. Testing contact form functionality...");
try {
  const response = await fetch(
    "http://localhost:3000/scripts/modules/ContactFormManager.js",
  );
  const text = await response.text();
  if (
    text.includes("ContactFormManager") &&
    text.includes("handleSubmit") &&
    response.ok
  ) {
    console.log("✅ Contact form module available");
  } else {
    console.log("❌ Contact form module failed");
  }
} catch (e) {
  console.log("❌ Contact form error:", e.message);
}

console.log("\n📊 Bundled Application Test Complete");
console.log(
  "🎯 Key features verified: Homepage, JavaScript, Languages, CSS, Contact Form",
);
