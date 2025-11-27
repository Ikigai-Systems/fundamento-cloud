# Ruby 3.4.7 Upgrade PRD

## Project Overview
Upgrade Fundamento from Ruby 3.3.x to Ruby 3.4.7, ensuring compatibility across all components including the Rails application, dependencies, Docker environments, and CI/CD pipelines.

## Objectives
- Update Ruby version to 3.4.7 across all environments
- Ensure all gems are compatible with Ruby 3.4.7
- Update Docker configurations for development and production
- Verify CI/CD pipelines work with new Ruby version
- Test all application functionality after upgrade

## Technical Requirements

### 1. Version Files Update
- Update `.ruby-version` file to 3.4.7
- Update `Gemfile` to specify Ruby 3.4.7
- Update any Ruby version references in documentation

### 2. Dependency Management
- Run `bundle update --ruby` to update Gemfile.lock
- Identify and resolve any gem compatibility issues
- Update gems that require newer versions for Ruby 3.4.7 support
- Test that all critical gems work correctly

### 3. Docker Configuration
- Update Dockerfile base image to use Ruby 3.4.7
- Update docker-compose.yml if needed
- Rebuild Docker images for development
- Test Docker-based development environment
- Update production Dockerfile

### 4. CI/CD Pipeline Updates
- Update GitHub Actions workflows to use Ruby 3.4.7
- Update any other CI configurations (if applicable)
- Ensure test suite runs successfully in CI

### 5. Development Environment Setup
- Install Ruby 3.4.7 locally using rbenv/asdf/rvm
- Test `bin/dev` command with new Ruby version
- Verify all micro-services (formula-eval, blocknote-converter, blocknote) work correctly
- Test database operations (migrations, seeds)

### 6. Testing & Validation
- Run full RSpec test suite
- Run E2E Cypress tests
- Test application manually in development
- Verify real-time collaboration features work
- Test formula evaluation micro-service integration
- Check for any deprecation warnings

### 7. Code Compatibility
- Check for Ruby 3.4.7-specific deprecations or breaking changes
- Update code if needed for compatibility
- Review and update any custom patches or workarounds
- Test SOPS secrets management integration

### 8. Performance & Monitoring
- Benchmark application performance after upgrade
- Check for any performance regressions
- Monitor memory usage
- Verify error tracking (Sentry) works correctly

## Success Criteria
- Ruby 3.4.7 installed and active in all environments
- All tests pass (RSpec and E2E)
- Application runs without errors in development
- Docker containers build and run successfully
- CI/CD pipeline passes
- No critical performance regressions
- All micro-services communicate correctly
- Real-time collaboration features work as expected

## Rollback Plan
- Keep previous Ruby version available
- Maintain backup of working Gemfile.lock
- Document any code changes for easy reversal
- Test rollback procedure before full deployment

## Notes
- Ruby 3.4.7 includes performance improvements and bug fixes
- Check for YJIT enhancements that may benefit the application
- Review Ruby 3.4 changelog for new features that could be leveraged
- Consider updating deprecated code patterns during this upgrade
