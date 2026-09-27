import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { LocationPickerMap } from "./LocationPickerMap";

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  CircleMarker: () => null,
  useMap: () => ({ flyTo: vi.fn() }),
  useMapEvents: vi.fn(),
}));

afterEach(cleanup);

it("contains map layers below dialogs while retaining location controls", () => {
  render(<LocationPickerMap value={null} onChange={vi.fn()} />);
  expect(screen.getByTestId("map").parentElement).toHaveClass("relative", "isolate", "z-0");
  expect(screen.getByRole("button", { name: "Use current location" })).toBeEnabled();
});
