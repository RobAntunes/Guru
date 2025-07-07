# Guru CI/CD Workflows

This directory contains the CI/CD pipeline configurations for the Guru project.

## Workflows

### 1. unified-ci.yml - Main Pipeline
The comprehensive CI/CD pipeline that runs on every push and PR. It includes:

- **Core Tests**: TypeScript type checking and unit tests
- **QPFM Tests**: Quantum Probability Field Memory system tests
- **Harmonic Tests**: Harmonic Intelligence pattern analysis tests  
- **Docker Tests**: Infrastructure and service health checks
- **MCP Tests**: Model Context Protocol tools validation
- **Quality Gates**: Code quality, complexity, and performance benchmarks
- **Security Scan**: Vulnerability and secrets detection
- **Build & Package**: Production build and artifact creation

Triggers: Push to main/develop/feature branches, PRs to main/develop

### 2. ci.yml - AI-Native Pipeline
Focused on AI compatibility and integration:

- **Test Suite**: AI-native, validation, and stress tests
- **Code Quality**: Type checking and linting
- **Security**: CodeQL analysis
- **AI Compatibility**: Tests output formats for AI consumption

Triggers: Push to main/develop, PRs to main

### 3. harmonic-intelligence-ci.yml - Harmonic Intelligence Pipeline
Dedicated to the Harmonic Intelligence subsystem:

- **Unit & Integration Tests**: Harmonic pattern analysis tests
- **Security**: Dependency audits and OWASP checks
- **Quality Gates**: Complexity and coverage thresholds
- **Performance**: Analysis speed and memory usage checks
- **Documentation**: API docs generation
- **Release**: Automated releases with pattern analysis

Triggers: Changes to harmonic-intelligence code, push to main/develop

## Key Features

- **Parallel Execution**: Tests run in parallel where possible
- **Node.js 20.x**: All workflows use Node.js 20.x for consistency
- **NPM**: Uses npm (not bun) for package management
- **Docker Compose**: Full infrastructure testing with Neo4j, Redis, DuckDB
- **Error Tolerance**: Non-critical steps use `|| true` to prevent blocking
- **Artifacts**: Test results, coverage reports, and builds are uploaded

## Environment Variables

- `NODE_VERSION`: Set to '20.x' globally
- `DOCKER_BUILDKIT`: Enabled for faster Docker builds
- `NODE_ENV`: Set to 'test' for test runs

## Running Locally

To run the CI checks locally:

```bash
# Install dependencies
npm ci

# Type checking
npm run type-check

# Run all tests
npm test

# Run specific test suites
npm run test:memory
npm run test:ai-native

# Docker infrastructure
docker-compose up -d
docker-compose down

# Build project
npm run build
```

## Maintenance

- Update Node.js version in env.NODE_VERSION
- Add new test suites to appropriate workflow
- Monitor performance benchmarks for regressions
- Review security scan results regularly