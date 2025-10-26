# 03. Test image editing with Gemini tool

meta:
id: test-gemini-tool-and-favicon-03
feature: test-gemini-tool-and-favicon
priority: P1
depends_on: [test-gemini-tool-and-favicon-01]
tags: [testing, gemini, image-editing]

objective:

- Test the edit tool function with a sample image and prompt

deliverables:

- Edited image or mock response in test mode
- Log of the test execution

steps:

- Import the edit tool from the Gemini module
- Call the edit function with a test image data URL and prompt
- Verify the response is as expected (mock in test mode)
- Log the result

tests:

- Unit: Check if the response is a string
- Integration/e2e: Run the tool and check output

acceptance_criteria:

- Tool executes without errors
- Response matches expected format

validation:

- Run: node -e "import('./.opencode/tool/gemini/index.js').then(m => m.edit.execute({image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', prompt: 'test edit'}, {})).then(console.log)"
- Check: Response is a string

notes:

- Use a sample base64 image for testing
