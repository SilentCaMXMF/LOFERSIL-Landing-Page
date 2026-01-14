/**
 * Test and example usage for the Cloudflare File Organization System
 */

import { CloudflareFileOrganizer, OPERATION_TYPES, getDefaultNamingConfig } from './file-organization.js';

// Example usage
async function exampleUsage() {
  // Create organizer instance
  const organizer = new CloudflareFileOrganizer({
    baseDir: './test-output',
    enableCleanup: true,
    enableArchiving: true,
  });

  // Generate a unique filename for an image generation operation
  const namingConfig = getDefaultNamingConfig(OPERATION_TYPES.GENERATION);
  const filePath = await organizer.generateUniqueFilename(
    OPERATION_TYPES.GENERATION,
    {
      ...namingConfig,
      prefix: 'test',
      suffix: 'example',
    },
    '.png'
  );

  console.log('Generated file path:', filePath);

  // Create metadata for an operation
  const metadata = organizer.createMetadata(
    OPERATION_TYPES.GENERATION,
    '@cf/black-forest-labs/flux-1-schnell',
    {
      prompt: 'A beautiful sunset over mountains',
      steps: 4,
      width: 1024,
      height: 1024,
    },
    filePath,
    2500, // duration in ms
    0, // cost (free tier)
    undefined, // tokens
    undefined // error
  );

  console.log('Created metadata:', metadata.id);

  // Save metadata
  const metadataPath = await organizer.saveMetadata(metadata);
  console.log('Metadata saved to:', metadataPath);

  // Format for MCP response
  const mcpResponse = organizer.formatFilePathForMCP(filePath, metadata);
  console.log('MCP response:', mcpResponse);

  // Get MCP resources
  const resources = organizer.getMCPResourceInfo(metadata.id);
  console.log('MCP resources:', resources);
}

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage().catch(console.error);
}

export { exampleUsage };</content>
<parameter name="filePath">/workspaces/LOFERSIL-Landing-Page/.opencode/tool/cloudflare/file-organization-test.ts