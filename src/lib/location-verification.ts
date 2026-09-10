import type { DetectedPhilippineAddress } from "@/lib/location-address";

type ResidenceArea = {
  barangay?: string;
  municipality?: string;
  province?: string;
};

export type BarangayLocationMatch =
  | { status: "required" }
  | { status: "checking" }
  | { status: "incomplete"; detected: DetectedPhilippineAddress }
  | {
      /** The map returned only part of an otherwise matching Philippine address. */
      status: "partial-match";
      detected: DetectedPhilippineAddress;
    }
  | {
      status: "matched";
      detected: Required<
        Pick<DetectedPhilippineAddress, "barangay" | "municipality" | "province">
      >;
    }
  | {
      status: "mismatched";
      detected: Required<
        Pick<DetectedPhilippineAddress, "barangay" | "municipality" | "province">
      >;
    };

const normalizeAreaName = (value?: string) => {
  const normalized = value
    ?.trim()
    .toLocaleLowerCase("en-PH")
    .replace(/^barangay\s+/, "")
    .replace(/^(?:brgy\.?|bgy\.?)\s*/, "")
    .replace(/^(?:city|municipality|province)\s+of\s+/, "")
    .replace(/^(?:city|municipality|province)\s+/, "")
    .replace(/\s+city$/, "")
    .replace(/[^a-z0-9]/g, "");
  return normalized || "";
};

export function compareBarangayLocation(
  residence: ResidenceArea,
  detected: DetectedPhilippineAddress | null,
): BarangayLocationMatch {
  if (!detected) return { status: "checking" };
  const areaFields = ["barangay", "municipality", "province"] as const;
  const matches = (field: keyof ResidenceArea) =>
    Boolean(
      residence[field] &&
        detected[field] &&
        normalizeAreaName(residence[field]) ===
          normalizeAreaName(detected[field]),
    );
  const conflicts = (field: keyof ResidenceArea) =>
    Boolean(
      residence[field] &&
        detected[field] &&
        normalizeAreaName(residence[field]) !==
          normalizeAreaName(detected[field]),
    );

  // Philippine reverse-geocoding data often returns a purok or zone in the
  // barangay field (for example, "Zone 7") instead of the official barangay.
  // A conflicting locality label alone is therefore not reliable enough to
  // reject someone when their municipality or province agrees.
  const hasParentConflict =
    conflicts("municipality") || conflicts("province");
  const hasParentMatch = matches("municipality") || matches("province");
  const barangayMatches = matches("barangay");
  const barangayConflicts = conflicts("barangay");
  const hasCompleteDetectedArea = areaFields.every((field) =>
    Boolean(detected[field]),
  );

  if (hasParentConflict) {
    return {
      status: "mismatched",
      detected: {
        barangay: detected.barangay || "Not returned",
        municipality: detected.municipality || "Not returned",
        province: detected.province || "Not returned",
      },
    };
  }
  if (hasCompleteDetectedArea && barangayMatches) {
    return {
      status: "matched",
      detected: {
        barangay: detected.barangay!,
        municipality: detected.municipality!,
        province: detected.province!,
      },
    };
  }

  // Do not infer that an unrecognised locality is in the registered barangay
  // unless a higher-level administrative area confirms the location.
  if (barangayConflicts && !hasParentMatch)
    return { status: "incomplete", detected };
  if (barangayMatches || hasParentMatch)
    return { status: "partial-match", detected };
  return { status: "incomplete", detected };
}
