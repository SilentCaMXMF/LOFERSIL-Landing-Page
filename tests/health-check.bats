@test "health check script exists and is executable" {
  [ -x scripts/health-check.sh ]
}

@test "health check passes when MCP server is healthy" {
  # Assuming server is running on port 3001
  run ./scripts/health-check.sh
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Health check passed" ]]
}

@test "health check fails when MCP server is not running" {
  # Stop server if running
  # This might be tricky in test
  run ./scripts/health-check.sh
  [ "$status" -eq 1 ]
  [[ "$output" =~ "WebSocket connection failed" ]]
}

@test "health check validates WebSocket connectivity" {
  run ./scripts/health-check.sh
  [[ "$output" =~ "WebSocket connection: OK" ]]
}

@test "health check checks tool availability" {
  run ./scripts/health-check.sh
  [[ "$output" =~ "Tools available: 4" ]]
}

@test "health check measures response time" {
  run ./scripts/health-check.sh
  [[ "$output" =~ "Response time:" ]]
}

@test "health check monitors system resources" {
  run ./scripts/health-check.sh
  [[ "$output" =~ "CPU usage:" ]]
  [[ "$output" =~ "Memory usage:" ]]
}

@test "health check returns appropriate exit codes" {
  # Healthy
  run ./scripts/health-check.sh
  [ "$status" -eq 0 ]

  # When unhealthy, but hard to test without mocking
}