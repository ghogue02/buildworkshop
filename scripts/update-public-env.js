const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Path to the env-config.js file in the public directory
const envConfigPath = path.join(__dirname, '../public/env-config.js');

try {
  // Create the env-config.js content
  const envConfigContent = `window._env_ = {
  REACT_APP_SUPABASE_URL: "${process.env.REACT_APP_SUPABASE_URL || ''}",
  REACT_APP_SUPABASE_ANON_KEY: "${process.env.REACT_APP_SUPABASE_ANON_KEY || ''}"
};`;
  
  // Write the content to the file
  fs.writeFileSync(envConfigPath, envConfigContent);
  
  console.log(`Successfully updated ${envConfigPath} with environment variables`);
} catch (error) {
  console.error('Error updating env-config.js:', error);
  process.exit(1);
}