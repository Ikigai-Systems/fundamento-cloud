import React from '@vitejs/plugin-react'
import RubyPlugin from 'vite-plugin-ruby'
import StimulusHMR from 'vite-plugin-stimulus-hmr'
import FullReload from 'vite-plugin-full-reload'
import { defineConfig } from 'vite'
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    React(),
    RubyPlugin(),
    StimulusHMR(),
    FullReload(['config/routes.rb', 'app/views/**/*'], { delay: 200 })
  ],
  resolve: {
    alias: {
      "rowstack": resolve(__dirname, "vendor/javascript/rowstack/main.js")
    }
  }
})
