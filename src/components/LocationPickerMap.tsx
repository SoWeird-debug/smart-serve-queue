import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PinnedLocation {
  latitude: number;
  longitude: number;
}

const JONES_CENTER: [number, number] = [16.5613, 121.7023];

function MapClickHandler({ onChange }: { onChange: (location: PinnedLocation) => void }) {
  useMapEvents({
    click(event) {
      onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

function Recenter({ onChange }: { onChange: (location: PinnedLocation) => void }) {
  const map = useMap();

  function useCurrentLocation() {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      const next = { latitude: coords.latitude, longitude: coords.longitude };
      map.flyTo([next.latitude, next.longitude], 16);
      onChange(next);
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="absolute right-2 top-2 z-[500] h-8 rounded-lg bg-card shadow-card"
      onClick={useCurrentLocation}
    >
      <LocateFixed className="mr-1 h-3.5 w-3.5" />
      My location
    </Button>
  );
}

export function LocationPickerMap({
  value,
  onChange,
}: {
  value: PinnedLocation | null;
  onChange: (location: PinnedLocation) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      <MapContainer center={JONES_CENTER} zoom={14} scrollWheelZoom className="h-48 w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onChange={onChange} />
        <Recenter onChange={onChange} />
        {value && (
          <CircleMarker
            center={[value.latitude, value.longitude]}
            radius={9}
            pathOptions={{ color: "#fff", weight: 3, fillColor: "#0ea5e9", fillOpacity: 1 }}
          />
        )}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-2 left-2 z-[500] flex items-center gap-1.5 rounded-lg bg-card/95 px-2 py-1 text-[10px] shadow-soft">
        <MapPin className="h-3 w-3 text-primary" />
        Tap the map to pin your home location
      </div>
    </div>
  );
}
