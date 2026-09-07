import type { PinnedLocation } from "@/components/LocationPickerMap";

export type DetectedPhilippineAddress = {
  barangay?: string;
  municipality?: string;
  province?: string;
  postalCode?: string;
};

type NominatimReverseResult = {
  address?: Record<string, string | undefined>;
};

export async function reverseGeocodePhilippineAddress(
  location: PinnedLocation,
  signal?: AbortSignal,
): Promise<DetectedPhilippineAddress> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=${encodeURIComponent(location.latitude)}&lon=${encodeURIComponent(location.longitude)}`,
    { signal },
  );
  if (!response.ok) throw new Error("Location details are unavailable");

  const { address = {} } = (await response.json()) as NominatimReverseResult;
  const barangay =
    address.barangay ||
    address.village ||
    address.suburb ||
    address.neighbourhood;
  const municipality =
    address.municipality ||
    address.city ||
    address.town ||
    address.city_district;
  const province = address.province || address.state;
  const postalCode = address.postcode?.trim();

  return {
    ...(barangay ? { barangay } : {}),
    ...(municipality ? { municipality } : {}),
    ...(province ? { province } : {}),
    ...(postalCode ? { postalCode } : {}),
  };
}
