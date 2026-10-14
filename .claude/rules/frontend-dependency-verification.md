# Verifying a frontend dependency bump without the whole app

When a UI-only dependency bump (e.g. apexcharts 4 → 6) has no test coverage and running the full
app is awkward, render the affected component configurations in a throwaway Vite harness against
the real installed package. It skips auth and data fetching and still shows whether the library
renders.

Put the harness **inside the project**, in the gitignored `tmp/`. Node resolves the harness's own
`vite` and `@vitejs/plugin-react` by walking up from its config file, and a scratch directory
outside the project never reaches the project's `node_modules`.

A typecheck is not enough on its own: a major bump can typecheck and still render nothing.
