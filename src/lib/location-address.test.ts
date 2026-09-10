import { describe, expect, it, vi } from "vitest";

import { reverseGeocodePhilippineAddress } from "./location-address";

describe("reverseGeocodePhilippineAddress", () => {
  it("uses a provincial state value when it differs from the region", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          address: {
            hamlet: "Zone 7",
            town: "San Agustin",
            state: "Isabela",
            region: "Cagayan Valley",
          },
        }),
      }),
    );

    await expect(
      reverseGeocodePhilippineAddress({ latitude: 16.49914, longitude: 121.74633 }),
    ).resolves.toEqual({
      barangay: "Zone 7",
      municipality: "San Agustin",
      province: "Isabela",
    });
  });

  it("does not mistake a regional state value for a province", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          address: { town: "San Agustin", state: "Cagayan Valley", region: "Cagayan Valley" },
        }),
      }),
    );

    await expect(
      reverseGeocodePhilippineAddress({ latitude: 16.49914, longitude: 121.74633 }),
    ).resolves.toEqual({ municipality: "San Agustin" });
  });
});
