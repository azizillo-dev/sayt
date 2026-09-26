const ID = /^[\w-]{11}$/;

/** Extracts the video id from any common YouTube URL form (watch, youtu.be, shorts, embed). */
export function youtubeId(input: string): string | null {
  const value = input.trim();
  if (ID.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return ID.test(url.pathname.slice(1)) ? url.pathname.slice(1) : null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const v = url.searchParams.get("v");
      if (v && ID.test(v)) return v;
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/);
      return match?.[1] ?? null;
    }
  } catch {
    // not a URL
  }
  return null;
}
