const fs = require('fs');
const path = require('path');

// Mock base64 image from test script
const mockBase64Image =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/vAA=';

const base64Data = mockBase64Image.split(',')[1];
const imageBuffer = Buffer.from(base64Data, 'base64');

const filepath = path.join('assets', 'images', 'reborn_doll_cloudflare_2025-11-14T12-00-00.jpg');

// Ensure directory exists
fs.mkdirSync(path.dirname(filepath), { recursive: true });

// Save the image
fs.writeFileSync(filepath, imageBuffer);

console.log(`Image saved to: ${filepath}`);
