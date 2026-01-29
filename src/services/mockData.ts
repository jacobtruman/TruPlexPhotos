import { Photo, Album } from '../types';

// Generate mock photos using picsum.photos for demo
const generateMockPhotos = (count: number): Photo[] => {
  const photos: Photo[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000);
    
    const width = 400 + Math.floor(Math.random() * 200);
    const height = 400 + Math.floor(Math.random() * 200);
    const seed = 100 + i;

    photos.push({
      id: `photo-${i}`,
      uri: `https://picsum.photos/seed/${seed}/${width}/${height}`,
      filename: `IMG_${1000 + i}.jpg`,
      width,
      height,
      createdAt,
      mediaType: 'photo',
    });
  }

  return photos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

const generateMockAlbums = (photos: Photo[]): Album[] => {
  const albumNames = [
    'Vacation 2024',
    'Family',
    'Nature',
    'Food',
    'Pets',
    'Travel',
    'Events',
    'Screenshots',
  ];

  return albumNames.map((title, index) => {
    const albumPhotos = photos.filter((_, i) => i % albumNames.length === index);
    return {
      id: `album-${index}`,
      title,
      coverPhoto: albumPhotos[0],
      photoCount: albumPhotos.length,
      createdAt: new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000),
    };
  });
};

// Export mock data
export const mockPhotos = generateMockPhotos(50);
export const mockAlbums = generateMockAlbums(mockPhotos);

export const getPhotosForAlbum = (albumId: string): Photo[] => {
  const albumIndex = parseInt(albumId.replace('album-', ''));
  return mockPhotos.filter((_, i) => i % 8 === albumIndex);
};

