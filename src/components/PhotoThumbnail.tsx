import React from 'react';
import { StyleSheet, TouchableOpacity, Dimensions, View, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Photo } from '../types';
import { colors, borderRadius } from '../theme';
import { formatDuration } from '../utils/photoUtils';

interface PhotoThumbnailProps {
  photo: Photo;
  onPress: () => void;
  size?: number;
  selected?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const DEFAULT_SIZE = (SCREEN_WIDTH - 8) / 3;

export const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({
  photo,
  onPress,
  size = DEFAULT_SIZE,
  selected = false,
}) => {
  const hasValidUri = photo.uri && photo.uri.trim() !== '';

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {hasValidUri ? (
        <Image
          source={{ uri: photo.uri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.placeholderContainer]}>
          <Ionicons name="image-outline" size={size * 0.4} color={colors.textSecondary} />
        </View>
      )}
      
      {photo.mediaType === 'video' && photo.duration && (
        <View style={styles.durationBadge}>
          <Ionicons name="play" size={10} color={colors.textPrimary} />
          <Text style={styles.durationText}>{formatDuration(photo.duration)}</Text>
        </View>
      )}
      
      {selected && (
        <View style={styles.selectedOverlay}>
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={18} color={colors.textPrimary} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  durationText: {
    color: colors.textPrimary,
    fontSize: 10,
    marginLeft: 2,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(229, 160, 13, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

