const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the OpenAI API key from command line arguments
const apiKey = process.argv[2];

if (!apiKey) {
  console.error('Error: OpenAI API key is required');
  console.error('Usage: node update-deployed-env.js YOUR_OPENAI_API_KEY');
  process.exit(1);
}

// Create a temporary directory
const tempDir = path.join(__dirname, '../temp-gh-pages');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

try {
  // Clone the gh-pages branch to the temporary directory
  console.log('Cloning gh-pages branch...');
  execSync(`git clone -b gh-pages https://github.com/ghogue02/buildworkshop.git ${tempDir}`, { stdio: 'inherit' });

  // Path to the env-config.js file in the cloned repository
  const envConfigPath = path.join(tempDir, 'env-config.js');

  // Read the env-config.js file
  console.log('Updating env-config.js with OpenAI API key...');
  const envConfigContent = fs.readFileSync(envConfigPath, 'utf8');
  
  // Replace the placeholder with the actual API key
  const updatedContent = envConfigContent.replace(
    /REACT_APP_OPENAI_API_KEY":\s*"[^"]*"/,
    `REACT_APP_OPENAI_API_KEY": "${apiKey}"`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(envConfigPath, updatedContent);
  
  // Commit and push the changes
  console.log('Committing and pushing changes...');
  execSync(`cd ${tempDir} && git add env-config.js && git commit -m "Update OpenAI API key" && git push`, { stdio: 'inherit' });
  
  console.log('Successfully updated env-config.js with the OpenAI API key on the deployed site');
} catch (error) {
  console.error('Error updating env-config.js:', error);
  process.exit(1);
} finally {
  // Clean up the temporary directory
  console.log('Cleaning up...');
  fs.rmSync(tempDir, { recursive: true, force: true });
}