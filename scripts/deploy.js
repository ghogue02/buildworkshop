const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read environment variables
const envVars = {
  REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
  REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
  REACT_APP_OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY
};

// Validate environment variables
Object.entries(envVars).forEach(([key, value]) => {
  if (!value) {
    console.error(`Error: ${key} is not set`);
    process.exit(1);
  }
});

try {
  // Build the project
  console.log('Building project...');
  execSync('npm run build', { stdio: 'inherit' });

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

  // Deploy to GitHub Pages
  console.log('Deploying to GitHub Pages...');
  execSync('gh-pages -d build', { stdio: 'inherit' });

  console.log('Deployment completed successfully!');
} catch (error) {
  console.error('Deployment failed:', error);
  process.exit(1);
}