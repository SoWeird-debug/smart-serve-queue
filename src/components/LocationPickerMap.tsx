import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { MapPin } from "lucide-react";

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

function RecenterOnPin({ value }: { value: PinnedLocation | null }) {
  const map = useMap();
  useEffect(() => { if (value) map.flyTo([value.latitude, value.longitude], 16); }, [map, value?.latitude, value?.longitude]);
  return null;
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
        <RecenterOnPin value={value} />
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
        Address pin is automatic. Tap the map only to correct it with the patient.
      </div>
    </div>
  );
}
