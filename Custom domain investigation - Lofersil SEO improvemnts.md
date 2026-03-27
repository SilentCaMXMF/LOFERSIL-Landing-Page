# Custom Domain Investigation — LOFERSIL SEO Improvements

**Date**: 2026-03-27
**Status**: Research complete, awaiting decision

---

## Why a Custom Domain Matters

The site currently runs on `lofersil.vercel.app`. Google treats free subdomains (`.vercel.app`, `.netlify.app`, `.github.io`) as lower authority than custom domains. A custom domain is the single biggest SEO improvement available — it unlocks better rankings for local searches like "papelaria lisboa" and "material escritório lisboa".

---

## Cheapest Domain Options

### Best TLDs for a Lisbon Business (ranked by local SEO value)

| Extension | Cheapest Registration | Renewal | Best Registrar | Notes |
|-----------|----------------------|---------|----------------|-------|
| **`.pt`** | **~$11.56/yr** | ~$11.56/yr | **Regery** | Best local SEO. ccTLD signals Google that the site targets Portuguese users. |
| `.com.pt` | ~$12.09/yr | ~$14.49/yr | OVHcloud | Good alternative, "commercial Portugal" second-level domain. |
| `.com` | ~$8.99/yr | ~$15-17/yr | Namecheap / Cloudflare | Cheapest first year, but weaker local SEO signal. Renewal prices are higher. |

### Top 3 Cheapest Registrars for `.pt`

| # | Registrar | Registration | Renewal | Free Features | Rating |
|---|-----------|-------------|---------|---------------|--------|
| 1 | **Regery** | $12.99/yr | $12.99/yr | SSL (90 days), Email Forwarding, DNS | 19 reviews |
| 2 | **OVHcloud** | $12.09/yr | $14.49/yr | SSL, 1 Email Account, DNS | 26 reviews |
| 3 | **Netcetera** | ~$16.82/yr | ~$16.82/yr | SSL, Email Forwarding, 1 Email Account, DNS | 10 reviews |

### Domain Suggestions (check availability)

| Domain | Pros | Cons |
|--------|------|------|
| `lofersil.pt` | Clean, brand-focused, easy to remember | No keyword signal |
| `lofersil.com.pt` | Commercial variant, recognizable | Slightly longer |
| `papelaria-lofersil.pt` | Contains "papelaria" keyword | Hyphenated, longer |
| `lofersil-lisboa.pt` | Geo-targeted with "lisboa" keyword | Hyphenated, longer |

---

## Vercel Integration

### Option A: Buy from Vercel (simpler, more expensive)
- Go to vercel.com/domains
- Search and purchase directly
- Auto-configured DNS — no manual setup

### Option B: Buy from Registrar + Point DNS to Vercel (cheaper)
1. Buy domain from Regery or OVHcloud (~$12-13/yr)
2. In Vercel dashboard → Settings → Domains → Add domain
3. Vercel provides DNS records to configure at your registrar
4. Update nameservers or add A/CNAME records at registrar
5. Takes ~5-30 min to propagate

**Cost difference**: ~$5-10/yr cheaper buying from registrar vs Vercel.

---

## Recommendation

**`lofersil.pt` from Regery (~$13/yr)**

- Best local SEO impact for Portugal
- No local presence required (open since 2012)
- Lowest long-term cost (same price to renew)
- Trusted by Portuguese users
- SSL and DNS included free

### Post-Purchase Checklist

- [ ] Register `lofersil.pt` at Regery
- [ ] Add domain in Vercel dashboard (Settings → Domains)
- [ ] Update DNS records at Regery to point to Vercel
- [ ] Update all canonical URLs in `index.html` and `en/index.html`
- [ ] Update all hreflang tags to use new domain
- [ ] Update `sitemap.xml` and `public/sitemap.xml` URLs
- [ ] Update `robots.txt` sitemap reference
- [ ] Update Schema.org JSON-LD `@id`, `url`, `sameAs` references
- [ ] Resubmit sitemap in Google Search Console with new domain
- [ ] Set up 301 redirect from `lofersil.vercel.app` to new domain (Vercel handles this)

---

## Sources

- [TLD-List: .pt price comparison](https://tld-list.com/tld/pt)
- [TLD-List: .com.pt price comparison](https://tld-list.com/tld/com.pt)
- [Regery](https://regery.com)
- [OVHcloud](https://www.ovhcloud.com/en/domains/tld/pt/)
- [Vercel Domains Documentation](https://vercel.com/docs/domains/working-with-domains)
