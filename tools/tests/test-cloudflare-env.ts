import { envLoader } from './src/scripts/modules/EnvironmentLoader.ts';

try {
  const token = envLoader.get('CLOUDFLARE_API_TOKEN');
  const accountId = envLoader.get('CLOUDFLARE_ACCOUNT_ID');

  console.log('CLOUDFLARE_API_TOKEN:', token ? 'set' : 'not set');
  console.log('CLOUDFLARE_ACCOUNT_ID:', accountId ? 'set' : 'not set');

  if (accountId && accountId !== 'your_cloudflare_account_id_here') {
    console.log('CLOUDFLARE_ACCOUNT_ID appears to be a real value');
  } else {
    console.log('CLOUDFLARE_ACCOUNT_ID is not set or is placeholder');
  }
} catch (error) {
  console.error('Error:', error.message);
}
