import { envLoader } from './src/scripts/modules/EnvironmentLoader.ts';

const keys = [
  'GEMINI_API_KEY',
  'CONTEXT7_API_KEY',
  'OPENAI_API_KEY',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
];

keys.forEach(key => {
  const value = envLoader.get(key as any);
  if (value) {
    if (value.startsWith('your_') || value.includes('here')) {
      console.log(`${key}: placeholder`);
    } else {
      console.log(`${key}: set`);
    }
  } else {
    console.log(`${key}: not set`);
  }
});
