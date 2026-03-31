/// <reference types="vitest/config" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// pako is not a top-level dep — it lives inside browserify-zlib (a @react-pdf/pdfkit dep).
// Rolldown can't resolve the deep pako/* imports, so we alias them explicitly.
const pakoBase = path.resolve('./node_modules/browserify-zlib/node_modules/pako')
const pakoAlias = ['zstream', 'deflate', 'inflate', 'constants'].reduce<Record<string, string>>(
  (acc, name) => {
    acc[`pako/lib/zlib/${name}.js`] = `${pakoBase}/lib/zlib/${name}.js`
    return acc
  },
  {}
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { alias: pakoAlias },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
