# Privacy Policy for Tru Photos

**Last Updated: January 30, 2026**

## Overview

Tru Photos is a mobile application that allows you to browse and manage photos from your Plex Media Server. This privacy policy explains how the app handles your data.

## Data Collection

### What We Collect

Tru Photos does **NOT** collect, store, or transmit any personal data to third-party servers. All data remains on your device and your Plex Media Server.

The app stores the following information **locally on your device only**:

- **Plex Authentication Token**: Used to authenticate with your Plex account
- **Selected Profile**: Your chosen Plex profile
- **Selected Server**: Your chosen Plex Media Server
- **Selected Library**: Your chosen photo library
- **App Preferences**: Settings like selected tab, grid size, etc.

### What We Don't Collect

- We do **NOT** collect analytics or usage data
- We do **NOT** track your location
- We do **NOT** access your device's camera or microphone
- We do **NOT** share your data with third parties
- We do **NOT** display advertisements

## Data Storage

All data is stored locally on your device using:

- **Expo SecureStore**: For sensitive data like authentication tokens
- **AsyncStorage**: For app preferences and settings

This data is **never transmitted** to any server except your own Plex Media Server.

## Third-Party Services

### Plex Media Server

Tru Photos connects directly to:

1. **Plex.tv** - For authentication and server discovery
2. **Your Plex Media Server** - For accessing your photos

Please refer to [Plex's Privacy Policy](https://www.plex.tv/about/privacy-legal/) for information about how Plex handles your data.

### No Other Third Parties

Tru Photos does not use:
- Analytics services (e.g., Google Analytics, Firebase)
- Crash reporting services
- Advertising networks
- Social media integrations

## Permissions

The app requests the following permissions:

- **Internet Access**: Required to connect to your Plex Media Server
- **Media Library Access**: Optional, only if you choose to download photos to your device
- **Storage Access**: Optional, only if you choose to download photos

## Data Security

- Authentication tokens are stored securely using Expo SecureStore
- All communication with Plex servers uses HTTPS encryption
- No data is transmitted to servers other than Plex

## Your Rights

You have the right to:

- **Delete Your Data**: Uninstalling the app removes all locally stored data
- **Sign Out**: Removes authentication tokens from the device
- **Switch Profiles/Servers**: Change which Plex account or server you use

## Children's Privacy

Tru Photos does not knowingly collect data from children under 13. The app is designed for users who have access to a Plex Media Server.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the app and on the GitHub repository.

## Open Source

Tru Photos is open source software. You can review the source code at:
https://github.com/jacobtruman/TruPhotos

## Contact

For questions or concerns about privacy, please open an issue on GitHub:
https://github.com/jacobtruman/TruPhotos/issues

## Summary

**TL;DR**: Tru Photos is a privacy-focused app that:
- ✅ Stores data only on your device
- ✅ Connects only to your Plex servers
- ✅ Does not collect analytics or tracking data
- ✅ Does not share data with third parties
- ✅ Is open source and transparent

Your photos and data remain private and under your control.

