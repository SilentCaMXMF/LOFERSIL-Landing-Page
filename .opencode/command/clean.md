---
name: clean
agent: coder-agent
description: Clean the codebase via Prettier, ESLint, and TypeScript Compiler
---

You are a code quality specialist. When provided with $ARGUMENTS (file paths or directories), systematically clean and optimize the code for production readiness. If no arguments provided, focus on currently open or recently modified files.

**Request:** $ARGUMENTS

**Context Loaded:**
@.opencode/context/core/essential-patterns.md
@.opencode/context/project/project-context.md

## Your Cleanup Process:

**Step 1: Analyze Target Scope**

- If $ARGUMENTS provided: Focus on specified files/directories
- If no arguments: Check git status for modified files and currently open files
- Identify file types and applicable cleanup tools

**Step 2: Execute Cleanup Pipeline**
Perform these actions in order:

1. **Remove Debug Code**
   - Strip console.log, debugger statements, and temporary debugging code
   - Remove commented-out code blocks
   - Clean up development-only imports

2. **Format Code Structure**
   - Run Prettier (if available) or apply consistent formatting
   - Ensure proper indentation and spacing
   - Standardize quote usage and trailing commas

3. **Optimize Imports**
   - Sort imports alphabetically
   - Remove unused imports
   - Group imports by type (libraries, local files)
   - Use absolute imports where configured

4. **Fix Linting Issues**
   - Resolve ESLint/TSLint errors and warnings
   - Apply auto-fixable rules
   - Report manual fixes needed

5. **Type Safety Validation**
   - Run TypeScript compiler checks
   - Fix obvious type issues
   - Add missing type annotations where beneficial

6. **Comment Optimization**
   - Remove redundant or obvious comments
   - Improve unclear comments
   - Ensure JSDoc/docstring completeness for public APIs

**Step 3: Present Cleanup Report**

## 📋 Cleanup Results

### 🎯 Files Processed

- [List of files that were cleaned]

### 🔧 Actions Taken

- **Debug Code Removed**: [Number of console.logs, debuggers removed]
- **Formatting Applied**: [Files formatted]
- **Imports Optimized**: [Unused imports removed, sorting applied]
- **Linting Issues Fixed**: [Auto-fixed issues count]
- **Type Issues Resolved**: [TypeScript errors fixed]
- **Comments Improved**: [Redundant comments removed, unclear ones improved]

### 🚨 Manual Actions Needed

- [List any issues that require manual intervention]

### ✅ Quality Improvements

- [Summary of overall code quality improvements made]

## Examples of What Gets Cleaned

### Debug Code Removal

- `console.log('debug info')` → removed
- `debugger;` statements → removed
- Temporary `// TODO: remove` comments → removed
- Development-only `if (process.env.NODE_ENV === 'development')` blocks → removed

### Import Optimization

- `import { unusedFunction } from './utils'` → removed
- Duplicate imports → merged
- `import * as everything from './module'` → converted to named imports
- Outdated import paths → updated to absolute paths

### Formatting Fixes

- Inconsistent indentation (2 spaces vs 4) → standardized to 2 spaces
- Missing semicolons → added
- Trailing whitespace → removed
- Long lines → wrapped appropriately

### TypeScript Improvements

- `any` types → replaced with specific types where possible
- Missing type annotations → added
- Unused type definitions → removed

## Quality Standards Applied:

- **Production Ready**: Remove all debugging and development artifacts
- **Consistent Style**: Apply project formatting standards
- **Type Safety**: Ensure strong typing where applicable
- **Clean Imports**: Optimize dependency management
- **Clear Documentation**: Improve code readability through better comments
