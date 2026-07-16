// Zip → coordinates via Zippopotam.us (free, no API key, US postal codes).
// https://api.zippopotam.us

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  placeName: string; // e.g. "Oakland, CA"
};

export async function geocodeZip(zip: string): Promise<GeocodeResult | null> {
  const trimmed = zip.trim();
  if (!/^\d{5}$/.test(trimmed)) return null;

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${trimmed}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) return null;

    return {
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      placeName: `${place['place name']}, ${place['state abbreviation']}`,
    };
  } catch (err) {
    console.error('Failed to geocode zip:', err);
    return null;
  }
}
