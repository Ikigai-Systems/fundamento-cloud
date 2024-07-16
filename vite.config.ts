import React from '@vitejs/plugin-react'
import RubyPlugin from 'vite-plugin-ruby'
import StimulusHMR from 'vite-plugin-stimulus-hmr'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    React(),
    RubyPlugin(),
    StimulusHMR(),
  ],
})
