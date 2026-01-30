import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PhotoGrid, ProfileButton, LibraryDropdown } from '../components';
import { colors, spacing, typography } from '../theme';
import { Photo, RootStackParamList } from '../types';
import { groupPhotosByDate } from '../utils/photoUtils';
import { useAuth } from '../context/AuthContext';
import { getPhotosFromLibrary, convertPlexPhotosToPhotos, PhotosResult } from '../services/plexService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 1000;

export const PhotosScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { selectedServer, selectedLibrary } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPhotos = useCallback(async (isRefresh: boolean = false) => {
    if (!selectedServer) {
      setLoading(false);
      setError('No server selected');
      return;
    }

    if (!selectedLibrary) {
      setLoading(false);
      setError('No library selected');
      return;
    }

    // Use the server's access token, not the user's auth token
    const serverToken = selectedServer.accessToken;
    if (!serverToken) {
      setLoading(false);
      setError('No server access token');
      return;
    }

    try {
      setError(null);
      const result = await getPhotosFromLibrary(selectedServer, serverToken, selectedLibrary.key, 0, PAGE_SIZE);
      const fetchedPhotos = convertPlexPhotosToPhotos(result.photos, selectedServer, serverToken);

      setPhotos(fetchedPhotos);
      setHasMore(result.hasMore);
      setTotalCount(result.totalSize);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedServer, selectedLibrary]);

  const loadMorePhotos = useCallback(async () => {
    if (!hasMore || loadingMore || !selectedServer || !selectedLibrary) return;

    const serverToken = selectedServer.accessToken;
    if (!serverToken) return;

    setLoadingMore(true);
    try {
      const start = photos.length;
      const result = await getPhotosFromLibrary(selectedServer, serverToken, selectedLibrary.key, start, PAGE_SIZE);
      const newPhotos = convertPlexPhotosToPhotos(result.photos, selectedServer, serverToken);
      setPhotos(prev => [...prev, ...newPhotos]);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to load more photos:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, photos.length, selectedServer, selectedLibrary]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Memoize photoGroups to prevent unnecessary recalculations
  // This helps maintain scroll position when loading more photos
  const photoGroups = useMemo(() => {
    return groupPhotosByDate(photos);
  }, [photos]);

  const handlePhotoPress = useCallback(
    (photo: Photo, allPhotos: Photo[], index: number) => {
      navigation.navigate('PhotoViewer', {
        photo,
        photos: allPhotos,
        initialIndex: index,
      });
    },
    [navigation]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchPhotos(true);
  }, [fetchPhotos]);

  const handleEndReached = useCallback(() => {
    loadMorePhotos();
  }, [loadMorePhotos]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <LibraryDropdown />
            <ProfileButton />
          </View>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <LibraryDropdown />
            <ProfileButton />
          </View>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Pull down to retry</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleContainer}>
            <LibraryDropdown />
            <Text style={styles.photoCount}>{photos.length}{totalCount > photos.length ? ` of ${totalCount}` : ''} photos</Text>
          </View>
          <ProfileButton />
        </View>
      </View>
      {photos.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No photos found</Text>
          <Text style={styles.emptyHint}>
            This library doesn't have any photos
          </Text>
        </View>
      ) : (
        <PhotoGrid
          photoGroups={photoGroups}
          onPhotoPress={handlePhotoPress}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleEndReached}
          loadingMore={loadingMore}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  errorHint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  photoCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

