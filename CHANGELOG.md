# Changelog

All notable changes to TruPlexPhotos will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Version management system with automated build number tracking

### Changed
- Improved photo and folder grid spacing (4px margins)
- Updated photo thumbnails with rounded corners

### Fixed
- Photo sorting now uses Plex's original order

## [1.0.0] - 2026-01-30

### Added
- Initial release
- Plex OAuth authentication
- Multi-server support
- Profile management
- Timeline view with date-based sections
- Folder/album navigation with breadcrumbs
- Full-screen photo viewer
- Photo metadata display
- Download photos to device
- Share photos via native share sheet
- Video playback support
- Photo rating system
- Pull-to-refresh functionality
- Dark theme with Plex orange accents
- 3-column responsive grid layout
- Folder cards with gradient overlays

### Technical
- React Native 0.81.5
- Expo SDK 54
- TypeScript 5.9.2
- React Navigation 7.x
- EAS Build support

---

## Version Format

- **MAJOR.MINOR.PATCH** (Semantic Versioning)
- **Build Numbers**: Auto-incremented for each build
  - iOS: `buildNumber` (string)
  - Android: `versionCode` (integer)

## How to Update Version

```bash
# Patch version (1.0.0 -> 1.0.1) - Bug fixes
npm run version:patch

# Minor version (1.0.0 -> 1.1.0) - New features
npm run version:minor

# Major version (1.0.0 -> 2.0.0) - Breaking changes
npm run version:major
```

After updating version, commit the changes and build:

```bash
git add package.json app.json CHANGELOG.md
git commit -m "chore: bump version to X.Y.Z"
npm run build:android  # or build:ios
```

