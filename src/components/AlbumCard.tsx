import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Album } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

interface AlbumCardProps {
  album: Album;
  itemCount?: number;
  size?: number;
  onPress: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const DEFAULT_SIZE = (SCREEN_WIDTH - 8) / NUM_COLUMNS;
const TAB_HEIGHT = 12;

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, itemCount, size = DEFAULT_SIZE, onPress }) => {
  // Use itemCount prop if provided, otherwise fall back to album.photoCount
  const count = itemCount !== undefined ? itemCount : album.photoCount;
  const countText = count > 0 ? `${count}` : '';
  const hasCoverPhoto = !!album.coverPhoto?.uri;

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, margin: 1 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Folder tab at top */}
      <View style={[styles.folderTab, { width: size * 0.4 }]} />

      {/* Main folder body */}
      <View style={[styles.folderBody, { width: size, height: size - TAB_HEIGHT - spacing.xl }]}>
        {hasCoverPhoto ? (
          <>
            <Image
              source={{ uri: album.coverPhoto!.uri }}
              style={styles.image}
              resizeMode="cover"
            />
            {/* Dark overlay to fade the image */}
            <View style={styles.imageOverlay} />
          </>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="folder-open" size={32} color={colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {album.title}
        </Text>
        {countText ? <Text style={styles.count}>{countText}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xs,
  },
  folderTab: {
    height: TAB_HEIGHT,
    borderTopLeftRadius: borderRadius.sm,
    borderTopRightRadius: 2,
    marginBottom: -2, // Overlap slightly with body
  },
  folderBody: {
    borderRadius: borderRadius.sm,
    borderTopLeftRadius: 0, // Flat where tab connects
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },

  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    paddingTop: 2,
    paddingHorizontal: 2,
  },
  title: {
    ...typography.small,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  count: {
    ...typography.small,
    color: colors.textSecondary,
  },
});

