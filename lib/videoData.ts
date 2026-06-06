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

const rawPortrait = [
  "video01.mp4",
  "video02.mp4",
  "video03.mp4",
  "goalkeeper.mp4",
  "legspeed.mp4",
  "Functional.mp4"
];

const rawLandscape = [
  "video04.mp4",
  "video05.mp4",
  "Games01.mp4",
  "Games02.mp4",
  "Games03.mp4",
  "Technique.mp4",
  "Functional02.mp4",
  "vidcen.mp4",
  "videohero.mp4"
];

const getSlug = (name: string) => name.replace('.mp4', '').replace(/[\(\)]/g, '').replace(/\s+/g, '-').toLowerCase();

export const allVideos: VideoMetadata[] = [
  ...rawPortrait.map((name, i) => ({
    id: `p-${getSlug(name)}-${i}`,
    src: `/videos/${name}`,
    type: 'portrait' as const,
    category: name.includes('Games') ? 'GAMES' : name.includes('Functional') || name.includes('goalkeeper') || name.includes('legspeed') ? 'LA' : 'TRAINING',
    duration: "0:45",
    title: name.replace('.mp4', '').replace(/[\(\)]/g, '').toUpperCase(),
    description: "High-performance training session focused on agility and core stability. KIO-X Human Performance protocol."
  })),
  ...rawLandscape.map((name, i) => ({
    id: `l-${getSlug(name)}-${i}`,
    src: `/videos/${name}`,
    type: 'landscape' as const,
    category: name.includes('Games') ? 'GAMES' : name.includes('Technique') || name.includes('Functional02') ? 'LA' : 'TRAINING',
    duration: "1:12",
    title: name.replace('.mp4', '').replace(/[\(\)]/g, '').toUpperCase(),
    description: "Advanced game simulation and field-work. Real-time performance tracking and biomechanical analysis."
  }))
];

export const getVideoById = (id: string) => allVideos.find(v => v.id === id);
