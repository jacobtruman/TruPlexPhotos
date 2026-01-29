import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  AuthState,
  PlexUser,
  PlexProfile,
  PlexServer,
  PlexLibrary,
} from '../types';
import {
  createPin,
  checkPin,
  openPlexAuth,
  getUser,
  getResources,
  getProfiles,
  switchProfile,
  resourceToServer,
  getClientIdentifier,
} from '../services/authService';
import { getPhotoLibraries, filterAccessibleServers } from '../services/plexService';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'plex_auth_token',
  USER: 'plex_user',
  SELECTED_PROFILE: 'plex_selected_profile',
  SELECTED_SERVER: 'plex_selected_server',
  SELECTED_LIBRARY: 'plex_selected_library',
};

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  selectedProfile: null,
  profiles: [],
  servers: [],
  authToken: null,
  clientIdentifier: null,
  selectedServer: null,
  selectedLibrary: null,
  libraries: [],
};

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  selectProfile: (profile: PlexProfile, pin?: string) => Promise<void>;
  clearProfile: () => Promise<void>;
  selectServer: (server: PlexServer) => Promise<void>;
  clearServer: () => Promise<void>;
  selectLibrary: (library: PlexLibrary) => Promise<void>;
  clearLibrary: () => Promise<void>;
  refreshServers: () => Promise<void>;
  refreshLibraries: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  // Load saved auth state on mount
  useEffect(() => {
    loadSavedAuth();
  }, []);

  const loadSavedAuth = async () => {
    try {
      const [authToken, userJson, profileJson, clientId] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.USER),
        SecureStore.getItemAsync(STORAGE_KEYS.SELECTED_PROFILE),
        getClientIdentifier(),
      ]);

      if (authToken && userJson) {
        const user: PlexUser = JSON.parse(userJson);
        const selectedProfile: PlexProfile | null = profileJson ? JSON.parse(profileJson) : null;

        // Load profile-specific server selection
        const serverKey = selectedProfile
          ? `${STORAGE_KEYS.SELECTED_SERVER}_${selectedProfile.id}`
          : STORAGE_KEYS.SELECTED_SERVER;
        console.log(`Plex: Loading server from key: ${serverKey}`);
        const serverJson = await SecureStore.getItemAsync(serverKey);
        console.log(`Plex: Saved server JSON: ${serverJson ? 'found' : 'not found'}`);
        const savedServer: PlexServer | null = serverJson ? JSON.parse(serverJson) : null;

        // Load profile-specific library selection
        const libraryKey = selectedProfile
          ? `${STORAGE_KEYS.SELECTED_LIBRARY}_${selectedProfile.id}`
          : STORAGE_KEYS.SELECTED_LIBRARY;
        const libraryJson = await SecureStore.getItemAsync(libraryKey);
        const savedLibrary: PlexLibrary | null = libraryJson ? JSON.parse(libraryJson) : null;

        // Fetch fresh data
        const [profiles, resources] = await Promise.all([
          getProfiles(authToken).catch(() => []),
          getResources(authToken).catch(() => []),
        ]);

        const allServers = resources.map(resourceToServer).filter((s): s is PlexServer => s !== null);
        // Filter to only accessible servers
        const servers = await filterAccessibleServers(allServers);

        // If we have a saved server, find the matching fresh server data (with updated accessToken)
        let actualServer: PlexServer | null = null;
        if (savedServer) {
          // Find the fresh server that matches the saved server ID
          actualServer = servers.find(s => s.machineIdentifier === savedServer.machineIdentifier) || null;
          console.log(`Plex: Restored saved server "${savedServer.name}", found fresh data: ${actualServer ? 'yes' : 'no'}`);
        }
        // Don't auto-select a server if none was saved - let user choose

        // Fetch libraries if we have a server
        // Use the server's accessToken which is scoped to the current profile's permissions
        let libraries: PlexLibrary[] = [];
        if (actualServer) {
          try {
            libraries = await getPhotoLibraries(actualServer, actualServer.accessToken);
          } catch (e) {
            console.error('Failed to fetch libraries:', e);
          }
        }

        // If we have a saved library, find the matching library from the fetched list
        let actualLibrary: PlexLibrary | null = null;
        if (savedLibrary && libraries.length > 0) {
          actualLibrary = libraries.find(l => l.key === savedLibrary.key) || null;
          console.log(`Plex: Restored saved library "${savedLibrary.title}", found: ${actualLibrary ? 'yes' : 'no'}`);
        }

        setState({
          isAuthenticated: true,
          isLoading: false,
          user,
          selectedProfile,
          profiles,
          servers,
          authToken,
          clientIdentifier: clientId,
          selectedServer: actualServer,
          selectedLibrary: actualLibrary,
          libraries,
        });
      } else {
        setState({ ...initialState, isLoading: false, clientIdentifier: clientId });
      }
    } catch (error) {
      console.error('Failed to load saved auth:', error);
      setState({ ...initialState, isLoading: false });
    }
  };

  const login = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // Create PIN and open browser
      const pin = await createPin();
      await openPlexAuth(pin.code);

      // Poll for auth completion (every 2 seconds, max 5 minutes)
      const maxAttempts = 150;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pinStatus = await checkPin(pin.id);
        
        if (pinStatus.authToken) {
          // Success! Get user info and resources
          const [user, profiles, resources] = await Promise.all([
            getUser(pinStatus.authToken),
            getProfiles(pinStatus.authToken).catch(() => []),
            getResources(pinStatus.authToken).catch(() => []),
          ]);

          const allServers = resources.map(resourceToServer).filter((s): s is PlexServer => s !== null);
          // Filter to only accessible servers
          const servers = await filterAccessibleServers(allServers);

          // Save to secure storage
          await Promise.all([
            SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, pinStatus.authToken),
            SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user)),
          ]);

          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            isLoading: false,
            user,
            profiles,
            servers,
            authToken: pinStatus.authToken,
            selectedServer: servers[0] || null,
          }));
          return;
        }
      }
      throw new Error('Authentication timed out');
    } catch (error) {
      console.error('Login failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
      SecureStore.deleteItemAsync(STORAGE_KEYS.SELECTED_PROFILE),
      SecureStore.deleteItemAsync(STORAGE_KEYS.SELECTED_SERVER),
      SecureStore.deleteItemAsync(STORAGE_KEYS.SELECTED_LIBRARY),
    ]);
    setState({ ...initialState, isLoading: false, clientIdentifier: state.clientIdentifier });
  }, [state.clientIdentifier]);

  const selectProfile = useCallback(async (profile: PlexProfile, pin?: string) => {
    if (!state.authToken) throw new Error('Not authenticated');

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const newToken = await switchProfile(state.authToken, profile.id, pin);
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, newToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.SELECTED_PROFILE, JSON.stringify(profile));

      // Re-fetch resources with the new profile token to get updated server access tokens
      // This is important because each profile may have different server access permissions
      console.log('Plex: Re-fetching resources for new profile...');
      const resources = await getResources(newToken).catch(() => []);
      const allServers = resources.map(resourceToServer).filter((s): s is PlexServer => s !== null);
      // Filter to only accessible servers
      const servers = await filterAccessibleServers(allServers);
      console.log(`Plex: Found ${servers.length} accessible servers for profile "${profile.title}"`);

      // Load this profile's saved server selection
      const serverKey = `${STORAGE_KEYS.SELECTED_SERVER}_${profile.id}`;
      console.log(`Plex: Loading server from key: ${serverKey}`);
      const savedServerJson = await SecureStore.getItemAsync(serverKey);
      console.log(`Plex: Saved server JSON: ${savedServerJson ? 'found' : 'not found'}`);
      let selectedServer: PlexServer | null = null;

      if (savedServerJson) {
        const savedServer: PlexServer = JSON.parse(savedServerJson);
        // Find the fresh server that matches the saved server ID (with updated accessToken)
        selectedServer = servers.find(s => s.machineIdentifier === savedServer.machineIdentifier) || null;
        console.log(`Plex: Restored saved server "${savedServer.name}" for profile "${profile.title}", found fresh data: ${selectedServer ? 'yes' : 'no'}`);
      }

      // Fetch libraries if we have a server
      let libraries: PlexLibrary[] = [];
      if (selectedServer) {
        try {
          libraries = await getPhotoLibraries(selectedServer, selectedServer.accessToken);
        } catch (e) {
          console.error('Failed to fetch libraries:', e);
        }
      }

      // Load this profile's saved library selection
      const libraryKey = `${STORAGE_KEYS.SELECTED_LIBRARY}_${profile.id}`;
      const savedLibraryJson = await SecureStore.getItemAsync(libraryKey);
      let selectedLibrary: PlexLibrary | null = null;

      if (savedLibraryJson && libraries.length > 0) {
        const savedLibrary: PlexLibrary = JSON.parse(savedLibraryJson);
        // Find the library that matches the saved library key
        selectedLibrary = libraries.find(l => l.key === savedLibrary.key) || null;
        console.log(`Plex: Restored saved library "${savedLibrary.title}" for profile "${profile.title}", found: ${selectedLibrary ? 'yes' : 'no'}`);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        authToken: newToken,
        selectedProfile: profile,
        servers,
        selectedServer,
        selectedLibrary,
        libraries,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [state.authToken]);

  const selectServer = useCallback(async (server: PlexServer) => {
    // Fetch libraries for the new server FIRST to verify connection works
    // Use the server's accessToken which is scoped to the current profile's permissions
    const libraries = await getPhotoLibraries(server, server.accessToken);

    // Only save server selection after successful connection
    const serverKey = state.selectedProfile
      ? `${STORAGE_KEYS.SELECTED_SERVER}_${state.selectedProfile.id}`
      : STORAGE_KEYS.SELECTED_SERVER;
    console.log(`Plex: Saving server "${server.name}" with key: ${serverKey}`);
    await SecureStore.setItemAsync(serverKey, JSON.stringify(server));
    // Clear library when server changes
    await SecureStore.deleteItemAsync(STORAGE_KEYS.SELECTED_LIBRARY);

    setState(prev => ({ ...prev, selectedServer: server, selectedLibrary: null, libraries }));
  }, [state.selectedProfile]);

  const selectLibrary = useCallback(async (library: PlexLibrary) => {
    // Store library selection per profile
    const libraryKey = state.selectedProfile
      ? `${STORAGE_KEYS.SELECTED_LIBRARY}_${state.selectedProfile.id}`
      : STORAGE_KEYS.SELECTED_LIBRARY;
    console.log(`Plex: Saving library "${library.title}" with key: ${libraryKey}`);
    await SecureStore.setItemAsync(libraryKey, JSON.stringify(library));
    setState(prev => ({ ...prev, selectedLibrary: library }));
  }, [state.selectedProfile]);

  const clearLibrary = useCallback(async () => {
    // Delete profile-specific library key
    if (state.selectedProfile) {
      await SecureStore.deleteItemAsync(`${STORAGE_KEYS.SELECTED_LIBRARY}_${state.selectedProfile.id}`);
    }
    setState(prev => ({ ...prev, selectedLibrary: null }));
  }, [state.selectedProfile]);

  const clearServer = useCallback(async () => {
    // Delete profile-specific server and library keys
    if (state.selectedProfile) {
      await SecureStore.deleteItemAsync(`${STORAGE_KEYS.SELECTED_SERVER}_${state.selectedProfile.id}`);
      await SecureStore.deleteItemAsync(`${STORAGE_KEYS.SELECTED_LIBRARY}_${state.selectedProfile.id}`);
    }
    setState(prev => ({ ...prev, selectedServer: null, selectedLibrary: null, libraries: [] }));
  }, [state.selectedProfile]);

  const clearProfile = useCallback(async () => {
    // Only clear the selected profile - don't delete server/library selections
    // so they can be restored when switching back to this profile
    await SecureStore.deleteItemAsync(STORAGE_KEYS.SELECTED_PROFILE);
    setState(prev => ({ ...prev, selectedProfile: null, selectedServer: null, selectedLibrary: null, libraries: [] }));
  }, []);

  const refreshServers = useCallback(async () => {
    if (!state.authToken) return;
    try {
      const resources = await getResources(state.authToken);
      const allServers = resources.map(resourceToServer).filter((s): s is PlexServer => s !== null);
      // Filter to only accessible servers
      const servers = await filterAccessibleServers(allServers);
      setState(prev => ({ ...prev, servers }));
    } catch (error) {
      console.error('Failed to refresh servers:', error);
    }
  }, [state.authToken]);

  const refreshLibraries = useCallback(async () => {
    if (!state.selectedServer) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      console.log('Plex: Refreshing libraries from server...');
      // Use the server's accessToken which is scoped to the current profile's permissions
      const libraries = await getPhotoLibraries(state.selectedServer, state.selectedServer.accessToken);
      console.log(`Plex: Found ${libraries.length} libraries:`, libraries.map(l => l.title));
      setState(prev => ({ ...prev, libraries, isLoading: false }));
    } catch (error) {
      console.error('Failed to refresh libraries:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.selectedServer]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    selectProfile,
    clearProfile,
    selectServer,
    clearServer,
    selectLibrary,
    clearLibrary,
    refreshServers,
    refreshLibraries,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

