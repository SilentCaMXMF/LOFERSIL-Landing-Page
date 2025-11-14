import fs from 'fs';
import path from 'path';

const testFilePath = path.join(process.cwd(), 'assets', 'images', 'test-file-creation.txt');
const testContent = 'This is a test file to verify file creation works.';

try {
  fs.writeFileSync(testFilePath, testContent, 'utf8');
  console.log('✅ File creation successful:', testFilePath);

  // Verify the file exists and has correct content
  if (fs.existsSync(testFilePath)) {
    const readContent = fs.readFileSync(testFilePath, 'utf8');
    if (readContent === testContent) {
      console.log('✅ File verification successful: content matches.');
    } else {
      console.log('❌ File verification failed: content does not match.');
    }
  } else {
    console.log('❌ File verification failed: file does not exist after creation.');
  }

  // Clean up
  fs.unlinkSync(testFilePath);
  console.log('✅ Test file cleaned up.');
} catch (error) {
  console.error('❌ File creation failed:', error.message);
  process.exit(1);
}
