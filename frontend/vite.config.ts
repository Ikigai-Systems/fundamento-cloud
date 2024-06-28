import {defineConfig, loadEnv} from 'vite'
import React from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import {presetAttributify, presetIcons, presetUno} from "unocss";

// https://vitejs.dev/config/
export default defineConfig(({command, mode}) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      UnoCSS({
        presets: [
          presetUno(),
          presetAttributify(),
          presetIcons(),
        ]
      }),
      React(),
    ],

    build: {
      emptyOutDir: true,
      outDir: '../public',
      rollupOptions: {
        output: {
          format: 'es',
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
          manualChunks(id) {
            if (/projectEnvVariables.ts/.test(id)) {
              return 'projectEnvVariables'
            }
          },
        },
      }
    },
  }
})
