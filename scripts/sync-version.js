#!/usr/bin/env node

/**
 * Sync version from package.json to app.json
 * Also increments build numbers for iOS and Android
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const version = packageJson.version;

// Read app.json
const appPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appPath, 'utf8'));

// Update version
appJson.expo.version = version;

// Increment build numbers
if (appJson.expo.ios && appJson.expo.ios.buildNumber) {
  const currentBuildNumber = parseInt(appJson.expo.ios.buildNumber, 10);
  appJson.expo.ios.buildNumber = String(currentBuildNumber + 1);
}

if (appJson.expo.android && appJson.expo.android.versionCode) {
  appJson.expo.android.versionCode = appJson.expo.android.versionCode + 1;
}

// Write back to app.json
fs.writeFileSync(appPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`✅ Version synced to ${version}`);
console.log(`📱 iOS build number: ${appJson.expo.ios?.buildNumber || 'N/A'}`);
console.log(`🤖 Android version code: ${appJson.expo.android?.versionCode || 'N/A'}`);

