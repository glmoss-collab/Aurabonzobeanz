import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aurastylist.app',
  appName: 'Aura Stylist',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: {
        camera: 'This app uses your camera to take photos of clothing items.',
        photos: 'This app needs access to your photos to select clothing items.'
      }
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#FBFBFB",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#000000"
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#FFFFFF"
    }
  }
};

export default config;
