---
globs: ["app/controllers/users/**/*.rb", "spec/requests/users/**/*.rb"]
---

# Devise Controllers

- Devise's `create` action calls `build_resource` which rebuilds the resource object from params. Any attributes set on `resource` before `super` will be lost.
- To set extra attributes during registration, use `resource.update_column` after the `super` call, and only if `resource.persisted?`.
- The `resource` method returns the current Devise model instance (e.g., User).
