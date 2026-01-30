import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getVersionString } from '../constants/version';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.settingIcon}>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement || (onPress && (
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    ))}
  </TouchableOpacity>
);

export const SettingsScreen: React.FC = () => {
  const { selectedProfile, selectedServer, clearProfile, clearServer, logout } = useAuth();
  const [autoBackup, setAutoBackup] = useState(false);
  const [wifiOnly, setWifiOnly] = useState(true);

  const handleSwitchProfile = async () => {
    await clearProfile();
    // Navigation will automatically redirect to ProfileSelectionScreen
    // because selectedProfile becomes null
  };

  const handleChangeServer = async () => {
    await clearServer();
    // Navigation will automatically redirect to ServerSelectionScreen
    // because selectedServer becomes null
  };

  const handleSignOut = async () => {
    await logout();
    // Navigation will automatically redirect to LoginScreen
    // because isAuthenticated becomes false
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account / Profile Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <View style={styles.profileContainer}>
            {selectedProfile?.thumb ? (
              <Image source={{ uri: selectedProfile.thumb }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatar, styles.profileAvatarPlaceholder]}>
                <Ionicons name="person" size={28} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{selectedProfile?.title || 'Unknown Profile'}</Text>
              {selectedServer && (
                <Text style={styles.profileServer}>Connected to {selectedServer.name}</Text>
              )}
            </View>
          </View>
          <View style={styles.accountButtons}>
            <TouchableOpacity style={styles.switchProfileButton} onPress={handleSwitchProfile}>
              <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
              <Text style={styles.switchProfileText}>Switch Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.changeServerButton} onPress={handleChangeServer}>
              <Ionicons name="server-outline" size={18} color={colors.primary} />
              <Text style={styles.changeServerText}>Change Server</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Backup Settings */}
        <Text style={styles.sectionTitle}>Backup</Text>
        <View style={styles.section}>
          <SettingItem
            icon="cloud-upload-outline"
            title="Auto Backup"
            subtitle="Automatically backup photos to server"
            rightElement={
              <Switch
                value={autoBackup}
                onValueChange={setAutoBackup}
                trackColor={{ false: colors.surface, true: colors.primary }}
                thumbColor={colors.textPrimary}
              />
            }
          />
          <SettingItem
            icon="wifi-outline"
            title="Wi-Fi Only"
            subtitle="Only backup when connected to Wi-Fi"
            rightElement={
              <Switch
                value={wifiOnly}
                onValueChange={setWifiOnly}
                trackColor={{ false: colors.surface, true: colors.primary }}
                thumbColor={colors.textPrimary}
              />
            }
          />
        </View>

        {/* Display Settings */}
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.section}>
          <SettingItem
            icon="grid-outline"
            title="Grid Size"
            subtitle="3 columns"
            onPress={() => {}}
          />
          <SettingItem
            icon="calendar-outline"
            title="Sort Order"
            subtitle="Newest first"
            onPress={() => {}}
          />
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <SettingItem
            icon="information-circle-outline"
            title="Version"
            subtitle={getVersionString(Platform.OS as 'ios' | 'android')}
          />
          <SettingItem
            icon="document-text-outline"
            title="Privacy Policy"
            onPress={() => {}}
          />
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  settingSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.md,
  },
  profileAvatarPlaceholder: {
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 17,
  },
  profileServer: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  accountButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  switchProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xs,
    flex: 1,
  },
  switchProfileText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  changeServerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xs,
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  changeServerText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xs,
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  signOutText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
});

