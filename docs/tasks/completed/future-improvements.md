# Future Improvements - OpenCode Integration

## 📋 Remaining Tasks for Implementation

This file contains prioritized tasks identified during the OpenCode integration verification process. These are optional improvements that can enhance the system over time.

**Status Update (2025-11-21):** All planned improvements have been successfully completed. The MCP implementation is **100% complete** with all integrations fully functional and production-ready. All configuration issues have been resolved and the system is ready for production use.

## 🔴 High Priority

### 1. Fix Vitest Configuration for MCP Tests

**Location:** `vitest.config.ts`
**Issue:** MCP test files in `.opencode/tool/mcp/` are excluded from test execution
**Impact:** Cannot run MCP tests, testing coverage incomplete
**Estimated Time:** 30 minutes

**Specific Issues:**

- Vitest config excludes `.opencode` directory entirely
- Test files exist but cannot be executed
- Need to add `.opencode/**/*.test.{ts,js}` to include pattern

**Implementation Steps:**

1. Update `vitest.config.ts` to include MCP test files
2. Test that MCP tests can be discovered and run
3. Verify test execution works with `npm run test:run`

**Verification:** `npm run test:run .opencode/tool/mcp/*.test.ts` discovers and runs tests

---

### 2. Fix Gemini MCP URL Configuration

**Location:** `mcp-config.json` and Gemini factory
**Issue:** Gemini integration fails with 404 error due to incorrect URL
**Impact:** Cannot use Gemini MCP tools for image generation
**Estimated Time:** 1 hour

**Specific Issues:**

- Current URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`
- Should be base URL: `https://generativelanguage.googleapis.com/v1beta`
- Factory creates incorrect full URLs

**Implementation Steps:**

1. Update Gemini factory to use correct base URL
2. Test Gemini connection with valid API key
3. Verify image generation tools work

**Verification:** Gemini MCP client can connect and list tools successfully

## 🟡 Medium Priority

### 3. Update ESLint Configuration for Test Files

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

### 4. Add Environment Variable Validation

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

### 5. Fix Parameter Validation Bug in MCP Tools

**Location:** `.opencode/tool/mcp/tools.ts:118`
**Issue:** Type validation too strict, rejects valid JavaScript numbers for integer parameters
**Impact:** Tool calls fail when passing valid numeric parameters
**Estimated Time:** 30 minutes

**Specific Issues:**

- `typeof value !== paramSchema.type` check fails for integer types
- JavaScript numbers should be accepted for integer parameters
- Need to allow `typeof value === 'number'` for integer types

**Implementation Steps:**

1. Update parameter validation logic in `validateParameters` method
2. Allow JavaScript numbers for integer schema types
3. Test with tools that require integer parameters

**Verification:** Tool calls with numeric parameters work correctly

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

| Task                     | Priority | Impact | Effort | ROI    |
| ------------------------ | -------- | ------ | ------ | ------ |
| Fix Vitest Config        | High     | Medium | Low    | High   |
| Fix Gemini URL           | High     | Medium | Low    | High   |
| Fix Parameter Validation | Medium   | Low    | Low    | High   |
| ESLint Config            | Medium   | Medium | Low    | High   |
| Env Validation           | Medium   | High   | Medium | High   |
| Command Docs             | Low      | Low    | Medium | Medium |

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

- **Week 1:** Fix Vitest config + Gemini URL + Parameter validation (High priority, quick wins)
- **Week 2:** Update ESLint config + Environment validation (Medium priority, important)
- **Month 1:** Enhance command documentation (Low priority, nice-to-have)

## ✅ Completion Checklist

- [x] MCP core infrastructure implemented (Client, Tools, Resources, Health Monitor)
- [x] Context7 integration fully functional and production-ready
- [x] Demo scripts working and demonstrating full functionality
- [x] Vitest configuration updated for MCP tests
- [x] Gemini URL configuration fixed
- [x] Parameter validation bug fixed
- [x] ESLint runs cleanly on all files
- [x] Environment validation provides clear error messages
- [x] All commands have comprehensive documentation
- [x] All changes tested and verified
- [x] Documentation updated to reflect changes

**Current Status: 11/11 tasks completed (100%) → All planned improvements successfully implemented and verified**

**✅ Cloudflare MCP Integration: Fully functional and production-ready. Successfully generates images using Flux-1-Schnell and Stable Diffusion models.**

## 📝 Completion Notes

All future improvements have been successfully implemented and tested. The system now has:

- Full MCP test coverage with Vitest configuration updated
- Correct Gemini URL configuration enabling image generation tools
- Fixed parameter validation allowing proper numeric inputs
- Clean ESLint configuration with appropriate test file rules
- Comprehensive environment variable validation with clear error messages
- Enhanced command documentation with usage examples and edge cases

The OpenCode integration is now 100% complete and production-ready. All high and medium priority tasks have been addressed, and the low priority documentation enhancements have been completed for improved developer experience.

---

_This file was generated during OpenCode integration verification on 2025-10-30. Completed: 2025-11-21 after successful implementation of all planned improvements._
