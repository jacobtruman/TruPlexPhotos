import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Paths, File as ExpoFile } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors, spacing } from '../theme';
import { RootStackParamList, Photo, serializableToPhoto } from '../types';
import { downloadPhoto } from '../services/downloadService';
import { formatDate } from '../utils/photoUtils';
import { ratePhoto, getEnrichedPhotoMetadata, EnrichedPhotoMetadata } from '../services/plexService';
import { useAuth } from '../context/AuthContext';

type PhotoViewerRouteProp = RouteProp<RootStackParamList, 'PhotoViewer'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const PhotoViewerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PhotoViewerRouteProp>();
  const { photos: serializablePhotos, initialIndex } = route.params;
  const { selectedServer } = useAuth();

  // Convert serializable photos back to Photo objects with Date fields
  const photos = useMemo(() => serializablePhotos.map(serializableToPhoto), [serializablePhotos]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  // Cache enriched metadata by photo id
  const [enrichedMetadata, setEnrichedMetadata] = useState<Record<string, EnrichedPhotoMetadata>>({});
  // Track favorite status for each photo by id
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    photos.forEach(photo => {
      initial[photo.id] = photo.rating === 10;
    });
    return initial;
  });

  const currentPhoto = photos[currentIndex];
  const isFavorite = favorites[currentPhoto.id] || false;
  const currentEnrichedMetadata = enrichedMetadata[currentPhoto.id];

  // Fetch enriched metadata when info modal opens
  const fetchEnrichedMetadata = useCallback(async () => {
    // Skip if we already have enriched metadata for this photo
    if (enrichedMetadata[currentPhoto.id]) return;
    // Skip if photo already has full metadata (from Library view)
    if (currentPhoto.fileSize && currentPhoto.width > 0) return;

    if (!selectedServer?.accessToken) return;

    setLoadingMetadata(true);
    try {
      const metadata = await getEnrichedPhotoMetadata(
        selectedServer,
        selectedServer.accessToken,
        currentPhoto.id
      );
      if (metadata) {
        setEnrichedMetadata(prev => ({
          ...prev,
          [currentPhoto.id]: metadata,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch photo metadata:', error);
    } finally {
      setLoadingMetadata(false);
    }
  }, [currentPhoto.id, currentPhoto.fileSize, currentPhoto.width, currentPhoto.filename, currentPhoto.fullUri, enrichedMetadata, selectedServer]);

  // Fetch metadata when info modal opens
  useEffect(() => {
    if (showInfoModal) {
      fetchEnrichedMetadata();
    }
  }, [showInfoModal, fetchEnrichedMetadata]);

  // Get display values - prefer enriched metadata, fall back to photo data
  const displayFilename = currentEnrichedMetadata?.filename || currentPhoto.filename;
  const displayFilePath = currentEnrichedMetadata?.filePath || currentPhoto.filePath;
  const displayWidth = currentEnrichedMetadata?.width || currentPhoto.width;
  const displayHeight = currentEnrichedMetadata?.height || currentPhoto.height;
  const displayFileSize = currentEnrichedMetadata?.fileSize || currentPhoto.fileSize;
  const displayFormat = currentEnrichedMetadata?.format || currentPhoto.format;
  const displayAspectRatio = currentEnrichedMetadata?.aspectRatio || currentPhoto.aspectRatio;

  // Format duration in milliseconds to readable format
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  // Format date with time
  const formatDateTime = (date: Date): string => {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format file size in bytes to human readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const result = await downloadPhoto(currentPhoto);
      Alert.alert(
        result.success ? 'Success' : 'Error',
        result.message
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to download photo');
    } finally {
      setDownloading(false);
    }
  }, [currentPhoto]);

  const handleShare = useCallback(async () => {
    setSharing(true);
    let downloadedFile: InstanceType<typeof ExpoFile> | null = null;
    try {
      // Check if sharing is available
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Download to cache first
      const downloadUrl = currentPhoto.fullUri || currentPhoto.uri;
      const filename = currentPhoto.filename || `photo_${currentPhoto.id}.jpg`;
      const destinationFile = new ExpoFile(Paths.cache, filename);

      downloadedFile = await ExpoFile.downloadFileAsync(
        downloadUrl,
        destinationFile,
        { idempotent: true }
      ) as InstanceType<typeof ExpoFile>;

      // Share the file
      await Sharing.shareAsync(downloadedFile.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Photo',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share photo');
    } finally {
      // Clean up the temporary file
      if (downloadedFile) {
        try {
          await downloadedFile.delete();
        } catch {
          // Ignore cleanup errors
        }
      }
      setSharing(false);
    }
  }, [currentPhoto]);

  const handleFavorite = useCallback(async () => {
    if (!selectedServer) {
      Alert.alert('Error', 'Not connected to a server');
      return;
    }

    setFavoriting(true);
    try {
      // Toggle favorite: if currently favorite (10), set to -1 (reset), otherwise set to 10
      const newRating = isFavorite ? -1 : 10;
      // Use the server's accessToken which is scoped to the current profile's permissions
      const success = await ratePhoto(selectedServer, selectedServer.accessToken, currentPhoto.id, newRating);

      if (success) {
        setFavorites(prev => ({
          ...prev,
          [currentPhoto.id]: !isFavorite,
        }));
      } else {
        Alert.alert('Error', 'Failed to update favorite status');
      }
    } catch (error) {
      console.error('Favorite error:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    } finally {
      setFavoriting(false);
    }
  }, [currentPhoto, isFavorite, selectedServer]);

  const toggleControls = () => setShowControls(!showControls);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const renderPhoto = ({ item }: { item: Photo }) => {
    const hasValidUri = item.uri && item.uri.trim() !== '';

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleControls}
        style={styles.photoContainer}
      >
        {hasValidUri ? (
          <Image
            source={{ uri: item.uri }}
            style={styles.photo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="image-outline" size={100} color={colors.textSecondary} />
            <Text style={styles.placeholderText}>Image not available</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      />

      {showControls && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.photoTitle} numberOfLines={1}>
                {currentPhoto.title || currentPhoto.filename}
              </Text>
            </View>
            <View style={styles.iconButton} />
          </View>

          {/* Footer with actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <Ionicons name="download-outline" size={28} color={colors.textPrimary} />
              )}
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <Ionicons name="share-outline" size={28} color={colors.textPrimary} />
              )}
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleFavorite}
              disabled={favoriting}
            >
              {favoriting ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={28}
                  color={isFavorite ? colors.primary : colors.textPrimary}
                />
              )}
              <Text style={styles.actionText}>{isFavorite ? 'Favorited' : 'Favorite'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => setShowInfoModal(true)}>
              <Ionicons name="information-circle-outline" size={28} color={colors.textPrimary} />
              <Text style={styles.actionText}>Info</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Photo Info</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {/* Loading indicator */}
              {loadingMetadata && (
                <View style={styles.metadataLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.metadataLoadingText}>Loading details...</Text>
                </View>
              )}

              {/* File Info Section */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Filename</Text>
                <Text style={styles.infoValue}>{displayFilename}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>
                  {currentPhoto.mediaType === 'video' ? 'Video' : 'Photo'}
                </Text>
              </View>
              {displayWidth > 0 && displayHeight > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dimensions</Text>
                  <Text style={styles.infoValue}>
                    {displayWidth} × {displayHeight}
                  </Text>
                </View>
              )}
              {displayFileSize && displayFileSize > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>File Size</Text>
                  <Text style={styles.infoValue}>{formatFileSize(displayFileSize)}</Text>
                </View>
              )}
              {currentPhoto.mediaType === 'video' && currentPhoto.duration && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{formatDuration(currentPhoto.duration)}</Text>
                </View>
              )}
              {displayFormat && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Format</Text>
                  <Text style={styles.infoValue}>{displayFormat.toUpperCase()}</Text>
                </View>
              )}
              {displayAspectRatio && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Aspect Ratio</Text>
                  <Text style={styles.infoValue}>{displayAspectRatio.toFixed(2)}</Text>
                </View>
              )}

              {/* Date Info Section */}
              <Text style={styles.infoSectionHeader}>Dates</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date Added</Text>
                <Text style={styles.infoValue}>{formatDateTime(currentPhoto.createdAt)}</Text>
              </View>
              {currentPhoto.modifiedAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date Modified</Text>
                  <Text style={styles.infoValue}>{formatDateTime(currentPhoto.modifiedAt)}</Text>
                </View>
              )}

              {/* File Path Section */}
              {displayFilePath && (
                <>
                  <Text style={styles.infoSectionHeader}>Location</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>File Path</Text>
                    <Text style={styles.infoValueSmall}>{displayFilePath}</Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  photoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl + spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.overlay,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  photoTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.overlay,
  },
  actionButton: {
    alignItems: 'center',
    minWidth: 70,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.md,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  infoSectionHeader: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  infoValueSmall: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  metadataLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  metadataLoadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.md,
  },
});

