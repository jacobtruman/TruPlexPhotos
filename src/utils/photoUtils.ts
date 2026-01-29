import { Photo, PhotoGroup } from '../types';

export const formatDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const photoDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (photoDate.getTime() === today.getTime()) {
    return 'Today';
  }
  if (photoDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: photoDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  };

  return date.toLocaleDateString('en-US', options);
};

export const groupPhotosByDate = (photos: Photo[]): PhotoGroup[] => {
  const groups: Map<string, PhotoGroup> = new Map();

  photos.forEach((photo) => {
    const date = new Date(photo.createdAt);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        title: formatDate(date),
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        photos: [],
      });
    }

    groups.get(dateKey)!.photos.push(photo);
  });

  // Sort groups by date (newest first)
  const sortedGroups = Array.from(groups.values()).sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  // Sort photos within each group by time (newest first)
  sortedGroups.forEach((group) => {
    group.photos.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  return sortedGroups;
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

