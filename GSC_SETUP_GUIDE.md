# Google Search Console Verification Setup Guide

Complete guide to set up Google Search Console for the LOFERSIL website.

---

## Quick Start

Choose the verification method that best fits your needs:

| Method                         | Difficulty    | Best For                  |
| ------------------------------ | ------------- | ------------------------- |
| **Method 1: HTML Meta Tag** ⭐ | ⭐ Easy       | Quick setup, static sites |
| **Method 2: HTML File Upload** | ⭐⭐ Easy     | Alternative to meta tag   |
| **Method 3: DNS TXT Record**   | ⭐⭐⭐ Medium | Domain-level verification |

---

## Method 1: HTML Meta Tag Verification (Recommended)

**Pros:**

- ✅ Fastest setup (5 minutes)
- ✅ No DNS access required
- ✅ Works with Vercel deployments
- ✅ Easy to manage

**Cons:**

- ❌ Only verifies specific URL prefix
- ❌ Must add to both PT and EN versions

### Step-by-Step:

#### 1. Get Your Verification Code

1. Visit: https://search.google.com/search-console
2. Click **"Add property"** → Select **"URL prefix"**
3. Enter: `https://lofersil.pt/`
4. Click **Continue** and scroll to **"HTML tag"** method
5. Copy the meta tag, which looks like:

```html
<meta
  name="google-site-verification"
  content="google4f6f8e9a8d1b2c3d4e5f6g7h8i9j0k1l2m3n4o5"
/>
```

**Important:** Save just the `content="..."` value (your verification code).

#### 2. Add Meta Tag to Your HTML

The verification meta tag comments are already in place in both HTML files:

**File: `/workspaces/LOFERSIL-Landing-Page/index.html`** (Portuguese)

```html
<!-- Google Search Console Verification (Uncomment and replace YOUR_VERIFICATION_CODE when ready) -->
<!-- <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" /> -->
```

**File: `/workspaces/LOFERSIL-Landing-Page/en/index.html`** (English)

```html
<!-- Google Search Console Verification (Uncomment and replace YOUR_VERIFICATION_CODE when ready) -->
<!-- <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" /> -->
```

**To enable:**

1. Replace `YOUR_VERIFICATION_CODE` with your actual code
2. Remove the comment markers `<!--` and `-->`
3. Save both files

**Example after activation:**

```html
<!-- Google Search Console Verification -->
<meta
  name="google-site-verification"
  content="google4f6f8e9a8d1b2c3d4e5f6g7h8i9j0k1l2m3n4o5"
/>
```

#### 3. Deploy Your Changes

```bash
# Build and deploy to Vercel
npm run build
vercel --prod
# Or use GitHub Actions/Vercel Git Integration
```

#### 4. Verify in Google Search Console

1. Return to Google Search Console
2. Click **Verify** button
3. If successful: **"Ownership verified"** 🎉

#### 5. Repeat for English Version

After verifying `https://lofersil.pt/`, add property for `https://lofersil.pt/en/` with the same verification code.

---

## Method 2: HTML File Upload Verification

**Pros:**

- ✅ No code changes needed
- ✅ Simple file upload
- ✅ Works with static sites

**Cons:**

- ❌ File must remain on server
- ❌ Must be in root directory
- ❌ Only verifies URL prefix

### Step-by-Step:

#### 1. Get Your Verification File

1. Visit: https://search.google.com/search-console
2. Click **"Add property"** → Select **"URL prefix"**
3. Enter: `https://lofersil.pt/`
4. Click **Continue** and scroll to **"HTML file upload"** method
5. Download the verification file (looks like: `google4f6f8e9a8d1b2c3d4e5f6g7h8i9j0k1l2m3n4o5.html`)

#### 2. Add File to Your Project

The template file is already created at:
**`/workspaces/LOFERSIL-Landing-Page/google-site-verification.html`**

This file contains the verification meta tag as a template. To use it:

**Option A: Rename the Downloaded File**

1. Place your downloaded verification file (e.g., `google4f6f8e9a8d1b2c3d4e5f6g7h8i9j0k1l2m3n4o5.html`) in the root directory
2. The build process will copy it to `dist/`

**Option B: Use the Template File**

1. Open `google-site-verification.html`
2. Replace the template with your actual verification meta tag
3. Rename the file to match Google's filename

#### 3. Build and Deploy

```bash
npm run build
# The file will be in: dist/google-site-verification.html
vercel --prod
```

#### 4. Verify in Google Search Console

1. Return to Google Search Console
2. Click **Verify**
3. If successful: **"Ownership verified"** 🎉

---

## Method 3: DNS TXT Record Verification

**Pros:**

- ✅ Domain-level verification (all subdomains)
- ✅ No code or file changes
- ✅ Best for production environments
- ✅ Covers `lofersil.pt`, `www.lofersil.pt`, `lofersil.vercel.app`

**Cons:**

- ❌ Requires DNS access
- ❌ Takes 15-60 minutes to propagate
- ❌ More complex setup

### Step-by-Step:

#### 1. Get Your DNS TXT Record

1. Visit: https://search.google.com/search-console
2. Click **"Add property"** → Select **"Domain"**
3. Enter: `lofersil.pt` (without http/https)
4. Click **Continue**
5. Copy the TXT record provided:

```text
Name/Host: _google-site-verification
Type: TXT
Value: vw2xv6eXbK2d7c1j9H8a3b4K6lM7n8o9P0qR1sT2uV
```

#### 2. Add DNS Record to Vercel

If you're using Vercel DNS (recommended):

1. Go to: https://vercel.com/dashboard
2. Select your **LOFERSIL** project
3. Go to **Settings** → **Domains**
4. Find `lofersil.pt` and click **Edit DNS**
5. Click **Add Record**
6. Configure:

| Type | Name                        | Value                    | TTL   |
| ---- | --------------------------- | ------------------------ | ----- |
| TXT  | `_google-site-verification` | `YOUR_VERIFICATION_CODE` | 10800 |

7. Click **Save**

#### 3. Wait for DNS Propagation

DNS changes typically take 5-60 minutes to propagate globally. You can check status:

```bash
# macOS/Linux
dig TXT _google-site-verification.lofersil.pt

# Windows
nslookup -type=TXT _google-site-verification.lofersil.pt

# Online tool
https://dnschecker.org/#TXT/_google-site-verification.lofersil.pt
```

#### 4. Verify in Google Search Console

1. Return to Google Search Console
2. Click **Verify**
3. Google will check for the TXT record
4. If successful: **"Ownership verified"** 🎉

---

## After Verification

### What's Next?

#### 1. Submit Sitemap

Create and submit `sitemap.xml` to help Google discover all pages:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://lofersil.pt/</loc>
    <lastmod>2026-01-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://lofersil.pt/en/</loc>
    <lastmod>2026-01-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

Submit at: Google Search Console → Sitemaps → Add a new sitemap

#### 2. Monitor Search Performance

- Check **Performance** report for impressions, clicks, CTR
- Identify top-performing pages and queries
- Monitor mobile vs desktop performance

#### 3. Review Coverage Report

- Check for indexing errors
- Ensure all pages are indexed
- Fix any "Submitted URL blocked by robots.txt" issues

#### 4. Set Up International Targeting

Configure for both Portuguese and English versions:

- Go to **Settings** → **International Targeting**
- Set `pt` for `https://lofersil.pt/`
- Set `en` for `https://lofersil.pt/en/`
- Ensure proper hreflang tags are in place (already done)

#### 5. Request Indexing

After making major changes:

- Use **URL Inspection** tool
- Click **Request Indexing**
- Wait for Google to crawl your pages

---

## Troubleshooting

### Verification Failed

#### Meta Tag Method:

- [ ] Meta tag uncommented in BOTH `index.html` and `en/index.html`
- [ ] `YOUR_VERIFICATION_CODE` replaced with actual code
- [ ] Website redeployed after changes
- [ ] Meta tag placed in `<head>` section (before `</head>`)

#### HTML File Method:

- [ ] File named exactly as provided by Google
- [ ] File in root directory (`/dist/` after build)
- [ ] File contains verification meta tag
- [ ] File accessible at `https://lofersil.pt/google1234567890.html`

#### DNS Method:

- [ ] TXT record added to DNS provider
- [ ] Record name: `_google-site-verification` (with underscore)
- [ ] Record type: TXT
- [ ] Wait 15-60 minutes for DNS propagation
- [ ] Verify record exists: `dig TXT _google-site-verification.lofersil.pt`

### Common Issues

| Issue                               | Solution                                                   |
| ----------------------------------- | ---------------------------------------------------------- |
| **"We couldn't find the meta tag"** | Check that meta tag is uncommented and website is deployed |
| **"Verification failed"**           | Clear browser cache, wait 5 minutes, try again             |
| **DNS record not found**            | Wait longer for propagation, check record in DNS provider  |
| **Multiple properties**             | Use domain-level verification to cover all URLs            |

---

## Files Created

This setup created the following files:

1. **`google-site-verification.html`**
   - Template for HTML file verification method
   - Contains verification meta tag as comment
   - Ready to be renamed or edited

2. **`GSC_DNS_VERIFICATION.md`**
   - Comprehensive DNS verification guide
   - Detailed troubleshooting steps
   - Instructions for multiple domains

3. **This File: `GSC_SETUP_GUIDE.md`**
   - Complete setup guide for all methods
   - Quick start comparison table
   - Post-verification steps

4. **Modified Files:**
   - `index.html` - Added verification meta tag comment (Portuguese)
   - `en/index.html` - Added verification meta tag comment (English)

---

## Additional Resources

- **Google Search Console:** https://search.google.com/search-console
- **GSC Help Center:** https://support.google.com/webmasters
- **Verification Documentation:** https://support.google.com/webmasters/answer/9008080
- **Vercel DNS Guide:** https://vercel.com/docs/concepts/projects/domains/dns-records

---

## Support

If you encounter issues:

1. Check [GSC_DNS_VERIFICATION.md](GSC_DNS_VERIFICATION.md) for detailed DNS troubleshooting
2. Use Google's [Search Console Help Forum](https://support.google.com/webmasters/community)
3. Verify your website is accessible: https://lofersil.pt/
4. Check Vercel deployment logs for any errors

---

**Last Updated:** 2026-01-14
**Website:** https://lofersil.pt/
**Project:** LOFERSIL Landing Page
