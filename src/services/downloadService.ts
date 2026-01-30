import { Paths, File as ExpoFile } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
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
    // On Android, try to get current permissions first without requesting
    // This avoids the AUDIO permission issue in Expo Go
    const { status: existingStatus } = await MediaLibrary.getPermissionsAsync();
    if (existingStatus === 'granted') {
      return true;
    }

    // If not granted, try requesting with writeOnly on Android
    if (Platform.OS === 'android') {
      // For Expo Go on Android, we'll skip permission request and let createAssetAsync handle it
      // It will prompt the user if needed
      return true;
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    // Return true to attempt the save - it may still work or prompt the user
    return true;
  }
};

export const downloadPhoto = async (
  photo: Photo,
  _onProgress?: (progress: DownloadProgress) => void
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
    // Ensure filename has a proper extension for MediaLibrary.createAssetAsync
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

    const destinationFile = new ExpoFile(Paths.cache, filename);

    // Only download full resolution - don't fall back to thumbnail
    if (!photo.fullUri) {
      return {
        success: false,
        message: 'Full resolution file not available for download',
      };
    }

    const downloadUrl = photo.fullUri;

    // Download the file using the new static method
    // Type assertion needed to resolve conflict between expo-file-system File and DOM File
    const downloadedFile = await ExpoFile.downloadFileAsync(
      downloadUrl,
      destinationFile,
      { idempotent: true }
    ) as InstanceType<typeof ExpoFile>;

    try {
      // Save to media library using the file URI
      // Skip album organization in Expo Go due to permission limitations
      const asset = await MediaLibrary.createAssetAsync(downloadedFile.uri);

      return {
        success: true,
        message: 'Photo saved to gallery',
        localUri: asset.uri,
      };
    } finally {
      // Clean up the temporary file
      try {
        await downloadedFile.delete();
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

