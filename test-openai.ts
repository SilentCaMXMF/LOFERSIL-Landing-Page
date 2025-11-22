import { envLoader } from './src/scripts/modules/EnvironmentLoader.ts';

try {
  const openaiKey = envLoader.get('OPENAI_API_KEY');
  if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
    console.log('OPENAI_API_KEY is set to a value');
  } else {
    console.log('OPENAI_API_KEY is not set or is placeholder');
  }
} catch (error) {
  console.error('Error checking OPENAI_API_KEY:', error.message);
}
