# BlockNote converter micro-service

`micro-services/blocknote-converter` is a **separate npm project**. Running the app's
checks says nothing about it.

- It has its own `npm run typecheck`, `npm run lint` and `npm test`. Run them from inside
  that directory.
- `npm run build` uses **esbuild, which does not typecheck**. A green build can still be a
  red CI: a type error shipped this way and failed the `blocknote-converter` job.
- It pins its **own** `@blocknote/core` (0.54.0) while the app pins 0.52.1. Read API source
  from the `node_modules` of the project you are changing — conclusions drawn from the
  wrong tree have been wrong.
- `@blocknote/core` exports neither `Link` nor `isAllowedUri` at runtime in either version,
  despite its own JSDoc telling you to import the latter. Predicates copied from it must
  name the original so they can be kept in step.
