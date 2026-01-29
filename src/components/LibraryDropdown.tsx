import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { PlexLibrary } from '../types';

export const LibraryDropdown: React.FC = () => {
  const { selectedLibrary, libraries, selectLibrary } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (library: PlexLibrary) => {
    selectLibrary(library);
    setIsOpen(false);
  };

  const renderLibraryItem = ({ item }: { item: PlexLibrary }) => {
    const isSelected = item.key === selectedLibrary?.key;
    return (
      <TouchableOpacity
        style={[styles.libraryItem, isSelected && styles.libraryItemSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="images"
          size={20}
          color={isSelected ? colors.primary : colors.textSecondary}
        />
        <Text
          style={[styles.libraryItemText, isSelected && styles.libraryItemTextSelected]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="library-outline" size={20} color={colors.primary} />
        <Text style={styles.libraryName} numberOfLines={1}>
          {selectedLibrary?.title || 'Select Library'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <Pressable style={styles.dropdownMenu} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuHeader}>
              <View style={styles.menuTitleRow}>
                <Ionicons name="library-outline" size={22} color={colors.primary} />
                <Text style={styles.menuTitle}>Select Library</Text>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={libraries}
              renderItem={renderLibraryItem}
              keyExtractor={(item) => item.key}
              style={styles.libraryList}
              showsVerticalScrollIndicator={false}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    gap: spacing.xs,
  },
  libraryName: {
    ...typography.h3,
    color: colors.textPrimary,
    maxWidth: 220,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  dropdownMenu: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    maxHeight: 400,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  libraryList: {
    paddingVertical: spacing.sm,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  libraryItemSelected: {
    backgroundColor: colors.backgroundLight,
  },
  libraryItemText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  libraryItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

