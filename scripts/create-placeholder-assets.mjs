#!/usr/bin/env node
/**
 * Creates placeholder favicon.ico, apple-touch-icon.png, and og-image.jpg.
 * Run: node scripts/create-placeholder-assets.mjs
 */

import fs from 'fs'
import path from 'path'

const publicDir = path.resolve(process.cwd(), 'public')

// Minimal 16x16 favicon.ico (single color)
const faviconIco = Buffer.from([
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00,
  0x20, 0x00, 0x68, 0x04, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00,
  0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x01, 0x00,
  0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00,
].concat(Array(1024).fill(0xff).map((_, i) => (i % 4 === 3 ? 0xff : 0x86)), [0x3b, 0xff]) // purple-ish
)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconIco.slice(0, 318))

// Minimal 1x1 gray JPEG (valid JPEG structure)
const minimalJpeg = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQD/xAAfEAABBAMBAAAAAAAAAAAAAAABAAIDBBEFEiH/2gAMAwEAAhEDEQA/ALeB/9k=',
  'base64'
)
fs.writeFileSync(path.join(publicDir, 'og-image.jpg'), minimalJpeg)

// Copy favicon.svg to apple-touch-icon (SVG works on modern iOS)
const faviconSvg = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf8')
const appleTouchSvg = faviconSvg.replace('width="48" height="46"', 'width="180" height="180"')
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleTouchSvg)

console.log('Created: favicon.ico, og-image.jpg, apple-touch-icon.svg')
console.log('Note: Update index.html to use apple-touch-icon.svg if apple-touch-icon.png is not available')
