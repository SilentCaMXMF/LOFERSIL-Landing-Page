/**
 * Frontend Specialist Agent - Core Types
 * Type definitions for the Frontend Specialist agent modules
 */

export interface FrontendSpecialistConfig {
  enabled: boolean;
  modules: {
    componentGenerator: boolean;
    responsiveHelper: boolean;
    performanceOptimizer: boolean;
    accessibilityAuditor: boolean;
    cssFrameworkIntegrator: boolean;
    testingFramework: boolean;
  };
  performance: {
    enableMonitoring: boolean;
    enableOptimization: boolean;
    lighthouseThresholds: LighthouseThresholds;
  };
  accessibility: {
    enableAuditing: boolean;
    enableAutoFix: boolean;
    wcagLevel: 'A' | 'AA' | 'AAA';
  };
  build: {
    enableOptimization: boolean;
    enableAnalysis: boolean;
  };
}

export interface LighthouseThresholds {
  performance: number;
  accessibility: number;
  'best-practices': number;
  seo: number;
  pwa: number;
}

export interface AgentState {
  initialized: boolean;
  activeModules: string[];
  performanceMetrics: PerformanceMetrics;
  accessibilityScore: number;
  lastAnalysis: Date;
  recommendations: Recommendation[];
}

export interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  bundleSize: number;
  imageOptimizationRatio: number;
}

export interface Recommendation {
  id: string;
  type: 'performance' | 'accessibility' | 'seo' | 'ux' | 'code-quality';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number; // 1-10 scale
  effort: number; // 1-10 scale
  autoFixable: boolean;
  code?: string;
}

// DOM Analysis Types
export interface DOMAnalysis {
  totalElements: number;
  semanticElements: number;
  accessibilityScore: number;
  performanceScore: number;
  issues: DOMIssue[];
  recommendations: Recommendation[];
}

export interface DOMIssue {
  type: 'missing-alt' | 'invalid-aria' | 'poor-contrast' | 'large-dom' | 'unused-css';
  severity: 'error' | 'warning' | 'info';
  element: HTMLElement;
  description: string;
  suggestion: string;
}

// CSS Analysis Types
export interface CSSAnalysis {
  totalRules: number;
  unusedRules: number;
  criticalCSS: string;
  optimizationOpportunities: CSSOptimization[];
  performance: CSSPerformanceMetrics;
}

export interface CSSOptimization {
  type: 'unused-selector' | 'inefficient-selector' | 'redundant-property';
  selector: string;
  impact: number;
  suggestion: string;
}

export interface CSSPerformanceMetrics {
  renderBlockingResources: number;
  cssSize: number;
  selectorsCount: number;
  complexityScore: number;
}

// Image Analysis Types
export interface ImageAnalysis {
  totalImages: number;
  optimizedImages: number;
  optimizationRatio: number;
  opportunities: ImageOptimization[];
  webpCandidates: HTMLElement[];
}

export interface ImageOptimization {
  element: HTMLImageElement;
  currentSize: number;
  potentialSavings: number;
  suggestions: string[];
}

// Build Analysis Types
export interface BuildAnalysis {
  bundleSize: number;
  chunks: BundleChunk[];
  assets: AssetInfo[];
  optimizationOpportunities: BuildOptimization[];
  performance: BuildPerformanceMetrics;
}

export interface BundleChunk {
  name: string;
  size: number;
  modules: string[];
  isEntry: boolean;
}

export interface AssetInfo {
  name: string;
  size: number;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
  optimized: boolean;
}

export interface BuildOptimization {
  type: 'code-splitting' | 'tree-shaking' | 'compression' | 'minification';
  impact: number;
  description: string;
  implementation: string;
}

export interface BuildPerformanceMetrics {
  buildTime: number;
  bundleSize: number;
  compressionRatio: number;
  moduleCount: number;
}

// Component Types
export interface ComponentSpec {
  type: 'button' | 'card' | 'form' | 'modal' | 'navigation';
  variant?: string;
  props: Record<string, any>;
  accessibility: AccessibilityProps;
  responsive: ResponsiveProps;
}

export interface AccessibilityProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
  tabIndex?: number;
}

export interface ResponsiveProps {
  mobile?: any;
  tablet?: any;
  desktop?: any;
  breakpoints?: BreakpointConfig;
}

export interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Error Context Types
export interface ErrorContext {
  component: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Plugin System Types
export interface AgentPlugin {
  name: string;
  version: string;
  capabilities: string[];
  init(agent: any): Promise<void>;
  destroy(): Promise<void>;
}

// Testing Types
export interface TestSuite {
  name: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface TestCase {
  name: string;
  test: () => Promise<void> | void;
  expected?: any;
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ModuleStatus = 'pending' | 'initializing' | 'ready' | 'error' | 'disabled';

export interface ModuleInfo {
  name: string;
  status: ModuleStatus;
  version: string;
  dependencies: string[];
  capabilities: string[];
}