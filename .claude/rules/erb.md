---
paths:
  - "**/*.erb"
---

# ERB

Prefer `if/elsif/else` over `case/when` to choose inline output.

Since ActionView 8.1.3, indentation before a `<% when %>` that has trailing output on the same
line (`<% when "x" %><span>…</span>`) is no longer trimmed. It compiles to an output append
**between** `case` and the first `when`, which is a Ruby syntax error and raises
`ActionView::SyntaxErrorInTemplate` at render time. `case` is safe only when every `<% when %>` is
alone on its line; `if/elsif` has no such trap.

To check a template compiles without rendering it:

```ruby
src = ActionView::Template::Handlers::ERB::Erubi.new(File.read(path), trim: true, bufvar: "@output_buffer", escape: true).src
RubyVM::InstructionSequence.compile(src)
```
