const VALID_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_B64_LEN = 5 * 1024 * 1024 * 1.4; // ~5 MB decoded
const MAGIC = ["/9j/", "iVBOR", "UklGR", "R0lGO"]; // JPEG, PNG, WebP, GIF

export function validateImages(
  images: Array<{ base64: string; mediaType: string }>
): string | null {
  if (!images.length) return "Aucune image fournie.";
  if (images.length > 12) return "Maximum 12 images à la fois.";

  for (let i = 0; i < images.length; i++) {
    const { base64, mediaType } = images[i];
    if (!VALID_TYPES.includes(mediaType))
      return `Image ${i + 1} : type non supporté (${mediaType}).`;
    if (base64.length > MAX_B64_LEN)
      return `Image ${i + 1} : trop volumineuse (max 5 Mo par image).`;
    if (!MAGIC.some((m) => base64.startsWith(m)))
      return `Image ${i + 1} : format non reconnu.`;
  }
  return null;
}
