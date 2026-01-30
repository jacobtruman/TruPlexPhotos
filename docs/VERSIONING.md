# Versioning Guide

## Overview

TruPlexPhotos uses **Semantic Versioning (SemVer)** for version numbers and automated build number tracking for app stores.

## Version Format

### Semantic Version: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.x.x): Breaking changes, major redesigns
- **MINOR** (x.1.x): New features, backwards-compatible
- **PATCH** (x.x.1): Bug fixes, minor improvements

### Build Numbers

- **iOS**: `buildNumber` (string) - e.g., "1", "2", "3"
- **Android**: `versionCode` (integer) - e.g., 1, 2, 3

Build numbers are **automatically incremented** when you bump the version.

## How to Bump Version

### Using NPM Scripts (Recommended)

```bash
# Bug fixes and minor improvements
npm run version:patch
# Example: 1.0.0 -> 1.0.1

# New features (backwards-compatible)
npm run version:minor
# Example: 1.0.0 -> 1.1.0

# Breaking changes or major updates
npm run version:major
# Example: 1.0.0 -> 2.0.0
```

### What Happens Automatically

1. Updates `package.json` version
2. Updates `app.json` version
3. Increments iOS `buildNumber`
4. Increments Android `versionCode`
5. Displays new version info

## Release Workflow

### 1. Update CHANGELOG.md

Before bumping version, document your changes:

```markdown
## [Unreleased]

### Added
- New photo sharing feature

### Fixed
- Fixed crash when viewing large photos
```

### 2. Bump Version

```bash
npm run version:patch  # or minor/major
```

### 3. Update CHANGELOG

Move changes from `[Unreleased]` to the new version:

```markdown
## [1.0.1] - 2026-01-30

### Added
- New photo sharing feature

### Fixed
- Fixed crash when viewing large photos
```

### 4. Commit Changes

```bash
git add package.json app.json CHANGELOG.md
git commit -m "chore: release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

### 5. Build for Distribution

```bash
# Preview build (for testing)
npm run build:android
npm run build:ios

# Production build (for app stores)
npm run build:production
```

## Version Display

The app displays version info in the Settings screen:

- **Format**: `1.0.0 (1)` where:
  - `1.0.0` = Semantic version
  - `(1)` = Build number

## When to Bump Each Version Type

### PATCH (x.x.1)
- Bug fixes
- Performance improvements
- UI tweaks
- Documentation updates
- Dependency updates (non-breaking)

### MINOR (x.1.x)
- New features
- New screens or components
- Enhanced functionality
- Backwards-compatible API changes
- Dependency updates (new features)

### MAJOR (1.x.x)
- Breaking changes
- Complete redesigns
- Removed features
- Major architecture changes
- Incompatible API changes

## Examples

### Patch Release (1.0.0 → 1.0.1)
```
- Fixed photo download crash on Android
- Improved grid spacing
- Updated README
```

### Minor Release (1.0.0 → 1.1.0)
```
- Added photo editing feature
- New album sorting options
- Improved search functionality
```

### Major Release (1.0.0 → 2.0.0)
```
- Complete UI redesign
- Removed legacy authentication
- New navigation structure
- Requires Plex Pass subscription
```

## Build Number Management

Build numbers are **automatically managed** and should **never be manually edited**.

- They increment with every version bump
- iOS and Android have separate build numbers
- They're used by app stores to identify builds

## Troubleshooting

### Version Mismatch

If `package.json` and `app.json` versions don't match:

```bash
node scripts/sync-version.js
```

### Reset Build Numbers

If you need to reset build numbers (rare):

1. Edit `app.json` manually
2. Set `ios.buildNumber` to "1"
3. Set `android.versionCode` to 1

### Check Current Version

```bash
# View package.json version
npm version

# View all version info
node -e "console.log(require('./src/constants/version').getFullVersionInfo())"
```

## Best Practices

1. **Always use npm scripts** to bump versions
2. **Update CHANGELOG.md** before releasing
3. **Commit version changes** separately from feature changes
4. **Tag releases** in git
5. **Test builds** before production release
6. **Document breaking changes** clearly
7. **Follow SemVer strictly** for predictability

## References

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Expo Versioning](https://docs.expo.dev/distribution/app-stores/#versioning-your-app)

