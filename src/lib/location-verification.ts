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
  const comparableFields = areaFields.filter(
    (field) => Boolean(residence[field] && detected[field]),
  );
  const hasConflict = comparableFields.some(
    (field) =>
      normalizeAreaName(residence[field]) !==
      normalizeAreaName(detected[field]),
  );
  const hasCompleteDetectedArea = areaFields.every((field) =>
    Boolean(detected[field]),
  );

  if (hasConflict) {
    return {
      status: "mismatched",
      detected: {
        barangay: detected.barangay || "Not returned",
        municipality: detected.municipality || "Not returned",
        province: detected.province || "Not returned",
      },
    };
  }
  if (hasCompleteDetectedArea) {
    return {
      status: "matched",
      detected: {
        barangay: detected.barangay!,
        municipality: detected.municipality!,
        province: detected.province!,
      },
    };
  }
  if (comparableFields.length > 0)
    return { status: "partial-match", detected };
  return { status: "incomplete", detected };
}
