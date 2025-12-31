#!/usr/bin/env python3
"""
Final comprehensive testing and validation report for LOFERSIL landing page
"""

import requests
import json
from urllib.parse import urljoin

BASE_URL = "http://localhost:3000"


def test_asset_loading():
    """Test critical assets and report detailed findings"""
    print("=== COMPREHENSIVE ASSET TESTING ===")

    test_results = {}

    # 1. Hero Images
    print("\n1. HERO IMAGES")
    images = [
        ("Frente loja", "assets/images/Frente%20loja.jpg"),
        ("Interior", "assets/images/Interior.jpg"),
        (
            "Interior com funcionário",
            "assets/images/Interior%20c%20funcion%C3%A1rio.jpg",
        ),
        ("Reborn doll", "assets/images/reborn_doll.jpg"),
        ("Caixas joias", "assets/images/Caixas_joias.jpg"),
        ("Canetas oferta", "assets/images/Canetas_oferta.jpg"),
        ("Dossiers", "assets/images/Dossiers.jpg"),
        ("Mochilas", "assets/images/Mochilas.jpg"),
        ("Tinteiros", "assets/images/Tinteiros.jpg"),
        ("Logo SVG", "assets/images/logo.svg"),
        ("DHL Logo", "assets/images/dhl-logo.svg"),
    ]

    image_results = []
    for name, path in images:
        try:
            response = requests.get(f"{BASE_URL}/{path}", timeout=10)
            status = "✓" if response.status_code == 200 else f"✗ {response.status_code}"
            size = (
                f"{len(response.content):,} bytes"
                if response.status_code == 200
                else "N/A"
            )
            image_results.append((name, status, size))
        except Exception as e:
            image_results.append((name, f"✗ {str(e)}", "N/A"))

    for name, status, size in image_results:
        print(f"  {status:<4} {size:<15} {name}")

    test_results["images"] = image_results

    # 2. TypeScript Modules
    print("\n2. TYPESCRIPT MODULES")
    modules = [
        ("ContactFormManager", "dist/scripts/modules/ContactFormManager.js"),
        ("NavigationManager", "dist/scripts/modules/NavigationManager.js"),
        ("ThemeManager", "dist/scripts/modules/ThemeManager.js"),
        ("TranslationManager", "dist/scripts/modules/TranslationManager.js"),
        ("Utils", "dist/scripts/modules/Utils.js"),
        ("ErrorManager", "dist/scripts/modules/ErrorManager.js"),
        ("ScrollManager", "dist/scripts/modules/ScrollManager.js"),
        ("Main Entry", "dist/scripts/index.js"),
    ]

    module_results = []
    for name, path in modules:
        try:
            response = requests.get(f"{BASE_URL}/{path}", timeout=5)
            status = "✓" if response.status_code == 200 else f"✗ {response.status_code}"
            size = (
                f"{len(response.content):,} bytes"
                if response.status_code == 200
                else "N/A"
            )
            module_results.append((name, status, size))
        except Exception as e:
            module_results.append((name, f"✗ {str(e)}", "N/A"))

    for name, status, size in module_results:
        print(f"  {status:<4} {size:<15} {name}")

    test_results["modules"] = module_results

    # 3. CSS Files
    print("\n3. CSS COMPILATION")
    css_files = [
        ("Main CSS", "main.css"),
        ("Base CSS", "src/styles/base.css"),
        ("Forms CSS", "src/styles/forms.css"),
        ("Hero CSS", "src/styles/hero.css"),
        ("Navigation CSS", "src/styles/navigation.css"),
        ("Sections CSS", "src/styles/sections.css"),
        ("Responsive CSS", "src/styles/responsive.css"),
        ("Privacy CSS", "src/styles/privacy.css"),
    ]

    css_results = []
    for name, path in css_files:
        try:
            response = requests.get(f"{BASE_URL}/{path}", timeout=5)
            status = "✓" if response.status_code == 200 else f"✗ {response.status_code}"
            size = (
                f"{len(response.content):,} bytes"
                if response.status_code == 200
                else "N/A"
            )
            css_results.append((name, status, size))
        except Exception as e:
            css_results.append((name, f"✗ {str(e)}", "N/A"))

    for name, status, size in css_results:
        print(f"  {status:<4} {size:<15} {name}")

    test_results["css"] = css_results

    # 4. Locale Files (Corrected Path)
    print("\n4. LOCALE FILES")
    locales = [("Portuguese", "locales/pt.json"), ("English", "locales/en.json")]

    locale_results = []
    for name, path in locales:
        try:
            response = requests.get(f"{BASE_URL}/{path}", timeout=5)
            if response.status_code == 200:
                try:
                    data = response.json()
                    keys_count = (
                        len(data.keys()) if isinstance(data, dict) else "Invalid"
                    )
                    status = "✓ Valid JSON"
                    size = f"{len(response.content):,} bytes"
                    locale_results.append((name, status, size, f"{keys_count} keys"))
                except json.JSONDecodeError:
                    status = "✗ Invalid JSON"
                    size = f"{len(response.content):,} bytes"
                    locale_results.append((name, status, size, "N/A"))
            else:
                locale_results.append((name, f"✗ {response.status_code}", "N/A", "N/A"))
        except Exception as e:
            locale_results.append((name, f"✗ {str(e)}", "N/A", "N/A"))

    for name, status, size, keys in locale_results:
        print(f"  {status:<12} {size:<15} {keys:<10} {name}")

    test_results["locales"] = locale_results

    return test_results


def test_page_functionality():
    """Test page loading and JavaScript references"""
    print("\n=== PAGE FUNCTIONALITY ===")

    try:
        response = requests.get(BASE_URL, timeout=10)
        if response.status_code == 200:
            content = response.text
            print(f"✓ Page loads successfully ({len(content):,} bytes)")

            # Check for key patterns
            checks = {
                "Brand name": "LOFERSIL" in content,
                "CSS reference": "main.css" in content,
                "TypeScript modules": "src/scripts/index.ts" in content,
                "Contact form": "ContactFormManager" in content,
                "Navigation manager": "NavigationManager" in content,
                "Theme manager": "ThemeManager" in content,
                "Translation manager": "TranslationManager" in content,
                "Data translate attributes": "data-translate=" in content,
                "Meta tags": "meta name=" in content,
                "Responsive design": "viewport" in content,
            }

            print("\nContent Analysis:")
            for check_name, found in checks.items():
                status = "✓" if found else "✗"
                print(f"  {status} {check_name}")

            return True
        else:
            print(f"✗ Page failed to load: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error loading page: {str(e)}")
        return False


def generate_summary(test_results):
    """Generate comprehensive summary"""
    print("\n" + "=" * 60)
    print("COMPREHENSIVE TESTING SUMMARY")
    print("=" * 60)

    total_tests = 0
    passed_tests = 0

    for category, results in test_results.items():
        if category == "locales":
            passed = sum(1 for r in results if "✓" in r[1])
            total = len(results)
        else:
            passed = sum(1 for r in results if "✓" in r[1])
            total = len(results)

        total_tests += total
        passed_tests += passed

        print(f"{category.upper():<15} {passed}/{total} passed")

    success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    print(f"\nOVERALL: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")

    print("\nCRITICAL ISSUES FOUND:")
    issues = []

    # Check for TypeScript files being loaded in HTML
    if "src/scripts/index.ts" in requests.get(BASE_URL).text:
        issues.append(
            "- HTML references TypeScript files (.ts) instead of compiled JavaScript (.js)"
        )

    # Check locale file paths
    try:
        pt_response = requests.get(f"{BASE_URL}/src/locales/pt.json", timeout=5)
        if (
            pt_response.status_code == 200
            and "html" in pt_response.headers.get("content-type", "").lower()
        ):
            issues.append(
                "- Locale files accessed at wrong path (/src/locales/ instead of /locales/)"
            )
    except:
        pass

    if issues:
        for issue in issues:
            print(f"  {issue}")
    else:
        print("  ✓ No critical issues detected")

    print("\nRECOMMENDATIONS:")
    print("  1. Use index.prod.html for production (references compiled JS)")
    print("  2. Ensure locale files are copied to dist/locales/ during build")
    print("  3. Test JavaScript console for runtime errors")
    print("  4. Verify all interactive features work as expected")

    return success_rate >= 80


def main():
    print("LOFERSIL Landing Page - Deep Testing & Analysis")
    print("=" * 60)

    # Test server connectivity
    try:
        response = requests.get(BASE_URL, timeout=5)
        if response.status_code != 200:
            print(f"✗ Server responded with HTTP {response.status_code}")
            return
    except Exception as e:
        print(f"✗ Cannot connect to server at {BASE_URL}: {str(e)}")
        return

    print("✓ Server is accessible")

    # Run comprehensive tests
    test_results = test_asset_loading()
    page_works = test_page_functionality()
    test_results["page_loading"] = [("Main Page", "✓" if page_works else "✗", "N/A")]

    # Generate summary
    success = generate_summary(test_results)

    if success:
        print("\n🎉 Testing completed successfully!")
    else:
        print("\n⚠️  Some issues found - review recommendations above")


if __name__ == "__main__":
    main()
