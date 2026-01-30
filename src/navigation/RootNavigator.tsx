import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import {
  PhotoViewerScreen,
  AlbumDetailScreen,
  LoginScreen,
  ProfileSelectionScreen,
  ServerSelectionScreen,
  LibrarySelectionScreen,
  ProfileOptionsScreen,
} from '../screens';
import { RootStackParamList } from '../types';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { authToken, selectedProfile, selectedServer, selectedLibrary } = useAuth();

  // Determine which screens to show based on auth state
  const isAuthenticated = !!authToken;
  const hasProfile = !!selectedProfile;
  const hasServer = !!selectedServer;
  const hasLibrary = !!selectedLibrary;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      {!isAuthenticated ? (
        // Not logged in - show login screen
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : !hasProfile ? (
        // Logged in but no profile selected
        <Stack.Screen name="ProfileSelection" component={ProfileSelectionScreen} />
      ) : !hasServer ? (
        // Profile selected but no server selected
        <Stack.Screen name="ServerSelection" component={ServerSelectionScreen} />
      ) : !hasLibrary ? (
        // Server selected but no library selected
        <Stack.Screen name="LibrarySelection" component={LibrarySelectionScreen} />
      ) : (
        // Fully authenticated - show main app
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="ProfileOptions"
            component={ProfileOptionsScreen}
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="PhotoViewer"
            component={PhotoViewerScreen}
            options={{
              animation: 'fade',
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen
            name="AlbumDetail"
            component={AlbumDetailScreen}
            options={{
              animation: 'slide_from_right',
              ...(Platform.OS === 'android' && {
                statusBarColor: colors.background,
                navigationBarColor: colors.background,
              }),
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

