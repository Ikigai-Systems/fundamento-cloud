---
globs: ["spec/requests/**/*.rb"]
---

# Request Specs

- Use fixtures (not factories): `fixtures :organizations, :users, :organization_memberships, :spaces, ...`
- Sign in and select org in `before` block:
  ```ruby
  before do
    sign_in user
    post select_organization_path(organization)
  end
  ```
- For job enqueue assertions use `have_enqueued_job(JobClass).with(...)`.
- Use `anything` matcher for values you don't control (ip_address, user_agent).
