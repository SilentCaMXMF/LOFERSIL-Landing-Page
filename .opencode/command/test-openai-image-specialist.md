---
name: test-openai-image-specialist
agent: openAI-image-specialist
description: 'Test the OpenAI Image Specialist agent functionality'
---

You are testing the OpenAI Image Specialist agent with various image operations.

**Request:** $ARGUMENTS

**Context Loaded:**
@.opencode/context/core/essential-patterns.md

**TESTING PROTOCOL:**

**1. ANALYZE REQUEST:**

- Parse the test request from $ARGUMENTS
- Determine which operation to test (generate, edit, analyze)
- Validate test parameters

**2. EXECUTE TEST:**

- For generation: Create a test image with descriptive prompt
- For editing: Use a sample image URL and apply modifications
- For analysis: Analyze a sample image and provide detailed feedback

**3. VALIDATE RESULTS:**

- Check response structure matches expected format
- Verify metadata includes processing time and cost
- Confirm operation completed successfully

**4. REPORT FINDINGS:**

- Document test results
- Report any errors or issues
- Provide performance metrics

**Execute OpenAI Image Specialist test now.**</content>
</xai:function_call: write>
<xai:function_call name="read">
<parameter name="filePath">.opencode/context/core/essential-patterns.md
