import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PhotoThumbnail, AlbumCard } from '../components';
import { colors, spacing, typography } from '../theme';
import { RootStackParamList, Photo, Album } from '../types';
import { useAuth } from '../context/AuthContext';
import { getFolderContents, getFolderItemCount, convertPlexPhotosToPhotos, convertPlexAlbumsToAlbums } from '../services/plexService';

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
  const { album } = route.params;
  const { selectedServer } = useAuth();

  const [folders, setFolders] = useState<Album[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContents = useCallback(async () => {
    if (!selectedServer || !album.key) {
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
      console.log(`Plex: Fetching contents from folder "${album.title}" (ratingKey: ${album.ratingKey})...`);
      // Use ratingKey if available, otherwise fall back to key
      const contents = await getFolderContents(selectedServer, serverToken, album.ratingKey || album.key);

      const fetchedFolders = convertPlexAlbumsToAlbums(contents.folders, selectedServer, serverToken);
      const fetchedPhotos = convertPlexPhotosToPhotos(contents.photos, selectedServer, serverToken);

      // DON'T sort folders - keep them in the order Plex returns them
      // Plex should already be returning them sorted by titleSort
      console.log(`Plex: Folder order from Plex:`, fetchedFolders.map(f => f.title).join(', '));

      // Sort photos by date (newest first)
      fetchedPhotos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      console.log(`Plex: Loaded ${fetchedFolders.length} folders and ${fetchedPhotos.length} photos from "${album.title}"`);
      setFolders(fetchedFolders);
      setPhotos(fetchedPhotos);

      // Fetch item counts for each folder - update UI as each count comes in
      if (fetchedFolders.length > 0) {
        // Clear previous counts
        setFolderCounts({});

        // Fetch counts in parallel, updating state as each completes
        fetchedFolders.forEach(async (folder) => {
          if (folder.key) {
            const count = await getFolderItemCount(selectedServer, serverToken, folder.key);
            if (count > 0) {
              setFolderCounts(prev => ({ ...prev, [folder.id]: count }));
            }
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch folder contents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedServer, album]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContents();
  }, [fetchContents]);

  const handleFolderPress = useCallback(
    (folder: Album) => {
      navigation.push('AlbumDetail', { album: folder });
    },
    [navigation]
  );

  const handlePhotoPress = useCallback(
    (photo: Photo, index: number) => {
      navigation.navigate('PhotoViewer', {
        photo,
        photos,
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

  if (loading) {
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
            <Text style={styles.title}>{album.title}</Text>
          </View>
          <View style={styles.backButton} />
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{album.title}</Text>
          </View>
          <View style={styles.backButton} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
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
          <Text style={styles.title}>{album.title}</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
});

