import React from 'react';
import { StyleSheet, View, Text, SectionList, Dimensions, SectionListData, ActivityIndicator } from 'react-native';
import { Photo, PhotoGroup } from '../types';
import { PhotoThumbnail } from './PhotoThumbnail';
import { colors, spacing, typography } from '../theme';

interface PhotoGridProps {
  photoGroups: PhotoGroup[];
  onPhotoPress: (photo: Photo, allPhotos: Photo[], index: number) => void;
  selectedPhotos?: Set<string>;
  onRefresh?: () => void;
  refreshing?: boolean;
  onEndReached?: () => void;
  loadingMore?: boolean;
}

// Section type for SectionList - each item is a row of photos
interface PhotoSection {
  title: string;
  date: string;
  data: Photo[][]; // Array of rows, each row is an array of photos
  allPhotos: Photo[]; // Keep reference to all photos for index calculation
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const PHOTO_SIZE = (SCREEN_WIDTH - 8) / NUM_COLUMNS;

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photoGroups,
  onPhotoPress,
  selectedPhotos,
  onRefresh,
  refreshing = false,
  onEndReached,
  loadingMore = false,
}) => {
  // Flatten all photos for index calculation
  const allPhotos = photoGroups.flatMap((group) => group.photos);

  // Convert PhotoGroup to SectionList format - each section contains rows of photos
  const sections: PhotoSection[] = photoGroups.map((group) => {
    // Split photos into rows of NUM_COLUMNS
    const rows: Photo[][] = [];
    for (let i = 0; i < group.photos.length; i += NUM_COLUMNS) {
      rows.push(group.photos.slice(i, i + NUM_COLUMNS));
    }
    return {
      title: group.title,
      date: group.date,
      data: rows,
      allPhotos: group.photos,
    };
  });

  // Render a single row of photos
  const renderItem = ({ item: row, section }: { item: Photo[]; section: SectionListData<Photo[], PhotoSection> }) => {
    return (
      <View style={styles.row}>
        {row.map((photo) => {
          const globalIndex = allPhotos.findIndex((p) => p.id === photo.id);
          return (
            <PhotoThumbnail
              key={photo.id}
              photo={photo}
              size={PHOTO_SIZE}
              selected={selectedPhotos?.has(photo.id)}
              onPress={() => onPhotoPress(photo, allPhotos, globalIndex)}
            />
          );
        })}
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: SectionListData<Photo[], PhotoSection> }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderListFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => `row-${index}-${item[0]?.id || index}`}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ListFooterComponent={renderListFooter}
      stickySectionHeadersEnabled={true}
      contentContainerStyle={styles.container}
      onRefresh={onRefresh}
      refreshing={refreshing}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      // Prevent scroll jump when loading more items
      removeClippedSubviews={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 2,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  loadingMoreText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});

