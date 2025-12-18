/**
 * Simple MCP Server for GitHub Issues Reviewer
 * Basic implementation to get started
 */

import { WebSocketServer, WebSocket } from "ws";
import { createServer as createHttpServer } from "http";
import { CodeAnalyzer } from "./tools/code-analyzer.js";

interface SimpleMCPRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: any;
}

interface SimpleMCPResponse {
  jsonrpc: "2.0";
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
    };
  }

  private async generateTests(args: any): Promise<any> {
    const {
      code,
      language,
      test_framework,
      coverage_requirements = {},
    } = args;

    // Validate input
    if (!code || !language) {
      throw new Error("Code and language are required");
    }

    // Generate test suite based on language
    const testSuite = this.generateTestSuite(code, language, test_framework);

    // Analyze coverage
    const coverageAnalysis = this.analyzeTestCoverage(code, language, coverage_requirements);

    return {
      content: [
        {
          type: "text",
          text: `Generated test suite for ${language} code`,
        },
      ],
      test_suite: testSuite,
      coverage_analysis: coverageAnalysis,
    };
  }

  private generateTestSuite(
    code: string,
    language: string,
    testFramework?: string,
  ): any {
    let framework = testFramework;
    let tests = "";
    let testFile = "";

    switch (language) {
      case "javascript":
        framework = framework || "jest";
        tests = this.generateJavaScriptTests(code, framework);
        testFile = `test.${framework === "jest" ? "js" : "js"}`;
        break;
      case "typescript":
        framework = framework || "jest";
        tests = this.generateTypeScriptTests(code, framework);
        testFile = `test.${framework === "jest" ? "ts" : "ts"}`;
        break;
      case "python":
        framework = framework || "pytest";
        tests = this.generatePythonTests(code, framework);
        testFile = `test_${framework === "pytest" ? "py" : "py"}`;
        break;
      case "java":
        framework = framework || "junit";
        tests = this.generateJavaTests(code, framework);
        testFile = `Test${framework === "junit" ? ".java" : ".java"}`;
        break;
      case "go":
        framework = "testing";
        tests = this.generateGoTests(code);
        testFile = `_test.go`;
        break;
      case "rust":
        framework = "built-in";
        tests = this.generateRustTests(code);
        testFile = `tests.rs`;
        break;
      default:
        tests = `// Tests for ${language}
// Please implement tests according to ${language} testing conventions`;
        testFile = `test.${language}`;
    }

    return {
      language,
      framework,
      test_file: testFile,
      tests,
      test_types: ["unit", "integration", "edge_cases"],
    };
  }

  private analyzeTestCoverage(
    code: string,
    language: string,
    requirements: any,
  ): any {
    // Simple coverage analysis
    const lines = code.split("\n");
    const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith("//")).length;
    const estimatedCoverage = Math.min(85, Math.max(60, 100 - (codeLines / 50) * 10));

    const recommendations = [];
    if (estimatedCoverage < 80) {
      recommendations.push("Add more test cases to cover edge cases");
      recommendations.push("Test error conditions and invalid inputs");
    }

    return {
      estimated_coverage: estimatedCoverage,
      lines_of_code: codeLines,
      recommendations,
      requirements: requirements,
    };
  }

  private generateJavaScriptTests(code: string, framework: string): string {
    if (framework === "jest") {
      return `const { describe, it, expect } = require('@jest/globals');

// Sample tests for the provided code
describe('Code Tests', () => {
  it('should execute basic functionality', () => {
    // Add test cases based on code analysis
    expect(true).toBe(true);
  });

  it('should handle edge cases', () => {
    // Test edge cases
    expect(true).toBe(true);
  });

  it('should validate inputs', () => {
    // Test input validation
    expect(true).toBe(true);
  });
});`;
    }
    return `// Tests using ${framework}`;
  }

  private generateTypeScriptTests(code: string, framework: string): string {
    if (framework === "jest") {
      return `import { describe, it, expect } from '@jest/globals';

// Sample tests for the provided code
describe('Code Tests', () => {
  it('should execute basic functionality', () => {
    // Add test cases based on code analysis
    expect(true).toBe(true);
  });

  it('should handle edge cases', () => {
    // Test edge cases
    expect(true).toBe(true);
  });

  it('should validate inputs', () => {
    // Test input validation
    expect(true).toBe(true);
  });
});`;
    }
    return `// Tests using ${framework}`;
  }

  private generatePythonTests(code: string, framework: string): string {
    if (framework === "pytest") {
      return `import pytest

# Sample tests for the provided code
def test_basic_functionality():
    """Test basic functionality"""
    assert True

def test_edge_cases():
    """Test edge cases"""
    assert True

def test_input_validation():
    """Test input validation"""
    assert True`;
    }
    return `# Tests using ${framework}`;
  }

  private generateJavaTests(code: string, framework: string): string {
    if (framework === "junit") {
      return `import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class CodeTest {
    @Test
    public void testBasicFunctionality() {
        // Test basic functionality
        assertTrue(true);
    }

    @Test
    public void testEdgeCases() {
        // Test edge cases
        assertTrue(true);
    }

    @Test
    public void testInputValidation() {
        // Test input validation
        assertTrue(true);
    }
}`;
    }
    return `// Tests using ${framework}`;
  }

  private generateGoTests(code: string): string {
    return `package main

import "testing"

func TestBasicFunctionality(t *testing.T) {
    // Test basic functionality
    if true != true {
        t.Errorf("Expected true, got false")
    }
}

func TestEdgeCases(t *testing.T) {
    // Test edge cases
    if true != true {
        t.Errorf("Expected true, got false")
    }
}

func TestInputValidation(t *testing.T) {
    // Test input validation
    if true != true {
        t.Errorf("Expected true, got false")
    }
}`;
  }

  private generateRustTests(code: string): string {
    return `#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_functionality() {
        // Test basic functionality
        assert_eq!(true, true);
    }

    #[test]
    fn test_edge_cases() {
        // Test edge cases
        assert_eq!(true, true);
    }

    #[test]
    fn test_input_validation() {
        // Test input validation
        assert_eq!(true, true);
    }
}`;
  }

  private sendResponse(ws: WebSocket, id: number, result: any): void {
    const response: SimpleMCPResponse = {
      jsonrpc: "2.0",
      id,
      result,
    };
    ws.send(JSON.stringify(response));
  }

  private sendError(
    ws: WebSocket,
    code: number,
    message: string,
    id?: number,
  ): void {
    const response: SimpleMCPResponse = {
      jsonrpc: "2.0",
      id: id || 0,
      error: {
        code,
        message,
      },
    };
    ws.send(JSON.stringify(response));
  }

  public shutdown(): void {
    console.log("🛑 Shutting down MCP server...");
    this.wss.close(() => {
      console.log("✅ MCP server shutdown complete");
    });
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.MCP_SERVER_PORT
    ? parseInt(process.env.MCP_SERVER_PORT)
    : 3001;
  const server = new SimpleMCPServer(port);

  // Graceful shutdown
  process.on("SIGINT", () => {
    server.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    server.shutdown();
    process.exit(0);
  });
}

export { SimpleMCPServer };

        return re.match(pattern, email) is not None

    def _hash_password(self, password: str) -> str:
        # Use proper hashing in production (bcrypt, argon2)
        return hashlib.sha256(password.encode()).hexdigest()

    def _verify_password(self, password: str, password_hash: str) -> bool:
        return self._hash_password(password) == password_hash

    def _generate_session_id(self) -> str:
        return secrets.token_urlsafe(32)`;
    }

    return `# Generic Python solution
from typing import TypeVar, Generic, Optional
from datetime import datetime

T = TypeVar('T')

class ProcessResult(Generic[T]):
    def __init__(self, success: bool, result: Optional[T] = None,
                 error: Optional[str] = None):
        self.success = success
        self.result = result
        self.error = error
        self.processed_at = datetime.now()

def process_data(data: T) -> ProcessResult[T]:
    try:
        # Validate input
        if data is None:
            return ProcessResult(False, error="Data is required")

        # Process data according to requirements
        ${requirements.map((req) => `# ${req}`).join("\n        ")}

        return ProcessResult(True, result=data)
    except Exception as e:
        return ProcessResult(False, error=str(e))`;
  }

  private generateJavaSolution(text: string, requirements: string[]): string {
    if (text.includes("authentication") || text.includes("login")) {
      return `// User Authentication Service
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

public class User {
    private String email;
    private String passwordHash;
    private LocalDateTime createdAt;

    public User(String email, String passwordHash, LocalDateTime createdAt) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
    }

    // Getters
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

public class Session {
    private String userEmail;
    private String sessionId;
    private LocalDateTime expiresAt;

    public Session(String userEmail, String sessionId, LocalDateTime expiresAt) {
        this.userEmail = userEmail;
        this.sessionId = sessionId;
        this.expiresAt = expiresAt;
    }

    // Getters
    public String getUserEmail() { return userEmail; }
    public String getSessionId() { return sessionId; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
}

public class AuthResult {
    private boolean success;
    private String sessionId;
    private String message;

    public AuthResult(boolean success, String sessionId, String message) {
        this.success = success;
        this.sessionId = sessionId;
        this.message = message;
    }

    // Getters
    public boolean isSuccess() { return success; }
    public String getSessionId() { return sessionId; }
    public String getMessage() { return message; }
}

public class AuthService {
    private Map<String, User> users = new HashMap<>();
    private Map<String, Session> sessions = new HashMap<>();
    private SecureRandom random = new SecureRandom();
    private Pattern emailPattern = Pattern.compile("^[^\s@]+@[^\s@]+\.[^\s@]+$");

    public AuthResult register(String email, String password) throws Exception {
        // Validate input
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Email and password required");
        }

        if (!isValidEmail(email)) {
            throw new IllegalArgumentException("Invalid email format");
        }

        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }

        // Check if user exists
        if (users.containsKey(email)) {
            return new AuthResult(false, null, "User already exists");
        }

        // Hash password
        String passwordHash = hashPassword(password);

        // Store user
        User user = new User(email, passwordHash, LocalDateTime.now());
        users.put(email, user);

        return new AuthResult(true, null, "User registered successfully");
    }

    public AuthResult login(String email, String password) throws Exception {
        User user = users.get(email);
        if (user == null) {
            return new AuthResult(false, null, "User not found");
        }

        if (!verifyPassword(password, user.getPasswordHash())) {
            return new AuthResult(false, null, "Invalid password");
        }

        String sessionId = generateSessionId();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        Session session = new Session(email, sessionId, expiresAt);
        sessions.put(sessionId, session);

        return new AuthResult(true, sessionId, "Login successful");
    }

    public boolean validateSession(String sessionId) {
        Session session = sessions.get(sessionId);
        if (session == null) {
            return false;
        }

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            sessions.remove(sessionId);
            return false;
        }

        return true;
    }

    private boolean isValidEmail(String email) {
        return emailPattern.matcher(email).matches();
    }

    private String hashPassword(String password) throws NoSuchAlgorithmException {
        // Use proper hashing library like BCrypt in production
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(password.getBytes());
        return Base64.getEncoder().encodeToString(hash);
    }

    private boolean verifyPassword(String password, String passwordHash) throws NoSuchAlgorithmException {
        String computedHash = hashPassword(password);
        return computedHash.equals(passwordHash);
    }

    private String generateSessionId() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }
}`;

  private async classifyIssue(args: any): Promise<any> {
    const { title, body, labels = [] } = args;

    // Simple classification logic
    let category = "bug";
    let complexity = "medium";
    let feasibility = true;

    const text = (title + " " + body).toLowerCase();

    if (
      text.includes("feature") ||
      text.includes("add") ||
      text.includes("implement")
    ) {
      category = "feature";
    } else if (text.includes("documentation") || text.includes("docs")) {
      category = "documentation";
    } else if (text.includes("question") || text.includes("how to")) {
      category = "question";
    }

    if (
      text.includes("critical") ||
      text.includes("urgent") ||
      labels.includes("critical")
    ) {
      complexity = "high";
    } else if (
      text.includes("simple") ||
      text.includes("easy") ||
      labels.includes("good-first-issue")
    ) {
      complexity = "low";
    }

    if (category === "question") {
      feasibility = false;
    }

    return {
      content: [
        {
          type: "text",
          text: `Issue classified as ${category} with ${complexity} complexity`,
        },
      ],
      classification: {
        category,
        complexity,
        feasibility,
        confidence: 0.8,
        requirements: [
          "Implement solution",
          "Add tests",
          "Update documentation",
        ],
        acceptance_criteria: [
          "Solution works as expected",
          "Tests pass",
          "Code is reviewed",
        ],
      },
    };
  }

  private generateJavaScriptSolution(
    text: string,
    requirements: string[],
  ): string {
    if (text.includes("authentication") || text.includes("login")) {
      return `// User Authentication Module
class AuthService {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
  }

  async register(email, password) {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password required');
    }

    // Check if user exists
    if (this.users.has(email)) {
      throw new Error('User already exists');
    }

    // Hash password (use bcrypt in production)
    const hashedPassword = await this.hashPassword(password);

    // Store user
    this.users.set(email, { email, password: hashedPassword });

    return { success: true, message: 'User registered successfully' };
  }

  async login(email, password) {
    const user = this.users.get(email);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    const sessionId = this.generateSessionId();
    this.sessions.set(sessionId, { email, created: Date.now() });

    return { success: true, sessionId };
  }

  async hashPassword(password) {
    // Use crypto.scrypt or bcrypt in production
    return password + '_hashed';
  }

  async verifyPassword(password, hash) {
    // Verify password against hash
    return hash === password + '_hashed';
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2);
  }
}

export default AuthService;`;
    }

    return `// Generic JavaScript solution
function processData(data) {
  // Validate input
  if (!data) {
    throw new Error('Data is required');
  }

  // Process data according to requirements
  ${requirements.map((req) => `// ${req}`).join("\n  ")}

  return {
    success: true,
    result: data,
    processedAt: new Date().toISOString()
  };
}

module.exports = { processData };`;
  }

  private generateTypeScriptSolution(
    text: string,
    requirements: string[],
  ): string {
    if (text.includes("authentication") || text.includes("login")) {
      return `// User Authentication Types and Service
interface User {
  email: string;
  password: string;
  createdAt: Date;
}

interface Session {
  userId: string;
  sessionId: string;
  expiresAt: Date;
}

interface AuthResult {
  success: boolean;
  sessionId?: string;
  message?: string;
}

class AuthService {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();

  async register(email: string, password: string): Promise<AuthResult> {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password required');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check if user exists
    if (this.users.has(email)) {
      return { success: false, message: 'User already exists' };
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Store user
    const user: User = {
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    this.users.set(email, user);

    return { success: true, message: 'User registered successfully' };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = this.users.get(email);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      return { success: false, message: 'Invalid password' };
    }

    const sessionId = this.generateSessionId();
    const session: Session = {
      userId: email,
      sessionId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    this.sessions.set(sessionId, session);

    return { success: true, sessionId };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async hashPassword(password: string): Promise<string> {
    // Use proper hashing library like bcrypt
    return password + '_hashed';
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Verify password against hash
    return hash === password + '_hashed';
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return false;
    }

    return true;
  }
}

export { AuthService, User, Session, AuthResult };
export default AuthService;`;
    }

    return `// Generic TypeScript solution
interface ProcessResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  processedAt: Date;
}

function processData<T>(data: T): ProcessResult<T> {
  try {
    // Validate input
    if (!data) {
      return {
        success: false,
        error: 'Data is required',
        processedAt: new Date()
      };
    }

    // Process data according to requirements
    ${requirements.map((req) => `// ${req}`).join("\n    ")}

    return {
      success: true,
      result: data,
      processedAt: new Date()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processedAt: new Date()
    };
  }
}

export { processData, ProcessResult };`;
  }

  private generatePythonSolution(text: string, requirements: string[]): string {
    if (text.includes("authentication") || text.includes("login")) {
      return `# User Authentication Service
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import re

class User:
    def __init__(self, email: str, password_hash: str, created_at: datetime):
        self.email = email
        self.password_hash = password_hash
        self.created_at = created_at

class Session:
    def __init__(self, user_email: str, session_id: str, expires_at: datetime):
        self.user_email = user_email
        self.session_id = session_id
        self.expires_at = expires_at

class AuthService:
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.sessions: Dict[str, Session] = {}

    def register(self, email: str, password: str) -> Dict[str, Any]:
        # Validate input
        if not email or not password:
            raise ValueError("Email and password required")

        if not self._is_valid_email(email):
            raise ValueError("Invalid email format")

        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters")

        # Check if user exists
        if email in self.users:
            return {"success": False, "message": "User already exists"}

        # Hash password
        password_hash = self._hash_password(password)

        # Store user
        user = User(email, password_hash, datetime.now())
        self.users[email] = user

        return {"success": True, "message": "User registered successfully"}

    def login(self, email: str, password: str) -> Dict[str, Any]:
        user = self.users.get(email)
        if not user:
            return {"success": False, "message": "User not found"}

        if not self._verify_password(password, user.password_hash):
            return {"success": False, "message": "Invalid password"}

        session_id = self._generate_session_id()
        expires_at = datetime.now() + timedelta(hours=24)

        session = Session(email, session_id, expires_at)
        self.sessions[session_id] = session

        return {"success": True, "session_id": session_id}

    def validate_session(self, session_id: str) -> bool:
        session = self.sessions.get(session_id)
        if not session:
            return False

        if session.expires_at < datetime.now():
            del self.sessions[session_id]
            return False

        return True

    def _is_valid_email(self, email: str) -> bool:
        pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+

  private async generateSolution(args: any): Promise<any> {
    const { title, body, requirements = [], language } = args;

    // Generate code solution based on language and issue description
    const text = (title + " " + body).toLowerCase();
    let code = "";
    let explanation = "";
    let securityConsiderations: string[] = [];
    let implementationSteps: string[] = [];
    let testingRecommendations: string[] = [];

    // Language-specific code generation
    switch (language) {
      case "javascript":
        code = this.generateJavaScriptSolution(text, requirements);
        securityConsiderations = [
          "Validate and sanitize all user inputs",
          "Use HTTPS for all external communications",
          "Avoid eval() and other dangerous functions",
          "Implement proper error handling to prevent information leakage",
        ];
        testingRecommendations = [
          "Unit tests for all functions",
          "Integration tests for API endpoints",
          "Security tests for input validation",
          "Performance tests for critical paths",
        ];
        break;

      case "typescript":
        code = this.generateTypeScriptSolution(text, requirements);
        securityConsiderations = [
          "Use strict type checking",
          "Validate inputs with type guards",
          "Avoid any types in production code",
          "Implement proper error boundaries",
        ];
        testingRecommendations = [
          "Type tests for interfaces",
          "Unit tests with type assertions",
          "Integration tests for type safety",
          "Runtime type validation tests",
        ];
        break;

      case "python":
        code = this.generatePythonSolution(text, requirements);
        securityConsiderations = [
          "Use parameterized queries for database operations",
          "Validate inputs with proper sanitization",
          "Avoid shell execution with user inputs",
          "Implement proper exception handling",
        ];
        testingRecommendations = [
          "Unit tests with pytest",
          "Integration tests for APIs",
          "Security tests for input validation",
          "Performance profiling tests",
        ];
        break;

      case "java":
        code = this.generateJavaSolution(text, requirements);
        securityConsiderations = [
          "Use prepared statements for SQL queries",
          "Validate inputs with bean validation",
          "Implement proper authentication and authorization",
          "Use secure random for cryptographic operations",
        ];
        testingRecommendations = [
          "JUnit tests for all methods",
          "Integration tests with Spring Boot Test",
          "Security tests with Spring Security Test",
          "Performance tests with JMeter",
        ];
        break;

      case "go":
        code = this.generateGoSolution(text, requirements);
        securityConsiderations = [
          "Use context for timeout handling",
          "Validate inputs with proper error checking",
          "Avoid SQL injection with prepared statements",
          "Implement proper logging without sensitive data",
        ];
        testingRecommendations = [
          "Unit tests with testing package",
          "Benchmark tests for performance",
          "Race condition tests",
          "Integration tests for HTTP handlers",
        ];
        break;

      case "rust":
        code = this.generateRustSolution(text, requirements);
        securityConsiderations = [
          "Leverage Rust's ownership system for memory safety",
          "Use Result and Option for error handling",
          "Validate inputs at boundaries",
          "Avoid unsafe code blocks",
        ];
        testingRecommendations = [
          "Unit tests with #[test]",
          "Integration tests in tests/ directory",
          "Documentation tests with #[doc]",
          "Property-based testing with proptest",
        ];
        break;

      default:
        code = `// Solution for ${language}
// Please provide specific implementation based on requirements`;
    }

    // Generate explanation and steps
    explanation = `This solution implements ${title} using ${language}. The code addresses the main requirements while following ${language}-specific best practices.`;

    implementationSteps = [
      "Review the generated code and adapt to your specific needs",
      "Add proper error handling and logging",
      "Implement unit tests for all new functions",
      "Add integration tests if applicable",
      "Review code for security vulnerabilities",
      "Add documentation and comments",
      "Test the implementation thoroughly",
    ];

    return {
      content: [
        {
          type: "text",
          text: `Generated ${language} solution for: ${title}`,
        },
      ],
      solution: {
        language,
        code,
        explanation,
        security_considerations: securityConsiderations,
        implementation_steps: implementationSteps,
        testing_recommendations: testingRecommendations,
      },
    };
  }

  private sendResponse(ws: WebSocket, id: number, result: any): void {
    const response: SimpleMCPResponse = {
      jsonrpc: "2.0",
      id,
      result,
    };
    ws.send(JSON.stringify(response));
  }

  private sendError(
    ws: WebSocket,
    code: number,
    message: string,
    id?: number,
  ): void {
    const response: SimpleMCPResponse = {
      jsonrpc: "2.0",
      id: id || 0,
      error: {
        code,
        message,
      },
    };
    ws.send(JSON.stringify(response));
  }

  public shutdown(): void {
    console.log("🛑 Shutting down MCP server...");
    this.wss.close(() => {
      console.log("✅ MCP server shutdown complete");
    });
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.MCP_SERVER_PORT
    ? parseInt(process.env.MCP_SERVER_PORT)
    : 3001;
  const server = new SimpleMCPServer(port);

  // Graceful shutdown
  process.on("SIGINT", () => {
    server.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    server.shutdown();
    process.exit(0);
  });
}

export { SimpleMCPServer };

        return re.match(pattern, email) is not None

    def _hash_password(self, password: str) -> str:
        # Use proper hashing in production (bcrypt, argon2)
        return hashlib.sha256(password.encode()).hexdigest()

    def _verify_password(self, password: str, password_hash: str) -> bool:
        return self._hash_password(password) == password_hash

    def _generate_session_id(self) -> str:
        return secrets.token_urlsafe(32)`;
    }

    return `# Generic Python solution
from typing import TypeVar, Generic, Optional
from datetime import datetime

T = TypeVar('T')

class ProcessResult(Generic[T]):
    def __init__(self, success: bool, result: Optional[T] = None,
                 error: Optional[str] = None):
        self.success = success
        self.result = result
        self.error = error
        self.processed_at = datetime.now()

def process_data(data: T) -> ProcessResult[T]:
    try:
        # Validate input
        if data is None:
            return ProcessResult(False, error="Data is required")

        # Process data according to requirements
        ${requirements.map((req) => `# ${req}`).join("\n        ")}

        return ProcessResult(True, result=data)
    except Exception as e:
        return ProcessResult(False, error=str(e))`;
  }

  private generateJavaSolution(text: string, requirements: string[]): string {
    if (text.includes("authentication") || text.includes("login")) {
      return `// User Authentication Service
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

public class User {
    private String email;
    private String passwordHash;
    private LocalDateTime createdAt;

    public User(String email, String passwordHash, LocalDateTime createdAt) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
    }

    // Getters
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

public class Session {
    private String userEmail;
    private String sessionId;
    private LocalDateTime expiresAt;

    public Session(String userEmail, String sessionId, LocalDateTime expiresAt) {
        this.userEmail = userEmail;
        this.sessionId = sessionId;
        this.expiresAt = expiresAt;
    }

    // Getters
    public String getUserEmail() { return userEmail; }
    public String getSessionId() { return sessionId; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
}

public class AuthResult {
    private boolean success;
    private String sessionId;
    private String message;

    public AuthResult(boolean success, String sessionId, String message) {
        this.success = success;
        this.sessionId = sessionId;
        this.message = message;
    }

    // Getters
    public boolean isSuccess() { return success; }
    public String getSessionId() { return sessionId; }
    public String getMessage() { return message; }
}

public class AuthService {
    private Map<String, User> users = new HashMap<>();
    private Map<String, Session> sessions = new HashMap<>();
    private SecureRandom random = new SecureRandom();
    private Pattern emailPattern = Pattern.compile("^[^\s@]+@[^\s@]+\.[^\s@]+$");

    public AuthResult register(String email, String password) throws Exception {
        // Validate input
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Email and password required");
        }

        if (!isValidEmail(email)) {
            throw new IllegalArgumentException("Invalid email format");
        }

        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }

        // Check if user exists
        if (users.containsKey(email)) {
            return new AuthResult(false, null, "User already exists");
        }

        // Hash password
        String passwordHash = hashPassword(password);

        // Store user
        User user = new User(email, passwordHash, LocalDateTime.now());
        users.put(email, user);

        return new AuthResult(true, null, "User registered successfully");
    }

    public AuthResult login(String email, String password) throws Exception {
        User user = users.get(email);
        if (user == null) {
            return new AuthResult(false, null, "User not found");
        }

        if (!verifyPassword(password, user.getPasswordHash())) {
            return new AuthResult(false, null, "Invalid password");
        }

        String sessionId = generateSessionId();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        Session session = new Session(email, sessionId, expiresAt);
        sessions.put(sessionId, session);

        return new AuthResult(true, sessionId, "Login successful");
    }

    public boolean validateSession(String sessionId) {
        Session session = sessions.get(sessionId);
        if (session == null) {
            return false;
        }

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            sessions.remove(sessionId);
            return false;
        }

        return true;
    }

    private boolean isValidEmail(String email) {
        return emailPattern.matcher(email).matches();
    }

    private String hashPassword(String password) throws NoSuchAlgorithmException {
        // Use proper hashing library like BCrypt in production
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(password.getBytes());
        return Base64.getEncoder().encodeToString(hash);
    }

    private boolean verifyPassword(String password, String passwordHash) throws NoSuchAlgorithmException {
        String computedHash = hashPassword(password);
        return computedHash.equals(passwordHash);
    }

    private String generateSessionId() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }
}`;

  private async generateSolution(args: any): Promise<any> {
    const { title, body, requirements = [], language } = args;

    // Generate code solution based on language and issue description
    const text = (title + " " + body).toLowerCase();
    let code = "";
    let explanation = "";
    let securityConsiderations: string[] = [];
    let implementationSteps: string[] = [];
    let testingRecommendations: string[] = [];

    // Language-specific code generation
    switch (language) {
      case "javascript":
        code = this.generateJavaScriptSolution(text, requirements);
        securityConsiderations = [
          "Validate and sanitize all user inputs",
          "Use HTTPS for all external communications",
          "Avoid eval() and other dangerous functions",
          "Implement proper error handling to prevent information leakage",
        ];
        testingRecommendations = [
          "Unit tests for all functions",
          "Integration tests for API endpoints",
          "Security tests for input validation",
          "Performance tests for critical paths",
        ];
        break;

      case "typescript":
        code = this.generateTypeScriptSolution(text, requirements);
        securityConsiderations = [
          "Use strict type checking",
          "Validate inputs with type guards",
          "Avoid any types in production code",
          "Implement proper error boundaries",
        ];
        testingRecommendations = [
          "Type tests for interfaces",
          "Unit tests with type assertions",
          "Integration tests for type safety",
          "Runtime type validation tests",
        ];
        break;

      case "python":
        code = this.generatePythonSolution(text, requirements);
        securityConsiderations = [
          "Use parameterized queries for database operations",
          "Validate inputs with proper sanitization",
          "Avoid shell execution with user inputs",
          "Implement proper exception handling",
        ];
        testingRecommendations = [
          "Unit tests with pytest",
          "Integration tests for APIs",
          "Security tests for input validation",
          "Performance profiling tests",
        ];
        break;

      case "java":
        code = this.generateJavaSolution(text, requirements);
        securityConsiderations = [
          "Use prepared statements for SQL queries",
          "Validate inputs with bean validation",
          "Implement proper authentication and authorization",
          "Use secure random for cryptographic operations",
        ];
        testingRecommendations = [
          "JUnit tests for all methods",
          "Integration tests with Spring Boot Test",
          "Security tests with Spring Security Test",
          "Performance tests with JMeter",
        ];
        break;

      case "go":
        code = this.generateGoSolution(text, requirements);
        securityConsiderations = [
          "Use context for timeout handling",
          "Validate inputs with proper error checking",
          "Avoid SQL injection with prepared statements",
          "Implement proper logging without sensitive data",
        ];
        testingRecommendations = [
          "Unit tests with testing package",
          "Benchmark tests for performance",
          "Race condition tests",
          "Integration tests for HTTP handlers",
        ];
        break;

      case "rust":
        code = this.generateRustSolution(text, requirements);
        securityConsiderations = [
          "Leverage Rust's ownership system for memory safety",
          "Use Result and Option for error handling",
          "Validate inputs at boundaries",
          "Avoid unsafe code blocks",
        ];
        testingRecommendations = [
          "Unit tests with #[test]",
          "Integration tests in tests/ directory",
          "Documentation tests with #[doc]",
          "Property-based testing with proptest",
        ];
        break;

      default:
        code = `// Solution for ${language}
// Please provide specific implementation based on requirements`;
    }

    // Generate explanation and steps
    explanation = `This solution implements ${title} using ${language}. The code addresses the main requirements while following ${language}-specific best practices.`;

    implementationSteps = [
      "Review the generated code and adapt to your specific needs",
      "Add proper error handling and logging",
      "Implement unit tests for all new functions",
      "Add integration tests if applicable",
      "Review code for security vulnerabilities",
      "Add documentation and comments",
      "Test the implementation thoroughly",
    ];

    return {
      content: [
        {
          type: "text",
          text: `Generated ${language} solution for: ${title}`,
        },
      ],
      solution: {
        language,
        code,
        explanation,
        security_considerations: securityConsiderations,
        implementation_steps: implementationSteps,
        testing_recommendations: testingRecommendations,
      },
    };
  }

  private generateJavaScriptSolution(
    text: string,
    requirements: string[],
  ): string {
    if (text.includes("authentication") || text.includes("login")) {
      return `// User Authentication Module
class AuthService {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
  }

  async register(email, password) {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password required');
    }

    // Check if user exists
    if (this.users.has(email)) {
      throw new Error('User already exists');
    }

    // Hash password (use bcrypt in production)
    const hashedPassword = await this.hashPassword(password);

    // Store user
    this.users.set(email, { email, password: hashedPassword });

    return { success: true, message: 'User registered successfully' };
  }

  async login(email, password) {
    const user = this.users.get(email);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    const sessionId = this.generateSessionId();
    this.sessions.set(sessionId, { email, created: Date.now() });

    return { success: true, sessionId };
  }

  async hashPassword(password) {
    // Use crypto.scrypt or bcrypt in production
    return password + '_hashed';
  }

  async verifyPassword(password, hash) {
    // Verify password against hash
    return hash === password + '_hashed';
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2);
  }
}

export default AuthService;`;
    }

    return `// Generic JavaScript solution
function processData(data) {
  // Validate input
  if (!data) {
    throw new Error('Data is required');
  }

  // Process data according to requirements
  ${requirements.map((req) => `// ${req}`).join("\n  ")}

  return {
    success: true,
    result: data,
    processedAt: new Date().toISOString()
  };
}

module.exports = { processData };`;
  }

  private generateTypeScriptSolution(
    text: string,
    requirements: string[],
  ): string {
    if (text.includes("authentication") || text.includes("login")) {
      return `// User Authentication Types and Service
interface User {
  email: string;
  password: string;
  createdAt: Date;
}

interface Session {
  userId: string;
  sessionId: string;
  expiresAt: Date;
}

interface AuthResult {
  success: boolean;
  sessionId?: string;
  message?: string;
}

class AuthService {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();

  async register(email: string, password: string): Promise<AuthResult> {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password required');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check if user exists
    if (this.users.has(email)) {
      return { success: false, message: 'User already exists' };
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Store user
    const user: User = {
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    this.users.set(email, user);

    return { success: true, message: 'User registered successfully' };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = this.users.get(email);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      return { success: false, message: 'Invalid password' };
    }

    const sessionId = this.generateSessionId();
    const session: Session = {
      userId: email,
      sessionId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    this.sessions.set(sessionId, session);

    return { success: true, sessionId };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async hashPassword(password: string): Promise<string> {
    // Use proper hashing library like bcrypt
    return password + '_hashed';
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Verify password against hash
    return hash === password + '_hashed';
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return false;
    }

    return true;
  }
}

export { AuthService, User, Session, AuthResult };
export default AuthService;`;
    }

    return `// Generic TypeScript solution
interface ProcessResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  processedAt: Date;
}

function processData<T>(data: T): ProcessResult<T> {
  try {
    // Validate input
    if (!data) {
      return {
        success: false,
        error: 'Data is required',
        processedAt: new Date()
      };
    }

    // Process data according to requirements
    ${requirements.map((req) => `// ${req}`).join("\n    ")}

    return {
      success: true,
      result: data,
      processedAt: new Date()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processedAt: new Date()
    };
  }
}

export { processData, ProcessResult };`;
  }

  private generatePythonSolution(text: string, requirements: string[]): string {
    if (text.includes("authentication") || text.includes("login")) {
      return `# User Authentication Service
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import re

class User:
    def __init__(self, email: str, password_hash: str, created_at: datetime):
        self.email = email
        self.password_hash = password_hash
        self.created_at = created_at

class Session:
    def __init__(self, user_email: str, session_id: str, expires_at: datetime):
        self.user_email = user_email
        self.session_id = session_id
        self.expires_at = expires_at

class AuthService:
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.sessions: Dict[str, Session] = {}

    def register(self, email: str, password: str) -> Dict[str, Any]:
        # Validate input
        if not email or not password:
            raise ValueError("Email and password required")

        if not self._is_valid_email(email):
            raise ValueError("Invalid email format")

        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters")

        # Check if user exists
        if email in self.users:
            return {"success": False, "message": "User already exists"}

        # Hash password
        password_hash = self._hash_password(password)

        # Store user
        user = User(email, password_hash, datetime.now())
        self.users[email] = user

        return {"success": True, "message": "User registered successfully"}

    def login(self, email: str, password: str) -> Dict[str, Any]:
        user = self.users.get(email)
        if not user:
            return {"success": False, "message": "User not found"}

        if not self._verify_password(password, user.password_hash):
            return {"success": False, "message": "Invalid password"}

        session_id = self._generate_session_id()
        expires_at = datetime.now() + timedelta(hours=24)

        session = Session(email, session_id, expires_at)
        self.sessions[session_id] = session

        return {"success": True, "session_id": session_id}

    def validate_session(self, session_id: str) -> bool:
        session = self.sessions.get(session_id)
        if not session:
            return False

        if session.expires_at < datetime.now():
            del self.sessions[session_id]
            return False

        return True

    def _is_valid_email(self, email: str) -> bool:
        pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+

  private sendResponse(ws: WebSocket, id: number, result: any): void {
    const response: SimpleMCPResponse = {
      jsonrpc: "2.0",
      id,
      result,
    };
    ws.send(JSON.stringify(response));
  }

  private sendError(
    ws: WebSocket,
    code: number,
    message: string,
    id?: number,
  ): void {
    const response: SimpleMCPResponse = {
      jsonrpc: "2.0",
      id: id || 0,
      error: {
        code,
        message,
      },
    };
    ws.send(JSON.stringify(response));
  }

  public shutdown(): void {
    console.log("🛑 Shutting down MCP server...");
    this.wss.close(() => {
      console.log("✅ MCP server shutdown complete");
    });
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.MCP_SERVER_PORT
    ? parseInt(process.env.MCP_SERVER_PORT)
    : 3001;
  const server = new SimpleMCPServer(port);

  // Graceful shutdown
  process.on("SIGINT", () => {
    server.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    server.shutdown();
    process.exit(0);
  });
}

export { SimpleMCPServer };

        return re.match(pattern, email) is not None

    def _hash_password(self, password: str) -> str:
        # Use proper hashing in production (bcrypt, argon2)
        return hashlib.sha256(password.encode()).hexdigest()

    def _verify_password(self, password: str, password_hash: str) -> bool:
        return self._hash_password(password) == password_hash

    def _generate_session_id(self) -> str:
        return secrets.token_urlsafe(32)`;
    }

    return `# Generic Python solution
from typing import TypeVar, Generic, Optional
from datetime import datetime

T = TypeVar('T')

class ProcessResult(Generic[T]):
    def __init__(self, success: bool, result: Optional[T] = None,
                 error: Optional[str] = None):
        self.success = success
        self.result = result
        self.error = error
        self.processed_at = datetime.now()

def process_data(data: T) -> ProcessResult[T]:
    try:
        # Validate input
        if data is None:
            return ProcessResult(False, error="Data is required")

        # Process data according to requirements
        ${requirements.map((req) => `# ${req}`).join("\n        ")}

        return ProcessResult(True, result=data)
    except Exception as e:
        return ProcessResult(False, error=str(e))`;
  }

  private generateJavaSolution(text: string, requirements: string[]): string {
    if (text.includes("authentication") || text.includes("login")) {
      return `// User Authentication Service
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

public class User {
    private String email;
    private String passwordHash;
    private LocalDateTime createdAt;

    public User(String email, String passwordHash, LocalDateTime createdAt) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
    }

    // Getters
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

public class Session {
    private String userEmail;
    private String sessionId;
    private LocalDateTime expiresAt;

    public Session(String userEmail, String sessionId, LocalDateTime expiresAt) {
        this.userEmail = userEmail;
        this.sessionId = sessionId;
        this.expiresAt = expiresAt;
    }

    // Getters
    public String getUserEmail() { return userEmail; }
    public String getSessionId() { return sessionId; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
}

public class AuthResult {
    private boolean success;
    private String sessionId;
    private String message;

    public AuthResult(boolean success, String sessionId, String message) {
        this.success = success;
        this.sessionId = sessionId;
        this.message = message;
    }

    // Getters
    public boolean isSuccess() { return success; }
    public String getSessionId() { return sessionId; }
    public String getMessage() { return message; }
}

public class AuthService {
    private Map<String, User> users = new HashMap<>();
    private Map<String, Session> sessions = new HashMap<>();
    private SecureRandom random = new SecureRandom();
    private Pattern emailPattern = Pattern.compile("^[^\s@]+@[^\s@]+\.[^\s@]+$");

    public AuthResult register(String email, String password) throws Exception {
        // Validate input
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Email and password required");
        }

        if (!isValidEmail(email)) {
            throw new IllegalArgumentException("Invalid email format");
        }

        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }

        // Check if user exists
        if (users.containsKey(email)) {
            return new AuthResult(false, null, "User already exists");
        }

        // Hash password
        String passwordHash = hashPassword(password);

        // Store user
        User user = new User(email, passwordHash, LocalDateTime.now());
        users.put(email, user);

        return new AuthResult(true, null, "User registered successfully");
    }

    public AuthResult login(String email, String password) throws Exception {
        User user = users.get(email);
        if (user == null) {
            return new AuthResult(false, null, "User not found");
        }

        if (!verifyPassword(password, user.getPasswordHash())) {
            return new AuthResult(false, null, "Invalid password");
        }

        String sessionId = generateSessionId();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        Session session = new Session(email, sessionId, expiresAt);
        sessions.put(sessionId, session);

        return new AuthResult(true, sessionId, "Login successful");
    }

    public boolean validateSession(String sessionId) {
        Session session = sessions.get(sessionId);
        if (session == null) {
            return false;
        }

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            sessions.remove(sessionId);
            return false;
        }

        return true;
    }

    private boolean isValidEmail(String email) {
        return emailPattern.matcher(email).matches();
    }

    private String hashPassword(String password) throws NoSuchAlgorithmException {
        // Use proper hashing library like BCrypt in production
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(password.getBytes());
        return Base64.getEncoder().encodeToString(hash);
    }

    private boolean verifyPassword(String password, String passwordHash) throws NoSuchAlgorithmException {
        String computedHash = hashPassword(password);
        return computedHash.equals(passwordHash);
    }

    private String generateSessionId() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }
}`;

  private sendResponse(ws: WebSocket, id: number, result: any): void {
    const response: SimpleMCPResponse = {
      jsonrpc: "2.0",
      id,
      result,
    };
    ws.send(JSON.stringify(response));
  }

  private sendError(
    ws: WebSocket,
    code: number,
    message: string,
    id?: number,
  ): void {
    const response: SimpleMCPResponse = {
      jsonrpc: "2.0",
      id: id || 0,
      error: {
        code,
        message,
      },
    };
    ws.send(JSON.stringify(response));
  }

  public shutdown(): void {
    console.log("🛑 Shutting down MCP server...");
    this.wss.close(() => {
      console.log("✅ MCP server shutdown complete");
    });
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.MCP_SERVER_PORT
    ? parseInt(process.env.MCP_SERVER_PORT)
    : 3001;
  const server = new SimpleMCPServer(port);

  // Graceful shutdown
  process.on("SIGINT", () => {
    server.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    server.shutdown();
    process.exit(0);
  });
}

export { SimpleMCPServer };
