import { describe, expect, it } from "vitest";

import { compareBarangayLocation } from "./location-verification";

const masayaSur = {
  barangay: "Masaya Sur",
  municipality: "San Agustin",
  province: "Isabela",
};

describe("compareBarangayLocation", () => {
  it("accepts a zone label when the municipality matches", () => {
    expect(
      compareBarangayLocation(masayaSur, {
        barangay: "Zone 7",
        municipality: "San Agustin",
      }),
    ).toMatchObject({ status: "partial-match" });
  });

  it("rejects a location in another municipality", () => {
    expect(
      compareBarangayLocation(masayaSur, {
        barangay: "Zone 7",
        municipality: "Jones",
        province: "Isabela",
      }),
    ).toMatchObject({ status: "mismatched" });
  });

  it("does not accept an unmatched locality without a matching parent area", () => {
    expect(
      compareBarangayLocation(masayaSur, { barangay: "Dappig" }),
    ).toMatchObject({ status: "incomplete" });
  });
});
