# 02. Test image generation with Gemini tool

meta:
id: test-gemini-tool-and-favicon-02
feature: test-gemini-tool-and-favicon
priority: P1
depends_on: [test-gemini-tool-and-favicon-01]
tags: [testing, gemini, image-generation]

objective:

- Test the generate tool function with a sample prompt

deliverables:

- Generated image or mock response in test mode
- Log of the test execution

steps:

- Import the generate tool from the Gemini module
- Call the generate function with a test prompt
- Verify the response is as expected (mock in test mode)
- Log the result

tests:

- Unit: Check if the response is a string
- Integration/e2e: Run the tool and check output

acceptance_criteria:

- Tool executes without errors
- Response matches expected format

validation:

- Run: node -e "import('./.opencode/tool/gemini/index.js').then(m => m.generate.execute({prompt: 'test image'}, {})).then(console.log)"
- Check: Response is a string

notes:

- Use test mode for safe testing
