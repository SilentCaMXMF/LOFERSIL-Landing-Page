# 07. Design Accessibility Auditing Workflow

meta:
id: frontend-specialist-agent-07
feature: frontend-specialist-agent
priority: P2
depends_on: [frontend-specialist-agent-04, frontend-specialist-agent-05, frontend-specialist-agent-06]
tags: [workflow, accessibility, auditing]

objective:

- Design accessibility auditing workflow using existing tools and @tester-agent for WCAG compliance

deliverables:

- Accessibility auditing workflow in frontend-specialist-agent.md
- Automated accessibility testing coordination
- WCAG compliance validation processes
- Accessibility improvement recommendation system

steps:

- Define accessibility audit triggers and scope definition
- Design automated testing workflow using @tester-agent
- Implement WCAG guideline validation patterns
- Create color contrast and visual accessibility analysis
- Design keyboard navigation and focus management testing
- Establish screen reader compatibility validation
- Define semantic HTML and ARIA attribute auditing
- Create accessibility issue prioritization and fixing workflows

tests:

- Unit: Accessibility audit logic validation
- Integration: WCAG compliance testing accuracy
- QA: Accessibility improvement verification

acceptance_criteria:

- Accessibility workflow identifies WCAG violations accurately
- Audit results provide actionable improvement recommendations
- Workflow integrates with existing accessibility features
- Analysis covers all major accessibility categories

validation:

- Audit current LOFERSIL accessibility implementation
- Test workflow accuracy against known accessibility issues
- Verify recommendations improve accessibility scores
- Validate compliance with WCAG guidelines