import React, { ReactNode } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface LoadingStateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  loadingText?: string;
  errorText?: string;
  errorHint?: string;
  emptyText?: string;
  emptyHint?: string;
  children?: ReactNode;
  header?: ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading = false,
  error = null,
  empty = false,
  loadingText = 'Loading...',
  errorText,
  errorHint = 'Pull down to retry',
  emptyText = 'No items found',
  emptyHint,
  children,
  header,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorText || error}</Text>
          {errorHint && <Text style={styles.errorHint}>{errorHint}</Text>}
        </View>
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{emptyText}</Text>
          {emptyHint && <Text style={styles.emptyHint}>{emptyHint}</Text>}
          {children}
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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

