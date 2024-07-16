import {defineConfig, loadEnv} from 'vite'
import React from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({command, mode}) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
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

    server: {
      proxy: {
        '/admin/users': 'http://localhost:3000',
        '/users': 'http://localhost:3000',
        '^/assets/.*': 'http://localhost:3000',
      },
    },
  }
})
