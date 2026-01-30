# TruPlexPhotos

A beautiful, native mobile photo viewer for Plex Media Server, built with React Native and Expo.

## 📱 Overview

TruPlexPhotos is a dedicated mobile application for browsing and viewing photos from your Plex Media Server. It provides a clean, intuitive interface optimized for mobile devices with features like folder navigation, timeline view, photo downloads, and sharing.

## ✨ Features

### Core Functionality
- **Plex Authentication** - Secure OAuth login with Plex account
- **Multi-Server Support** - Connect to multiple Plex servers
- **Profile Management** - Switch between Plex managed profiles
- **Library Selection** - Browse multiple photo libraries

### Photo Browsing
- **Timeline View** - Photos organized by date with infinite scroll
- **Folder Navigation** - Browse photos organized in folders/albums
- **Breadcrumb Navigation** - Easy navigation through folder hierarchy
- **Folder Previews** - Visual folder cards with cover photos and item counts
- **Mixed Content** - Seamlessly display folders and photos in the same grid

### Photo Viewing
- **Full-Screen Viewer** - Swipe through photos with smooth transitions
- **Photo Metadata** - View detailed EXIF data, ratings, and descriptions
- **Video Support** - Play videos with duration indicators
- **Rating System** - Rate photos directly from the viewer

### Photo Management
- **Download to Device** - Save photos to your device's gallery
- **Share Photos** - Share photos via native share sheet
- **Pull to Refresh** - Refresh content with pull-down gesture

### UI/UX
- **Dark Theme** - Beautiful dark interface with Plex orange accents
- **Responsive Grid** - 3-column grid layout with consistent spacing
- **Rounded Thumbnails** - Modern rounded corners on all media
- **Gradient Overlays** - Dynamic color gradients from photo metadata
- **Edge-to-Edge Display** - Full-screen immersive experience on Android

## 🛠 Tech Stack

### Framework & Language
- **React Native** 0.81.5
- **Expo SDK** 54
- **TypeScript** 5.9.2
- **React** 19.1.0

### Navigation
- **React Navigation** 7.x
  - Native Stack Navigator
  - Bottom Tab Navigator

### Key Dependencies
- **expo-secure-store** - Secure token storage
- **expo-file-system** - File downloads and caching
- **expo-media-library** - Save photos to device gallery
- **expo-sharing** - Native share functionality
- **expo-linear-gradient** - Gradient overlays
- **expo-crypto** - Client ID generation
- **expo-web-browser** - OAuth authentication
- **react-native-reanimated** - Smooth animations
- **react-native-gesture-handler** - Touch gestures

## 📁 Project Structure

```
TruPlexPhotos/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── AlbumCard.tsx
│   │   ├── PhotoThumbnail.tsx
│   │   ├── PhotoGrid.tsx
│   │   └── ...
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── PhotosScreen.tsx
│   │   ├── AlbumsScreen.tsx
│   │   ├── AlbumDetailScreen.tsx
│   │   ├── PhotoViewerScreen.tsx
│   │   └── ...
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API and business logic
│   │   ├── authService.ts
│   │   ├── plexService.ts
│   │   └── downloadService.ts
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── theme/            # Colors, typography, styles
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── assets/               # Images and icons
├── app.json             # Expo configuration
├── eas.json             # EAS Build configuration
└── package.json         # Dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode and iOS Simulator
- For Android: Android Studio and Android Emulator
- A Plex Media Server with photo libraries

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TruPlexPhotos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on a device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device




## 📦 Building for Production

### Build APK with EAS Build

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Build for Android**
   ```bash
   eas build --platform android --profile preview
   ```

4. **Build for iOS**
   ```bash
   eas build --platform ios --profile preview
   ```

The build will be processed on Expo's servers and you'll receive a download link when complete.

### Local Development Build

```bash
# Generate native Android project
npx expo prebuild

# Build locally
cd android
./gradlew assembleRelease
```

## 🎨 Design System

### Color Palette
- **Primary**: `#E5A00D` (Plex Orange/Gold)
- **Primary Dark**: `#CC8A00`
- **Background**: `#1F1F1F` (Dark Gray)
- **Surface**: `#282828`
- **Surface Light**: `#333333`
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#B3B3B3`

### Spacing System
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px

### Grid Layout
- **3-column grid** for photos and folders
- **4px margins** between items
- **4px container padding** on edges
- **Rounded corners** (4px border radius) on all media

## 🔐 Authentication Flow

1. User taps "Sign in with Plex"
2. App generates a PIN via Plex API
3. Opens Plex OAuth page in browser
4. User authorizes the app
5. App polls for PIN status
6. Receives auth token and stores securely
7. Fetches user profile and available servers
8. User selects profile (if managed users exist)
9. User selects server
10. User selects photo library
11. App navigates to main interface

## 📸 Photo Grid System

The app uses a unified grid system for displaying both folders and photos:

- **Consistent sizing**: All items calculated based on screen width
- **Container padding**: 4px on left and right edges
- **Item margins**: 4px on all sides of each item
- **Size calculation**: `(SCREEN_WIDTH - CONTAINER_PADDING - (NUM_COLUMNS * 8)) / NUM_COLUMNS`
- **Union types**: Folders and photos can be mixed in the same grid

## 🗂 Key Components

### AlbumCard
Displays folder/album with:
- Folder tab design (subtle orange accent)
- Cover photo with gradient overlay
- Title and item count
- Dynamic colors from photo metadata

### PhotoThumbnail
Displays photo/video with:
- Rounded corners
- Video duration badge
- Selection state
- Placeholder for missing images

### PhotoGrid
Timeline view with:
- Date-based sections
- Infinite scroll
- Pull to refresh
- Loading states

### PhotoViewerScreen
Full-screen photo viewer with:
- Horizontal swipe navigation
- Metadata panel
- Download and share actions
- Rating functionality

## 🔧 Configuration

### app.json
- **edgeToEdgeEnabled**: Full-screen on Android
- **backgroundColor**: Dark theme throughout
- **newArchEnabled**: React Native new architecture

### Key Settings
- **Portrait orientation** only
- **Dark UI style** (status bar, navigation)
- **Plex orange** accent color throughout

## 📝 Development Notes

### TypeScript
- Strict mode enabled
- Comprehensive type definitions in `src/types/index.ts`
- Type-safe navigation with route params

### State Management
- React Context for global state (auth, server, library)
- Local state with useState for screen-specific data
- Custom hooks for shared logic (e.g., `useFolderCounts`)

### API Integration
- All Plex API calls in `plexService.ts`
- Authentication logic in `authService.ts`
- Download/share logic in `downloadService.ts`

## 🐛 Known Issues

- Expo Vector Icons type definitions may show warnings (cosmetic only)
- Some Plex servers may require additional network configuration

## 📄 License

This project is private and not licensed for public use.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- Designed for [Plex Media Server](https://www.plex.tv)
- Icons from [Ionicons](https://ionic.io/ionicons)

## 📧 Contact

For questions or issues, please contact the repository owner.

---

**Version**: 1.0.0
**Last Updated**: January 2026
