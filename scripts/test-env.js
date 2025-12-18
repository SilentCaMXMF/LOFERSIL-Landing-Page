// Local environment validation script
// Checks if required environment variables are set for development

const requiredEnvVars = [
  'NODE_ENV',
  'WEBSITE_URL',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'GOOGLE_ANALYTICS_ID',
  'ENABLE_MCP_INTEGRATION',
  'MCP_SERVER_URL'
];

const optionalEnvVars = [
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID'
];

console.log('🔍 Environment Validation Check\n');

let allRequiredSet = true;
let missingRequired = [];
let missingOptional = [];

console.log('Required environment variables:');
requiredEnvVars.forEach(varName => {
  const isSet = !!process.env[varName];
  const status = isSet ? '✅' : '❌';
  console.log(`${status} ${varName}: ${isSet ? 'SET' : 'MISSING'}`);
  if (!isSet) {
    allRequiredSet = false;
    missingRequired.push(varName);
  }
});

console.log('\nOptional environment variables:');
optionalEnvVars.forEach(varName => {
  const isSet = !!process.env[varName];
  const status = isSet ? '✅' : '⚠️';
  console.log(`${status} ${varName}: ${isSet ? 'SET' : 'NOT SET'}`);
  if (!isSet) {
    missingOptional.push(varName);
  }
});

console.log('\n📋 Summary:');
if (allRequiredSet) {
  console.log('✅ All required environment variables are set');
  console.log('🚀 Environment validation passed');
  process.exit(0);
} else {
  console.log('❌ Missing required environment variables:');
  missingRequired.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n💡 Copy values from .env.example or set them in your environment');
  console.log('🔧 For development, you can create a .env file with the required variables');
  process.exit(1);
}