import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CameraImage {
  base64String: string;
  format: string;
}

export const takePhoto = async (source: 'camera' | 'library' = 'library'): Promise<CameraImage | null> => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      width: 1920,
      height: 1920
    });

    if (image.base64String) {
      return {
        base64String: image.base64String,
        format: image.format || 'jpeg'
      };
    }
    return null;
  } catch (error) {
    console.error('Camera error:', error);
    return null;
  }
};

export const getImageDataUrl = (image: CameraImage): string => {
  return `data:image/${image.format};base64,${image.base64String}`;
};
