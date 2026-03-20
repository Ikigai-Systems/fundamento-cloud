---
globs: ["app/javascript/api/*.js"]
---
# Some routes are automatically exported from Rails routes to JavaScript

Gem `js_from_routes` auto-generates files in `app/javascript/api/*.js` from Rails routes that have `export: true`. 

When routes change (new actions, renamed paths), these files are regenerated automatically. 

**Commit them** — they are tracked in git.
