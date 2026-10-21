---
paths:
  - "app/views/**"
  - "app/assets/stylesheets/**"
---

# Styling views: inherit, don't restyle

Pages should look like one app. The shared stylesheets in `app/assets/stylesheets/` already set
text color, size, padding and fonts, so a view uses their classes and adds no colors or font sizes
of its own.

`body` gets `content-container` (`text-black dark:text-white`), so plain text already works in
dark mode. A hand-picked `text-gray-700 dark:text-gray-200` is redundant at best and drifts from
neighbouring pages at worst: one page did exactly that and ended up with a different dark-mode
gray and content out of line with its header.

Before styling a page, open a sibling page in the same layout and reuse what it uses:

- **Pages on `focused_section`:** each block is `table-legend` › `table-legend-description`, which
  holds an `h1`, paragraphs and ordered lists and pads them to line up with the page header
  (`app/views/api_tokens/index.html.erb`).
- **Fields:** `default-form` › `form-field` with a `label`, and `form-hint` for help text. Inside a
  `table-legend-description`, put the hint on a `div`: the section's `p` rule is more specific than
  `.default-form .form-hint` and would override its color.
- **Copyable values:** `form-input mt-0 h-10` plus a `secondary-button px-2 shadow-md h-10` copy
  button with the `clipboard` controller (`app/views/api_tokens/_create.html.erb`).
- **Code to copy:** `example-code-container` around a `pre`.
- **Single-card pages** (sign-in, OAuth consent): `form-section` with a `form-header`, and
  `form-footer` for the buttons.

When nothing fits, extend the shared stylesheet so every page gets it, rather than styling one page.
Layout utilities (`flex`, `gap-2`) are fine where the existing component already uses them.

Check the result in light and dark mode next to a sibling page. `app/assets/builds/tailwind.css`
has no watcher under `bin/dev`, so run `bin/rails tailwindcss:build` after editing a stylesheet.
