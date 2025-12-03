# Running Tests

## Command Line

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test tests/convertToYjs.test.ts
```

## RubyMine IDE

This project uses **Vitest 3.x** for better RubyMine compatibility. You can update to **Vitest 4.x** once RubyMine 2025.3 is released according to this [bug report](https://youtrack.jetbrains.com/issue/WEB-75191/No-tests-found-when-running-Vitest-4-tests).

## Test Fixtures

Test fixtures are located in `tests/fixtures/`:

- **`sample_blocks.json`** - Simple BlockNote blocks for basic tests
- **`complex_blocks.json`** - Complex BlockNote document with 105 blocks including various block types (paragraphs, images, lists, tables, etc.)

## Why Vitest?

We migrated from Jest to Vitest to solve ESM compatibility issues with BlockNote's markdown parser. Vitest provides:

- **Native ESM support** - Handles dynamic imports without configuration
- **Faster test execution** - Built on Vite for speed
- **Better TypeScript support** - Works seamlessly with TypeScript
- **Jest-compatible API** - Same test syntax as Jest
- **IDE integration** - Version 3.x works well with RubyMine's built-in test runner
