import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, FlatList, RefreshControl } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PhotoThumbnail, AlbumCard, LoadingState } from '../components';
import { colors, spacing, typography, commonStyles } from '../theme';
import { RootStackParamList, Photo, Album, photoToSerializable } from '../types';
import { useAuth } from '../context/AuthContext';
import { getFolderContents, convertPlexPhotosToPhotos, convertPlexAlbumsToAlbums } from '../services/plexService';
import { useFolderCounts } from '../hooks/useFolderCounts';

type AlbumDetailRouteProp = RouteProp<RootStackParamList, 'AlbumDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const PHOTO_SIZE = (SCREEN_WIDTH - 8) / NUM_COLUMNS;

// Union type for list items
type ListItem = { type: 'folder'; data: Album } | { type: 'photo'; data: Photo };

export const AlbumDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AlbumDetailRouteProp>();
  const { albumId, albumKey, albumRatingKey, albumTitle } = route.params;
  const { selectedServer } = useAuth();

  const [folders, setFolders] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use custom hook to fetch folder counts
  const serverToken = selectedServer?.accessToken || null;
  const folderCounts = useFolderCounts(folders, selectedServer, serverToken);

  const fetchContents = useCallback(async () => {
    if (!selectedServer || !albumKey) {
      setLoading(false);
      setError('Unable to load folder contents');
      return;
    }

    const serverToken = selectedServer.accessToken;
    if (!serverToken) {
      setLoading(false);
      setError('No server access token');
      return;
    }

    try {
      setError(null);
      // Use ratingKey if available, otherwise fall back to key
      const contents = await getFolderContents(selectedServer, serverToken, albumRatingKey || albumKey);

      const fetchedFolders = convertPlexAlbumsToAlbums(contents.folders, selectedServer, serverToken);
      const fetchedPhotos = convertPlexPhotosToPhotos(contents.photos, selectedServer, serverToken);

      // Sort photos by date (newest first)
      fetchedPhotos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setFolders(fetchedFolders);
      setPhotos(fetchedPhotos);
    } catch (err) {
      console.error('Failed to fetch folder contents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedServer, albumKey, albumRatingKey]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContents();
  }, [fetchContents]);

  const handleFolderPress = useCallback(
    (folder: Album) => {
      navigation.push('AlbumDetail', {
        albumId: folder.id,
        albumKey: folder.key,
        albumRatingKey: folder.ratingKey,
        albumTitle: folder.title,
      });
    },
    [navigation]
  );

  const handlePhotoPress = useCallback(
    (photo: Photo, index: number) => {
      navigation.navigate('PhotoViewer', {
        photo: photoToSerializable(photo),
        photos: photos.map(photoToSerializable),
        initialIndex: index,
      });
    },
    [navigation, photos]
  );

  // Combine folders and photos into a single list
  const listItems: ListItem[] = [
    ...folders.map((folder): ListItem => ({ type: 'folder', data: folder })),
    ...photos.map((photo): ListItem => ({ type: 'photo', data: photo })),
  ];

  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    if (item.type === 'folder') {
      return (
        <AlbumCard
          album={item.data}
          itemCount={folderCounts[item.data.id]}
          size={PHOTO_SIZE}
          onPress={() => handleFolderPress(item.data)}
        />
      );
    } else {
      const photoIndex = index - folders.length;
      return (
        <PhotoThumbnail
          photo={item.data}
          size={PHOTO_SIZE}
          onPress={() => handlePhotoPress(item.data, photoIndex)}
        />
      );
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <Text style={styles.title}>{albumTitle}</Text>
      </View>
      <View style={styles.backButton} />
    </View>
  );

  if (loading || error) {
    return (
      <LoadingState
        loading={loading}
        error={error}
        loadingText="Loading photos..."
        header={renderHeader()}
      />
    );
  }

  // Build subtitle text
  const subtitleParts: string[] = [];
  if (folders.length > 0) subtitleParts.push(`${folders.length} folders`);
  if (photos.length > 0) subtitleParts.push(`${photos.length} photos`);
  const subtitle = subtitleParts.join(', ') || 'Empty folder';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{albumTitle}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.type === 'folder' ? `folder-${item.data.id}` : `photo-${item.data.id}`}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: commonStyles.container,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  grid: {
    paddingHorizontal: 2,
    paddingBottom: spacing.xl,
  },
});

