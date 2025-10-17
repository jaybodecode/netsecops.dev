#!/usr/bin/env node

/**
 * Generate a proper Windows ICO file from PNG files using node-canvas
 * Creates a multi-resolution ICO with 16x16, 32x32, and 48x48 icons
 */

import fs from 'fs';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createCanvas, loadImage } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const sizes = [16, 32, 48];
const icoPath = join(rootDir, 'public', 'favicon.ico');

// Proper ICO file format structure
function createICOHeader(count) {
  const buffer = Buffer.alloc(6);
  buffer.writeUInt16LE(0, 0);     // Reserved (must be 0)
  buffer.writeUInt16LE(1, 2);     // Type (1 = ICO, 2 = CUR)
  buffer.writeUInt16LE(count, 4); // Number of images
  return buffer;
}

function createICODirEntry(width, height, offset, size, bpp = 32) {
  const buffer = Buffer.alloc(16);
  buffer.writeUInt8(width === 256 ? 0 : width, 0);   // Width (0 means 256)
  buffer.writeUInt8(height === 256 ? 0 : height, 1); // Height (0 means 256)
  buffer.writeUInt8(0, 2);                            // Color palette (0 = no palette for 32bpp)
  buffer.writeUInt8(0, 3);                            // Reserved (must be 0)
  buffer.writeUInt16LE(1, 4);                         // Color planes (should be 1)
  buffer.writeUInt16LE(bpp, 6);                       // Bits per pixel
  buffer.writeUInt32LE(size, 8);                      // Size of image data in bytes
  buffer.writeUInt32LE(offset, 12);                   // Offset to image data from beginning
  return buffer;
}

function createBMPFromCanvas(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, width, height);
  
  // BMP Info Header (40 bytes)
  const infoHeader = Buffer.alloc(40);
  infoHeader.writeUInt32LE(40, 0);                    // Header size
  infoHeader.writeInt32LE(width, 4);                  // Width
  infoHeader.writeInt32LE(height * 2, 8);             // Height * 2 (for ICO format)
  infoHeader.writeUInt16LE(1, 12);                    // Planes
  infoHeader.writeUInt16LE(32, 14);                   // Bits per pixel
  infoHeader.writeUInt32LE(0, 16);                    // Compression (0 = none)
  infoHeader.writeUInt32LE(0, 20);                    // Image size (can be 0 for uncompressed)
  infoHeader.writeInt32LE(0, 24);                     // X pixels per meter
  infoHeader.writeInt32LE(0, 28);                     // Y pixels per meter
  infoHeader.writeUInt32LE(0, 32);                    // Colors used
  infoHeader.writeUInt32LE(0, 36);                    // Important colors
  
  // Convert RGBA to BGRA and flip vertically for BMP format
  const pixelData = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = ((height - 1 - y) * width + x) * 4; // Flip vertically
      const dstIdx = (y * width + x) * 4;
      pixelData[dstIdx + 0] = imageData.data[srcIdx + 2]; // B
      pixelData[dstIdx + 1] = imageData.data[srcIdx + 1]; // G
      pixelData[dstIdx + 2] = imageData.data[srcIdx + 0]; // R
      pixelData[dstIdx + 3] = imageData.data[srcIdx + 3]; // A
    }
  }
  
  // AND mask (all zeros for 32bpp with alpha channel)
  const maskSize = Math.ceil((width * height) / 8);
  const andMask = Buffer.alloc(maskSize, 0);
  
  return Buffer.concat([infoHeader, pixelData, andMask]);
}

async function generateICO() {
  try {
    console.log('🎨 Generating proper Windows ICO file...\n');
    
    // Load SVG and render to different sizes
    const svgPath = join(rootDir, 'public', 'favicon.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    
    const img = await loadImage(svgDataUrl);
    const bmpData = [];
    
    for (const size of sizes) {
      console.log(`⚙️  Rendering ${size}x${size}...`);
      
      // Create canvas and render
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);
      
      // Convert to BMP format for ICO
      const bmp = createBMPFromCanvas(canvas);
      bmpData.push({ size, data: bmp });
      
      console.log(`   ✅ Created BMP data: ${bmp.length} bytes`);
    }
    
    // Create ICO file structure
    const header = createICOHeader(bmpData.length);
    const dirEntrySize = 16;
    const headerSize = 6 + (dirEntrySize * bmpData.length);
    
    // Calculate offsets
    let currentOffset = headerSize;
    const dirEntries = [];
    
    for (const { size, data } of bmpData) {
      dirEntries.push(createICODirEntry(size, size, currentOffset, data.length));
      currentOffset += data.length;
    }
    
    // Combine all parts
    const buffers = [header, ...dirEntries, ...bmpData.map(b => b.data)];
    const icoBuffer = Buffer.concat(buffers);
    
    // Write ICO file
    fs.writeFileSync(icoPath, icoBuffer);
    
    console.log(`\n✨ ICO generation complete!`);
    console.log(`📋 Generated: public/favicon.ico (${Math.round(icoBuffer.length / 1024)}KB)`);
    console.log(`   Format: Windows ICO`);
    console.log(`   Resolutions: ${sizes.map(s => `${s}x${s}`).join(', ')}`);
    console.log(`   Color depth: 32-bit RGBA`);
    
  } catch (error) {
    console.error('❌ Error generating ICO:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generateICO();
