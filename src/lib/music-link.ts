/**
 * Generate a direct music streaming link for a song.
 * Apple devices → Apple Music search. Everything else → Spotify search.
 * Both open in the native app when installed.
 */

export function getMusicLink(songAndArtist: string): string {
  const query = songAndArtist.replace(" — ", " ");

  if (typeof navigator !== "undefined" && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) {
    // Apple Music — opens in Music app on iOS/Mac
    return `https://music.apple.com/us/search?term=${encodeURIComponent(query)}`;
  }

  // Spotify — opens in Spotify app on Android/Windows/Linux
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}
