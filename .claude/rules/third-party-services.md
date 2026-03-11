---
globs: ["app/services/**/*.rb", "spec/services/**/*.rb"]
---

# Third-Party Service Wrappers

- Implement a `.enabled?` class method that checks whether required credentials are configured. This allows the feature to gracefully disable itself in environments without credentials.
- Access credentials via `Rails.application.credentials.dig(:service, :key)`.
- Define a custom error class (e.g., `ApiError`) for HTTP failures so jobs can `retry_on` it specifically.
- WebMock is not in the Gemfile. Stub HTTP calls with RSpec doubles (`allow(Net::HTTP).to receive(:post)`).
