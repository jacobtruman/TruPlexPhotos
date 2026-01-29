export interface Photo {
  id: string;
  uri: string;
  fullUri?: string; // Full resolution URL for downloading
  filename: string;
  filePath?: string; // Full file path on the server
  width: number;
  height: number;
  createdAt: Date;
  modifiedAt?: Date;
  mediaType: 'photo' | 'video';
  duration?: number;
  albumId?: string;
  rating?: number; // User rating from 0-10 (10 = favorite)
  title?: string; // Photo title from Plex
  // File metadata from Plex
  fileSize?: number; // File size in bytes
  format?: string; // File format (e.g., "jpeg", "png", "mp4")
  aspectRatio?: number; // Aspect ratio (e.g., 1.33, 1.78)
}

export interface Album {
  id: string;
  key?: string; // Plex album key for fetching photos (path-based)
  ratingKey?: string; // Plex rating key for fetching metadata
  title: string;
  coverPhoto?: Photo;
  photoCount: number;
  createdAt: Date;
  index?: number; // Custom sort order from Plex
}

export interface PhotoGroup {
  title: string;
  date: Date;
  photos: Photo[];
}

export interface ServerConfig {
  url: string;
  token?: string;
  name: string;
}

// Plex Authentication Types
export interface PlexPin {
  id: number;
  code: string;
  expiresAt: string;
  authToken: string | null;
  trusted: boolean;
  clientIdentifier: string;
}

export interface PlexUser {
  id: number;
  uuid: string;
  username: string;
  title: string;
  email: string;
  thumb: string;
  authToken: string;
  home: boolean;
  subscription: {
    active: boolean;
    status: string;
    plan: string;
  };
}

export interface PlexProfile {
  id: string;
  uuid: string;
  title: string;
  thumb: string;
  pin?: string;
  home: boolean;
  admin: boolean;
  guest: boolean;
  restricted: boolean;
}

export interface PlexServer {
  name: string;
  address: string;
  port: number;
  version: string;
  scheme: string;
  host: string;
  localAddresses: string;
  machineIdentifier: string;
  accessToken: string;
  owned: boolean;
  synced: boolean;
  // All available connection URIs, ordered by preference (remote first)
  connectionUris: string[];
}

export interface PlexResource {
  name: string;
  product: string;
  productVersion: string;
  platform: string;
  platformVersion: string;
  device: string;
  clientIdentifier: string;
  provides: string;
  owned: boolean;
  accessToken: string;
  connections: PlexConnection[];
}

export interface PlexConnection {
  protocol: string;
  address: string;
  port: number;
  uri: string;
  local: boolean;
}

export interface PlexLibrary {
  key: string;
  title: string;
  type: string;
  agent: string;
  scanner: string;
  thumb?: string;
}

export interface PlexAlbum {
  ratingKey: string;
  key: string;
  title: string;
  type: string;
  thumb?: string;
  addedAt: number;
  updatedAt: number;
  leafCount?: number; // Number of photos in album
  index?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: PlexUser | null;
  selectedProfile: PlexProfile | null;
  profiles: PlexProfile[];
  servers: PlexServer[];
  authToken: string | null;
  clientIdentifier: string | null;
  selectedServer: PlexServer | null;
  selectedLibrary: PlexLibrary | null;
  libraries: PlexLibrary[];
}

export type RootTabParamList = {
  Timeline: undefined;
  Library: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  ProfileSelection: undefined;
  ServerSelection: undefined;
  LibrarySelection: undefined;
  ProfileOptions: undefined;
  PhotoViewer: { photo: Photo; photos: Photo[]; initialIndex: number };
  AlbumDetail: { album: Album };
};

