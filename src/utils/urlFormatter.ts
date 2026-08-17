export const formatShortUrl = (url: string): string => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    return hostname.length > 15 ? hostname.substring(0, 15) + '...' : hostname;
  } catch (error) {
    // If invalid URL, return a truncated version of the string
    return url.length > 15 ? url.substring(0, 15) + '...' : url;
  }
};
