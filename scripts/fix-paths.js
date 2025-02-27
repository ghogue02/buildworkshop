const fs = require('fs');
const path = require('path');

console.log('Fixing paths in build files...');

// Read the index.html file
const indexPath = path.join(__dirname, '../build', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Replace absolute paths with relative paths
indexContent = indexContent.replace(/href="\/builderworkshop\//g, 'href="./');
indexContent = indexContent.replace(/src="\/builderworkshop\//g, 'src="./');
indexContent = indexContent.replace(/content="\/builderworkshop\//g, 'content="./');

// Write the modified content back to index.html
fs.writeFileSync(indexPath, indexContent);
console.log('Fixed paths in index.html');

// Check if there's a 404.html file and fix it too
const notFoundPath = path.join(__dirname, '../build', '404.html');
if (fs.existsSync(notFoundPath)) {
  let notFoundContent = fs.readFileSync(notFoundPath, 'utf8');
  
  // Replace absolute paths with relative paths
  notFoundContent = notFoundContent.replace(/href="\/builderworkshop\//g, 'href="./');
  notFoundContent = notFoundContent.replace(/src="\/builderworkshop\//g, 'src="./');
  notFoundContent = notFoundContent.replace(/content="\/builderworkshop\//g, 'content="./');
  
  // Write the modified content back to 404.html
  fs.writeFileSync(notFoundPath, notFoundContent);
  console.log('Fixed paths in 404.html');
}

// Fix asset-manifest.json if it exists
const manifestPath = path.join(__dirname, '../build', 'asset-manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    // Fix paths in the manifest
    const newManifest = {};
    for (const [key, value] of Object.entries(manifest)) {
      if (typeof value === 'string') {
        newManifest[key] = value.replace(/^\/builderworkshop\//, './');
      } else {
        newManifest[key] = value;
      }
    }
    
    // Write the modified manifest back to the file
    fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2));
    console.log('Fixed paths in asset-manifest.json');
  } catch (error) {
    console.error('Error fixing asset-manifest.json:', error);
  }
}

console.log('Path fixing completed!');