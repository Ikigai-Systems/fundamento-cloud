---
paths:
  - "spec/requests/**/*.rb"
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
- Namespaced fixtures get namespaced accessors: `fixtures "tables/tables"` is read as
  `tables_tables(:projects)`, not `tables(:projects)`.
- Put a spec in the existing spec file for the controller or policy it covers. An audit that cuts
  across the app (say, cross-organization access) adds a few examples to each of those files
  rather than one file named after the audit, so the next person changing a controller finds
  them next to its other specs.
- Don't parse the response HTML (Nokogiri, `at_css`) to check UI state such as a disabled button.
  Request specs cover server behaviour (status, records, redirects, flash); UI state belongs in a
  Cypress E2E test.
