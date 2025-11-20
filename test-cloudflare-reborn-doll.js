/**
 * Test script to generate a reborn doll image using Cloudflare Workers AI via MCP client
 */

import { MCPFactory } from './.opencode/tool/mcp/index.js';

async function testCloudflareImageGeneration() {
  let mcp = null;

  try {
    console.log('🔗 Connecting to Cloudflare MCP client...');

    // Check if required environment variables are set
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!apiToken || !accountId) {
      console.log('⚠️  Cloudflare API credentials not found. Running in mock mode for testing.');

      // Mock successful generation for testing purposes
      await runMockGeneration();
      return;
    }

    // Create MCP client for Cloudflare
    mcp = await MCPFactory.createCloudflareWorkersAI();

    // Connect to the server
    await mcp.connect();
    console.log('✅ Connected to Cloudflare MCP server');

    // Define the prompt for a professional reborn doll image suitable for LOFERSIL stationery website
    const prompt = `A high-quality, professional photograph of a beautiful reborn doll with realistic features, soft skin texture, and lifelike appearance. The doll should have curly blonde hair, blue eyes, and be dressed in elegant baby clothes suitable for a stationery and office supplies website. Clean white background, studio lighting, high resolution, photorealistic style.`;

    console.log('🎨 Generating reborn doll image using Flux-1-Schnell model...');

    // Execute the image generation tool
    const result = await mcp.getTools().executeTool('generate_image_flux', {
      prompt: prompt,
      steps: 4, // Fast generation for Flux-1-Schnell
    });

    console.log('✅ Image generated successfully!');
    console.log('📊 Generation details:');
    console.log('- Model: Flux-1-Schnell');
    console.log('- Prompt length:', prompt.length, 'characters');
    console.log('- Steps: 4');

    // Save the image to assets/images/
    const fs = await import('fs/promises');
    const path = await import('path');

    // Extract base64 data from the result
    const base64Data = result.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `reborn_doll_cloudflare_${timestamp}.jpg`;
    const filepath = path.join('assets', 'images', filename);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    // Save the image
    await fs.writeFile(filepath, imageBuffer);
    console.log(`💾 Image saved to: ${filepath}`);

    // Create metadata file
    const metadata = {
      filename: filename,
      filepath: filepath,
      model: '@cf/blackforestlabs/flux-1-schnell',
      prompt: prompt,
      steps: 4,
      generatedAt: new Date().toISOString(),
      cost: 0.0, // Free tier
      provider: 'Cloudflare Workers AI',
      tool: 'generate_image_flux',
    };

    const metadataPath = filepath.replace('.jpg', '.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`📄 Metadata saved to: ${metadataPath}`);

    // Get cost tracking
    const costResource = await mcp.readResource('cloudflare://costs');
    console.log('💰 Cost tracking:');
    console.log(`- Total cost: $${costResource.totalCost.toFixed(2)}`);
    console.log('- Free tier: All operations at $0.00');

    // Performance metrics
    console.log('⚡ Performance metrics:');
    console.log('- Model: Flux-1-Schnell (fast generation)');
    console.log('- Steps: 4 (optimized for speed)');
    console.log('- Status: Completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (mcp) {
      await mcp.disconnect();
      console.log('🔌 Disconnected from Cloudflare MCP server');
    }
  }
}

async function runMockGeneration() {
  console.log('🎭 Running mock image generation for testing...');

  // Simulate generation delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const fs = await import('fs/promises');
  const path = await import('path');

  // Create a mock base64 image (minimal valid JPEG)
  const mockBase64Image =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/vAA=';

  const base64Data = mockBase64Image.split(',')[1];
  const imageBuffer = Buffer.from(base64Data, 'base64');

  // Create filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `reborn_doll_cloudflare_${timestamp}.jpg`;
  const filepath = path.join('assets', 'images', filename);

  // Ensure directory exists
  await fs.mkdir(path.dirname(filepath), { recursive: true });

  // Save the mock image
  await fs.writeFile(filepath, imageBuffer);
  console.log(`💾 Mock image saved to: ${filepath}`);

  // Create metadata file
  const prompt = `A high-quality, professional photograph of a beautiful reborn doll with realistic features, soft skin texture, and lifelike appearance. The doll should have curly blonde hair, blue eyes, and be dressed in elegant baby clothes suitable for a stationery and office supplies website. Clean white background, studio lighting, high resolution, photorealistic style.`;

  const metadata = {
    filename: filename,
    filepath: filepath,
    model: '@cf/blackforestlabs/flux-1-schnell',
    prompt: prompt,
    steps: 4,
    generatedAt: new Date().toISOString(),
    cost: 0.0, // Free tier
    provider: 'Cloudflare Workers AI',
    tool: 'generate_image_flux',
    mock: true, // Indicates this was a mock generation
  };

  const metadataPath = filepath.replace('.jpg', '.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`📄 Metadata saved to: ${metadataPath}`);

  console.log('✅ Mock image generation completed!');
  console.log('📊 Generation details:');
  console.log('- Model: Flux-1-Schnell');
  console.log('- Prompt length:', prompt.length, 'characters');
  console.log('- Steps: 4');
  console.log('- Mode: Mock (no API credentials)');

  console.log('💰 Cost tracking:');
  console.log('- Total cost: $0.00');
  console.log('- Free tier: All operations at $0.00');

  console.log('⚡ Performance metrics:');
  console.log('- Model: Flux-1-Schnell (fast generation)');
  console.log('- Steps: 4 (optimized for speed)');
  console.log('- Status: Mock generation completed successfully');
}

// Run the test
testCloudflareImageGeneration();
