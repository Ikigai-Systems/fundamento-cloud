import {defineConfig} from 'vite'
import React from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import {presetAttributify, presetIcons, presetUno} from "unocss";

// https://vitejs.dev/config/
export default defineConfig({
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
  },    
})
