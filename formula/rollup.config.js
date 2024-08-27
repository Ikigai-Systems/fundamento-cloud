import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
// import json from '@rollup/plugin-json';

export default {
  input: 'index.mjs', // Entry point of your application
  output: {
    file: 'build/formula.js', // Output file
    format: 'cjs', // Output format (CommonJS)
  },
  plugins: [
    resolve({
      exportConditions: ["node"]
    }), // Resolve node_modules
    commonjs(), // Convert CommonJS modules to ES6
    // json() // Handle JSON files
  ]
};