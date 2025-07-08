const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse .env file
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#\s]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
    envVars[key] = value;
  }
});

// Generate environment configuration
const generateEnvironmentFile = (production = false) => {
  const config = {
    production,
    apiUrl: envVars.BACKEND_URL || 'http://localhost:5000',
    serviceDomain: envVars.SERVICE_DOMAIN || 'localhost:5000'
  };
  
  return `export const environment = ${JSON.stringify(config, null, 2)};
`;
};

// Write environment files
const environmentsDir = path.join(__dirname, 'src/environments');

// Ensure environments directory exists
if (!fs.existsSync(environmentsDir)) {
  fs.mkdirSync(environmentsDir, { recursive: true });
}

// Write development environment
fs.writeFileSync(
  path.join(environmentsDir, 'environment.ts'),
  generateEnvironmentFile(false)
);

// Write production environment
fs.writeFileSync(
  path.join(environmentsDir, 'environment.prod.ts'),
  generateEnvironmentFile(true)
);

console.log('✅ Environment files generated from .env');
console.log(`📁 API URL: ${envVars.BACKEND_URL || 'http://localhost:5000'}`);
console.log(`🌐 Service Domain: ${envVars.SERVICE_DOMAIN || 'localhost:5000'}`);
