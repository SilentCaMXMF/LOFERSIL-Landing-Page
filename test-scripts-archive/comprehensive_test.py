#!/usr/bin/env python3
"""
Comprehensive testing script for LOFERSIL landing page
"""

import requests
import os
import json
from urllib.parse import urljoin, quote

BASE_URL = "http://localhost:3000"


def test_image_loading():
    """Test all hero images mentioned in HTML"""
    print("=== TESTING IMAGE LOADING ===")

    # Images from HTML analysis
    images_to_test = [
        "assets/images/Frente%20loja.jpg",
        "assets/images/Interior.jpg",
        "assets/images/Interior%20c%20funcion%C3%A1rio.jpg",
        "assets/images/reborn_doll.jpg",
        "assets/images/Caixas_joias.jpg",
        "assets/images/Canetas_oferta.jpg",
        "assets/images/Dossiers.jpg",
        "assets/images/Mochilas.jpg",
        "assets/images/Tinteiros.jpg",
        "assets/images/dhl-logo.svg",
        "assets/images/logo.svg",
        "assets/images/favicon-48x48-lettuce.svg",
        "assets/images/favicon-16x16-lettuce.png",
        "assets/images/favicon-32x32-lettuce.png",
        "assets/images/facebook-favicon-32x32.png",
    ]

    results = []
    for image in images_to_test:
        try:
            response = requests.get(f"{BASE_URL}/{image}", timeout=5)
            status = (
                "✓ OK" if response.status_code == 200 else f"✗ {response.status_code}"
            )
            size = (
                f"{len(response.content)} bytes"
                if response.status_code == 200
                else "N/A"
            )
            results.append((image, status, size))
        except Exception as e:
            results.append((image, f"✗ ERROR: {str(e)}", "N/A"))

    for image, status, size in results:
        print(f"{status:<12} {size:<15} {image}")

    failed = [r for r in results if "✗" in r[1]]
    print(f"\nImages: {len(results) - len(failed)}/{len(results)} loaded successfully")
    return len(failed) == 0


def test_typescript_modules():
    """Test TypeScript module files"""
    print("\n=== TESTING TYPESCRIPT MODULES ===")

    modules_to_test = [
        "dist/scripts/modules/ContactFormManager.js",
        "dist/scripts/modules/NavigationManager.js",
        "dist/scripts/modules/ThemeManager.js",
        "dist/scripts/modules/TranslationManager.js",
        "dist/scripts/modules/Utils.js",
        "dist/scripts/modules/ErrorManager.js",
        "dist/scripts/modules/ScrollManager.js",
    ]

    results = []
    for module in modules_to_test:
        # Check file exists locally
        local_path = module
        if os.path.exists(local_path):
            size = os.path.getsize(local_path)
            try:
                response = requests.get(f"{BASE_URL}/{module}", timeout=5)
                status = (
                    "✓ OK"
                    if response.status_code == 200
                    else f"✗ {response.status_code}"
                )
                results.append((module, status, f"{size} bytes"))
            except Exception as e:
                results.append((module, f"✗ ERROR: {str(e)}", f"{size} bytes"))
        else:
            results.append((module, "✗ MISSING", "N/A"))

    for module, status, size in results:
        print(f"{status:<12} {size:<15} {module}")

    failed = [r for r in results if "✗" in r[1]]
    print(
        f"\nTypeScript Modules: {len(results) - len(failed)}/{len(results)} accessible"
    )
    return len(failed) == 0


def test_css_compilation():
    """Test CSS compilation and loading"""
    print("\n=== TESTING CSS COMPILATION ===")

    css_files = [
        "src/styles/main.css",
        "src/styles/base.css",
        "src/styles/forms.css",
        "src/styles/hero.css",
        "src/styles/navigation.css",
        "src/styles/sections.css",
        "src/styles/responsive.css",
        "src/styles/privacy.css",
    ]

    results = []
    for css_file in css_files:
        try:
            response = requests.get(f"{BASE_URL}/{css_file}", timeout=5)
            status = (
                "✓ OK" if response.status_code == 200 else f"✗ {response.status_code}"
            )
            size = (
                f"{len(response.content)} bytes"
                if response.status_code == 200
                else "N/A"
            )
            results.append((css_file, status, size))
        except Exception as e:
            results.append((css_file, f"✗ ERROR: {str(e)}", "N/A"))

    for css_file, status, size in results:
        print(f"{status:<12} {size:<15} {css_file}")

    failed = [r for r in results if "✗" in r[1]]
    print(
        f"\nCSS Files: {len(results) - len(failed)}/{len(results)} loaded successfully"
    )
    return len(failed) == 0


def test_locale_files():
    """Test locale files"""
    print("\n=== TESTING LOCALE FILES ===")

    locale_files = ["src/locales/pt.json", "src/locales/en.json"]

    results = []
    for locale_file in locale_files:
        try:
            response = requests.get(f"{BASE_URL}/{locale_file}", timeout=5)
            if response.status_code == 200:
                try:
                    data = response.json()
                    status = "✓ OK (valid JSON)"
                    size = f"{len(response.content)} bytes"
                    results.append((locale_file, status, size))
                except json.JSONDecodeError:
                    status = "✗ INVALID JSON"
                    size = f"{len(response.content)} bytes"
                    results.append((locale_file, status, size))
            else:
                results.append((locale_file, f"✗ {response.status_code}", "N/A"))
        except Exception as e:
            results.append((locale_file, f"✗ ERROR: {str(e)}", "N/A"))

    for locale_file, status, size in results:
        print(f"{status:<20} {size:<15} {locale_file}")

    failed = [r for r in results if "✗" in r[1]]
    print(
        f"\nLocale Files: {len(results) - len(failed)}/{len(results)} loaded successfully"
    )
    return len(failed) == 0


def test_page_loading():
    """Test main page loading and basic content"""
    print("\n=== TESTING PAGE LOADING ===")

    try:
        response = requests.get(BASE_URL, timeout=10)
        if response.status_code == 200:
            content = response.text

            # Check for key elements
            checks = [
                ("LOFERSIL", "Brand name present"),
                ("main.css", "CSS stylesheet referenced"),
                ("ContactFormManager", "Contact form module referenced"),
                ("NavigationManager", "Navigation module referenced"),
                ("ThemeManager", "Theme manager referenced"),
                ("TranslationManager", "Translation manager referenced"),
                ("pt.json", "Portuguese locale referenced"),
                ("en.json", "English locale referenced"),
            ]

            results = []
            for check, description in checks:
                found = check in content
                status = "✓ OK" if found else "✗ MISSING"
                results.append((check, status, description))

            for check, status, description in results:
                print(f"{status:<12} {description:<40} {check}")

            print(f"\nPage Size: {len(content)} bytes")
            return True
        else:
            print(f"✗ Failed to load page: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error loading page: {str(e)}")
        return False


def check_js_syntax():
    """Check JavaScript files for syntax issues"""
    print("\n=== CHECKING JAVASCRIPT SYNTAX ===")

    js_files = [
        "dist/scripts/modules/ContactFormManager.js",
        "dist/scripts/modules/NavigationManager.js",
        "dist/scripts/modules/ThemeManager.js",
        "dist/scripts/modules/TranslationManager.js",
        "dist/scripts/modules/Utils.js",
        "dist/scripts/modules/ErrorManager.js",
        "dist/scripts/modules/ScrollManager.js",
    ]

    # Check for basic syntax patterns that might indicate issues
    issues = []
    for js_file in js_files:
        if os.path.exists(js_file):
            try:
                with open(js_file, "r", encoding="utf-8") as f:
                    content = f.read()

                # Basic syntax checks
                unclosed_braces = content.count("{") - content.count("}")
                unclosed_parens = content.count("(") - content.count(")")

                if unclosed_braces != 0:
                    issues.append(f"{js_file}: Unclosed braces ({unclosed_braces})")
                if unclosed_parens != 0:
                    issues.append(
                        f"{js_file}: Unclosed parentheses ({unclosed_parens})"
                    )

                print(f"✓ CHECKED {js_file} ({len(content)} chars)")
            except Exception as e:
                issues.append(f"{js_file}: Error reading file - {str(e)}")
        else:
            issues.append(f"{js_file}: File not found")

    if issues:
        print("\nSyntax Issues Found:")
        for issue in issues:
            print(f"  ✗ {issue}")
        return False
    else:
        print("✓ No obvious syntax issues detected")
        return True


def main():
    print("LOFERSIL Landing Page - Comprehensive Testing")
    print("=" * 50)

    # Test if server is running
    try:
        response = requests.get(BASE_URL, timeout=5)
        if response.status_code != 200:
            print(f"✗ Server responded with HTTP {response.status_code}")
            return
    except Exception as e:
        print(f"✗ Cannot connect to server at {BASE_URL}: {str(e)}")
        print("Please ensure the server is running on http://localhost:3000")
        return

    print("✓ Server is accessible")

    # Run all tests
    results = []
    results.append(("Images", test_image_loading()))
    results.append(("TypeScript Modules", test_typescript_modules()))
    results.append(("CSS Compilation", test_css_compilation()))
    results.append(("Locale Files", test_locale_files()))
    results.append(("Page Loading", test_page_loading()))
    results.append(("JavaScript Syntax", check_js_syntax()))

    # Summary
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)

    passed = 0
    total = len(results)

    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:<8} {test_name}")
        if result:
            passed += 1

    print(f"\nOverall: {passed}/{total} test categories passed")

    if passed == total:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed - review the details above")


if __name__ == "__main__":
    main()
