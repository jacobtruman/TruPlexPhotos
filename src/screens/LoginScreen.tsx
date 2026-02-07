import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundDark} />
      
      <View style={styles.content}>
        {/* Logo/Branding Section */}
        <View style={styles.brandingContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Tru Photos</Text>
          <Text style={styles.tagline}>Your photos, beautifully organized</Text>
        </View>

        {/* Login Section */}
        <View style={styles.loginSection}>
          <Text style={styles.loginPrompt}>
            Sign in with your Plex account to access your photo libraries
          </Text>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={login}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.backgroundDark} />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={24} color={colors.backgroundDark} />
                <Text style={styles.loginButtonText}>Sign in with Plex</Text>
              </>
            )}
          </TouchableOpacity>

          {isLoading && (
            <Text style={styles.loadingText}>
              Complete sign in in your browser...
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by Plex Media Server
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  brandingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  logoImage: {
    width: 320,
    height: 320,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  appName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loginSection: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  loginPrompt: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    minWidth: 220,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    ...typography.body,
    color: colors.backgroundDark,
    fontWeight: '600',
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  footerText: {
    ...typography.small,
    color: colors.textMuted,
  },
});

