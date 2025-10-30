# Future Improvements - OpenCode Integration

## 📋 Remaining Tasks for Implementation

This file contains prioritized tasks identified during the OpenCode integration verification process. These are optional improvements that can enhance the system over time.

## 🔴 High Priority

### 1. Fix MCP Test Suite Syntax Errors
**Location:** `.opencode/tool/mcp/*.test.ts`
**Issue:** Multiple test files have syntax errors preventing proper execution
**Impact:** Testing reliability compromised, CI/CD failures possible
**Estimated Time:** 2-4 hours

**Specific Issues:**
- `config-loader.test.ts`: Unexpected `}` at line 562
- `client-headers.test.ts`: Incorrect test expectations for header masking
- `context7-integration.test.ts`: Timeout issues and assertion failures

**Implementation Steps:**
1. Fix syntax error in config-loader.test.ts
2. Update test expectations to match actual implementation behavior
3. Resolve timeout issues in integration tests
4. Run full test suite and verify all tests pass

**Verification:** `npm run test:run` passes with 0 failures

---

## 🟡 Medium Priority

### 2. Update ESLint Configuration for Test Files
**Location:** ESLint configuration (likely `.eslintrc.js` or `eslint.config.js`)
**Issue:** Console statements in test files flagged as warnings/errors
**Impact:** Code quality checks failing unnecessarily
**Estimated Time:** 1-2 hours

**Specific Issues:**
- 12 console statement warnings in `src/scripts/validation.test.ts`
- 1 unused variable error in `src/scripts/index.ts`
- Console statements expected in test files for debugging

**Implementation Steps:**
1. Locate ESLint configuration file
2. Add test file overrides to allow console statements
3. Configure different rules for `*.test.ts` files
4. Fix the unused variable in production code
5. Run `npm run lint` and verify clean output

**Verification:** `npm run lint` passes with 0 errors (warnings acceptable in test files)

---

### 3. Add Environment Variable Validation
**Location:** Application startup and `.opencode/tool/env/`
**Issue:** No validation of required environment variables on startup
**Impact:** Runtime failures when required variables missing
**Estimated Time:** 2-3 hours

**Specific Issues:**
- Critical variables like `GEMINI_API_KEY` could be missing
- No early failure detection for configuration issues
- Poor error messages when environment not properly configured

**Implementation Steps:**
1. Create environment validation utility in `.opencode/tool/env/`
2. Define required vs optional variables
3. Add validation to application startup
4. Provide clear error messages with setup instructions
5. Test with missing/invalid environment variables

**Required Variables to Validate:**
- `GEMINI_API_KEY` (required for image tools)
- `CONTEXT7_API_KEY` (required for MCP integration)
- `TELEGRAM_BOT_TOKEN` (required for notifications)
- `TELEGRAM_CHAT_ID` (required for notifications)

**Verification:** Application fails fast with clear error messages when required variables missing

---

## 🟢 Low Priority

### 4. Enhance Command Documentation
**Location:** `.opencode/command/*.md`
**Issue:** Some commands lack detailed usage examples and edge cases
**Impact:** Developer experience could be improved
**Estimated Time:** 4-6 hours

**Specific Commands Needing Enhancement:**
- `/clean`: Add examples of what gets cleaned and before/after comparisons
- `/commit`: Add more diverse commit message examples and edge cases
- `/context`: Add specific analysis scenarios and output examples
- `/optimize`: Add sample analysis reports and recommendations

**Implementation Steps:**
1. Review each command's current documentation
2. Add practical usage examples
3. Include edge cases and error scenarios
4. Add before/after examples where applicable
5. Test documentation accuracy by following examples

**Documentation Template to Follow:**
```markdown
## Usage Examples

### Basic Usage
[Simple example with expected output]

### Advanced Usage
[Complex example with all options]

### Edge Cases
[What happens with invalid input, missing files, etc.]

### Error Handling
[Common errors and how to resolve them]
```

**Verification:** Each command has comprehensive examples that developers can follow

---

## 📊 Implementation Priority Matrix

| Task | Priority | Impact | Effort | ROI |
|------|----------|--------|--------|-----|
| Fix MCP Tests | High | High | Medium | High |
| ESLint Config | Medium | Medium | Low | High |
| Env Validation | Medium | High | Medium | High |
| Command Docs | Low | Low | Medium | Medium |

## 🎯 Implementation Guidelines

### Code Standards
- Follow existing TypeScript patterns in the codebase
- Maintain consistency with current error handling
- Add appropriate tests for new functionality
- Update documentation as changes are made

### Testing
- Test all changes thoroughly before committing
- Ensure existing functionality remains intact
- Add tests for new validation/error handling
- Verify integration with existing systems

### Documentation
- Update this file as tasks are completed
- Add implementation notes and lessons learned
- Document any breaking changes or new dependencies

## 📅 Timeline Suggestions

- **Week 1:** Fix MCP test suite (High priority, blocking)
- **Week 2:** Update ESLint config + Environment validation (Medium priority, important)
- **Month 1:** Enhance command documentation (Low priority, nice-to-have)

## ✅ Completion Checklist

- [ ] MCP test suite passes completely
- [ ] ESLint runs cleanly on all files
- [ ] Environment validation provides clear error messages
- [ ] All commands have comprehensive documentation
- [ ] All changes tested and verified
- [ ] Documentation updated to reflect changes

---

*This file was generated during OpenCode integration verification on 2025-10-30. Last updated: 2025-10-30*