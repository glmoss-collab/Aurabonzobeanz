/**
 * Image Validation Service
 * Handles file size limits, dimension validation, MIME type checking,
 * and image compression to prevent upload errors and optimize performance.
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: ImageErrorCode;
  warnings?: string[];
}

export interface ProcessedImage {
  dataUrl: string;
  mimeType: string;
  originalSize: number;
  processedSize: number;
  width: number;
  height: number;
  wasCompressed: boolean;
}

export enum ImageErrorCode {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_TYPE = 'INVALID_TYPE',
  DIMENSIONS_TOO_SMALL = 'DIMENSIONS_TOO_SMALL',
  DIMENSIONS_TOO_LARGE = 'DIMENSIONS_TOO_LARGE',
  CORRUPTED_IMAGE = 'CORRUPTED_IMAGE',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

// Configuration constants for image validation
export const IMAGE_CONFIG = {
  // Maximum file size in bytes (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  // Warning threshold for file size (5MB)
  FILE_SIZE_WARNING: 5 * 1024 * 1024,
  // Maximum dimensions for processing
  MAX_DIMENSION: 4096,
  // Target dimensions for optimization
  TARGET_DIMENSION: 1920,
  // Minimum dimensions for quality
  MIN_DIMENSION: 200,
  // Allowed MIME types
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  // Compression quality (0-1)
  COMPRESSION_QUALITY: 0.85,
  // Compression threshold - compress if larger than this (2MB)
  COMPRESSION_THRESHOLD: 2 * 1024 * 1024,
};

/**
 * Validates an image file before processing
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  const warnings: string[] = [];

  // Check file size
  if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Image too large. Maximum size is ${formatFileSize(IMAGE_CONFIG.MAX_FILE_SIZE)}. Your file is ${formatFileSize(file.size)}.`,
      errorCode: ImageErrorCode.FILE_TOO_LARGE,
    };
  }

  if (file.size > IMAGE_CONFIG.FILE_SIZE_WARNING) {
    warnings.push(`Large file detected (${formatFileSize(file.size)}). Processing may take longer.`);
  }

  // Check MIME type
  if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid image format. Supported formats: JPEG, PNG, WebP, HEIC.`,
      errorCode: ImageErrorCode.INVALID_TYPE,
    };
  }

  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
};

/**
 * Validates image dimensions from an HTMLImageElement
 */
export const validateImageDimensions = (img: HTMLImageElement): ImageValidationResult => {
  const { naturalWidth, naturalHeight } = img;

  if (naturalWidth < IMAGE_CONFIG.MIN_DIMENSION || naturalHeight < IMAGE_CONFIG.MIN_DIMENSION) {
    return {
      valid: false,
      error: `Image too small. Minimum ${IMAGE_CONFIG.MIN_DIMENSION}x${IMAGE_CONFIG.MIN_DIMENSION} pixels required for quality analysis.`,
      errorCode: ImageErrorCode.DIMENSIONS_TOO_SMALL,
    };
  }

  if (naturalWidth > IMAGE_CONFIG.MAX_DIMENSION || naturalHeight > IMAGE_CONFIG.MAX_DIMENSION) {
    return {
      valid: false,
      error: `Image dimensions exceed ${IMAGE_CONFIG.MAX_DIMENSION}x${IMAGE_CONFIG.MAX_DIMENSION} pixels. Please use a smaller image.`,
      errorCode: ImageErrorCode.DIMENSIONS_TOO_LARGE,
    };
  }

  return { valid: true };
};

/**
 * Extracts MIME type from a data URL
 */
export const getMimeTypeFromDataUrl = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

/**
 * Extracts base64 data from a data URL
 */
export const getBase64FromDataUrl = (dataUrl: string): string => {
  const parts = dataUrl.split(',');
  return parts.length > 1 ? parts[1] : dataUrl;
};

/**
 * Loads an image from a data URL and returns an HTMLImageElement
 */
export const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image. The file may be corrupted.'));
    img.src = dataUrl;
  });
};

/**
 * Compresses and resizes an image if needed
 */
export const compressImage = async (
  dataUrl: string,
  options?: {
    maxDimension?: number;
    quality?: number;
    forceCompress?: boolean;
  }
): Promise<ProcessedImage> => {
  const maxDimension = options?.maxDimension ?? IMAGE_CONFIG.TARGET_DIMENSION;
  const quality = options?.quality ?? IMAGE_CONFIG.COMPRESSION_QUALITY;

  const img = await loadImageFromDataUrl(dataUrl);
  const originalSize = Math.round((dataUrl.length * 3) / 4); // Approximate base64 to bytes
  const mimeType = getMimeTypeFromDataUrl(dataUrl);

  // Calculate new dimensions maintaining aspect ratio
  let { naturalWidth: width, naturalHeight: height } = img;
  const needsResize = width > maxDimension || height > maxDimension;
  const needsCompress = options?.forceCompress || originalSize > IMAGE_CONFIG.COMPRESSION_THRESHOLD;

  if (!needsResize && !needsCompress) {
    return {
      dataUrl,
      mimeType,
      originalSize,
      processedSize: originalSize,
      width,
      height,
      wasCompressed: false,
    };
  }

  // Calculate new dimensions
  if (needsResize) {
    if (width > height) {
      height = Math.round((height / width) * maxDimension);
      width = maxDimension;
    } else {
      width = Math.round((width / height) * maxDimension);
      height = maxDimension;
    }
  }

  // Create canvas and compress
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to JPEG for better compression (except for transparent images)
  const outputType = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  const compressedDataUrl = canvas.toDataURL(outputType, quality);
  const processedSize = Math.round((compressedDataUrl.length * 3) / 4);

  return {
    dataUrl: compressedDataUrl,
    mimeType: outputType,
    originalSize,
    processedSize,
    width,
    height,
    wasCompressed: true,
  };
};

/**
 * Full image processing pipeline: validate, load, compress
 */
export const processImageFile = async (file: File): Promise<ProcessedImage> => {
  // Step 1: Validate file
  const fileValidation = validateImageFile(file);
  if (!fileValidation.valid) {
    throw new ImageProcessingError(fileValidation.error!, fileValidation.errorCode!);
  }

  // Step 2: Read file as data URL
  const dataUrl = await readFileAsDataUrl(file);

  // Step 3: Load and validate dimensions
  const img = await loadImageFromDataUrl(dataUrl);
  const dimensionValidation = validateImageDimensions(img);
  if (!dimensionValidation.valid) {
    throw new ImageProcessingError(dimensionValidation.error!, dimensionValidation.errorCode!);
  }

  // Step 4: Compress and optimize
  return compressImage(dataUrl);
};

/**
 * Process a base64 image (from mobile camera)
 */
export const processBase64Image = async (
  base64String: string,
  format: string = 'jpeg'
): Promise<ProcessedImage> => {
  const dataUrl = `data:image/${format};base64,${base64String}`;

  // Load and validate dimensions
  const img = await loadImageFromDataUrl(dataUrl);
  const dimensionValidation = validateImageDimensions(img);
  if (!dimensionValidation.valid) {
    throw new ImageProcessingError(dimensionValidation.error!, dimensionValidation.errorCode!);
  }

  // Compress and optimize
  return compressImage(dataUrl);
};

/**
 * Reads a File as a data URL
 */
export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Formats file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Custom error class for image processing errors
 */
export class ImageProcessingError extends Error {
  constructor(
    message: string,
    public code: ImageErrorCode,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'ImageProcessingError';
    this.userMessage = userMessage ?? message;
  }
}

/**
 * Gets user-friendly error message for display
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ImageProcessingError) {
    return error.userMessage ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred while processing the image.';
};
