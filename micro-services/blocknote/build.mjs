import * as esbuild from "esbuild";
import {TsconfigPathsPlugin} from "@esbuild-plugins/tsconfig-paths";

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/blocknoteServer.mjs'],
  bundle: true,
  sourcemap: true,
  format: "cjs",
  platform: 'node',
  target: ['node18'],
  outfile: 'build/blocknoteServer.mjs',
  loader: {
    ".css": "empty",
  },
  alias: {
    "rowstack": "../../vendor/javascript/rowstack/main.js"
  },
  external: [
    "canvas",
    "jsdom",
  ],
  plugins: [
    TsconfigPathsPlugin({})
  ]
};

try {
  if (isWatch) {
    const buildContext = await esbuild.context(buildOptions);
    await buildContext.watch();
    console.log('Esbuild watching for changes...');
  } else {
    await esbuild.build(buildOptions);
  }
} catch (err) {
  console.log(err);
  process.exit(1);
}