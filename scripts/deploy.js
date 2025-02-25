const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.production
const envPath = path.join(__dirname, '../.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
    process.env[key.trim()] = value.trim();
  }
});

// Validate Supabase environment variables
['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY'].forEach(key => {
  if (!process.env[key]) {
    console.error(`Error: ${key} is not set in .env.production`);
    process.exit(1);
  }
});

try {
  // Build the project
  console.log('Building project...');
  execSync('npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, ...envVars }
  });

  // Generate env-config.js
  console.log('Generating environment config...');
  const envConfigTemplate = fs.readFileSync(
    path.join(__dirname, '../public/env-config.js'),
    'utf8'
  );

  let envConfigContent = envConfigTemplate;
  Object.entries(envVars).forEach(([key, value]) => {
    envConfigContent = envConfigContent.replace(
      `%${key}%`,
      value
    );
  });

  fs.writeFileSync(
    path.join(__dirname, '../build/env-config.js'),
    envConfigContent
  );

  // Update env-config.js to use Web Speech API
  console.log('Updating env-config.js to use Web Speech API...');
  execSync('node scripts/web-speech-api-update.js build/env-config.js', { stdio: 'inherit' });

  // Deploy to GitHub Pages
  console.log('Deploying to GitHub Pages...');
  execSync('gh-pages -d build', { stdio: 'inherit' });
  
  console.log('Deployment completed successfully!');
  
  // Note: No need to manually update the env-config.js file anymore
  console.log('\nTranscription is now enabled using the Web Speech API!');
  console.log('No OpenAI API key is required.');
} catch (error) {
  console.error('Deployment failed:', error);
  process.exit(1);
}