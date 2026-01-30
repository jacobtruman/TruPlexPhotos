import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import { PlexServer } from '../types';

export const ServerSelectionScreen: React.FC = () => {
  const { servers, selectServer, refreshServers, isLoading, selectedProfile } = useAuth();
  const [selectingServerId, setSelectingServerId] = useState<string | null>(null);

  const handleSelectServer = async (server: PlexServer) => {
    setSelectingServerId(server.machineIdentifier);
    try {
      await selectServer(server);
    } catch (error) {
      console.error(`ServerSelectionScreen: Failed to select server "${server.name}":`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Connection Failed',
        `Could not connect to "${server.name}".\n\n${errorMessage}\n\nThis may be because:\n• The server is offline\n• Your profile doesn't have remote access\n• The server is not reachable from this network`,
        [{ text: 'OK' }]
      );
    } finally {
      setSelectingServerId(null);
    }
  };

  const renderServer = ({ item }: { item: PlexServer }) => {
    const isSelecting = selectingServerId === item.machineIdentifier;

    return (
    <TouchableOpacity
      style={[styles.serverCard, isSelecting && styles.serverCardSelecting]}
      onPress={() => handleSelectServer(item)}
      activeOpacity={0.7}
      disabled={selectingServerId !== null}
    >
      <View style={styles.serverIcon}>
        <MaterialIcons
          name="storage"
          size={28}
          color={colors.primary}
        />
      </View>
      <View style={styles.serverInfo}>
        <Text style={styles.serverName}>{item.name}</Text>
        <Text style={styles.serverDetails}>
          {item.address}:{item.port}
        </Text>
        <View style={styles.serverBadges}>
          {item.owned && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Owned</Text>
            </View>
          )}
          {item.localAddresses && (
            <View style={[styles.badge, styles.localBadge]}>
              <Text style={styles.badgeText}>Local</Text>
            </View>
          )}
        </View>
        {isSelecting && (
          <Text style={styles.connectingText}>Connecting...</Text>
        )}
      </View>
      {isSelecting ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
      )}
    </TouchableOpacity>
    );
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="server-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No Servers Found</Text>
      <Text style={styles.emptySubtitle}>
        We couldn't find any Plex servers with photo libraries.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={refreshServers}>
        <Ionicons name="refresh" size={20} color={colors.primary} />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundDark} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Select a Server</Text>
        {selectedProfile && (
          <Text style={styles.subtitle}>
            Welcome, {selectedProfile.title}
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding your servers...</Text>
        </View>
      ) : (
        <FlatList
          data={servers}
          renderItem={renderServer}
          keyExtractor={(item) => item.machineIdentifier}
          contentContainerStyle={styles.serverList}
          ListEmptyComponent={ListEmptyComponent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <TouchableOpacity style={styles.refreshFloatingButton} onPress={refreshServers}>
        <Ionicons name="refresh" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  serverList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  serverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  serverCardSelecting: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  connectingText: {
    ...typography.small,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  serverIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  serverInfo: {
    flex: 1,
  },
  serverName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  serverDetails: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  serverBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  localBadge: {
    backgroundColor: colors.info,
  },
  badgeText: {
    ...typography.small,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  separator: {
    height: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  refreshButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  refreshFloatingButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
