import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlbumCard, ProfileButton, LibraryDropdown } from '../components';
import { colors, spacing, typography } from '../theme';
import { Album, RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { getAlbumsFromLibrary, convertPlexAlbumsToAlbums, getFolderItemCount } from '../services/plexService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AlbumsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { selectedServer, selectedLibrary } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbums = useCallback(async () => {
    if (!selectedServer || !selectedLibrary) {
      setLoading(false);
      setError('No server or library selected');
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
      const plexAlbums = await getAlbumsFromLibrary(selectedServer, serverToken, selectedLibrary.key);
      const fetchedAlbums = convertPlexAlbumsToAlbums(plexAlbums, selectedServer, serverToken);
      setAlbums(fetchedAlbums);

      // Fetch item counts for each folder - update UI as each count comes in
      if (fetchedAlbums.length > 0) {
        // Clear previous counts
        setFolderCounts({});

        // Fetch counts in parallel, updating state as each completes
        fetchedAlbums.forEach(async (folder) => {
          if (folder.key) {
            const count = await getFolderItemCount(selectedServer, serverToken, folder.key);
            if (count > 0) {
              setFolderCounts(prev => ({ ...prev, [folder.id]: count }));
            }
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch albums:', err);
      setError(err instanceof Error ? err.message : 'Failed to load albums');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedServer, selectedLibrary]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAlbums();
  }, [fetchAlbums]);

  const handleAlbumPress = (album: Album) => {
    navigation.navigate('AlbumDetail', {
      albumId: album.id,
      albumKey: album.key,
      albumRatingKey: album.ratingKey,
      albumTitle: album.title,
    });
  };

  const renderAlbum = ({ item }: { item: Album }) => (
    <AlbumCard
      album={item}
      itemCount={folderCounts[item.id]}
      onPress={() => handleAlbumPress(item)}
    />
  );

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
          <Text style={styles.loadingText}>Loading folders...</Text>
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
            <Text style={styles.albumCount}>{albums.length} folders</Text>
          </View>
          <ProfileButton />
        </View>
      </View>
      {albums.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No folders found</Text>
          <Text style={styles.emptyHint}>
            This library doesn't have any folders
          </Text>
        </View>
      ) : (
        <FlatList
          data={albums}
          renderItem={renderAlbum}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.list}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  albumCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  list: {
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
});

