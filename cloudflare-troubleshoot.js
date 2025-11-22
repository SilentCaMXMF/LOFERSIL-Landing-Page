/**
 * Cloudflare API Troubleshooting Script
 * Tests the Cloudflare Workers AI API directly to isolate issues
 */

async function testCloudflareAPI() {
  console.log('🔧 Cloudflare API Troubleshooting Tool\n');

  // Check environment variables
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  console.log('1. Environment Variables Check:');
  console.log(`   CLOUDFLARE_API_TOKEN: ${apiToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`   CLOUDFLARE_ACCOUNT_ID: ${accountId ? '✅ Set' : '❌ Missing'}\n`);

  if (!apiToken || !accountId) {
    console.log('❌ Missing required environment variables. Please set:');
    console.log('   export CLOUDFLARE_API_TOKEN=your_token_here');
    console.log('   export CLOUDFLARE_ACCOUNT_ID=your_account_id_here');
    console.log('\n📖 How to get these values:');
    console.log('   1. Go to https://dash.cloudflare.com/');
    console.log('   2. Select your account');
    console.log('   3. Go to My Profile → API Tokens');
    console.log('   4. Create a token with Workers AI permissions');
    console.log('   5. Account ID is shown in the URL or Account Settings');
    return;
  }

  // Test 1: Basic API connectivity
  console.log('2. Testing API Connectivity:');
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.status === 200) {
      console.log('   ✅ API connectivity: OK');
    } else if (response.status === 400) {
      const error = await response.text();
      console.log(`   ❌ Bad Request: ${error}`);
      if (error.includes('object identifier invalid')) {
        console.log('   🔍 Issue: CLOUDFLARE_ACCOUNT_ID is incorrect');
        console.log('   💡 Solution: Verify your Account ID in Cloudflare dashboard');
      }
    } else if (response.status === 401) {
      console.log('   ❌ Unauthorized: API token invalid or expired');
      console.log('   💡 Solution: Check your API token permissions');
    } else if (response.status === 403) {
      console.log('   ❌ Forbidden: API token lacks Workers AI permissions');
      console.log('   💡 Solution: Ensure token has "Workers AI" permissions');
    } else {
      const error = await response.text();
      console.log(`   ❌ Unexpected error: ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
    console.log('   💡 Check your internet connection and Cloudflare status');
  }

  // Test 2: Account verification
  console.log('\n3. Testing Account ID:');
  try {
    const accountUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}`;
    const response = await fetch(accountUrl, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      console.log(`   ✅ Account ID valid: ${data.result.name} (${accountId})`);
    } else {
      console.log(`   ❌ Account ID invalid: ${response.status} ${response.statusText}`);
      console.log('   💡 Solution: Get correct Account ID from Cloudflare dashboard URL');
    }
  } catch (error) {
    console.log(`   ❌ Account check failed: ${error.message}`);
  }

  // Test 3: Workers AI availability
  console.log('\n4. Testing Workers AI Service:');
  try {
    const modelsUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models`;
    const response = await fetch(modelsUrl, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      const models = data.result || [];
      const aiModels = models.filter(m => m.name.includes('flux') || m.name.includes('llama'));
      console.log(`   ✅ Workers AI enabled: ${aiModels.length} models available`);
      if (aiModels.length === 0) {
        console.log('   ⚠️  Warning: No AI models found - Workers AI may not be enabled');
      }
    } else {
      console.log(`   ❌ Workers AI check failed: ${response.status} ${response.statusText}`);
      console.log('   💡 Solution: Enable Workers AI in your Cloudflare account');
    }
  } catch (error) {
    console.log(`   ❌ Workers AI check failed: ${error.message}`);
  }

  // Test 4: Image generation test
  console.log('\n5. Testing Image Generation:');
  try {
    const imageUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/blackforestlabs/flux-1-schnell`;
    const response = await fetch(imageUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A simple red circle on white background',
        steps: 4,
      }),
    });

    if (response.status === 200) {
      console.log('   ✅ Image generation: OK');
    } else {
      const error = await response.text();
      console.log(`   ❌ Image generation failed: ${response.status} - ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Image generation test failed: ${error.message}`);
  }

  console.log('\n📋 Troubleshooting Summary:');
  console.log('If you see "object identifier invalid":');
  console.log('   - Your CLOUDFLARE_ACCOUNT_ID is incorrect');
  console.log('   - Get the correct ID from https://dash.cloudflare.com/ → Account Settings');
  console.log('\nIf you see 401/403 errors:');
  console.log('   - Check your API token permissions');
  console.log('   - Ensure Workers AI is enabled for your account');
  console.log('\nIf you see 404 on /ai/run:');
  console.log('   - Workers AI may not be enabled');
  console.log('   - Enable it at https://dash.cloudflare.com/ → Workers AI');
}

// Run the test
testCloudflareAPI().catch(console.error);
