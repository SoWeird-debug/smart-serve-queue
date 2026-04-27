import { Smartphone, Monitor, LayoutDashboard, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export type RoleView = "patient" | "staff" | "admin";

const roles: { id: RoleView; label: string; sub: string; icon: typeof Smartphone }[] = [
  { id: "patient", label: "Patient",         sub: "Mobile App",       icon: Smartphone        },
  { id: "staff",   label: "Staff / Queue",   sub: "Onsite + TV",      icon: Monitor           },
  { id: "admin",   label: "Admin",           sub: "Dashboard",        icon: LayoutDashboard   },
];

export function RoleSwitcher({ value, onChange }: { value: RoleView; onChange: (v: RoleView) => void }) {
  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Heart className="w-5 h-5 text-primary-foreground" fill="currentColor" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none">SmartServe</h1>
            <p className="text-xs text-muted-foreground">Super Health Center · Jones, Isabela</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 p-1 bg-muted rounded-2xl">
          {roles.map((r) => {
            const Icon = r.icon;
            const active = value === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onChange(r.id)}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition-smooth",
                  active
                    ? "bg-card text-primary shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <div className="text-left hidden sm:block leading-tight">
                  <div>{r.label}</div>
                  <div className="text-[10px] text-muted-foreground">{r.sub}</div>
                </div>
                <span className="sm:hidden">{r.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
