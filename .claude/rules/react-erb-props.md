# React Components from ERB

## Props naming convention

The `react_component` helper takes React component name to render, followed by two hash arguments that will be passed to the component as props, 
the first argument auto-converts snake_case keys to camelCase on the frontend automatically:
- ERB: `can_edit: true, object_gid: "gid://..."`
- React receives: `canEdit: true, objectGid: "gid://..."`

Write **snake_case in ERB**, **camelCase in TypeScript** types and component code.

The second argument is passed to the component as is.

