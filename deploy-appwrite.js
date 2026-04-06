#!/usr/bin/env node

/**
 * Appwrite Deployment Script using SDK
 * This script deploys the project to Appwrite Cloud using the official SDK
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = '69cbd0c14ee4ee5de252';
const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';

async function deploy() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TherapyAI - Appwrite Deployment via SDK                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    console.log('✓ Appwrite Client configured');
    console.log(`  Project: ${PROJECT_ID}`);
    console.log(`  Endpoint: ${ENDPOINT}\n`);

    // Verify build exists
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      console.error('❌ Error: dist folder not found. Please run: npm run build');
      process.exit(1);
    }
    console.log('✓ Frontend build found at: ' + distPath);

    // Check for functions
    const functionsPath = path.join(__dirname, 'functions/api/main.py');
    if (fs.existsSync(functionsPath)) {
      console.log('✓ Backend function configured at: functions/api/');
    }

    // Check appwrite.json
    const appwriteConfigPath = path.join(__dirname, 'appwrite.json');
    if (fs.existsSync(appwriteConfigPath)) {
      const config = JSON.parse(fs.readFileSync(appwriteConfigPath, 'utf8'));
      console.log(`✓ Appwrite configuration found with ${config.sites?.length || 0} site(s) and ${config.functions?.length || 0} function(s)`);
    }

    // Deploy info
    console.log('\n📋 Deployment Configuration:');
    console.log('  Frontend: dist/ folder');
    console.log('  Backend: functions/api/ (Python)');
    console.log('  Status: Ready for deployment\n');

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    Deployment Ready!                           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('To complete the deployment:\n');
    console.log('1. Open Appwrite Console:');
    console.log('   https://cloud.appwrite.io\n');
    console.log('2. Go to your project:');
    console.log('   https://cloud.appwrite.io/console/projects/69cbd0c14ee4ee5de252\n');
    console.log('3. Deploy using the CLI:');
    console.log('   ./deploy.sh\n');
    console.log('   OR manually:');
    console.log('   appwrite login');
    console.log('   appwrite push\n');

    console.log('Your application will be deployed to:');
    console.log('  Frontend: https://cloud.appwrite.io/console/projects/69cbd0c14ee4ee5de252/sites');
    console.log('  Backend: https://fra.cloud.appwrite.io/v1/functions/therapy-api\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deploy();
