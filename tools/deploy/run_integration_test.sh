#!/bin/bash

# Run integration tests for the GitHub Issues Reviewer System
echo "Running GitHub Issues Reviewer System Integration Tests..."
npm run test:run src/scripts/modules/github-issues/integration.test.ts

echo "Integration tests completed."