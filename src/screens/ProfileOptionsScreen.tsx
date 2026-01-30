import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OptionItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  materialIcon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
}

const OptionItem: React.FC<OptionItemProps> = ({
  icon,
  materialIcon,
  title,
  subtitle,
  onPress,
  destructive,
}) => (
  <TouchableOpacity style={styles.optionItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.optionIcon, destructive && styles.optionIconDestructive]}>
      {materialIcon ? (
        <MaterialIcons name={materialIcon} size={22} color={destructive ? colors.error : colors.primary} />
      ) : (
        <Ionicons name={icon} size={22} color={destructive ? colors.error : colors.primary} />
      )}
    </View>
    <View style={styles.optionContent}>
      <Text style={[styles.optionTitle, destructive && styles.optionTitleDestructive]}>{title}</Text>
      {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
  </TouchableOpacity>
);

export const ProfileOptionsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { selectedProfile, selectedServer, selectedLibrary, clearProfile, clearServer, logout } = useAuth();

  const handleClose = () => {
    navigation.goBack();
  };

  const handleSwitchProfile = async () => {
    await clearProfile();
  };

  const handleChangeServer = async () => {
    await clearServer();
  };

  const handleSignOut = async () => {
    await logout();
  };

  const handleAbout = () => {
    navigation.navigate('About');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          {selectedProfile?.thumb ? (
            <Image source={{ uri: selectedProfile.thumb }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatar, styles.profileAvatarPlaceholder]}>
              <Ionicons name="person" size={40} color={colors.textSecondary} />
            </View>
          )}
          <Text style={styles.profileName}>{selectedProfile?.title || 'Unknown Profile'}</Text>
          {selectedServer && (
            <Text style={styles.serverName}>{selectedServer.name}</Text>
          )}
          {selectedLibrary && (
            <Text style={styles.libraryName}>{selectedLibrary.title}</Text>
          )}
        </View>

        {/* Options */}
        <View style={styles.section}>
          <OptionItem
            icon="swap-horizontal"
            title="Switch Profile"
            subtitle="Change to a different profile"
            onPress={handleSwitchProfile}
          />
          <OptionItem
            icon="server-outline"
            materialIcon="storage"
            title="Change Server"
            subtitle={selectedServer?.name}
            onPress={handleChangeServer}
          />
        </View>

        <View style={[styles.section, styles.sectionMargin]}>
          <OptionItem
            icon="information-circle-outline"
            title="About"
            subtitle="App info and version"
            onPress={handleAbout}
          />
        </View>

        <View style={[styles.section, styles.sectionMargin]}>
          <OptionItem
            icon="log-out-outline"
            title="Sign Out"
            onPress={handleSignOut}
            destructive
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  profileAvatarPlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  serverName: {
    ...typography.body,
    color: colors.textSecondary,
  },
  libraryName: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
  sectionMargin: {
    marginTop: spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionIconDestructive: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  optionTitleDestructive: {
    color: colors.error,
  },
  optionSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

