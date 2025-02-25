const fs = require('fs');
const path = require('path');

// Path to the env-config.js file in the deployed site
const envConfigPath = process.argv[2] || 'build/env-config.js';

try {
  console.log(`Updating ${envConfigPath} to use Web Speech API...`);
  
  // Read the env-config.js file
  const envConfigContent = fs.readFileSync(envConfigPath, 'utf8');
  
  // Check if the file contains the OpenAI API key
  if (envConfigContent.includes('REACT_APP_OPENAI_API_KEY')) {
    // Replace the OpenAI API key with a comment
    const updatedContent = envConfigContent.replace(
      /REACT_APP_OPENAI_API_KEY":\s*"[^"]*"/,
      '// OpenAI API key is no longer needed with Web Speech API'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(envConfigPath, updatedContent);
    
    console.log(`Successfully updated ${envConfigPath} to use Web Speech API`);
  } else {
    console.log(`No OpenAI API key found in ${envConfigPath}, already using Web Speech API`);
  }
} catch (error) {
  console.error('Error updating env-config.js:', error);
  process.exit(1);
}