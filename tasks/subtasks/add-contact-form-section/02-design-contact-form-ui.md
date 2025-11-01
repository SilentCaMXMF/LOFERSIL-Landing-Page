# 02. Design contact form UI and fields

meta:
id: add-contact-form-section-02
feature: add-contact-form-section
priority: P2
depends_on: [add-contact-form-section-01]
tags: [implementation, tests-required]

objective:

- Define the user interface design and required fields for the contact form

deliverables:

- Design specification for contact form including fields, layout, and styling approach

steps:

- Determine required fields: name, email, message, submit button
- Define form layout (vertical stack, responsive design)
- Specify styling to match existing site theme
- Consider accessibility requirements (labels, error states)

tests:

- Unit: N/A for design task
- Integration/e2e: N/A for design task

acceptance_criteria:

- Form fields defined: name (text), email (email), message (textarea), submit (button)
- Layout design specified (responsive, matches site style)
- Accessibility considerations included

validation:

- Design review against site aesthetics
- Ensure fields are standard and sufficient for contact

notes:

- Assumptions: Keep form simple with essential fields only
- Links to relevant docs: Site style guide in styles/main.css

analysis:

- Form fields determined:
  - Name: text input, required, placeholder="O seu nome"
  - Email: email input, required, placeholder="o.seu.email@exemplo.com"
  - Message: textarea, required, placeholder="A sua mensagem...", rows="5"
  - Submit: button with text "Enviar Mensagem"
- Layout design:
  - Responsive two-column layout on desktop, single column on mobile
  - Form container with max-width 600px, centered
  - Consistent with existing site design using same button styles and spacing
  - Section placed before footer, after CTA section
- Styling approach:
  - Use existing CSS classes: .section-header, .btn, .btn-primary
  - Form styling consistent with site's clean, professional aesthetic
  - Error states with red borders and text
  - Success state with green confirmation message
- Accessibility:
  - Proper labels for all form fields
  - ARIA attributes for error messages
  - Keyboard navigation support
  - Screen reader friendly error announcements
