# 04. Test image analysis with Gemini tool

meta:
id: test-gemini-tool-and-favicon-04
feature: test-gemini-tool-and-favicon
priority: P1
depends_on: [test-gemini-tool-and-favicon-01]
tags: [testing, gemini, image-analysis]

objective:

- Test the analyze tool function with a sample image and question

deliverables:

- Analysis response or mock response in test mode
- Log of the test execution

steps:

- Import the analyze tool from the Gemini module
- Call the analyze function with a test image data URL and question
- Verify the response is as expected (mock in test mode)
- Log the result

tests:

- Unit: Check if the response is a string
- Integration/e2e: Run the tool and check output

acceptance_criteria:

- Tool executes without errors
- Response matches expected format

validation:

- Run: node -e "import('./.opencode/tool/gemini/index.js').then(m => m.analyze.execute({image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', question: 'What is in this image?'}, {})).then(console.log)"
- Check: Response is a string

notes:

- Use a sample base64 image for testing
