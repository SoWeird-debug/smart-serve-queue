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
    address.neighbourhood ||
    address.quarter ||
    address.hamlet ||
    address.locality;
  const municipality =
    address.municipality ||
    address.city ||
    address.town ||
    address.city_district ||
    address.county ||
    address.district;
  // OSM frequently uses `state` for a Philippine *region* (for example,
  // Cagayan Valley), not the province. Do not treat it as a province because
  // that creates a false mismatch with records such as Isabela.
  const province = address.province || address.state_district;
  const postalCode = address.postcode?.trim();

  return {
    ...(barangay ? { barangay } : {}),
    ...(municipality ? { municipality } : {}),
    ...(province ? { province } : {}),
    ...(postalCode ? { postalCode } : {}),
  };
}
