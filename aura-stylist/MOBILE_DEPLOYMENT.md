# Aura Stylist - Mobile App Store Deployment Guide

## Overview

This guide covers deploying Aura Stylist to the Apple App Store (iOS) and Google Play Store (Android).

## Prerequisites

- Node.js 18+ and npm 9+
- Xcode 15+ (for iOS)
- Android Studio Hedgehog+ (for Android)
- Apple Developer Account ($99/year)
- Google Play Developer Account ($25 one-time)
- Gemini API Key configured in environment

## Quick Start

```bash
# Install dependencies
npm install

# Build and initialize mobile platforms
npm run mobile:init

# Or initialize platforms separately
npm run build
npx cap add ios
npx cap add android
npx cap sync
```

## Project Structure

```
aura-stylist/
├── resources/
│   ├── icon/           # App icons (1024x1024 source)
│   └── splash/         # Splash screens (2732x2732 source)
├── ios/                # Generated iOS project
├── android/            # Generated Android project
├── dist/               # Built web assets
└── capacitor.config.ts # Mobile configuration
```

---

## Image Upload Improvements

The following bottlenecks have been addressed to prevent user errors:

### 1. File Size Validation
- **Maximum file size**: 10MB
- **Warning threshold**: 5MB (shows processing notice)
- Clear error messages when limits exceeded

### 2. Image Dimension Validation
- **Minimum**: 200x200 pixels (prevents low-quality analysis)
- **Maximum**: 4096x4096 pixels (prevents memory issues)
- **Target**: 1920x1920 pixels (optimized for AI processing)

### 3. MIME Type Validation
- Supported formats: JPEG, PNG, WebP, HEIC, HEIF
- Proper MIME type extraction from data URLs
- Consistent handling across web and mobile

### 4. Automatic Image Compression
- Images over 2MB are automatically compressed
- Quality: 85% (good balance of size/quality)
- Maintains aspect ratio during resizing
- User notified of optimization

### 5. Memory Management
- Proper cleanup of blob URLs
- Request abortion on component unmount
- Generated images tracked and cleaned up

### 6. Error Handling & Retry Logic
- Automatic retry (up to 3 attempts) for network errors
- Exponential backoff with jitter
- User-friendly error messages
- Toast notifications for all error states

### 7. Permission Handling (Mobile)
- Proactive permission checking
- Clear permission denial messages
- Instructions to enable in device settings

---

## iOS Deployment

### 1. Generate App Icons

Create a 1024x1024 PNG icon and use a tool like:
- [App Icon Generator](https://appicon.co/)
- [Capacitor Assets](https://github.com/ionic-team/capacitor-assets)

Place generated icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### 2. Configure Xcode Project

```bash
npm run cap:ios
```

In Xcode:
1. Select your Team in Signing & Capabilities
2. Set Bundle Identifier: `com.aurastylist.app`
3. Set Version: `1.0.0`
4. Set Build: `1`

### 3. Required Info.plist Entries

Add to `ios/App/App/Info.plist`:

```xml
<!-- Camera Permission -->
<key>NSCameraUsageDescription</key>
<string>Aura Stylist needs camera access to photograph your clothing items for AI-powered outfit suggestions.</string>

<!-- Photo Library Permission -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Aura Stylist needs photo library access to select clothing items from your wardrobe for styling analysis.</string>

<!-- Photo Library Add Permission (for saving) -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Aura Stylist would like to save outfit suggestions to your photo library.</string>
```

### 4. App Store Connect Setup

1. Create app in [App Store Connect](https://appstoreconnect.apple.com)
2. Fill in metadata:
   - App Name: Aura Stylist
   - Subtitle: AI-Powered Style Assistant
   - Category: Lifestyle
   - Keywords: fashion, outfit, wardrobe, style, AI, color, clothing
3. Upload screenshots (required sizes):
   - 6.7" (iPhone 15 Pro Max): 1290x2796
   - 6.5" (iPhone 14 Plus): 1284x2778
   - 5.5" (iPhone 8 Plus): 1242x2208
   - 12.9" iPad Pro: 2048x2732

### 5. Build & Submit

```bash
# Build for release
npm run ios:build

# In Xcode:
# Product → Archive → Distribute App → App Store Connect
```

---

## Android Deployment

### 1. Generate App Icons

Create icons for all densities or use:
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)
- [Capacitor Assets](https://github.com/ionic-team/capacitor-assets)

Place in `android/app/src/main/res/mipmap-*/`

### 2. Configure Android Studio

```bash
npm run cap:android
```

### 3. Update app/build.gradle

```gradle
android {
    defaultConfig {
        applicationId "com.aurastylist.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 4. Signing Configuration

1. Generate keystore:
```bash
keytool -genkey -v -keystore aura-stylist.keystore -alias aurastylist -keyalg RSA -keysize 2048 -validity 10000
```

2. Add to `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        storeFile file('aura-stylist.keystore')
        storePassword System.getenv('KEYSTORE_PASSWORD')
        keyAlias 'aurastylist'
        keyPassword System.getenv('KEY_PASSWORD')
    }
}
```

### 5. Google Play Console Setup

1. Create app in [Google Play Console](https://play.google.com/console)
2. Fill in store listing:
   - Title: Aura Stylist
   - Short description: AI-powered outfit suggestions from your wardrobe
   - Full description: (detailed app description)
3. Upload screenshots (required):
   - Phone: 1080x1920 or 1440x2560
   - 7" Tablet: 1200x1920
   - 10" Tablet: 1600x2560
4. Upload feature graphic: 1024x500

### 6. Build & Submit

```bash
# Build release APK
npm run android:build

# In Android Studio:
# Build → Generate Signed Bundle / APK → Android App Bundle
```

---

## Environment Configuration

### API Key Setup

Create `.env.local` in project root:
```
GEMINI_API_KEY=your_api_key_here
```

**Important**: For production, implement a backend proxy to secure the API key.

---

## Testing Checklist

### Image Upload Testing
- [ ] Upload JPEG, PNG, WebP images
- [ ] Upload HEIC image (iOS)
- [ ] Upload image > 5MB (shows optimization notice)
- [ ] Upload image > 10MB (shows error)
- [ ] Upload image < 200px (shows error)
- [ ] Cancel image selection
- [ ] Permission denied handling

### Network Testing
- [ ] Slow connection (shows retry)
- [ ] No connection (shows error)
- [ ] Timeout handling
- [ ] Resume after connection restored

### Mobile Testing
- [ ] Camera capture (portrait & landscape)
- [ ] Photo library selection
- [ ] Permission prompts
- [ ] Safe area handling
- [ ] Orientation changes
- [ ] Background/foreground transitions

---

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors**
```bash
npm run typecheck
# Fix any type errors before building
```

**Capacitor sync fails**
```bash
npx cap doctor
# Follow recommendations
```

**iOS signing issues**
- Verify Team ID in Xcode
- Check provisioning profiles
- Ensure device is registered

**Android build fails**
- Check JAVA_HOME is set
- Verify Gradle version compatibility
- Clear Gradle cache: `cd android && ./gradlew clean`

---

## Version History

| Version | Changes |
|---------|---------|
| 1.0.0   | Initial release with image validation, compression, and error handling |

---

## Support

For issues, please open a GitHub issue with:
1. Device model and OS version
2. Steps to reproduce
3. Error messages (if any)
4. Screenshots (if applicable)
