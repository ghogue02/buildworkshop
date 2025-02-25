const fs = require('fs');
const path = require('path');

// Get the OpenAI API key from command line arguments
const apiKey = process.argv[2];

if (!apiKey) {
  console.error('Error: OpenAI API key is required');
  console.error('Usage: node update-env-config.js YOUR_OPENAI_API_KEY');
  process.exit(1);
}

// Path to the env-config.js file in the deployed site
const envConfigPath = process.argv[3] || 'build/env-config.js';

try {
  // Read the env-config.js file
  const envConfigContent = fs.readFileSync(envConfigPath, 'utf8');
  
  // Replace the placeholder with the actual API key
  const updatedContent = envConfigContent.replace(
    'OPENAI_API_KEY_PLACEHOLDER',
    apiKey
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(envConfigPath, updatedContent);
  
  console.log(`Successfully updated ${envConfigPath} with the OpenAI API key`);
} catch (error) {
  console.error('Error updating env-config.js:', error);
  process.exit(1);
}