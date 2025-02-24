const fs = require('fs');
const path = require('path');

// Read the template
const envConfigTemplate = fs.readFileSync(
  path.join(__dirname, '../public/env-config.js'),
  'utf8'
);

// Replace placeholders with actual environment variables
let envConfigContent = envConfigTemplate;
['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY', 'REACT_APP_OPENAI_API_KEY'].forEach(key => {
  envConfigContent = envConfigContent.replace(
    `%${key}%`,
    process.env[key] || ''
  );
});

// Write the generated config
fs.writeFileSync(
  path.join(__dirname, '../build/env-config.js'),
  envConfigContent
);

console.log('Environment config generated successfully');