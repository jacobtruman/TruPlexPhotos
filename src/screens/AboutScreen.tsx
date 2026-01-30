import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { getVersionString } from '../constants/version';

interface InfoItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity
    style={styles.infoItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoTitle}>{title}</Text>
      {subtitle && <Text style={styles.infoSubtitle}>{subtitle}</Text>}
    </View>
    {onPress && (
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    )}
  </TouchableOpacity>
);

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleClose = () => {
    navigation.goBack();
  };

  const handlePrivacyPolicy = async () => {
    // TODO: Replace with your actual privacy policy URL
    await WebBrowser.openBrowserAsync('https://github.com/jacobtruman/TruPlexPhotos/blob/main/PRIVACY.md');
  };

  const handleOpenSource = async () => {
    // Opens the GitHub repository
    await WebBrowser.openBrowserAsync('https://github.com/jacobtruman/TruPlexPhotos');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={styles.appSection}>
          <View style={styles.appIcon}>
            <Ionicons name="images" size={48} color={colors.primary} />
          </View>
          <Text style={styles.appName}>TruPlexPhotos</Text>
          <Text style={styles.appTagline}>Browse and manage your Plex photos</Text>
          <Text style={styles.version}>{getVersionString(Platform.OS as 'ios' | 'android')}</Text>
        </View>

        {/* Technical Info */}
        <Text style={styles.sectionTitle}>Technical</Text>
        <View style={styles.section}>
          <InfoItem
            icon="logo-react"
            title="Built With"
            subtitle="React Native & Expo"
          />
          <InfoItem
            icon="server-outline"
            title="Plex Integration"
            subtitle="Powered by Plex Media Server"
          />
        </View>

        {/* Legal */}
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.section}>
          <InfoItem
            icon="document-text-outline"
            title="Privacy Policy"
            onPress={handlePrivacyPolicy}
          />
          <InfoItem
            icon="code-slash-outline"
            title="Open Source"
            subtitle="MIT License"
            onPress={handleOpenSource}
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
  backButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  appSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  appTagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  version: {
    ...typography.caption,
    color: colors.textMuted,
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  infoSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

