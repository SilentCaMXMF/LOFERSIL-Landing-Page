# 02 - Identify All Navbar Links and Their Targets

## Task Description

Analyze each navbar link and determine what it should point to based on the page content.

## Current Links Analysis

### 1. Início (Home)

- **Current**: `href="/"`
- **Intended**: Should point to top of page or hero section
- **Target**: `#hero` or page top

### 2. Produtos (Products)

- **Current**: `href="/products"`
- **Intended**: Should point to products showcase section
- **Target**: `#products-showcase`

### 3. Serviços (Services)

- **Current**: `href="/services"`
- **Intended**: No services section exists on current page
- **Target**: Could point to `#features` section or remain external

### 4. Sobre Nós (About Us)

- **Current**: `href="/about"`
- **Intended**: Should point to about section
- **Target**: `#about`

### 5. Contacto (Contact)

- **Current**: `href="/contact"`
- **Intended**: No contact section exists on current page
- **Target**: Could point to footer or remain external

### 6. Visitar Loja (Visit Store)

- **Current**: `href="/store"`
- **Intended**: Could point to CTA section or remain external
- **Target**: `#cta` or keep as `/store`

## Page Sections Available

- `#hero` - Hero section
- `#about` - About Us section
- `#features` - Features/Why Choose Us section
- `#products-showcase` - Products showcase
- `#cta` - Call to Action section
- `#main-footer` - Footer

## Proposed Mapping

1. **Início** → `#hero`
2. **Produtos** → `#products-showcase`
3. **Serviços** → `#features` (as services are highlighted in features)
4. **Sobre Nós** → `#about`
5. **Contacto** → `#main-footer` (contact info in footer)
6. **Visitar Loja** → `#cta` (CTA section encourages visiting store)

## Next Steps

Verify that all proposed anchor targets exist on the page.
