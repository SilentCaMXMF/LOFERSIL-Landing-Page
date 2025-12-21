// Quick debug test to understand the IssueAnalyzer requirements extraction
import { IssueAnalyzer } from '../src/scripts/modules/github-issues/IssueAnalyzer.js';

const mockConfig = {
  openCodeAgent: {
    query: vi.fn(),
  },
  labels: {
    bug: ['bug', 'fix'],
    feature: ['feature', 'enhancement'],
    question: ['question', 'help', 'docs'],
  },
  complexity: {
    highLabels: ['critical', 'major', 'blocker'],
    highComplexityThreshold: 1000,
    criticalComplexityThreshold: 2000,
  },
  feasibility: {
    maxComplexityForAutonomous: 500,
    infeasibleCategories: ['question'],
  },
};

const analyzer = new IssueAnalyzer(mockConfig);

// Test the exact scenario from the failing test
const issueWithRequirements = {
  number: 123,
  title: "Test Feature",
  body: "## Requirements\n- Implement dark mode toggle\n- Add theme persistence\n- Update all components\n\n## Acceptance Criteria\n- Toggle switches theme\n- Theme persists on reload\n- All components support theme",
  labels: [],
  state: "open" as const,
  user: { login: "testuser" },
};

// Mock the AI responses exactly as in the test
mockConfig.openCodeAgent.query
  .mockResolvedValueOnce("feature")
  .mockResolvedValueOnce(JSON.stringify({
    requirements: [
      "Implement dark mode toggle",
      "Add theme persistence", 
      "Update all components",
    ],
    acceptanceCriteria: [
      "Toggle switches theme",
      "Theme persists on reload",
      "All components support theme",
    ],
  }));

analyzer.analyzeIssue(issueWithRequirements).then(result => {
  console.log('Category:', result.category);
  console.log('Requirements:', result.requirements);
  console.log('Acceptance Criteria:', result.acceptanceCriteria);
  console.log('Requirements length:', result.requirements.length);
  console.log('Acceptance Criteria length:', result.acceptanceCriteria.length);
}).catch(console.error);