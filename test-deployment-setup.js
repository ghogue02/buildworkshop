#!/usr/bin/env node

/**
 * Test Deployment Setup
 * 
 * This script verifies that your deployment setup is working correctly.
 * It checks for the necessary environment variables and dependencies.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Testing deployment setup...\n');

// Check if gh-pages is installed
try {
  console.log('Checking for gh-pages package...');
  const output = execSync('npm list gh-pages --depth=0').toString();
  if (output.includes('gh-pages@')) {
    console.log('✅ gh-pages package is installed correctly.');
  } else {
    console.log('❌ gh-pages package not found. Please run: npm install --save-dev gh-pages');
  }
} catch (error) {
  console.log('❌ Error checking gh-pages package:', error.message);
  console.log('Please run: npm install --save-dev gh-pages');
}

// Check for .env.production file
console.log('\nChecking for .env.production file...');
const envPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.production file exists.');
  
  // Check for required environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const supabaseUrl = envContent.includes('REACT_APP_SUPABASE_URL');
  const supabaseKey = envContent.includes('REACT_APP_SUPABASE_ANON_KEY');
  
  if (supabaseUrl) {
    console.log('✅ REACT_APP_SUPABASE_URL is defined in .env.production');
  } else {
    console.log('❌ REACT_APP_SUPABASE_URL is missing from .env.production');
  }
  
  if (supabaseKey) {
    console.log('✅ REACT_APP_SUPABASE_ANON_KEY is defined in .env.production');
  } else {
    console.log('❌ REACT_APP_SUPABASE_ANON_KEY is missing from .env.production');
  }
} else {
  console.log('❌ .env.production file not found. Please create it with the required environment variables.');
}

// Check for deploy.js script
console.log('\nChecking for deploy.js script...');
const deployPath = path.join(__dirname, 'scripts', 'deploy.js');
if (fs.existsSync(deployPath)) {
  console.log('✅ deploy.js script exists.');
} else {
  console.log('❌ deploy.js script not found.');
}

// Check for web-speech-api-update.js script
console.log('\nChecking for web-speech-api-update.js script...');
const webSpeechPath = path.join(__dirname, 'scripts', 'web-speech-api-update.js');
if (fs.existsSync(webSpeechPath)) {
  console.log('✅ web-speech-api-update.js script exists.');
} else {
  console.log('❌ web-speech-api-update.js script not found.');
}

// Check for env-config.js
console.log('\nChecking for env-config.js...');
const envConfigPath = path.join(__dirname, 'public', 'env-config.js');
if (fs.existsSync(envConfigPath)) {
  console.log('✅ env-config.js exists.');
} else {
  console.log('❌ env-config.js not found.');
}

// Check .gitignore for workflow directory
console.log('\nChecking if .github/workflows/ is in .gitignore...');
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.github/workflows/')) {
    console.log('✅ .github/workflows/ is in .gitignore');
  } else {
    console.log('❌ .github/workflows/ is not in .gitignore. Please add it to prevent future issues.');
  }
} else {
  console.log('❌ .gitignore file not found.');
}

console.log('\nDeployment setup test complete!');
console.log('\nIf all checks passed, you should be able to deploy with: npm run deploy');
console.log('If any checks failed, please fix the issues before deploying.');