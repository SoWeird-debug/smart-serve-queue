import { Circle, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { Crosshair, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DiseaseRecord } from "@/data/mockData";

const JONES_CENTER: [number, number] = [16.5613, 121.7023];

function riskColor(count: number) {
  if (count >= 15) return "#dc2626";
  if (count >= 10) return "#f97316";
  if (count >= 6) return "#eab308";
  return "#22c55e";
}

function FocusJonesControl() {
  const map = useMap();
  return (
    <Button
      size="sm"
      variant="secondary"
      className="absolute right-3 top-3 z-[500] rounded-xl bg-card text-foreground shadow-card hover:bg-muted"
      onClick={() => map.flyTo(JONES_CENTER, 13)}
    >
      <Crosshair className="mr-1.5 h-4 w-4" />
      Focus Jones
    </Button>
  );
}

export function DiseaseTrendMap({
  records,
  className = "",
}: {
  records: DiseaseRecord[];
  className?: string;
}) {
  const total = records.reduce((sum, record) => sum + record.count, 0);

  return (
    <section className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft ${className}`}>
      <div className="flex shrink-0 flex-col gap-3 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold">Geographic disease concentration</h3>
            <Badge className="border-0 bg-primary-soft text-primary">{total} cases</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Jones, Isabela and nearby municipalities · click a shaded area for details
          </p>
        </div>
      </div>

      <div className="relative min-h-[390px] flex-1">
        <MapContainer center={JONES_CENTER} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FocusJonesControl />
          {records.map((record) => {
            const color = riskColor(record.count);
            return (
              <Circle
                key={record.id}
                center={[record.latitude, record.longitude]}
                radius={650 + record.count * 45}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.42, weight: 2 }}
              >
                <Popup>
                  <div className="min-w-44">
                    <p className="font-bold">{record.barangay}</p>
                    <p className="text-xs text-slate-500">{record.municipality}, Isabela</p>
                    <div className="my-2 border-t border-slate-200" />
                    <p className="text-sm"><strong>{record.count}</strong> recorded cases</p>
                    <p className="text-xs">{record.diagnosis} · {record.category}</p>
                  </div>
                </Popup>
              </Circle>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-4 left-4 z-[500] rounded-xl bg-card/95 p-3 shadow-card backdrop-blur">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
            <MapPin className="h-3.5 w-3.5 text-primary" /> Case density
          </p>
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            {[["#22c55e", "Low"], ["#eab308", "Moderate"], ["#f97316", "High"], ["#dc2626", "Very high"]].map(([color, label]) => (
              <span key={label} className="flex items-center gap-1">
                <i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-border bg-muted/25 px-5 py-3 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-secondary" />
        Locations are aggregated by area. Individual patient identities are not shown.
      </div>
    </section>
  );
}
