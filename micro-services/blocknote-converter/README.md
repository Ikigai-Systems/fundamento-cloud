# Running Tests

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
- **No complex configuration** - Works out of the box with ESM modules