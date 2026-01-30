#!/usr/bin/env node

/**
 * Check if version has been updated in this commit
 * If not, auto-increment patch version
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the list of staged files
let stagedFiles;
try {
  stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' });
} catch (error) {
  // If git command fails, we're probably not in a git repo or no files staged
  console.log('⚠️  No staged files or not in a git repository');
  process.exit(0);
}

// Check if package.json is staged
const isPackageJsonStaged = stagedFiles.includes('package.json');

if (!isPackageJsonStaged) {
  console.log('📦 Auto-incrementing patch version...');
  
  // Read current version
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const oldVersion = packageJson.version;
  
  // Increment patch version
  try {
    execSync('npm version patch --no-git-tag-version', { stdio: 'inherit' });
    execSync('node scripts/sync-version.js', { stdio: 'inherit' });
    
    // Read new version
    const updatedPackageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const newVersion = updatedPackageJson.version;
    
    console.log(`✅ Version bumped: ${oldVersion} → ${newVersion}`);
    
    // Stage the updated files
    execSync('git add package.json app.json');
    console.log('📝 Staged version files');
  } catch (error) {
    console.error('❌ Failed to increment version:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Version already updated in this commit');
}

process.exit(0);

