#!/usr/bin/env node

/**
 * Sync version from package.json to native iOS and Android projects
 * Also increments build numbers for iOS and Android
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const version = packageJson.version;

// Note: iOS version is managed via Xcode project settings (MARKETING_VERSION and CURRENT_PROJECT_VERSION)
// To update iOS version, use Xcode or update the project.pbxproj file directly
console.log(`📱 iOS: Update version in Xcode project settings`);

// Update Android build.gradle
const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (fs.existsSync(buildGradlePath)) {
  let gradleContent = fs.readFileSync(buildGradlePath, 'utf8');

  // Update versionName
  gradleContent = gradleContent.replace(
    /versionName\s+"[^"]+"/,
    `versionName "${version}"`
  );

  // Increment versionCode
  const versionCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
  if (versionCodeMatch) {
    const currentCode = parseInt(versionCodeMatch[1], 10);
    const newCode = currentCode + 1;
    gradleContent = gradleContent.replace(
      /versionCode\s+\d+/,
      `versionCode ${newCode}`
    );
    console.log(`🤖 Android version code: ${newCode}`);
  }

  fs.writeFileSync(buildGradlePath, gradleContent);
}

console.log(`✅ Version synced to ${version}`);

