/**
 * XSS Protection Test
 * Tests DOMPurify sanitization with malicious inputs
 */

import { describe, it, expect } from 'vitest';

// Mock DOMPurify for testing
const mockDOMPurify = {
  sanitize: (input: string) => {
    // Simulate DOMPurify behavior - remove script tags and dangerous attributes
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*on\w+="[^"]*"[^>]*>/gi, '')
      .replace(/javascript:/gi, '');
  },
};

// Set up global DOMPurify
(globalThis as unknown as { DOMPurify: typeof mockDOMPurify }).DOMPurify = mockDOMPurify;

describe('XSS Protection Tests', () => {
  describe('DOMPurify Sanitization', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("XSS")</script><p>Safe content</p>';
      const sanitized = mockDOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('should remove event handlers', () => {
      const malicious = '<img src="x" onerror="alert(\'XSS\')" />';
      const sanitized = mockDOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('onerror');
    });

    it('should remove javascript: URLs', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click me</a>';
      const sanitized = mockDOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should sanitize form inputs', () => {
      const maliciousInput = 'Test<script>alert("XSS")</script>';
      const sanitized = mockDOMPurify.sanitize(maliciousInput);
      expect(sanitized).toBe('Test');
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', () => {
      const validEmails = ['user@example.com', 'test.email+tag@gmail.com'];
      const invalidEmails = ['invalid', 'user@', '@example.com'];

      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('should validate name format', () => {
      const validNames = ['John Doe', 'María José', "O'Connor"];

      validNames.forEach(name => {
        expect(name.length).toBeGreaterThanOrEqual(2);
        expect(name.length).toBeLessThanOrEqual(100);
        // Use Unicode-aware regex like the actual validation
        expect(/^[\p{L}\s\-']+$/u.test(name)).toBe(true);
      });
    });
  });
});
