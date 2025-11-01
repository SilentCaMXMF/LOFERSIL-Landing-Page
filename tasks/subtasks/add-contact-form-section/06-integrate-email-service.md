# 06. Integrate with email service (e.g., Formspree)

meta:
id: add-contact-form-section-06
feature: add-contact-form-section
priority: P2
depends_on: [add-contact-form-section-01, add-contact-form-section-03, add-contact-form-section-05]
tags: [implementation, tests-required]

objective:

- Configure the contact form to send emails using an external service

deliverables:

- Form configured with email service endpoint and any required API keys

steps:

- Choose email service (Formspree, Netlify Forms, or similar)
- Set up service account and get endpoint URL
- Update form action attribute with service URL
- Add any required hidden fields or configuration
- Handle service response in JavaScript

tests:

- Unit: N/A for service integration
- Integration/e2e: Form submissions reach email service

acceptance_criteria:

- Email service configured and active
- Form action points to valid service endpoint
- Service can receive and forward emails

validation:

- Submit test form and verify email received
- Check service dashboard for submissions

notes:

- Assumptions: Use free tier of Formspree or similar service
- Links to relevant docs: Service documentation for chosen provider
