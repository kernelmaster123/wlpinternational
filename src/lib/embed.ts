export type Embed = { kind: "spotify" | "youtube" | "soundcloud" | "apple"; src: string; height: number };

/**
 * Turns a share link (Spotify, YouTube, SoundCloud, Apple Music) into an
 * embeddable player URL. Returns null for plain audio files.
 */
export function getEmbed(url: string | null | undefined): Embed | null {
  if (!url) return null;
  const u = url.trim();

  const spotify = u.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/);
  if (spotify) {
    const type = spotify[1];
    return {
      kind: "spotify",
      src: `https://open.spotify.com/embed/${type}/${spotify[2]}?utm_source=generator&theme=0`,
      height: type === "track" || type === "episode" ? 152 : 352,
    };
  }

  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt) {
    return { kind: "youtube", src: `https://www.youtube.com/embed/${yt[1]}`, height: 220 };
  }

  if (/soundcloud\.com\//.test(u)) {
    return {
      kind: "soundcloud",
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(u)}&color=%23dc2626&auto_play=false`,
      height: 166,
    };
  }

  const apple = u.match(/music\.apple\.com\/(.+)$/);
  if (apple) {
    return { kind: "apple", src: `https://embed.music.apple.com/${apple[1]}`, height: 175 };
  }

  return null;
}

export function isDirectAudio(url: string | null | undefined) {
  if (!url) return false;
  return !getEmbed(url);
}
