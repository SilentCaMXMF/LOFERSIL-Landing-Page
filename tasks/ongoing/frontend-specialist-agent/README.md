# Frontend Specialist Agent

Objective: Design agent-based workflows for frontend specialization using existing subagents (@task-manager, @coder-agent, @tester-agent, @reviewer-agent) to handle UI/UX improvements, responsive design, performance optimization, accessibility enhancements, and modern frontend best practices within the LOFERSIL architecture.

Status legend: [ ] todo, [~] in-progress, [x] done

Tasks

- [x] 01 — analyze-current-frontend-architecture → `01-analyze-current-frontend-architecture.md`
- [x] 02 — design-agent-workflow-architecture → `02-design-agent-workflow-architecture.md`
- [ ] 03 — design-frontend-analysis-workflow → `03-design-frontend-analysis-workflow.md`
- [ ] 04 — design-ui-component-generation-workflow → `04-add-ui-component-generator.md`
- [ ] 05 — design-responsive-design-analysis-workflow → `05-implement-responsive-design-helper.md`
- [ ] 06 — design-performance-optimization-workflow → `06-create-performance-optimization-module.md`
- [ ] 07 — design-accessibility-auditing-workflow → `07-add-accessibility-auditor.md`
- [ ] 08 — design-css-framework-integration-workflow → `08-implement-modern-css-framework-integration.md`
- [ ] 09 — design-frontend-testing-framework-workflow → `09-create-testing-framework-for-frontend.md`
- [ ] 10 — design-build-process-optimization-workflow → `10-add-build-process-optimization.md`
- [ ] 11 — design-cross-browser-compatibility-workflow → `11-implement-cross-browser-compatibility.md`
- [ ] 12 — design-frontend-documentation-generator-workflow → `12-create-frontend-documentation-generator.md`
- [ ] 13 — design-automated-frontend-testing-workflow → `13-add-automated-frontend-testing.md`
- [ ] 14 — design-performance-monitoring-workflow → `14-implement-performance-monitoring.md`
- [ ] 15 — design-frontend-best-practices-validator-workflow → `15-create-frontend-best-practices-validator.md`

Dependencies

- 01 -> 02 (module structure depends on architecture analysis)
- 02 -> 03 (analysis tools depend on module design)
- 03 -> 04 (UI generator depends on analysis tools)
- 03 -> 05 (responsive helper depends on analysis tools)
- 03 -> 06 (performance module depends on analysis tools)
- 04 -> 07 (accessibility auditor depends on UI generator)
- 05 -> 07 (accessibility auditor depends on responsive helper)
- 06 -> 07 (accessibility auditor depends on performance module)
- 07 -> 08 (CSS integration depends on accessibility auditor)
- 08 -> 09 (testing framework depends on CSS integration)
- 09 -> 10 (build optimization depends on testing framework)
- 10 -> 11 (cross-browser compatibility depends on build optimization)
- 11 -> 12 (documentation generator depends on cross-browser compatibility)
- 12 -> 13 (automated testing depends on documentation generator)
- 13 -> 14 (performance monitoring depends on automated testing)
- 14 -> 15 (best practices validator depends on performance monitoring)

Exit criteria

- All 15 workflow designs are completed in frontend-specialist-agent.md, with comprehensive subagent coordination patterns, integration with existing LOFERSIL architecture, and quality assurance processes for frontend specialization capabilities.