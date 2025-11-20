# 03. Design Frontend Analysis Workflow

meta:
id: frontend-specialist-agent-03
feature: frontend-specialist-agent
priority: P1
depends_on: [frontend-specialist-agent-02]
tags: [workflow, analysis, subagent-coordination]

objective:

- Design the frontend analysis workflow that coordinates existing subagents for comprehensive frontend evaluation

deliverables:

- Analysis workflow orchestration in frontend-specialist-agent.md
- Subagent coordination patterns for DOM, CSS, image, and build analysis
- Integration with existing LOFERSIL tools and architecture
- Quality assurance processes for analysis accuracy

steps:

- Define analysis workflow triggers and scheduling
- Design subagent coordination for DOM structure analysis using existing tools
- Implement CSS analysis workflow using @tester-agent and build tools
- Create image optimization workflow coordination with existing optimizers
- Design build system analysis integration with current build.js
- Establish analysis result aggregation and reporting patterns
- Define error handling and fallback strategies for analysis failures
- Create validation workflows for analysis accuracy

tests:

- Unit: Workflow orchestration logic validation
- Integration: End-to-end analysis workflow execution
- QA: Analysis result accuracy verification

acceptance_criteria:

- Analysis workflow successfully coordinates all required subagents
- Workflow integrates seamlessly with existing LOFERSIL architecture
- Analysis results are accurate and actionable
- Error handling provides graceful degradation
- Workflow performance doesn't impact existing application

validation:

- Execute complete analysis workflow on current application
- Verify subagent coordination and result aggregation
- Validate analysis accuracy against known benchmarks
- Performance impact assessment on existing functionality