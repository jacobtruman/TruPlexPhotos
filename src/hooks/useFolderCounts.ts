import { useState, useEffect } from 'react';
import { Album, PlexServer } from '../types';
import { getFolderItemCount } from '../services/plexService';

/**
 * Custom hook to fetch and manage folder item counts
 * @param folders - Array of folders to fetch counts for
 * @param server - The Plex server
 * @param token - Server access token
 * @returns Object containing folder counts keyed by folder ID
 */
export const useFolderCounts = (
  folders: Album[],
  server: PlexServer | null,
  token: string | null
): Record<string, number> => {
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!server || !token || folders.length === 0) {
      setFolderCounts({});
      return;
    }

    // Clear previous counts
    setFolderCounts({});

    // Fetch counts in parallel, updating state as each completes
    folders.forEach(async (folder) => {
      if (folder.key) {
        try {
          const count = await getFolderItemCount(server, token, folder.key);
          if (count > 0) {
            setFolderCounts(prev => ({ ...prev, [folder.id]: count }));
          }
        } catch (error) {
          console.error(`Failed to fetch count for folder ${folder.id}:`, error);
        }
      }
    });
  }, [folders, server, token]);

  return folderCounts;
};

