# 04 - Fix or Update Broken/Incorrect Links

## Task Description

Update the navbar links in `index.html` to point to the verified anchor targets instead of external routes.

## Current Links (to be updated)

Located in `index.html` lines 68-73:

```html
<a href="/" class="nav-link active">Início</a>
<a href="/products" class="nav-link">Produtos</a>
<a href="/services" class="nav-link">Serviços</a>
<a href="/about" class="nav-link">Sobre Nós</a>
<a href="/contact" class="nav-link">Contacto</a>
<a href="/store" class="nav-link nav-cta">Visitar Loja</a>
```

## Proposed Updates

### 1. Início

- **From**: `href="/"`
- **To**: `href="#hero"`
- **Reason**: Points to hero section at top of page

### 2. Produtos

- **From**: `href="/products"`
- **To**: `href="#products-showcase"`
- **Reason**: Points to products showcase section

### 3. Serviços

- **From**: `href="/services"`
- **To**: `href="#features"`
- **Reason**: Services are highlighted in features section

### 4. Sobre Nós

- **From**: `href="/about"`
- **To**: `href="#about"`
- **Reason**: Points to about section

### 5. Contacto

- **From**: `href="/contact"`
- **To**: `href="#main-footer"`
- **Reason**: Contact information is in footer

### 6. Visitar Loja

- **From**: `href="/store"`
- **To**: `href="#cta"`
- **Reason**: CTA section encourages visiting store

## Updated HTML Structure

```html
<a href="#hero" class="nav-link active">Início</a>
<a href="#products-showcase" class="nav-link">Produtos</a>
<a href="#features" class="nav-link">Serviços</a>
<a href="#about" class="nav-link">Sobre Nós</a>
<a href="#main-footer" class="nav-link">Contacto</a>
<a href="#cta" class="nav-link nav-cta">Visitar Loja</a>
```

## Implementation Notes

- Ensure smooth scrolling behavior is implemented in CSS/JavaScript
- Test that clicking links scrolls to correct sections
- Verify mobile navigation works with anchor links
- Consider adding `aria-label` attributes for accessibility

## Next Steps

Test the updated navigation functionality across different devices and browsers.
