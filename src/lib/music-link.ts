/**
 * Music streaming link utility.
 *
 * First tap: shows a picker (Spotify, Apple Music, YouTube Music, Amazon Music, Tidal).
 * User picks once → saved to localStorage. Every future tap opens their chosen app directly.
 */

export type MusicPlatform = "spotify" | "apple" | "youtube" | "amazon" | "tidal";

export interface MusicPlatformOption {
  id: MusicPlatform;
  name: string;
  icon: string; // simple text icon
  getUrl: (query: string) => string;
}

export const MUSIC_PLATFORMS: MusicPlatformOption[] = [
  {
    id: "spotify",
    name: "Spotify",
    icon: "●",
    getUrl: (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}`,
  },
  {
    id: "apple",
    name: "Apple Music",
    icon: "♪",
    getUrl: (q) => `https://music.apple.com/us/search?term=${encodeURIComponent(q)}`,
  },
  {
    id: "youtube",
    name: "YouTube Music",
    icon: "▶",
    getUrl: (q) => `https://music.youtube.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "amazon",
    name: "Amazon Music",
    icon: "◆",
    getUrl: (q) => `https://music.amazon.com/search/${encodeURIComponent(q)}`,
  },
  {
    id: "tidal",
    name: "Tidal",
    icon: "◈",
    getUrl: (q) => `https://listen.tidal.com/search?q=${encodeURIComponent(q)}`,
  },
];

const STORAGE_KEY = "ourfable-music-platform";

export function getSavedPlatform(): MusicPlatform | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && MUSIC_PLATFORMS.some(p => p.id === saved)) return saved as MusicPlatform;
  return null;
}

export function savePlatform(platform: MusicPlatform): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, platform);
}

export function getMusicLink(songAndArtist: string, platform?: MusicPlatform): string {
  const query = songAndArtist.replace(" — ", " ").replace(" - ", " ");
  const p = platform || getSavedPlatform() || "spotify";
  const opt = MUSIC_PLATFORMS.find(m => m.id === p) || MUSIC_PLATFORMS[0];
  return opt.getUrl(query);
}

export function clearSavedPlatform(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
