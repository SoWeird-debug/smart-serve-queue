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

const normalizeAreaName = (value?: string) =>
  value?.trim().toLocaleLowerCase("en-PH").replace(/[^a-z0-9]/g, "") || "";

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
  // OSM can put either a province (for example, Isabela) or a region (for
  // example, Cagayan Valley) in `state`. Use it only when it differs from the
  // reported region so province-level mismatches remain detectable.
  const province =
    address.province ||
    address.state_district ||
    (address.state &&
    normalizeAreaName(address.state) !== normalizeAreaName(address.region)
      ? address.state
      : undefined);
  const postalCode = address.postcode?.trim();

  return {
    ...(barangay ? { barangay } : {}),
    ...(municipality ? { municipality } : {}),
    ...(province ? { province } : {}),
    ...(postalCode ? { postalCode } : {}),
  };
}
