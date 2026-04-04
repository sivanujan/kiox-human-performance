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
  "video (1).mp4", "video (2).mp4", "video (3).mp4", "video (4).mp4",
  "video (17).mp4", "video (18).mp4", "video (19).mp4", "video (20).mp4", "video (21).mp4",
  "la01.mp4", "la02.mp4", "la03.mp4", "la04.mp4", "la05.mp4", "videonew.mp4"
];

const rawLandscape = [
  "video (5).mp4", "video (6).mp4", "video (7).mp4", "video (8).mp4",
  "video (9).mp4", "video (10).mp4", "video (11).mp4", "video (12).mp4",
  "video (13).mp4", "video (14).mp4", "video (15).mp4", "video (16).mp4",
  "videonew02.mp4", "videonew03.mp4", "videonew04.mp4", "videonew05.mp4"
];

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
