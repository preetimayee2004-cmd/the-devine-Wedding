/**
 * Map links for a place. An explicit maps URL wins; otherwise the link is
 * built from the very name and address the page shows, so the written
 * address and the map can never disagree.
 */
interface Place {
  name: string;
  address: string;
  mapsUrl: string | null;
}

const query = (p: Place) => [p.name, p.address].filter(Boolean).join(", ");

export function directionsUrl(p: Place): string {
  if (p.mapsUrl) return p.mapsUrl;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query(p))}`;
}

/** Embeddable map preview (no API key needed). */
export function mapEmbedUrl(p: Place): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query(p))}&z=15&output=embed`;
}

/** wa.me link with a message ready to send. */
export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
