import { useState } from "react";
import {
  LayoutDashboard, Calendar, Users, Stethoscope, TrendingUp,
  Boxes, FileBarChart, UserCog, ArrowUp, ArrowDown,
  AlertTriangle, CheckCircle2, Clock, Activity, Search, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DiseaseTrendMap } from "@/components/DiseaseTrendMap";
import {
  appointments, patients, services, diseaseRecords, resources,
  weeklyTrends, monthlyAppointments, serviceDemand, helpers,
} from "@/data/mockData";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";

type Page =
  | "overview" | "appointments" | "patients" | "services"
  | "trends"   | "forecast"    | "reports"  | "users";

const nav: { id: Page; label: string; icon: any }[] = [
  { id: "overview",     label: "Overview",        icon: LayoutDashboard },
  { id: "appointments", label: "Appointments",    icon: Calendar       },
  { id: "patients",     label: "Patient Records", icon: Users          },
  { id: "services",     label: "Services",        icon: Stethoscope    },
  { id: "trends",       label: "Disease Trends",  icon: TrendingUp     },
  { id: "forecast",     label: "Forecasting",     icon: Boxes          },
  { id: "reports",      label: "Reports",         icon: FileBarChart   },
  { id: "users",        label: "Staff & Users",   icon: UserCog        },
];

export function AdminApp() {
  const [page, setPage] = useState<Page>("overview");
  return (
    <div className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
      <div className="grid md:grid-cols-[240px,1fr] min-h-[800px]">
        {/* Sidebar */}
        <aside className="bg-muted/30 border-r border-border p-4 md:p-5">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display font-bold text-sm leading-tight">Admin Console</p>
              <p className="text-[10px] text-muted-foreground">SmartServe v1.0</p>
            </div>
          </div>
          <nav className="space-y-1">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = page === n.id;
              return (
                <button key={n.id} onClick={() => setPage(n.id)}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-left transition-smooth",
                    active ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:bg-card/60 hover:text-foreground")}>
                  <Icon className="w-4 h-4" /> {n.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 p-3 bg-gradient-primary rounded-2xl text-primary-foreground">
            <p className="text-xs opacity-80">Logged in as</p>
            <p className="font-semibold text-sm">Dr. Carmela Reyes</p>
            <p className="text-[10px] opacity-70">Administrator</p>
          </div>
        </aside>

        {/* Main */}
        <main className="p-5 md:p-7 bg-background overflow-x-auto">
          {page === "overview"     && <Overview />}
          {page === "appointments" && <Appointments />}
          {page === "patients"     && <PatientsPage />}
          {page === "services"     && <ServicesPage />}
          {page === "trends"       && <TrendsPage />}
          {page === "forecast"     && <ForecastPage />}
          {page === "reports"      && <ReportsPage />}
          {page === "users"        && <UsersPage />}
        </main>
      </div>
    </div>
  );
}

/* ---------- shared ---------- */

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-3">
      <div>
        <h2 className="font-display font-bold text-2xl">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function KpiCard({ label, value, delta, icon: Icon, tone = "primary" }: any) {
  const up = delta >= 0;
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft hover:shadow-card transition-smooth">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
          tone === "primary"   && "bg-primary-soft text-primary",
          tone === "secondary" && "bg-secondary-soft text-secondary",
          tone === "accent"    && "bg-accent-soft text-accent",
          tone === "warning"   && "bg-warning/15 text-warning",
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={cn("text-xs font-semibold flex items-center gap-0.5",
          up ? "text-secondary" : "text-destructive")}>
          {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(delta)}%
        </span>
      </div>
      <p className="font-display font-extrabold text-3xl tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

const chartColors = {
  primary:   "hsl(199 89% 48%)",
  secondary: "hsl(160 70% 42%)",
  accent:    "hsl(188 95% 43%)",
  warning:   "hsl(38 95% 55%)",
  destruct:  "hsl(0 78% 58%)",
  muted:     "hsl(210 14% 65%)",
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  fontSize: "12px",
};

/* ---------- Overview ---------- */

function Overview() {
  return (
    <>
      <PageHeader title="Overview" subtitle="Live operations across the health center" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Today's appointments" value={appointments.length} delta={12} icon={Calendar}    tone="primary" />
        <KpiCard label="Patients served"      value={appointments.filter(a=>a.queueStatus==="Completed").length} delta={8} icon={CheckCircle2} tone="secondary" />
        <KpiCard label="Avg. wait time"       value="18m" delta={-15} icon={Clock}      tone="accent" />
        <KpiCard label="No-shows"             value={appointments.filter(a=>a.queueStatus==="No Show").length} delta={-22} icon={AlertTriangle} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold">Monthly appointments</h3>
              <p className="text-xs text-muted-foreground">Booked vs served · last 4 weeks</p>
            </div>
            <Badge className="bg-secondary-soft text-secondary border-0">+11.4%</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyAppointments}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.4} /><stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} /></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColors.secondary} stopOpacity={0.4} /><stop offset="100%" stopColor={chartColors.secondary} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="booked" stroke={chartColors.primary}   fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="served" stroke={chartColors.secondary} fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <h3 className="font-display font-bold mb-1">Service demand</h3>
          <p className="text-xs text-muted-foreground mb-4">Today's distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={serviceDemand} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                {serviceDemand.map((_, i) => (
                  <Cell key={i} fill={[chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.warning, chartColors.destruct, chartColors.muted][i % 6]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 text-xs mt-2">
            {serviceDemand.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: [chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.warning, chartColors.destruct, chartColors.muted][i % 6] }} />
                <span className="text-muted-foreground truncate">{s.name}</span>
                <span className="ml-auto font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <h3 className="font-display font-bold mb-4">Today's queue snapshot</h3>
          <div className="space-y-2">
            {appointments.slice(0, 5).map(a => {
              const p = helpers.getPatient(a.patientId);
              const s = helpers.getService(a.serviceId);
              return (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                  <span className="font-display font-bold text-primary w-14">{a.queueNumber}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.fullName}</p>
                    <p className="text-xs text-muted-foreground">{s.name} · {a.timeSlot}</p>
                  </div>
                  <Badge className={cn("border-0",
                    a.queueStatus === "Now Serving" && "bg-secondary text-secondary-foreground",
                    a.queueStatus === "Waiting"     && "bg-warning/20 text-warning",
                    a.queueStatus === "Completed"   && "bg-muted text-muted-foreground",
                    a.queueStatus === "Scheduled"   && "bg-primary-soft text-primary",
                    a.queueStatus === "No Show"     && "bg-destructive/15 text-destructive",
                  )}>{a.queueStatus}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <h3 className="font-display font-bold mb-4">System activity</h3>
          <div className="space-y-3 text-sm">
            {[
              { t: "2m ago", a: "Staff Reyes",  m: "marked A-003 as Now Serving",     icon: Activity, color: "secondary" },
              { t: "8m ago", a: "Patient",      m: "M. Cruz booked General Consultation", icon: Calendar, color: "primary" },
              { t: "21m ago",a: "Admin",        m: "updated immunization capacity to 40", icon: UserCog,  color: "accent" },
              { t: "1h ago", a: "System",       m: "auto-sent 24 appointment reminders",  icon: CheckCircle2, color: "secondary" },
              { t: "3h ago", a: "Forecast Bot", m: "predicted spike in URI cases this week", icon: TrendingUp, color: "warning" },
            ].map((row, i) => {
              const Icon = row.icon;
              return (
                <div key={i} className="flex gap-3">
                  <div className={cn("w-8 h-8 rounded-lg shrink-0 flex items-center justify-center",
                    row.color === "primary"   && "bg-primary-soft text-primary",
                    row.color === "secondary" && "bg-secondary-soft text-secondary",
                    row.color === "accent"    && "bg-accent-soft text-accent",
                    row.color === "warning"   && "bg-warning/15 text-warning",
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm"><span className="font-semibold">{row.a}</span> {row.m}</p>
                    <p className="text-xs text-muted-foreground">{row.t}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Appointments ---------- */

function Appointments() {
  return (
    <>
      <PageHeader title="Appointment Management" subtitle="Today's bookings across all services"
        action={<div className="flex gap-2">
          <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search patient or queue #" className="pl-9 w-64 rounded-xl" /></div>
          <Button className="rounded-xl bg-gradient-primary border-0"><Plus className="w-4 h-4 mr-1" /> New</Button>
        </div>} />
      <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              {["Queue","Patient","Service","Time","Room","Attendance","Status"].map(h => <th key={h} className="text-left p-4 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {appointments.map(a => {
              const p = helpers.getPatient(a.patientId);
              const s = helpers.getService(a.serviceId);
              return (
                <tr key={a.id} className="hover:bg-muted/20">
                  <td className="p-4 font-display font-bold text-primary">{a.queueNumber}</td>
                  <td className="p-4">
                    <p className="font-medium">{p.fullName}</p>
                    <p className="text-xs text-muted-foreground">{p.barangay}</p>
                  </td>
                  <td className="p-4 text-muted-foreground">{s.name}</td>
                  <td className="p-4">{a.timeSlot}</td>
                  <td className="p-4 text-muted-foreground">{a.room}</td>
                  <td className="p-4"><Badge className={cn("border-0",
                    a.attendanceStatus === "Present" && "bg-secondary-soft text-secondary",
                    a.attendanceStatus === "Pending" && "bg-warning/15 text-warning",
                    a.attendanceStatus === "Absent"  && "bg-destructive/15 text-destructive",
                  )}>{a.attendanceStatus}</Badge></td>
                  <td className="p-4"><Badge className={cn("border-0",
                    a.queueStatus === "Now Serving" && "bg-secondary text-secondary-foreground",
                    a.queueStatus === "Waiting"     && "bg-warning/20 text-warning",
                    a.queueStatus === "Completed"   && "bg-muted text-muted-foreground",
                    a.queueStatus === "Scheduled"   && "bg-primary-soft text-primary",
                    a.queueStatus === "No Show"     && "bg-destructive/15 text-destructive",
                  )}>{a.queueStatus}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- Patients ---------- */

function PatientsPage() {
  return (
    <>
      <PageHeader title="Patient Records" subtitle={`${patients.length} registered patients`}
        action={<Button className="rounded-xl bg-gradient-primary border-0"><Plus className="w-4 h-4 mr-1" /> Add patient</Button>} />
      <div className="grid md:grid-cols-2 gap-3">
        {patients.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-2xl p-4 shadow-soft flex gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-display font-bold">
              {p.fullName.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{p.fullName}</p>
              <p className="text-xs text-muted-foreground">{p.gender} · DOB {p.dob}</p>
              <p className="text-xs text-muted-foreground truncate">{p.contact} · Brgy. {p.barangay}</p>
            </div>
            <Badge variant="secondary" className="bg-primary-soft text-primary border-0 self-start">Active</Badge>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Services ---------- */

function ServicesPage() {
  return (
    <>
      <PageHeader title="Services & Schedules" subtitle="Manage available services and daily capacity"
        action={<Button className="rounded-xl bg-gradient-primary border-0"><Plus className="w-4 h-4 mr-1" /> New service</Button>} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(s => {
          const used = appointments.filter(a => a.serviceId === s.id).length;
          const pct = Math.round((used / s.capacity) * 100);
          return (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-display font-bold">{s.name}</h4>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
                <Badge className="bg-primary-soft text-primary border-0">{s.duration}m</Badge>
              </div>
              <div className="flex items-end justify-between text-xs mb-1">
                <span className="text-muted-foreground">Capacity used</span>
                <span className="font-semibold">{used}/{s.capacity}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl">Schedule</Button>
                <Button variant="ghost" size="sm" className="rounded-xl">Edit</Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- Disease Trends ---------- */

function TrendsPage() {
  const totals = diseaseRecords.reduce((acc: Record<string, number>, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.count; return acc;
  }, {});
  const data = Object.entries(totals).map(([name, value]) => ({ name, value }));
  const caseTotal = diseaseRecords.reduce((sum, record) => sum + record.count, 0);
  const affectedAreas = new Set(diseaseRecords.map((record) => `${record.barangay}-${record.municipality}`)).size;

  return (
    <>
      <PageHeader title="Disease Trend Monitoring" subtitle="Surveillance data from recent consultations" />
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <KpiCard label="Cases this week"   value={caseTotal}  delta={9}  icon={TrendingUp} tone="primary" />
        <KpiCard label="Top category"      value="Resp." delta={14} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Affected locations"value={affectedAreas}   delta={2}  icon={Users}     tone="accent" />
      </div>

      <DiseaseTrendMap records={diseaseRecords} />

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <h3 className="font-display font-bold mb-1">Weekly cases by category</h3>
          <p className="text-xs text-muted-foreground mb-4">Based on consultations</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="respiratory" stroke={chartColors.primary}   strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="gi"          stroke={chartColors.secondary} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="htn"         stroke={chartColors.warning}   strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="diabetes"    stroke={chartColors.destruct}  strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <h3 className="font-display font-bold mb-1">Cases by category</h3>
          <p className="text-xs text-muted-foreground mb-4">Today's totals</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill={chartColors.primary} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-display font-bold mb-3">Recent case log</h3>
        <div className="space-y-2">
          {diseaseRecords.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 text-sm">
              <Badge className="bg-primary-soft text-primary border-0">{r.category}</Badge>
              <span className="font-medium flex-1">{r.diagnosis}</span>
              <span className="text-xs text-muted-foreground">Brgy. {r.barangay}, {r.municipality}</span>
              <span className="font-display font-bold text-primary">{r.count}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------- Forecast ---------- */

function ForecastPage() {
  const forecastData = [
    { week: "W1", actual: 142, predicted: 150 },
    { week: "W2", actual: 168, predicted: 165 },
    { week: "W3", actual: 155, predicted: 172 },
    { week: "W4", actual: 189, predicted: 188 },
    { week: "W5", actual: null, predicted: 205 },
    { week: "W6", actual: null, predicted: 218 },
  ];

  return (
    <>
      <PageHeader title="Resource Forecasting" subtitle="Predicted demand for staff, equipment, and supplies" />

      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft mb-4">
        <h3 className="font-display font-bold mb-1">Predicted patient demand</h3>
        <p className="text-xs text-muted-foreground mb-4">6-week forecast based on historical trends</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="fc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColors.accent} stopOpacity={0.4} /><stop offset="100%" stopColor={chartColors.accent} stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="actual"    stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.15} strokeWidth={2.5} />
            <Area type="monotone" dataKey="predicted" stroke={chartColors.accent}  fill="url(#fc)" strokeWidth={2.5} strokeDasharray="6 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {(["Staff","Equipment","Supplies"] as const).map(type => (
          <div key={type} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <h4 className="font-display font-bold mb-3">{type}</h4>
            <div className="space-y-3">
              {resources.filter(r => r.type === type).map(r => {
                const pct = Math.min(100, Math.round((r.current / r.forecast) * 100));
                const short = pct < 80;
                return (
                  <div key={r.id}>
                    <div className="flex justify-between items-end text-xs mb-1">
                      <span className="font-medium">{r.name}</span>
                      <span className={cn("font-semibold", short ? "text-destructive" : "text-secondary")}>
                        {r.current}/{r.forecast} {r.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", short ? "bg-destructive" : "bg-secondary")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Reports ---------- */

function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="Export operational and clinical reports"
        action={<Button className="rounded-xl bg-gradient-primary border-0">Export PDF</Button>} />
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total visits (mo)"   value={654} delta={11} icon={Users}        tone="primary" />
        <KpiCard label="Service satisfaction" value="94%" delta={3}  icon={CheckCircle2} tone="secondary" />
        <KpiCard label="Avg. visit duration" value="22m"  delta={-6} icon={Clock}        tone="accent" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft mb-4">
        <h3 className="font-display font-bold mb-4">Booked vs. served vs. no-show</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyAppointments}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="booked" fill={chartColors.primary}   radius={[8, 8, 0, 0]} />
            <Bar dataKey="served" fill={chartColors.secondary} radius={[8, 8, 0, 0]} />
            <Bar dataKey="noShow" fill={chartColors.destruct}  radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {[
          "Monthly appointment summary",
          "Disease surveillance report",
          "Staff productivity report",
          "Patient demographics report",
          "Service utilization report",
          "No-show analysis",
        ].map((r) => (
          <div key={r} className="bg-card border border-border rounded-2xl p-4 shadow-soft flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center"><FileBarChart className="w-5 h-5" /></div>
              <div>
                <p className="font-semibold text-sm">{r}</p>
                <p className="text-xs text-muted-foreground">Updated today</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">Download</Button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Users ---------- */

function UsersPage() {
  const staff = [
    { name: "Dr. Carmela Reyes",    role: "Admin",          dept: "Administration",     status: "Active" },
    { name: "Dr. Joseph Mariano",   role: "Physician",      dept: "General Consult.",   status: "Active" },
    { name: "Nurse Liza Andrada",   role: "Staff",          dept: "Triage / Queue",     status: "Active" },
    { name: "Midwife Anna Soriano", role: "Staff",          dept: "Maternal Health",    status: "Active" },
    { name: "Mr. Renato Pascual",   role: "Queue Monitor",  dept: "Frontdesk",          status: "Active" },
    { name: "Ms. Karen Bituin",     role: "Staff",          dept: "Laboratory",         status: "On leave" },
  ];
  return (
    <>
      <PageHeader title="Staff & User Management" subtitle="Roles: Patient · Staff · Admin"
        action={<Button className="rounded-xl bg-gradient-primary border-0"><Plus className="w-4 h-4 mr-1" /> Invite user</Button>} />
      <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>{["Name","Role","Department","Status",""].map(h => <th key={h} className="text-left p-4 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((s, i) => (
              <tr key={i} className="hover:bg-muted/20">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {s.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                  </div>
                  <span className="font-medium">{s.name}</span>
                </td>
                <td className="p-4"><Badge className={cn("border-0",
                  s.role === "Admin"     && "bg-accent-soft text-accent",
                  s.role === "Physician" && "bg-primary-soft text-primary",
                  s.role === "Staff"     && "bg-secondary-soft text-secondary",
                  s.role === "Queue Monitor" && "bg-warning/15 text-warning",
                )}>{s.role}</Badge></td>
                <td className="p-4 text-muted-foreground">{s.dept}</td>
                <td className="p-4">
                  <Badge className={cn("border-0", s.status === "Active" ? "bg-secondary-soft text-secondary" : "bg-muted text-muted-foreground")}>{s.status}</Badge>
                </td>
                <td className="p-4 text-right"><Button variant="ghost" size="sm">Manage</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
