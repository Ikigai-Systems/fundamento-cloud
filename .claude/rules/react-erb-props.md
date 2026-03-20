# React Components from ERB

## Props naming convention

The `react_component` helper auto-converts snake_case keys to camelCase on the frontend:
- ERB: `can_edit: true, object_gid: "gid://..."`
- React receives: `canEdit: true, objectGid: "gid://..."`

Write **snake_case in ERB**, **camelCase in TypeScript** types and component code.

## js_from_routes

`js_from_routes` auto-generates `app/javascript/api/*.js` from Rails routes. When routes change (new actions, renamed paths), these files are regenerated automatically. **Commit them** — they are tracked in git.
