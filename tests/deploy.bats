#!/usr/bin/env bats

setup() {
    # Create a temporary directory for testing
    TEST_DIR="$(mktemp -d)"
    cd "$TEST_DIR"

    # Mock the project structure
    mkdir -p mcp-server
    echo '{"scripts": {"build": "tsc", "test": "echo test passed"}}' > mcp-server/package.json

    # Copy the deploy script from original location
    cp /workspaces/LOFERSIL-Landing-Page/scripts/deploy.sh ./deploy.sh 2>/dev/null || true
}

teardown() {
    cd /
    rm -rf "$TEST_DIR"
}

@test "deploy.sh exists and is executable" {
    [ -x "deploy.sh" ]
}

@test "deploy.sh fails with no arguments" {
    run ./deploy.sh
    [ "$status" -eq 1 ]
    [[ "$output" =~ "Usage:" ]]
}

@test "deploy.sh fails with invalid environment" {
    run ./deploy.sh invalid
    [ "$status" -eq 1 ]
    [[ "$output" =~ "Invalid environment" ]]
}

@test "deploy.sh succeeds with valid environment" {
    # Mock successful build and test
    function npm() {
        echo "mock npm called with $@"
    }
    export -f npm

    function curl() {
        echo "Health check passed"
    }
    export -f curl

    run ./deploy.sh development
    [ "$status" -eq 0 ]
    [[ "$output" =~ "Deployment completed successfully" ]]
}

@test "deploy.sh fails if build fails" {
    # Mock failing build
    function npm() {
        if [[ "$2" == "build" ]]; then
            echo "Build failed"
            return 1
        fi
        echo "mock npm called with $@"
    }
    export -f npm

    run ./deploy.sh development
    [ "$status" -eq 1 ]
    [[ "$output" =~ "Build failed" ]]
}

@test "deploy.sh fails if tests fail" {
    # Mock failing test
    function npm() {
        if [[ "$2" == "test" ]]; then
            echo "Tests failed"
            return 1
        fi
        echo "mock npm called with $@"
    }
    export -f npm

    run ./deploy.sh development
    [ "$status" -eq 1 ]
    [[ "$output" =~ "Tests failed" ]]
}

@test "deploy.sh performs health check" {
    function npm() {
        echo "mock npm called with $@"
    }
    export -f npm

    function curl() {
        echo "Health check passed"
    }
    export -f curl

    run ./deploy.sh development
    [[ "$output" =~ "Health check passed" ]]
}

@test "deploy.sh performs rollback on health check failure" {
    function npm() {
        echo "mock npm called with $@"
    }
    export -f npm

    function curl() {
        echo "Health check failed"
        return 1
    }
    export -f curl

    run ./deploy.sh development
    [[ "$output" =~ "Rollback initiated" ]]
}