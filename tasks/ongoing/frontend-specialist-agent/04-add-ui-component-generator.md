# 04. Design UI Component Generation Workflow

meta:
id: frontend-specialist-agent-04
feature: frontend-specialist-agent
priority: P2
depends_on: [frontend-specialist-agent-03]
tags: [workflow, ui-generation, subagent-coordination]

objective:

- Design the UI component generation workflow using @coder-agent for creating reusable frontend components

deliverables:

- Component generation workflow in frontend-specialist-agent.md
- @coder-agent integration patterns for HTML/CSS/JS component creation
- Component specification and validation processes
- Integration with existing UIManager and theme system

steps:

- Define component generation triggers and requirements gathering
- Design @coder-agent prompts for component specification analysis
- Implement workflow for component HTML structure generation
- Create CSS styling workflow using existing theme variables
- Design JavaScript behavior integration patterns
- Establish component testing and validation workflows
- Define component registration and reuse mechanisms
- Create accessibility and responsive design integration

tests:

- Unit: Component generation workflow validation
- Integration: Generated component functionality testing
- QA: Component accessibility and responsive design verification

acceptance_criteria:

- @coder-agent successfully generates valid HTML/CSS/JS components
- Generated components integrate with existing UIManager
- Components follow LOFERSIL accessibility and responsive standards
- Component generation workflow is efficient and reliable

validation:

- Generate sample components (button, card, form) using workflow
- Verify component integration with existing application
- Test component accessibility and responsive behavior
- Validate workflow performance and reliability