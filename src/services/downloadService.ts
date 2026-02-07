import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { Platform, PermissionsAndroid } from 'react-native';
import { Photo } from '../types';

export interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number;
}

export interface DownloadResult {
  success: boolean;
  message: string;
  localUri?: string;
}

export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      // Android 13+ (API 33+) uses granular media permissions
      const androidVersion = Platform.Version as number;
      if (androidVersion >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // Older Android versions use WRITE_EXTERNAL_STORAGE
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    // iOS doesn't require explicit permission for saving to camera roll
    return true;
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
};

export const downloadPhoto = async (
  photo: Photo,
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> => {
  try {
    // Request permissions
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      return {
        success: false,
        message: 'Permission to access media library was denied',
      };
    }

    // Create destination file in cache directory
    // Ensure filename has a proper extension for CameraRoll.saveAsset
    let filename = photo.filename || `photo_${photo.id}`;

    // Check if filename has a valid image/video extension
    const hasValidExtension = /\.(jpg|jpeg|png|gif|heic|heif|webp|mp4|mov|m4v|avi)$/i.test(filename);
    if (!hasValidExtension) {
      // Add extension based on format or default to jpg for photos, mp4 for videos
      const extension = photo.format
        ? (photo.format.toLowerCase() === 'jpeg' ? 'jpg' : photo.format.toLowerCase())
        : (photo.mediaType === 'video' ? 'mp4' : 'jpg');
      filename = `${filename}.${extension}`;
    }

    const destinationPath = `${RNFS.CachesDirectoryPath}/${filename}`;

    // Only download full resolution - don't fall back to thumbnail
    if (!photo.fullUri) {
      return {
        success: false,
        message: 'Full resolution file not available for download',
      };
    }

    const downloadUrl = photo.fullUri;

    // Download the file using react-native-fs
    const downloadResult = await RNFS.downloadFile({
      fromUrl: downloadUrl,
      toFile: destinationPath,
      progress: (res) => {
        if (onProgress) {
          onProgress({
            totalBytesWritten: res.bytesWritten,
            totalBytesExpectedToWrite: res.contentLength,
            progress: res.contentLength > 0 ? res.bytesWritten / res.contentLength : 0,
          });
        }
      },
      progressDivider: 10, // Report progress every 10%
    }).promise;

    if (downloadResult.statusCode !== 200) {
      return {
        success: false,
        message: `Download failed with status ${downloadResult.statusCode}`,
      };
    }

    try {
      // Save to camera roll using @react-native-camera-roll/camera-roll
      const asset = await CameraRoll.saveAsset(`file://${destinationPath}`, {
        type: photo.mediaType === 'video' ? 'video' : 'photo',
      });

      return {
        success: true,
        message: 'Photo saved to gallery',
        localUri: asset.node?.image?.uri || destinationPath,
      };
    } finally {
      // Clean up the temporary file
      try {
        await RNFS.unlink(destinationPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Download failed',
    };
  }
};

export const downloadMultiplePhotos = async (
  photos: Photo[],
  onProgress?: (current: number, total: number) => void
): Promise<DownloadResult> => {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      return {
        success: false,
        message: 'Permission to access media library was denied',
      };
    }

    let successCount = 0;
    for (let i = 0; i < photos.length; i++) {
      const result = await downloadPhoto(photos[i]);
      if (result.success) {
        successCount++;
      }
      onProgress?.(i + 1, photos.length);
    }

    return {
      success: successCount === photos.length,
      message: `Downloaded ${successCount} of ${photos.length} photos`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Download failed',
    };
  }
};

