import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { PlexPin, PlexUser, PlexProfile, PlexServer, PlexResource, PlexConnection } from '../types';

const PLEX_API_BASE = 'https://plex.tv/api/v2';
const APP_NAME = 'TruPlex Photos';
const APP_VERSION = '1.0.0';

// Secure storage keys
const STORAGE_KEYS = {
  CLIENT_ID: 'plex_client_id',
  AUTH_TOKEN: 'plex_auth_token',
  USER: 'plex_user',
  SELECTED_PROFILE: 'plex_selected_profile',
  SELECTED_SERVER: 'plex_selected_server',
};

// Get or generate client identifier
export async function getClientIdentifier(): Promise<string> {
  let clientId = await SecureStore.getItemAsync(STORAGE_KEYS.CLIENT_ID);
  if (!clientId) {
    clientId = Crypto.randomUUID();
    await SecureStore.setItemAsync(STORAGE_KEYS.CLIENT_ID, clientId);
  }
  return clientId;
}

// Build standard Plex headers
async function getPlexHeaders(authToken?: string | null): Promise<Record<string, string>> {
  const clientId = await getClientIdentifier();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Plex-Product': APP_NAME,
    'X-Plex-Version': APP_VERSION,
    'X-Plex-Client-Identifier': clientId,
    'X-Plex-Platform': 'Android',
    'X-Plex-Platform-Version': '14',
    'X-Plex-Device': 'Mobile',
    'X-Plex-Device-Name': APP_NAME,
  };
  if (authToken) {
    headers['X-Plex-Token'] = authToken;
  }
  return headers;
}

// Create a new PIN for authentication
export async function createPin(): Promise<PlexPin> {
  const headers = await getPlexHeaders();
  const response = await fetch(`${PLEX_API_BASE}/pins?strong=true`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to create PIN: ${response.status}`);
  }
  return response.json();
}

// Check if PIN has been authorized
export async function checkPin(pinId: number): Promise<PlexPin> {
  const headers = await getPlexHeaders();
  const response = await fetch(`${PLEX_API_BASE}/pins/${pinId}`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to check PIN: ${response.status}`);
  }
  return response.json();
}

// Open browser for Plex authentication
export async function openPlexAuth(pinCode: string): Promise<WebBrowser.WebBrowserResult> {
  const clientId = await getClientIdentifier();
  const authUrl = `https://app.plex.tv/auth#?clientID=${clientId}&code=${pinCode}&context[device][product]=${encodeURIComponent(APP_NAME)}`;
  return WebBrowser.openBrowserAsync(authUrl);
}

// Get user info with auth token
export async function getUser(authToken: string): Promise<PlexUser> {
  const headers = await getPlexHeaders(authToken);
  const response = await fetch(`${PLEX_API_BASE}/user`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to get user: ${response.status}`);
  }
  return response.json();
}

// Get user's Plex resources (servers)
export async function getResources(authToken: string): Promise<PlexResource[]> {
  const headers = await getPlexHeaders(authToken);
  const response = await fetch(`${PLEX_API_BASE}/resources?includeHttps=1&includeRelay=1`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to get resources: ${response.status}`);
  }
  return response.json();
}

// Convert PlexResource to PlexServer
export function resourceToServer(resource: PlexResource): PlexServer | null {
  if (resource.provides !== 'server') return null;
  const connections = resource.connections || [];
  if (connections.length === 0) return null;

  // Sort connections: remote (non-local) first, then local
  // This helps with Android emulator which can't reach local IPs
  const sortedConnections = [...connections].sort((a, b) => {
    if (a.local === b.local) return 0;
    return a.local ? 1 : -1; // non-local first
  });

  const bestConnection = sortedConnections[0];

  // Build list of all connection URIs, remote first
  const connectionUris = sortedConnections.map((c: PlexConnection) => c.uri);

  return {
    name: resource.name,
    address: bestConnection.address,
    port: bestConnection.port,
    version: resource.productVersion || '',
    scheme: bestConnection.protocol,
    host: bestConnection.address,
    localAddresses: connections
      .filter((c: PlexConnection) => c.local)
      .map((c: PlexConnection) => c.address)
      .join(',') || '',
    machineIdentifier: resource.clientIdentifier,
    accessToken: resource.accessToken,
    owned: resource.owned,
    synced: false,
    connectionUris,
  };
}

// Get available profiles (home users)
export async function getProfiles(authToken: string): Promise<PlexProfile[]> {
  const headers = await getPlexHeaders(authToken);
  const response = await fetch(`${PLEX_API_BASE}/home/users`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to get profiles: ${response.status}`);
  }
  const data = await response.json();
  return data.users || [];
}

// Switch to a different profile
// Note: This endpoint uses /api/ not /api/v2/ and returns XML
const PLEX_HOME_API = 'https://plex.tv/api/home/users';

export async function switchProfile(authToken: string, userId: string, pin?: string): Promise<string> {
  const headers = await getPlexHeaders(authToken);

  // PIN must be passed as URL query parameter, not in body
  let url = `${PLEX_HOME_API}/${userId}/switch`;
  if (pin) {
    url += `?pin=${encodeURIComponent(pin)}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to switch profile: ${response.status}`);
  }

  // Response is XML, need to parse authenticationToken attribute
  const text = await response.text();
  const match = text.match(/authenticationToken="([^"]+)"/);
  if (!match) {
    throw new Error('No authentication token in response');
  }
  return match[1];
}

