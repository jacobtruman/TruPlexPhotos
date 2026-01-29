import { PlexServer, Photo, Album, PlexAlbum } from '../types';

export interface PlexLibrary {
  key: string;
  title: string;
  type: string;
  agent: string;
  scanner: string;
  thumb?: string;
}

export interface PlexPhotoItem {
  ratingKey: string;
  key: string;
  title: string;
  type: string;
  thumb?: string;
  originallyAvailableAt?: string;
  addedAt: number;
  updatedAt: number;
  userRating?: number; // User rating from 0-10 (10 = favorite)
  Media?: Array<{
    width: number;
    height: number;
    duration?: number;
    container?: string;
    aspectRatio?: number;
    Part: Array<{
      key: string;
      file: string;
      size?: number; // File size in bytes
    }>;
  }>;
}

// Store the working server URL once we find one
let workingServerUrl: string | null = null;

// Build server URL from PlexServer (fallback)
function getServerUrl(server: PlexServer): string {
  return `${server.scheme}://${server.address}:${server.port}`;
}

// Fetch with timeout helper
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Test if a server is accessible by trying to connect to it
// Returns true if at least one connection URI works, false otherwise
export async function testServerConnection(
  server: PlexServer,
  timeoutMs: number = 5000
): Promise<boolean> {
  const urisToTry = server.connectionUris || [];

  if (urisToTry.length === 0) {
    console.log(`Plex: Server "${server.name}" has no connection URIs`);
    return false;
  }

  // Try each connection URI with a short timeout
  for (const baseUrl of urisToTry) {
    try {
      const url = `${baseUrl}/identity`;
      const response = await fetchWithTimeout(url, {
        headers: {
          Accept: 'application/json',
          'X-Plex-Token': server.accessToken,
        },
      }, timeoutMs);

      if (response.ok) {
        console.log(`Plex: Server "${server.name}" is accessible via ${baseUrl}`);
        return true;
      }
      // 401 means the server is reachable but token is invalid for this profile
      if (response.status === 401) {
        console.log(`Plex: Server "${server.name}" returned 401 (unauthorized) from ${baseUrl}`);
        // Continue trying other URIs
      }
    } catch (error) {
      // Connection failed, try next URI
      console.log(`Plex: Server "${server.name}" not reachable via ${baseUrl}`);
    }
  }

  console.log(`Plex: Server "${server.name}" is not accessible (all ${urisToTry.length} URIs failed)`);
  return false;
}

// Filter servers to only include accessible ones
export async function filterAccessibleServers(
  servers: PlexServer[]
): Promise<PlexServer[]> {
  console.log(`Plex: Testing connectivity for ${servers.length} server(s)...`);

  // Test all servers in parallel for speed
  const results = await Promise.all(
    servers.map(async (server) => ({
      server,
      accessible: await testServerConnection(server),
    }))
  );

  const accessibleServers = results
    .filter(({ accessible }) => accessible)
    .map(({ server }) => server);

  console.log(`Plex: ${accessibleServers.length} of ${servers.length} server(s) are accessible`);
  return accessibleServers;
}

// Options for fetchWithFallback
interface FetchOptions {
  extraParams?: Record<string, string>;
  timeout?: number;
  silent?: boolean;  // Reduce logging for background requests
  method?: 'GET' | 'PUT' | 'POST' | 'DELETE';  // HTTP method (default: GET)
}

// Try to fetch from multiple connection URIs until one works
async function fetchWithFallback(
  server: PlexServer,
  path: string,
  token: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { extraParams, timeout = 10000, silent = false, method = 'GET' } = options;

  // Build list of URIs to try
  // Handle case where connectionUris might be undefined (old saved data)
  const connectionUris = server.connectionUris || [];
  const fallbackUrl = getServerUrl(server);

  let urisToTry: string[];
  if (workingServerUrl) {
    // If we have a working URL, try it first
    // For silent requests, only try the working URL to avoid timeout delays
    if (silent) {
      urisToTry = [workingServerUrl];
    } else {
      urisToTry = [workingServerUrl, ...connectionUris.filter(u => u !== workingServerUrl)];
      if (!urisToTry.includes(fallbackUrl)) {
        urisToTry.push(fallbackUrl);
      }
    }
  } else if (connectionUris.length > 0) {
    // No working URL yet - try all URLs (even for silent requests, we need to find one that works)
    urisToTry = [...connectionUris];
    if (!urisToTry.includes(fallbackUrl)) {
      urisToTry.push(fallbackUrl);
    }
  } else {
    urisToTry = [fallbackUrl];
  }

  if (!silent) {
    console.log(`Plex: Will try ${urisToTry.length} connection(s):`, urisToTry);
  }

  let lastError: Error | null = null;

  // Build query string - handle paths that already have query params
  const extraParamsStr = extraParams
    ? Object.entries(extraParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
    : '';
  const tokenParam = `X-Plex-Token=${token}`;
  const separator = path.includes('?') ? '&' : '?';
  const queryString = extraParamsStr ? `${tokenParam}&${extraParamsStr}` : tokenParam;

  for (const baseUrl of urisToTry) {
    const url = `${baseUrl}${path}${separator}${queryString}`;
    if (!silent) {
      console.log(`Plex: Trying ${baseUrl}...`);
    }

    try {
      const response = await fetchWithTimeout(url, {
        method,
        headers: { Accept: 'application/json' },
      }, timeout);

      if (response.ok) {
        // Remember this working URL for future requests
        workingServerUrl = baseUrl;
        if (!silent) {
          console.log(`Plex: Successfully connected to ${baseUrl}`);
        }
        return response;
      }

      if (!silent) {
        console.log(`Plex: HTTP ${response.status} from ${baseUrl}`);
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (!silent) {
        console.log(`Plex: Failed to connect to ${baseUrl}: ${errorMsg}`);
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('No connection URIs available');
}

// Fetch photo libraries from a Plex server
export async function getPhotoLibraries(
  server: PlexServer,
  token: string
): Promise<PlexLibrary[]> {
  try {
    console.log('Plex API: Fetching libraries from server:', server.name);
    console.log('Plex API: Using token:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');
    const response = await fetchWithFallback(server, '/library/sections', token);
    const data = await response.json();
    const directories = data.MediaContainer?.Directory || [];

    console.log('Plex API: Raw directories from server:', JSON.stringify(directories.map((d: any) => ({ key: d.key, title: d.title, type: d.type })), null, 2));

    // Filter to only photo libraries (type = 'photo')
    const photoLibraries = directories
      .filter((dir: any) => dir.type === 'photo')
      .map((dir: any) => ({
        key: dir.key,
        title: dir.title,
        type: dir.type,
        agent: dir.agent,
        scanner: dir.scanner,
        thumb: dir.thumb,
      }));

    console.log('Plex API: Filtered photo libraries:', photoLibraries.map((l: PlexLibrary) => l.title));
    return photoLibraries;
  } catch (error) {
    console.error('Error fetching photo libraries:', error);
    throw error;
  }
}

// Fetch all content from a directory (album/folder)
async function getDirectoryContents(
  server: PlexServer,
  token: string,
  directoryKey: string
): Promise<any[]> {
  try {
    const response = await fetchWithFallback(
      server,
      directoryKey,
      token
    );
    const data = await response.json();
    return data.MediaContainer?.Metadata || [];
  } catch (error) {
    console.error(`Error fetching directory ${directoryKey}:`, error);
    return [];
  }
}

// Recursively fetch all photos from a directory and its subdirectories
async function getPhotosRecursively(
  server: PlexServer,
  token: string,
  directoryKey: string,
  depth: number = 0,
  maxDepth: number = 10
): Promise<PlexPhotoItem[]> {
  if (depth > maxDepth) {
    console.log(`Plex: Max depth ${maxDepth} reached, stopping recursion`);
    return [];
  }

  const contents = await getDirectoryContents(server, token, directoryKey);
  const photos: PlexPhotoItem[] = [];

  for (const item of contents) {
    // Check if this is a container/folder (has /children in key or no Media array with photo type)
    const isContainer = item.key?.includes('/children') ||
                        (item.type === 'photo' && !item.Media);

    if (!isContainer && (item.type === 'photo' || item.type === 'clip' || item.type === 'video')) {
      // This is an actual photo or video with media data
      photos.push(item);
    } else if (item.key) {
      // This is a folder/album, recurse into it
      const subPhotos = await getPhotosRecursively(
        server,
        token,
        item.key,
        depth + 1,
        maxDepth
      );
      photos.push(...subPhotos);
    }
  }

  return photos;
}

// Result type for paginated photo fetching
export interface PhotosResult {
  photos: PlexPhotoItem[];
  totalSize: number;
  hasMore: boolean;
}

// Fetch photos from a specific library section with pagination
export async function getPhotosFromLibrary(
  server: PlexServer,
  token: string,
  libraryKey: string,
  start: number = 0,
  limit: number = 1000
): Promise<PhotosResult> {
  try {
    console.log(`Plex: getPhotosFromLibrary called with start=${start}, limit=${limit}`);

    // Fetch photos using server-side pagination with clusterZoomLevel
    // This returns photos already sorted by Plex (newest first)
    const photosResponse = await fetchWithFallback(
      server,
      `/library/sections/${libraryKey}/all`,
      token,
      {
        extraParams: {
          'clusterZoomLevel': '1',
          'X-Plex-Container-Start': start.toString(),
          'X-Plex-Container-Size': limit.toString()
        }
      }
    );
    const photosData = await photosResponse.json();
    const photos = photosData.MediaContainer?.Metadata || [];
    const totalSize = photosData.MediaContainer?.totalSize || photos.length;

    console.log(`Plex: Fetched ${photos.length} photos (${start} to ${start + photos.length}) of ${totalSize} total`);

    // Debug: log first photo on initial fetch to see available fields
    if (start === 0 && photos.length > 0) {
      const sample = photos[0];
      console.log(`\n\n========== PHOTO DEBUG ==========`);
      console.log(`All fields: ${JSON.stringify(sample, null, 2)}`);
      console.log(`=================================\n\n`);
    }

    // Check if there are more photos to load
    const hasMore = start + photos.length < totalSize;

    return {
      photos,
      totalSize,
      hasMore
    };
  } catch (error) {
    console.error('Error fetching photos from library:', error);
    throw error;
  }
}

// Fetch full metadata for a single photo by its ratingKey
export async function getPhotoMetadata(
  server: PlexServer,
  token: string,
  ratingKey: string
): Promise<PlexPhotoItem | null> {
  try {
    const response = await fetchWithFallback(
      server,
      `/library/metadata/${ratingKey}`,
      token
    );
    const data = await response.json();
    const items = data.MediaContainer?.Metadata || [];
    return items[0] || null;
  } catch (error) {
    console.error(`Error fetching photo metadata for ${ratingKey}:`, error);
    return null;
  }
}

// Enriched photo metadata returned from getEnrichedPhotoMetadata
export interface EnrichedPhotoMetadata {
  filename: string;
  filePath?: string;
  width: number;
  height: number;
  fileSize?: number;
  format?: string;
  aspectRatio?: number;
}

// Fetch and extract enriched metadata for a photo
export async function getEnrichedPhotoMetadata(
  server: PlexServer,
  token: string,
  ratingKey: string
): Promise<EnrichedPhotoMetadata | null> {
  console.log(`Plex: Fetching enriched metadata for photo ${ratingKey}...`);
  const metadata = await getPhotoMetadata(server, token, ratingKey);
  if (!metadata) {
    console.log(`Plex: No metadata returned for photo ${ratingKey}`);
    return null;
  }

  console.log(`Plex: DEBUG - Metadata keys:`, Object.keys(metadata));
  console.log(`Plex: DEBUG - Media array:`, JSON.stringify(metadata.Media, null, 2));

  const media = metadata.Media?.[0];
  const part = media?.Part?.[0];

  const result = {
    filename: part?.file?.split('/').pop() || metadata.title || 'photo',
    filePath: part?.file,
    width: media?.width || 0,
    height: media?.height || 0,
    fileSize: part?.size,
    format: media?.container,
    aspectRatio: media?.aspectRatio,
  };

  console.log(`Plex: DEBUG - Enriched result:`, result);
  return result;
}

// Get the working server URL for building image URLs
export function getWorkingServerUrl(server: PlexServer): string {
  return workingServerUrl || getServerUrl(server);
}

// Fetch albums/folders from a specific library section
export async function getAlbumsFromLibrary(
  server: PlexServer,
  token: string,
  libraryKey: string
): Promise<PlexAlbum[]> {
  try {
    // Use /library/sections/{sectionId}/all to get folders with full metadata including ratingKey
    console.log(`Plex: Fetching folders from library section ${libraryKey}...`);
    const response = await fetchWithFallback(
      server,
      `/library/sections/${libraryKey}/all`,
      token
    );
    const data = await response.json();
    const allItems = data.MediaContainer?.Metadata || [];

    console.log(`Plex: /all endpoint returned ${allItems.length} items`);
    if (allItems.length > 0) {
      console.log(`Plex: Item types found:`, [...new Set(allItems.map((item: any) => item.type))]);
      console.log(`Plex: First item keys:`, Object.keys(allItems[0]).join(', '));
    }

    // Filter for folders - items with /children in their key
    const folders = allItems.filter((item: any) =>
      item.key && item.key.includes('/children')
    );
    console.log(`Plex: Found ${folders.length} folders in library`);

    return folders;
  } catch (error) {
    console.error('Error fetching albums from library:', error);
    throw error;
  }
}

// Convert Plex albums/folders to our Album type
export function convertPlexAlbumsToAlbums(
  plexAlbums: PlexAlbum[],
  server: PlexServer,
  token: string
): Album[] {
  const serverUrl = getWorkingServerUrl(server);

  return plexAlbums.map((album: any, index: number) => {

    // Build thumbnail URL for cover photo
    const thumbUrl = album.thumb
      ? `${serverUrl}${album.thumb}?X-Plex-Token=${token}`
      : '';

    // Use ratingKey if available, otherwise use key or generate a unique id
    const uniqueId = album.ratingKey || album.key || `folder-${index}-${album.title}`;

    // Create a cover photo object
    const coverPhoto: Photo | undefined = thumbUrl ? {
      id: `cover-${uniqueId}`,
      uri: thumbUrl,
      filename: 'cover',
      width: 0,
      height: 0,
      createdAt: new Date((album.addedAt || 0) * 1000),
      mediaType: 'photo',
    } : undefined;

    // Try different properties for item count
    // Plex uses different properties depending on the endpoint/type
    const itemCount = album.leafCount || album.childCount || album.size || 0;

    return {
      id: uniqueId,
      key: album.key, // Store the Plex key for fetching photos (path-based)
      ratingKey: album.ratingKey, // Store the rating key for metadata fetching
      title: album.title,
      coverPhoto,
      photoCount: itemCount,
      createdAt: new Date((album.addedAt || 0) * 1000),
      index: album.index, // Custom sort order from Plex
    };
  });
}

// Result type for folder contents
export interface FolderContents {
  folders: PlexAlbum[];
  photos: PlexPhotoItem[];
}

// Fetch contents of a specific folder (returns both subfolders and photos)
export async function getFolderContents(
  server: PlexServer,
  token: string,
  folderKeyOrRatingKey: string
): Promise<FolderContents> {
  try {
    console.log(`Plex: Fetching contents from: ${folderKeyOrRatingKey}`);

    let items = [];

    // Check if this is a numeric ratingKey or a path-based key
    const isRatingKey = /^\d+$/.test(folderKeyOrRatingKey);

    if (isRatingKey) {
      // Use /library/metadata/{ratingKey}/children to get full metadata
      console.log(`Plex: Fetching children of ratingKey ${folderKeyOrRatingKey} with full metadata...`);
      const metadataResponse = await fetchWithFallback(
        server,
        `/library/metadata/${folderKeyOrRatingKey}/children`,
        token,
        { timeout: 30000 } // 30 second timeout
      );
      const metadataData = await metadataResponse.json();
      items = metadataData.MediaContainer?.Metadata || [];
      console.log(`Plex: Got ${items.length} items with full metadata`);
    } else {
      // Use the path-based key directly
      console.log(`Plex: Using path-based key...`);
      const response = await fetchWithFallback(
        server,
        folderKeyOrRatingKey,
        token
      );
      const data = await response.json();
      items = data.MediaContainer?.Metadata || [];
    }



    const folders: PlexAlbum[] = [];
    const photos: PlexPhotoItem[] = [];

    // Distinguish folders from photos:
    // - Folders have "/children" in their key
    // - Photos don't have "/children" in their key
    for (const item of items) {
      if (item.key && item.key.includes('/children')) {
        // This is a subfolder
        folders.push(item);
      } else {
        // This is a photo or video
        photos.push(item);
      }
    }

    console.log(`Plex: Found ${folders.length} subfolders and ${photos.length} photos/videos`);

    return { folders, photos };
  } catch (error) {
    console.error('Error fetching folder contents:', error);
    throw error;
  }
}

// Get the item count for a single folder
export async function getFolderItemCount(
  server: PlexServer,
  token: string,
  folderKey: string
): Promise<number> {
  try {
    const response = await fetchWithFallback(
      server,
      folderKey,
      token,
      { silent: true, timeout: 15000 }  // Silent request with reasonable timeout
    );
    const data = await response.json();
    const items = data.MediaContainer?.Metadata || [];
    return items.length;
  } catch (error) {
    // Silently return 0 on error - this is a background request
    return 0;
  }
}

// Fetch photos from a specific album/folder (legacy - fetches only photos, recursively)
export async function getPhotosFromAlbum(
  server: PlexServer,
  token: string,
  albumKey: string
): Promise<PlexPhotoItem[]> {
  const contents = await getFolderContents(server, token, albumKey);
  return contents.photos;
}

// Convert Plex photo items to our Photo type
export function convertPlexPhotosToPhotos(
  items: PlexPhotoItem[],
  server: PlexServer,
  token: string
): Photo[] {
  const serverUrl = getWorkingServerUrl(server);

  return items.map((item) => {
    const media = item.Media?.[0];
    const part = media?.Part?.[0];

    // Build thumbnail URL
    const thumbUrl = item.thumb
      ? `${serverUrl}${item.thumb}?X-Plex-Token=${token}`
      : '';

    // Build full image URL
    const fullUrl = part?.key
      ? `${serverUrl}${part.key}?X-Plex-Token=${token}`
      : thumbUrl;

    // Determine media type - clips and videos are treated as video
    const isVideo = item.type === 'clip' || item.type === 'video';

    // Use originallyAvailableAt (actual photo date) if available, otherwise fall back to addedAt
    let createdAt: Date;
    if (item.originallyAvailableAt) {
      // originallyAvailableAt is a string like "2025-01-15"
      // Parse as local date to avoid timezone shifts
      const [year, month, day] = item.originallyAvailableAt.split('-').map(Number);
      createdAt = new Date(year, month - 1, day);
    } else {
      // addedAt is a Unix timestamp
      createdAt = new Date(item.addedAt * 1000);
    }

    return {
      id: item.ratingKey,
      uri: thumbUrl,
      fullUri: fullUrl, // Full resolution URL for downloading
      filename: part?.file?.split('/').pop() || item.title || 'photo',
      filePath: part?.file, // Full file path on the server
      width: media?.width || 0,
      height: media?.height || 0,
      createdAt,
      modifiedAt: new Date(item.updatedAt * 1000),
      mediaType: isVideo ? 'video' as const : 'photo' as const,
      duration: isVideo ? media?.duration : undefined,
      rating: item.userRating,
      title: item.title,
      // File metadata from Plex
      fileSize: part?.size,
      format: media?.container,
      aspectRatio: media?.aspectRatio,
    };
  });
}

// Fetch all photos from all photo libraries
export async function getAllPhotos(
  server: PlexServer,
  token: string
): Promise<Photo[]> {
  console.log('Plex: Fetching photo libraries...');
  const libraries = await getPhotoLibraries(server, token);
  console.log(`Plex: Found ${libraries.length} photo libraries:`, libraries.map(l => l.title));

  const allPhotos: Photo[] = [];

  for (const library of libraries) {
    console.log(`Plex: Fetching photos from library "${library.title}" (key: ${library.key})...`);
    const result = await getPhotosFromLibrary(server, token, library.key);
    console.log(`Plex: Found ${result.photos.length} photos in "${library.title}"`);
    const photos = convertPlexPhotosToPhotos(result.photos, server, token);
    allPhotos.push(...photos);
  }

  console.log(`Plex: Total photos found: ${allPhotos.length}`);

  // Sort by date, newest first
  allPhotos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return allPhotos;
}

// Rate a photo (0-10 scale, 10 = favorite, -1 to reset)
export async function ratePhoto(
  server: PlexServer,
  token: string,
  ratingKey: string,
  rating: number
): Promise<boolean> {
  try {
    console.log(`Plex: Rating photo ${ratingKey} with rating ${rating}`);
    console.log(`Plex: Using token: ${token ? `${token.substring(0, 10)}...` : 'NO TOKEN'}`);

    // The Plex API expects the ratingKey as the key parameter
    const response = await fetchWithFallback(
      server,
      `/:/rate`,
      token,
      {
        extraParams: {
          key: ratingKey,
          identifier: 'com.plexapp.plugins.library',
          rating: rating.toString(),
        },
        method: 'PUT',
      }
    );
    console.log(`Plex: Rating response status: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error('Error rating photo:', error);
    return false;
  }
}
