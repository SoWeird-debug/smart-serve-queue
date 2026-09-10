import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { LocateFixed, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface PinnedLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export type LocationMethod = "Current device location" | "Manually adjusted";

const JONES_CENTER: [number, number] = [16.5613, 121.7023];

function MapClickHandler({
  onChange,
  onManualPosition,
  allowManualPin,
}: {
  onChange: (location: PinnedLocation, method?: LocationMethod) => void;
  onManualPosition?: () => void;
  allowManualPin: boolean;
}) {
  useMapEvents({
    click(event) {
      if (!allowManualPin) return;
      onManualPosition?.();
      onChange(
        { latitude: event.latlng.lat, longitude: event.latlng.lng },
        "Manually adjusted",
      );
    },
  });

  return null;
}

function RecenterOnPin({ value }: { value: PinnedLocation | null }) {
  const map = useMap();
  const latitude = value?.latitude;
  const longitude = value?.longitude;

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      map.flyTo([latitude, longitude], 18);
    }
  }, [latitude, longitude, map]);

  return null;
}

interface LocationPickerMapProps {
  value: PinnedLocation | null;
  onChange: (location: PinnedLocation, method?: LocationMethod) => void;
  onLocationMethodChange?: (method: LocationMethod, accuracy?: number) => void;
  showCurrentLocation?: boolean;
  allowManualPin?: boolean;
}

export function LocationPickerMap({
  value,
  onChange,
  onLocationMethodChange,
  showCurrentLocation = true,
  allowManualPin = true,
}: LocationPickerMapProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus(
        "This browser does not support device location. Search the address or place the pin manually.",
      );
      return;
    }

    setIsLocating(true);
    setLocationStatus("Requesting the device location…");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const accuracy = Math.round(coords.accuracy);
        onLocationMethodChange?.("Current device location", accuracy);
        onChange({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy,
        }, "Current device location");
        setLocationStatus(
          `Device location captured (estimated accuracy ±${accuracy} m). Confirm the pin with the patient.`,
        );
        setIsLocating(false);
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was not granted. Search the address or place the pin manually."
            : "The current location could not be determined. Search the address or place the pin manually.";
        setLocationStatus(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={JONES_CENTER}
        zoom={14}
        scrollWheelZoom
        className="h-56 w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler
          onChange={onChange}
          allowManualPin={allowManualPin}
          onManualPosition={() => {
            onLocationMethodChange?.("Manually adjusted");
            setLocationStatus(
              "Pin moved manually. Verify the position with the patient before continuing.",
            );
          }}
        />
        <RecenterOnPin value={value} />
        {value ? (
          <CircleMarker
            center={[value.latitude, value.longitude]}
            radius={10}
            pathOptions={{
              color: "#0284c7",
              fillColor: "#0ea5e9",
              fillOpacity: 0.72,
              weight: 3,
            }}
          />
        ) : null}
      </MapContainer>

      {showCurrentLocation ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute right-3 top-3 z-[500] shadow-md"
          onClick={useCurrentLocation}
          disabled={isLocating}
        >
          <LocateFixed className="h-4 w-4" />
          {isLocating ? "Locating…" : "Use current location"}
        </Button>
      ) : null}

      <div className="pointer-events-none absolute bottom-2 left-2 z-[500] flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-lg bg-background/95 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        {showCurrentLocation
          ? allowManualPin
            ? "Search the address or use current location, then tap the map to fine-tune the pin."
            : "Use current location to verify your registered barangay."
          : "Search the entered address, then tap the map to fine-tune the pin."}
      </div>

      {locationStatus ? (
        <div className="pointer-events-none absolute left-2 top-2 z-[500] max-w-[calc(100%-1rem)] rounded-lg bg-slate-950/85 px-2.5 py-1.5 text-xs text-white shadow-sm">
          {locationStatus}
        </div>
      ) : null}
    </div>
  );
}
