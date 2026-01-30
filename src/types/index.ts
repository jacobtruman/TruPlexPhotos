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
  ultraBlurColors?: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  }; // 4-corner colors from UltraBlurColors for gradient overlay
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
  UltraBlurColors?: {
    topLeft?: string;
    topRight?: string;
    bottomRight?: string;
    bottomLeft?: string;
  };
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
  selectedTab: keyof RootTabParamList;
}

export type RootTabParamList = {
  Timeline: undefined;
  Library: undefined;
};

// Serializable version of Photo for navigation params (Date -> string)
export interface SerializablePhoto extends Omit<Photo, 'createdAt' | 'modifiedAt'> {
  createdAt: string; // ISO string
  modifiedAt?: string; // ISO string
}

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  ProfileSelection: undefined;
  ServerSelection: undefined;
  LibrarySelection: undefined;
  ProfileOptions: undefined;
  PhotoViewer: { photo: SerializablePhoto; photos: SerializablePhoto[]; initialIndex: number };
  AlbumDetail: {
    albumId: string;
    albumKey?: string;
    albumRatingKey?: string;
    albumTitle: string;
    breadcrumb?: string; // Breadcrumb path like "2009 / May"
    breadcrumbHistory?: Array<{
      title: string;
      albumId: string;
      albumKey?: string;
      albumRatingKey?: string;
    }>; // History of breadcrumb items for navigation
  };
};


// Helper functions to convert between Photo and SerializablePhoto
export function photoToSerializable(photo: Photo): SerializablePhoto {
  // Validate dates before serialization
  const createdAt = photo.createdAt instanceof Date && !isNaN(photo.createdAt.getTime())
    ? photo.createdAt.toISOString()
    : new Date().toISOString(); // Fallback to current date if invalid

  const modifiedAt = photo.modifiedAt instanceof Date && !isNaN(photo.modifiedAt.getTime())
    ? photo.modifiedAt.toISOString()
    : undefined;

  return {
    ...photo,
    createdAt,
    modifiedAt,
  };
}

export function serializableToPhoto(serializable: SerializablePhoto): Photo {
  return {
    ...serializable,
    createdAt: new Date(serializable.createdAt),
    modifiedAt: serializable.modifiedAt ? new Date(serializable.modifiedAt) : undefined,
  };
}

