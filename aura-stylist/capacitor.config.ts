import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aurastylist.app',
  appName: 'Aura Stylist',
  webDir: 'dist',
  // App store version info
  // iOS: Set in Xcode (CFBundleShortVersionString and CFBundleVersion)
  // Android: Set in android/app/build.gradle (versionCode and versionName)

  server: {
    // Use HTTPS scheme for security
    androidScheme: 'https',
    iosScheme: 'https',
    // Allow navigation to external URLs (for deep linking)
    allowNavigation: ['*.google.com']
  },

  // iOS-specific configuration
  ios: {
    // Enable content inset adjustment for safe areas
    contentInset: 'automatic',
    // Prefer native scrolling
    preferredContentMode: 'mobile',
    // Background modes (if needed for future features)
    // limitsNavigationsToAppBoundDomains: true, // Enable for App Bound Domains
  },

  // Android-specific configuration
  android: {
    // Allow mixed content (HTTP in HTTPS context) - disabled for security
    allowMixedContent: false,
    // Capture input for file uploads
    captureInput: true,
    // Enable web contents debugging only in debug builds
    webContentsDebuggingEnabled: false,
    // Background color while loading
    backgroundColor: '#FBFBFB',
    // Build type for release
    // buildOptions: { releaseType: 'APK' }
  },

  plugins: {
    // Camera permissions and configuration
    Camera: {
      permissions: {
        camera: 'Aura Stylist needs camera access to photograph your clothing items for AI-powered outfit suggestions.',
        photos: 'Aura Stylist needs photo library access to select clothing items from your wardrobe for styling analysis.'
      }
    },

    // Splash screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#FBFBFB',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#000000'
    },

    // Status bar styling
    StatusBar: {
      style: 'dark',
      backgroundColor: '#FFFFFF',
      overlaysWebView: false
    },

    // App lifecycle
    App: {
      // Handle URL scheme for deep linking
      // urlSchemes: ['aurastylist']
    },

    // Keyboard behavior (for future text input features)
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },

  // Logging configuration
  loggingBehavior: 'none' // Disable console logging in production
};

export default config;
