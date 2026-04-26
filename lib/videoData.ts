// Centralized video data for KIO-X

export interface VideoMetadata {
  id: string;
  src: string;
  type: 'portrait' | 'landscape';
  category: string;
  duration: string;
  title: string;
  description: string;
}

const rawPortrait: string[] = [];
const rawLandscape: string[] = [];

const getSlug = (name: string) => name.replace('.mp4', '').replace(/[\(\)]/g, '').replace(/\s+/g, '-').toLowerCase();

export const allVideos: VideoMetadata[] = [
  ...rawPortrait.map((name, i) => ({
    id: `p-${getSlug(name)}-${i}`,
    src: `/v2/${name}`,
    type: 'portrait' as const,
    category: name.includes('la') ? 'GAMES' : 'TRAINING',
    duration: "0:45",
    title: name.replace('.mp4', '').replace(/[\(\)]/g, '').toUpperCase(),
    description: "High-performance training session focused on agility and core stability. KIO-X Human Performance protocol."
  })),
  ...rawLandscape.map((name, i) => ({
    id: `l-${getSlug(name)}-${i}`,
    src: `/v2/${name}`,
    type: 'landscape' as const,
    category: name.includes('la') ? 'GAMES' : 'TRAINING',
    duration: "1:12",
    title: name.replace('.mp4', '').replace(/[\(\)]/g, '').toUpperCase(),
    description: "Advanced game simulation and field-work. Real-time performance tracking and biomechanical analysis."
  }))
];

export const getVideoById = (id: string) => allVideos.find(v => v.id === id);
