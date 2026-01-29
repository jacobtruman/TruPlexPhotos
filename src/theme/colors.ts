// Plex-inspired dark theme colors
export const colors = {
  // Primary colors
  primary: '#E5A00D', // Plex orange/gold
  primaryDark: '#CC8A00',
  primaryLight: '#F5B82E',
  
  // Background colors
  background: '#1F1F1F',
  backgroundDark: '#121212',
  backgroundLight: '#2A2A2A',
  surface: '#282828',
  surfaceLight: '#333333',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#666666',
  
  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Other
  border: '#404040',
  divider: '#333333',
  overlay: 'rgba(0, 0, 0, 0.7)',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    color: colors.textSecondary,
  },
  small: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    color: colors.textMuted,
  },
};

