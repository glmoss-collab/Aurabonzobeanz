import { Camera, CameraResultType, CameraSource, CameraPermissionState } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraImage {
  base64String: string;
  format: string;
}

export enum CameraErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PERMISSION_LIMITED = 'PERMISSION_LIMITED',
  CAMERA_UNAVAILABLE = 'CAMERA_UNAVAILABLE',
  USER_CANCELLED = 'USER_CANCELLED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class CameraError extends Error {
  constructor(
    message: string,
    public code: CameraErrorCode,
    public userMessage: string
  ) {
    super(message);
    this.name = 'CameraError';
  }
}

/**
 * Check and request camera/photo permissions
 */
export const checkPermissions = async (): Promise<{
  camera: CameraPermissionState;
  photos: CameraPermissionState;
}> => {
  try {
    const status = await Camera.checkPermissions();
    return {
      camera: status.camera,
      photos: status.photos,
    };
  } catch {
    // Fallback for web or unsupported platforms
    return { camera: 'granted', photos: 'granted' };
  }
};

/**
 * Request camera and photo permissions
 */
export const requestPermissions = async (): Promise<{
  camera: CameraPermissionState;
  photos: CameraPermissionState;
}> => {
  try {
    const status = await Camera.requestPermissions({
      permissions: ['camera', 'photos'],
    });
    return {
      camera: status.camera,
      photos: status.photos,
    };
  } catch {
    return { camera: 'granted', photos: 'granted' };
  }
};

/**
 * Get user-friendly message for permission denial
 */
export const getPermissionDeniedMessage = (source: 'camera' | 'library'): string => {
  if (source === 'camera') {
    return 'Camera access is required to take photos. Please enable camera permissions in your device settings.';
  }
  return 'Photo library access is required to select images. Please enable photo permissions in your device settings.';
};

/**
 * Take or select a photo with proper error handling
 */
export const takePhoto = async (source: 'camera' | 'library' = 'library'): Promise<CameraImage | null> => {
  // Check permissions first on native platforms
  if (Capacitor.isNativePlatform()) {
    const permissions = await checkPermissions();
    const requiredPermission = source === 'camera' ? permissions.camera : permissions.photos;

    if (requiredPermission === 'denied') {
      // Try requesting permissions
      const requested = await requestPermissions();
      const newPermission = source === 'camera' ? requested.camera : requested.photos;

      if (newPermission === 'denied') {
        throw new CameraError(
          'Permission denied',
          CameraErrorCode.PERMISSION_DENIED,
          getPermissionDeniedMessage(source)
        );
      }
    }
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      width: 1920,
      height: 1920,
      correctOrientation: true, // Auto-fix orientation from EXIF
      presentationStyle: 'fullscreen', // Better UX on iOS
    });

    if (image.base64String) {
      return {
        base64String: image.base64String,
        format: image.format || 'jpeg'
      };
    }
    return null;
  } catch (error) {
    // Handle specific error cases
    if (error instanceof CameraError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';

    // User cancelled
    if (errorMessage.includes('cancel') || errorMessage.includes('user denied')) {
      throw new CameraError(
        'User cancelled',
        CameraErrorCode.USER_CANCELLED,
        'Photo selection was cancelled.'
      );
    }

    // Permission denied
    if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      throw new CameraError(
        'Permission denied',
        CameraErrorCode.PERMISSION_DENIED,
        getPermissionDeniedMessage(source)
      );
    }

    // Camera unavailable
    if (errorMessage.includes('camera') && errorMessage.includes('unavailable')) {
      throw new CameraError(
        'Camera unavailable',
        CameraErrorCode.CAMERA_UNAVAILABLE,
        'Camera is not available on this device.'
      );
    }

    console.error('Camera error:', error);
    throw new CameraError(
      String(error),
      CameraErrorCode.UNKNOWN_ERROR,
      'Failed to capture photo. Please try again.'
    );
  }
};

/**
 * Convert camera image to data URL format
 */
export const getImageDataUrl = (image: CameraImage): string => {
  return `data:image/${image.format};base64,${image.base64String}`;
};

/**
 * Get user-friendly error message from camera errors
 */
export const getCameraErrorMessage = (error: unknown): string => {
  if (error instanceof CameraError) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred with the camera.';
};

/**
 * Check if error was due to user cancellation (shouldn't show error)
 */
export const isUserCancellation = (error: unknown): boolean => {
  return error instanceof CameraError && error.code === CameraErrorCode.USER_CANCELLED;
};
