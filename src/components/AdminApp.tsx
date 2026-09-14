import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Calendar,
  Cast,
  ClipboardPlus,
  Copy,
  DatabaseZap,
  Download,
  Eye,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Package,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  Stethoscope,
  Trash2,
  TrendingUp,
  Tv,
  Upload,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DiseaseTrendMap } from "@/components/DiseaseTrendMap";
import {
  usePrototypeStore,
  type AuditEvent,
  type ConsultationTemplate,
  type DoctorAvailability,
  type ImportSummary,
  type MigrationRow,
  type StaffRole,
  type StaffUser,
} from "@/lib/prototype-store";

type Page =
  | "overview"
  | "appointments"
  | "patients"
  | "services"
  | "consultationTemplates"
  | "trends"
  | "inventory"
  | "users"
  | "cast";
const nav: [Page, string, any][] = [
  ["overview", "Overview", LayoutDashboard],
  ["appointments", "Appointments", Calendar],
  ["patients", "Patient Records", Users],
  ["services", "Services & Schedules", Stethoscope],
  ["consultationTemplates", "Consultation templates", ClipboardPlus],
  ["trends", "Disease Trends", TrendingUp],
  ["inventory", "Inventory", Package],
  ["users", "Staff & Roles", UserCog],
  ["cast", "Cast Center", Cast],
];
export function AdminApp() {
  const [page, setPage] = useState<Page>("overview");
  const store = usePrototypeStore();
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-card">
      <div className="grid min-h-[780px] md:grid-cols-[270px,1fr]">
        <aside className="bg-gradient-to-b from-primary via-primary to-primary/90 p-5 text-primary-foreground">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-card/15">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-bold">SmartServe</p>
              <p className="text-[10px] opacity-70">
                Clinic operations console
              </p>
            </div>
          </div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] opacity-60">
            Workspace
          </p>
          <nav className="space-y-1">
            {nav.map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setPage(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${page === id ? "bg-card text-primary shadow-card" : "text-primary-foreground/75 hover:bg-card/10"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
          <SidebarCalendar />
        </aside>
        <main className="bg-muted/20 p-5 md:p-8">
          <PageContent page={page} store={store} />
        </main>
      </div>
    </div>
  );
}

function SidebarCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1,
  );
  return (
    <section
      className="mt-6 rounded-2xl border border-primary-foreground/15 bg-card/10 p-3 backdrop-blur-sm"
      aria-label="Current month calendar"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold">
            {today.toLocaleDateString("en-PH", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-[10px] text-primary-foreground/65">
            Today ·{" "}
            {today.toLocaleDateString("en-PH", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <Calendar className="h-4 w-4 text-primary-foreground/70" />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-primary-foreground/55">
        {"SMTWTFS".split("").map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, index) =>
          day === null ? (
            <span key={`empty-${index}`} className="h-7" />
          ) : (
            <time
              key={day}
              dateTime={new Date(year, month, day).toISOString().slice(0, 10)}
              className={`grid h-7 place-items-center rounded-lg text-xs font-medium ${day === today.getDate() ? "bg-card text-primary shadow-soft" : "text-primary-foreground/80"}`}
            >
              {day}
            </time>
          ),
        )}
      </div>
    </section>
  );
}
function PageContent({ page, store }: any) {
  const {
    patients,
    appointments,
    medicines,
    services,
    consultationTemplates,
    staffUsers,
    medicalRecords,
    audit,
  } = store;
  if (page === "overview") return <OverviewDashboard store={store} />;
  if (page === "patients")
    return (
      <PatientPage
        patients={patients}
        medicalRecords={medicalRecords}
        update={store.updatePatient}
        remove={store.deletePatient}
        barangayEntries={store.barangays}
        addBarangay={store.addBarangay}
        updateBarangay={store.updateBarangay}
        deleteBarangay={store.deleteBarangay}
      />
    );
  if (page === "appointments")
    return (
      <AppointmentPage
        appointments={appointments}
        patients={patients}
        update={store.updateAppointment}
        remove={store.deleteAppointment}
      />
    );
  if (page === "services")
    return (
      <ServicePage
        services={services}
        add={store.addService}
        update={store.updateService}
        remove={store.deleteService}
      />
    );
  if (page === "consultationTemplates")
    return (
      <ConsultationTemplatePage
        templates={consultationTemplates}
        add={store.addConsultationTemplate}
        update={store.updateConsultationTemplate}
        remove={store.deleteConsultationTemplate}
      />
    );
  if (page === "users")
    return (
      <StaffPage
        users={staffUsers}
        add={store.addStaffUser}
        update={store.updateStaffUser}
        remove={store.deleteStaffUser}
      />
    );
  if (page === "cast") return <CastCenter />;
  if (page === "inventory")
    return (
      <MedicinePage
        medicines={medicines}
        audit={audit}
        add={store.addMedicine}
        update={store.updateMedicine}
        remove={store.deleteMedicine}
      />
    );
  const records = medicalRecords.flatMap((r: any) => {
    const p = patients.find((x: any) => x.id === r.patientId);
    return p && p.locationSource !== "Barangay fallback" && p.locationVerified
      ? [
          {
            id: r.id,
            category: "Consultation diagnosis",
            diagnosis: r.diagnosis,
            date: r.date,
            count: 1,
            barangay: p.mobileLocationBarangay || p.barangay,
            municipality: p.mobileLocationMunicipality || p.municipality,
            latitude: p.latitude,
            longitude: p.longitude,
          },
        ]
      : [];
  });
  const barangayOnlyCases = medicalRecords.length - records.length;
  return (
    <>
      <Head
        title="Disease trends"
        sub="Completed consultation diagnoses mapped from verified current locations captured when patients selected a service."
      />
      {records.length ? (
        <DiseaseTrendMap records={records} />
      ) : (
        <Empty text="No completed consultation diagnosis with a verified map location has been recorded yet." />
      )}
      {barangayOnlyCases > 0 ? (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {barangayOnlyCases} case{barangayOnlyCases === 1 ? "" : "s"} is
          recorded by barangay only or has an unverified pin, so it is
          intentionally excluded from the precise location map.
        </p>
      ) : null}
    </>
  );
}
type DiagnosisSummary = {
  name: string;
  code: string;
  value: number;
  color: string;
};

const diagnosisColors = [
  "#0ea5e9",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
  "#ec4899",
  "#64748b",
];
const diagnosisAcronym = (diagnosis: string) => {
  const normalized = diagnosis.trim().toLowerCase();
  const known: Record<string, string> = {
    "acute upper respiratory infection": "AURI",
    tuberculosis: "TB",
    "dengue fever": "DF",
    hypertension: "HTN",
    diabetes: "DM",
    "urinary tract infection": "UTI",
    "animal bite": "AB",
  };
  if (known[normalized]) return known[normalized];
  const letters = diagnosis
    .match(/[A-Za-z0-9]+/g)
    ?.map((word) => word[0])
    .join("")
    .toUpperCase();
  return letters?.slice(0, 5) || "N/A";
};

function DiagnosisChartTooltip({ active, payload }: any) {
  const item = payload?.[0]?.payload as DiagnosisSummary | undefined;
  if (!active || !item) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-primary">
        {item.code}
      </p>
      <p className="mt-1 max-w-56 text-sm font-semibold">{item.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {item.value} recorded case{item.value === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function OverviewDashboard({ store }: any) {
  const {
    patients,
    appointments,
    medicines,
    services,
    staffUsers,
    medicalRecords,
    audit,
    reset,
  } = store;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [serviceId, setServiceId] = useState("all");
  const [status, setStatus] = useState("all");
  const [importOpen, setImportOpen] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] =
    useState<DiagnosisSummary | null>(null);
  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment: any) => {
        const inDateRange =
          (!from || appointment.date >= from) &&
          (!to || appointment.date <= to);
        const inService =
          serviceId === "all" || appointment.serviceId === serviceId;
        const inStatus = status === "all" || appointment.queueStatus === status;
        return inDateRange && inService && inStatus;
      }),
    [appointments, from, to, serviceId, status],
  );
  const filteredRecords = useMemo(
    () =>
      medicalRecords.filter(
        (record: any) =>
          (!from || record.date >= from) && (!to || record.date <= to),
      ),
    [medicalRecords, from, to],
  );
  const trendData = useMemo(() => {
    const recordedDates = [
      ...new Set([
        ...filteredAppointments.map((appointment: any) => appointment.date),
        ...filteredRecords.map((record: any) => record.date),
      ]),
    ]
      .filter(Boolean)
      .sort();
    const dates = recordedDates.length
      ? recordedDates
      : emptyTrendDates(from, to);
    return dates.map((date) => ({
      date: formatChartDate(date),
      appointments: filteredAppointments.filter(
        (appointment: any) => appointment.date === date,
      ).length,
      cases: filteredRecords.filter((record: any) => record.date === date)
        .length,
    }));
  }, [filteredAppointments, filteredRecords, from, to]);
  const statusData = useMemo(() => {
    const results = Object.entries(
      filteredAppointments.reduce(
        (counts: Record<string, number>, appointment: any) => {
          const label = appointment.queueStatus || "Scheduled";
          counts[label] = (counts[label] || 0) + 1;
          return counts;
        },
        {},
      ),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    return results.length
      ? results
      : [
          { name: "Waiting", value: 0 },
          { name: "In consultation", value: 0 },
          { name: "Completed", value: 0 },
          { name: "Cancelled", value: 0 },
        ];
  }, [filteredAppointments]);
  const diagnosisData = useMemo<DiagnosisSummary[]>(() => {
    const results = Object.entries(
      filteredRecords.reduce((counts: Record<string, number>, record: any) => {
        const label = record.diagnosis?.trim() || "No diagnosis recorded";
        counts[label] = (counts[label] || 0) + 1;
        return counts;
      }, {}),
    )
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    if (!results.length)
      return [
        {
          name: "No cases recorded",
          code: "NCR",
          value: 0,
          color: diagnosisColors[0],
        },
      ];
    const usedCodes = new Map<string, number>();
    return results.map((item, index) => {
      const baseCode = diagnosisAcronym(item.name);
      const duplicateCount = usedCodes.get(baseCode) || 0;
      usedCodes.set(baseCode, duplicateCount + 1);
      return {
        ...item,
        code: duplicateCount ? `${baseCode}-${duplicateCount + 1}` : baseCode,
        color: diagnosisColors[index % diagnosisColors.length],
      };
    });
  }, [filteredRecords]);
  const present = filteredAppointments.filter(
    (appointment: any) => appointment.attendanceStatus === "Present",
  ).length;
  const waiting = filteredAppointments.filter((appointment: any) =>
    [
      "Waiting",
      "Waiting for Triage",
      "Triage",
      "Waiting for Doctor",
      "Called",
      "In Consultation",
      "Now Serving",
    ].includes(appointment.queueStatus),
  ).length;
  const lowStock = medicines.filter(
    (medicine: any) => medicine.stock <= medicine.reorderLevel,
  ).length;
  const activeAccounts = staffUsers.filter((user: StaffUser) => user.active).length;
  const statuses = [
    ...new Set(
      appointments
        .map((appointment: any) => appointment.queueStatus)
        .filter(Boolean),
    ),
  ].sort();
  const clearFilters = () => {
    setFrom("");
    setTo("");
    setServiceId("all");
    setStatus("all");
  };
  const exportFilteredData = () => {
    const rows = [
      [
        "Record type",
        "Date",
        "Patient ID",
        "Service",
        "Visit type",
        "Queue status",
        "Attendance",
        "Diagnosis",
        "Clinician",
      ],
      ...filteredAppointments.map((appointment: any) => {
        const patient = patients.find(
          (item: any) => item.id === appointment.patientId,
        );
        const service = services.find(
          (item: any) => item.id === appointment.serviceId,
        );
        return [
          "Appointment",
          appointment.date,
          patient?.patientNumber || appointment.patientId,
          service?.name || "Unknown service",
          appointment.visitType || "Scheduled",
          appointment.queueStatus,
          appointment.attendanceStatus,
          "",
          "",
        ];
      }),
      ...filteredRecords.map((record: any) => {
        const patient = patients.find(
          (item: any) => item.id === record.patientId,
        );
        return [
          "Completed checkup",
          record.date,
          patient?.patientNumber || record.patientId,
          "",
          "",
          "",
          "",
          record.diagnosis,
          record.clinician,
        ];
      }),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const file = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smartserve-overview-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <Head
        title="Live operations overview"
        sub="Filter local operational data, monitor clinic workload, and export the current view."
        action={
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              title="Import CSV data"
              aria-label="Import CSV data"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={reset}>
              <DatabaseZap className="mr-2 h-4 w-4" />
              Clear patient data
            </Button>
            <Button onClick={exportFilteredData}>
              <Download className="mr-2 h-4 w-4" />
              Export data
            </Button>
          </div>
        }
      />
      <section className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold">Dashboard filters</h3>
            <p className="text-xs text-muted-foreground">
              Appointment filters apply to date, service, and status. Checkup
              cases use the selected date range.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DateFilter label="From date" value={from} onChange={setFrom} />
          <DateFilter label="To date" value={to} onChange={setTo} />
          <SelectFilter
            label="Service"
            value={serviceId}
            onChange={setServiceId}
            options={[
              { value: "all", label: "All services" },
              ...services.map((service: any) => ({
                value: service.id,
                label: service.name,
              })),
            ]}
          />
          <SelectFilter
            label="Appointment status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All statuses" },
              ...statuses.map((item: string) => ({ value: item, label: item })),
            ]}
          />
        </div>
      </section>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi
          label="Filtered appointments"
          value={filteredAppointments.length}
        />
        <Kpi label="Present check-ins" value={present} />
        <Kpi label="Completed checkups" value={filteredRecords.length} />
        <Kpi label="Currently in queue" value={waiting} />
        <Kpi label="Low-stock medicines" value={lowStock} />
        <Kpi label="Active staff accounts" value={activeAccounts} />
      </div>
      <div className="mb-5 grid gap-5 xl:grid-cols-[1.55fr,1fr]">
        <DashboardCard
          title="Appointments and completed cases"
          sub="Daily volume within the selected date range."
        >
          <div className="mb-3 flex flex-wrap gap-4 text-xs font-medium">
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-full bg-primary" />
              Appointments
            </span>
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-full bg-accent" />
              Completed cases
            </span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={trendData}
              margin={{ left: -18, right: 12, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="appointmentFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="caseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--accent))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--accent))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{
                  stroke: "hsl(var(--border))",
                  strokeDasharray: "4 4",
                }}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "hsl(var(--border))",
                }}
              />
              <Area
                type="monotone"
                dataKey="appointments"
                name="Appointments"
                stroke="hsl(var(--primary))"
                fill="url(#appointmentFill)"
                strokeWidth={3}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="cases"
                name="Completed cases"
                stroke="hsl(var(--accent))"
                fill="url(#caseFill)"
                strokeWidth={3}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          {!filteredAppointments.length && !filteredRecords.length && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              No matching records yet — the chart is ready for the first clinic
              activity.
            </p>
          )}
        </DashboardCard>
        <DashboardCard
          title="Appointment status"
          sub="Current workflow state of matching appointments."
        >
          <ResponsiveContainer width="100%" height={270}>
            <BarChart
              data={statusData}
              layout="vertical"
              margin={{ left: 8, right: 12, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="statusFill" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={104}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "hsl(var(--border))",
                }}
              />
              <Bar
                dataKey="value"
                name="Appointments"
                fill="url(#statusFill)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr,.9fr]">
        <DashboardCard
          title="Cases by diagnosis"
          sub="Top disease trends from completed checkups. Click a bar to read the full diagnosis."
        >
          <div className="mb-4 flex flex-wrap gap-2" aria-label="Disease acronym key">
            {diagnosisData.map((item) => (
              <button
                type="button"
                key={item.code}
                onClick={() => item.value > 0 && setSelectedDiagnosis(item)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-semibold transition-colors hover:border-primary/40 hover:bg-primary-soft"
                title={item.name}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.code}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={254}>
            <BarChart
              data={diagnosisData}
              margin={{ left: -18, right: 12, top: 12, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="code"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fontWeight: 700 }}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={<DiagnosisChartTooltip />} />
              <Bar
                dataKey="value"
                name="Cases"
                radius={[8, 8, 2, 2]}
                cursor="pointer"
                onClick={(entry: any) => {
                  const selected = entry?.payload || entry;
                  if (selected?.value > 0) setSelectedDiagnosis(selected);
                }}
              >
                {diagnosisData.map((item) => (
                  <Cell key={item.code} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Acronyms keep the chart readable. Select a bar or acronym to view
            the full disease trend.
          </p>
        </DashboardCard>
        <DashboardCard
          title="Operational attention"
          sub="Items that may need action today."
        >
          <div className="space-y-3">
            <Attention
              label="Medicines at or below reorder level"
              value={lowStock}
              tone={lowStock ? "text-destructive" : "text-primary"}
            />
            <Attention
              label="Appointments waiting to be completed"
              value={waiting}
              tone={waiting ? "text-amber-600" : "text-primary"}
            />
            <Attention
              label="Active staff accounts"
              value={activeAccounts}
              tone="text-primary"
            />
            <Attention
              label="Recent activity entries"
              value={audit.length}
              tone="text-primary"
            />
          </div>
        </DashboardCard>
      </div>
      <ImportMigrationDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={store.importMigration}
      />
      <Dialog
        open={Boolean(selectedDiagnosis)}
        onOpenChange={(open) => {
          if (!open) setSelectedDiagnosis(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogDescription>Selected disease trend</DialogDescription>
            <DialogTitle className="font-display text-2xl">
              {selectedDiagnosis?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-primary-soft p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-primary">
                Acronym
              </p>
              <p className="mt-1 font-display text-2xl font-bold">
                {selectedDiagnosis?.code}
              </p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
                Filtered cases
              </p>
              <p className="mt-1 font-display text-2xl font-bold">
                {selectedDiagnosis?.value ?? 0}
              </p>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            This total reflects completed consultation records within the active
            overview date filter. No patient names are shown in this summary.
          </p>
          <DialogFooter>
            <Button type="button" onClick={() => setSelectedDiagnosis(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
function ImportMigrationDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: MigrationRow[]) => ImportSummary;
}) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<MigrationRow[]>([]);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setSummary(null);
    try {
      const parsed = parseCsvRows(await file.text());
      if (!parsed.length)
        throw new Error("The selected file has no data rows.");
      setFileName(file.name);
      setRows(parsed);
    } catch (reason) {
      setRows([]);
      setFileName("");
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to read this CSV file.",
      );
    }
  };
  const completeImport = () => {
    const result = onImport(rows);
    setSummary(result);
    if (
      !result.patientsAdded &&
      !result.appointmentsAdded &&
      !result.checkupsAdded
    )
      setError(
        "No compatible new records were found. Check the required columns and whether these records already exist.",
      );
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl p-0">
        <DialogHeader className="border-b border-border bg-muted/30 px-6 py-5">
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft">
              <Upload className="h-5 w-5 text-primary" />
            </span>
            Import migration data
          </DialogTitle>
          <DialogDescription>
            Upload a CSV export to add compatible historical records to this
            local prototype. Existing records are kept; duplicates are skipped.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-6 py-5">
          <div className="rounded-xl border border-dashed border-primary/40 bg-primary-soft/30 p-4">
            <Label htmlFor="migration-file" className="font-semibold">
              CSV file
            </Label>
            <Input
              id="migration-file"
              type="file"
              accept=".csv,text/csv"
              onChange={chooseFile}
              className="mt-2 cursor-pointer bg-card"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Supported: SmartServe operational CSV exports, or patient master
              CSVs with Full name, Date of birth, Mobile number, Barangay,
              Municipality, and Address.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Patient master file
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Adds patient profiles. Optional columns: Patient ID, Gender,
                Latitude, and Longitude.
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Operational export
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Imports Appointments and Completed checkups when their Patient
                ID already exists locally.
              </p>
            </div>
          </div>
          {rows.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {rows.length} data row{rows.length === 1 ? "" : "s"} ready
                    for review and migration.
                  </p>
                </div>
                <Badge className="border-0 bg-primary-soft text-primary">
                  CSV ready
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Detected columns: {Object.keys(rows[0]).slice(0, 7).join(" · ")}
                {Object.keys(rows[0]).length > 7 ? " · …" : ""}
              </p>
            </div>
          )}
          {summary && (
            <div className="rounded-xl border border-secondary/30 bg-secondary-soft/50 p-4">
              <p className="font-semibold text-secondary">Migration complete</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Added {summary.patientsAdded} patient profile(s),{" "}
                {summary.appointmentsAdded} appointment(s), and{" "}
                {summary.checkupsAdded} checkup(s). Skipped {summary.skipped}{" "}
                duplicate or incomplete row(s).
              </p>
            </div>
          )}
          {error && (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button disabled={!rows.length} onClick={completeImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import compatible rows
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function parseCsvRows(source: string): MigrationRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else value += character;
  }
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows
    .shift()!
    .map(
      (header, index) =>
        header.replace(/^\uFEFF/, "").trim() || `Column ${index + 1}`,
    );
  return rows.map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, values[index]?.trim() || ""]),
    ),
  );
}
function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1"
      />
    </div>
  );
}
function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
function DashboardCard({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: any;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4">
        <h3 className="font-display font-bold">{title}</h3>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {children}
    </section>
  );
}
function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="grid h-[270px] place-items-center rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
function Attention({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-display text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
function formatChartDate(date: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}
function emptyTrendDates(from: string, to: string) {
  const end = to ? new Date(`${to}T12:00:00`) : new Date();
  const start = from ? new Date(`${from}T12:00:00`) : new Date(end);
  if (!from) start.setDate(end.getDate() - 6);
  if (start > end) start.setTime(end.getTime());
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end && dates.length < 90) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
const normalizeBarangayName = (value?: string) =>
  value
    ?.trim()
    .toLocaleLowerCase("en-PH")
    .replace(/[^a-z0-9]/g, "") || "";

function PatientPage({
  patients,
  medicalRecords,
  update,
  remove,
  barangayEntries,
  addBarangay,
  updateBarangay,
  deleteBarangay,
}: any) {
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [barangayQuery, setBarangayQuery] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  const [barangayEditorOpen, setBarangayEditorOpen] = useState(false);
  const [editingBarangay, setEditingBarangay] = useState<any>(null);
  const [deletingBarangay, setDeletingBarangay] = useState<any>(null);
  const [barangayError, setBarangayError] = useState("");
  const [directoryNotice, setDirectoryNotice] = useState("");
  const [barangayForm, setBarangayForm] = useState({
    name: "",
    municipality: "",
    province: "",
    postalCode: "",
  });
  const barangays = useMemo(() => {
    const directory = new Map<string, any>();
    (barangayEntries || []).forEach((entry: any) => {
      const key = normalizeBarangayName(entry.name);
      if (!key) return;
      directory.set(key, { ...entry, key, count: 0 });
    });
    patients.forEach((patient: any) => {
      const name = patient.barangay?.trim() || "Unspecified barangay";
      const key = normalizeBarangayName(name);
      const existing = directory.get(key);
      directory.set(key, {
        ...existing,
        key,
        name: existing?.name || name,
        municipality: existing?.municipality || patient.municipality || "",
        province: existing?.province || patient.province || "",
        postalCode: existing?.postalCode || patient.postalCode || "",
        count: (existing?.count || 0) + 1,
      });
    });
    return [...directory.values()]
      .sort((left, right) => left.name.localeCompare(right.name, "en-PH"));
  }, [barangayEntries, patients]);
  const visibleBarangays = barangays.filter((barangay) =>
    barangay.name
      .toLocaleLowerCase("en-PH")
      .includes(barangayQuery.trim().toLocaleLowerCase("en-PH")),
  );
  const visiblePatients = patients
    .filter(
      (patient: any) =>
        (!selectedBarangay ||
          normalizeBarangayName(patient.barangay) ===
            normalizeBarangayName(selectedBarangay)) &&
        [patient.fullName, patient.patientNumber, patient.contact]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("en-PH")
          .includes(patientQuery.trim().toLocaleLowerCase("en-PH")),
    )
    .sort((left: any, right: any) =>
      left.fullName.localeCompare(right.fullName, "en-PH"),
    );
  const openPatient = (patient: any) => {
    setSelected({ ...patient });
    setEditing(false);
  };
  const openBarangayEditor = (barangay?: any) => {
    setEditingBarangay(barangay || null);
    setBarangayForm({
      name: barangay?.name || "",
      municipality: barangay?.municipality || "",
      province: barangay?.province || "",
      postalCode: barangay?.postalCode || "",
    });
    setBarangayError("");
    setBarangayEditorOpen(true);
  };
  const saveBarangay = () => {
    if (
      !barangayForm.name.trim() ||
      !barangayForm.municipality.trim() ||
      !barangayForm.province.trim()
    ) {
      setBarangayError(
        "Barangay, municipality / city, and province are required.",
      );
      return;
    }
    const saved = editingBarangay
      ? updateBarangay(editingBarangay.name, barangayForm)
      : addBarangay(barangayForm);
    if (!saved) {
      setBarangayError(
        "A managed barangay with this name already exists. Use Edit instead.",
      );
      return;
    }
    setBarangayEditorOpen(false);
    setEditingBarangay(null);
    setBarangayError("");
    setDirectoryNotice("");
  };
  const confirmBarangayDelete = () => {
    if (!deletingBarangay) return;
    const removed = deleteBarangay(deletingBarangay.name);
    setDeletingBarangay(null);
    setDirectoryNotice(
      removed
        ? ""
        : "This barangay cannot be deleted while patient records are assigned to it. Reassign or update those patient records first.",
    );
  };
  const updateNamePart = (key: string, value: string) => {
    const next = { ...selected, [key]: value };
    const composedName = [
      next.givenName,
      next.middleName,
      next.familyName,
      next.suffix,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    setSelected({
      ...next,
      fullName:
        next.givenName?.trim() && next.familyName?.trim()
          ? composedName
          : next.fullName,
    });
  };
  const save = () => {
    update(selected.id, selected);
    setEditing(false);
  };
  const checkups = selected
    ? medicalRecords
        .filter((record: any) => record.patientId === selected.id)
        .sort((a: any, b: any) => b.date.localeCompare(a.date))
    : [];
  return (
    <>
      <Head
        title="Patient records"
        sub="Choose a barangay to find and open a private patient record."
      />
      {!selectedBarangay ? (
        <Panel
          title={`Barangay directory (${barangays.length})`}
          action={
            <Button
              type="button"
              size="icon"
              title="Add barangay"
              aria-label="Add barangay"
              onClick={() => openBarangayEditor()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          }
        >
          <div className="mb-4 max-w-md">
            <Label htmlFor="barangay-search">Search barangay</Label>
            <Input
              id="barangay-search"
              value={barangayQuery}
              onChange={(event) => setBarangayQuery(event.target.value)}
              placeholder="Type a barangay name"
              className="mt-1"
            />
          </div>
          {directoryNotice ? (
            <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {directoryNotice}
            </p>
          ) : null}
          {visibleBarangays.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {visibleBarangays.map((barangay) => (
                <div
                  key={barangay.name}
                  className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 p-2 transition-smooth hover:border-primary/40 hover:bg-primary-soft/40"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBarangay(barangay.name);
                      setPatientQuery("");
                    }}
                    className="min-w-0 flex-1 px-1 py-1 text-left"
                  >
                    <span className="block truncate font-medium">
                      {barangay.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {barangay.municipality || "Municipality not set"}
                    </span>
                  </button>
                  <Badge className="border-0 bg-card text-primary">
                    {barangay.count}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      title={`Edit ${barangay.name}`}
                      aria-label={`Edit ${barangay.name}`}
                      onClick={() => openBarangayEditor(barangay)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      title={
                        barangay.count
                          ? "Reassign patient records before deleting this barangay"
                          : `Delete ${barangay.name}`
                      }
                      aria-label={`Delete ${barangay.name}`}
                      disabled={barangay.count > 0}
                      onClick={() => setDeletingBarangay(barangay)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="No barangay matches your search." />
          )}
        </Panel>
      ) : (
        <Panel
          title={`Patients in ${selectedBarangay} (${visiblePatients.length})`}
          action={
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Close patient list and return to barangay directory"
              title="Return to barangay directory"
              onClick={() => {
                setSelectedBarangay("");
                setBarangayQuery("");
                setPatientQuery("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          }
        >
          <div className="mb-4 max-w-md">
            <Label htmlFor="patient-search">Search patient</Label>
            <Input
              id="patient-search"
              value={patientQuery}
              onChange={(event) => setPatientQuery(event.target.value)}
              placeholder="Name, patient ID, or mobile number"
              className="mt-1"
            />
          </div>
          {visiblePatients.map((p: any) => (
            <Row
              key={p.id}
              title={p.fullName}
              detail={`${p.patientNumber || "Patient ID pending"} · ${p.contact} · ${p.barangay}`}
              badge="Patient"
              onClick={() => openPatient(p)}
              actions={
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={`View ${p.fullName}`}
                  onClick={() => openPatient(p)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              }
            />
          ))}
          {!visiblePatients.length && (
            <Empty text="No patient in this barangay matches the search." />
          )}
        </Panel>
      )}
      <Dialog
        open={barangayEditorOpen}
        onOpenChange={(open) => {
          setBarangayEditorOpen(open);
          if (!open) setBarangayError("");
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBarangay ? "Edit barangay" : "Add barangay"}
            </DialogTitle>
            <DialogDescription>
              {editingBarangay
                ? "Changing the barangay name also updates the matching structured patient address field."
                : "Create a barangay directory entry before patients are registered there."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Barangay name"
              value={barangayForm.name}
              onChange={(value: string) =>
                setBarangayForm({ ...barangayForm, name: value })
              }
            />
            <Field
              label="Municipality / city"
              value={barangayForm.municipality}
              onChange={(value: string) =>
                setBarangayForm({ ...barangayForm, municipality: value })
              }
            />
            <Field
              label="Province"
              value={barangayForm.province}
              onChange={(value: string) =>
                setBarangayForm({ ...barangayForm, province: value })
              }
            />
            <Field
              label="Postal code"
              value={barangayForm.postalCode}
              onChange={(value: string) =>
                setBarangayForm({ ...barangayForm, postalCode: value })
              }
            />
          </div>
          {barangayError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {barangayError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBarangayEditorOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveBarangay}>
              {editingBarangay ? "Save barangay" : "Add barangay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!deletingBarangay}
        onOpenChange={(open) => !open && setDeletingBarangay(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete barangay?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {deletingBarangay?.name} from the directory? This does not
              delete patient records. A barangay with assigned patients cannot
              be removed until those records are reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBarangayDelete}>
              Delete barangay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-2xl p-0">
          <DialogHeader className="border-b border-border bg-muted/30 px-6 py-5">
            <DialogTitle className="font-display text-2xl">
              Patient profile
            </DialogTitle>
            <DialogDescription>
              Private record view. Use Edit record only after verifying changes
              with the patient.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-6 px-6 py-5">
              <div className="flex justify-between rounded-xl bg-primary-soft p-4">
                <div>
                  <p className="font-semibold">{selected.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selected.patientNumber || "Local patient record"} ·{" "}
                    {selected.dob || "Birth date not recorded"}
                  </p>
                </div>
                <Badge className="border-0 bg-card text-primary">
                  Private record
                </Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Full name"
                  value={selected.fullName || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, fullName: v })
                  }
                />
                <Field
                  label="Last / family name"
                  value={selected.familyName || ""}
                  disabled={!editing}
                  onChange={(v: string) => updateNamePart("familyName", v)}
                />
                <Field
                  label="First / given name"
                  value={selected.givenName || ""}
                  disabled={!editing}
                  onChange={(v: string) => updateNamePart("givenName", v)}
                />
                <Field
                  label="Middle name"
                  value={selected.middleName || ""}
                  disabled={!editing}
                  onChange={(v: string) => updateNamePart("middleName", v)}
                />
                <Field
                  label="Name suffix"
                  value={selected.suffix || ""}
                  disabled={!editing}
                  onChange={(v: string) => updateNamePart("suffix", v)}
                />
                <Field
                  label="Date of birth"
                  value={selected.dob || ""}
                  disabled={!editing}
                  onChange={(v: string) => setSelected({ ...selected, dob: v })}
                />
                <Field
                  label="Sex / administrative gender"
                  value={selected.gender || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, gender: v })
                  }
                />
                <Field
                  label="Mobile number"
                  value={selected.contact || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, contact: v })
                  }
                />
                <Field
                  label="Alternate number"
                  value={selected.alternateContact || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, alternateContact: v })
                  }
                />
                <Field
                  label="Email address"
                  value={selected.email || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, email: v })
                  }
                />
                <Field
                  label="Civil status"
                  value={selected.civilStatus || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, civilStatus: v })
                  }
                />
                <Field
                  label="Nationality"
                  value={selected.nationality || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, nationality: v })
                  }
                />
                <Field
                  label="Preferred language"
                  value={selected.preferredLanguage || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, preferredLanguage: v })
                  }
                />
                <Field
                  label="Barangay"
                  value={selected.barangay || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, barangay: v })
                  }
                />
                <Field
                  label="Municipality"
                  value={selected.municipality || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, municipality: v })
                  }
                />
                <Field
                  label="Province"
                  value={selected.province || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, province: v })
                  }
                />
                <Field
                  label="Postal code"
                  value={selected.postalCode || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, postalCode: v })
                  }
                />
                <Field
                  label="Address / purok"
                  value={selected.address || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, address: v })
                  }
                />
                <Field
                  label="Emergency contact"
                  value={selected.emergencyContactPhone || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, emergencyContactPhone: v })
                  }
                />
                <Field
                  label="Emergency contact name"
                  value={selected.emergencyContactName || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, emergencyContactName: v })
                  }
                />
                <Field
                  label="Emergency contact relationship"
                  value={selected.emergencyContactRelationship || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({
                      ...selected,
                      emergencyContactRelationship: v,
                    })
                  }
                />
                <Field
                  label="Parent / legal guardian"
                  value={selected.guardianName || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, guardianName: v })
                  }
                />
                <Field
                  label="Guardian relationship"
                  value={selected.guardianRelationship || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, guardianRelationship: v })
                  }
                />
                <Field
                  label="Guardian mobile number"
                  value={selected.guardianContact || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, guardianContact: v })
                  }
                />
                <Field
                  label="PhilHealth client type"
                  value={selected.philHealthClientType || "Not enrolled"}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, philHealthClientType: v })
                  }
                />
                <Field
                  label="PhilHealth PIN"
                  value={selected.philHealthPin || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, philHealthPin: v })
                  }
                />
                <Field
                  label="Member / sponsor name"
                  value={selected.philHealthMemberName || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, philHealthMemberName: v })
                  }
                />
                <Field
                  label="Member / sponsor PIN"
                  value={selected.philHealthMemberPin || ""}
                  disabled={!editing}
                  onChange={(v: string) =>
                    setSelected({ ...selected, philHealthMemberPin: v })
                  }
                />
              </div>
              <section className="border-t border-border pt-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold">
                      Checkup history
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Past completed consultations for this patient.
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {checkups.length}{" "}
                    {checkups.length === 1 ? "checkup" : "checkups"}
                  </Badge>
                </div>
                {checkups.length ? (
                  <div className="space-y-3">
                    {checkups.map((record: any) => (
                      <article
                        key={record.id}
                        className="rounded-xl border border-border bg-muted/20 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">
                              {record.diagnosis || "Consultation completed"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {record.date} ·{" "}
                              {record.clinician || "Clinician not recorded"}
                            </p>
                          </div>
                          <Badge className="border-0 bg-primary-soft text-primary">
                            {record.status || "Completed"}
                          </Badge>
                        </div>
                        {record.notes && (
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {record.notes}
                          </p>
                        )}
                        {record.prescription?.length > 0 && (
                          <p className="mt-3 text-xs font-medium text-foreground">
                            Prescription: {record.prescription.length} medicine
                            {record.prescription.length === 1 ? "" : "s"}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center text-sm text-muted-foreground">
                    No completed checkups have been recorded for this patient
                    yet.
                  </div>
                )}
              </section>
            </div>
          )}
          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
            <Button
              variant="destructive"
              onClick={() => {
                if (window.confirm(`Delete ${selected.fullName}?`)) {
                  remove(selected.id);
                  setSelected(null);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete record
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            {editing ? (
              <Button onClick={save}>Save changes</Button>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit record
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
function AppointmentPage({ appointments, patients, update, remove }: any) {
  return (
    <>
      <Head
        title="Appointments"
        sub="View, reschedule, change status, or delete local visits."
      />
      <Panel title="Visits">
        {appointments.map((a: any) => (
          <Row
            key={a.id}
            title={`${patients.find((p: any) => p.id === a.patientId)?.fullName || "Unknown patient"} · ${a.queueNumber || "No number"}`}
            detail={`${a.date} · ${a.queueStatus}`}
            badge={a.visitType || "Scheduled"}
            actions={
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const date = window.prompt("Date (YYYY-MM-DD)", a.date);
                    if (date) update(a.id, { date });
                  }}
                >
                  Reschedule
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    window.confirm("Delete visit?") && remove(a.id)
                  }
                >
                  Delete
                </Button>
              </>
            }
          />
        ))}
        {!appointments.length && <Empty text="No visits yet." />}
      </Panel>
    </>
  );
}
function ServicePage({ services, add, update, remove }: any) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration: "20",
    capacity: "20",
    queueArea: "General Clinic",
    followUpEligible: false,
  });
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const create = () => {
    if (
      add({
        ...form,
        duration: Number(form.duration),
        capacity: Number(form.capacity),
        icon: "Stethoscope",
        color: "primary",
      })
    ) {
      setForm({ name: "", description: "", duration: "20", capacity: "20", queueArea: "General Clinic", followUpEligible: false });
      setCreating(false);
    }
  };
  const saveEdit = () => {
    const service = {
      ...editing,
      duration: Number(editing.duration),
      capacity: Number(editing.capacity),
    };
    update(service.id, service);
    setViewing(service);
    setEditing(null);
  };
  const formFields = (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field
        label="Service name"
        value={form.name}
        onChange={(v: string) => setForm({ ...form, name: v })}
      />
      <div><Label>Queue building</Label><select value={form.queueArea} onChange={(event) => setForm({ ...form, queueArea: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>General Clinic</option><option>Animal Bite Center</option></select></div>
      <label className="mt-6 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.followUpEligible} onChange={(event) => setForm({ ...form, followUpEligible: event.target.checked })} />Follow-up check-up applicable</label>
      <Field
        label="Description"
        value={form.description}
        onChange={(v: string) => setForm({ ...form, description: v })}
      />
      <Field
        label="Duration (minutes)"
        value={form.duration}
        onChange={(v: string) => setForm({ ...form, duration: v })}
      />
      <Field
        label="Daily capacity"
        value={form.capacity}
        onChange={(v: string) => setForm({ ...form, capacity: v })}
      />
    </div>
  );
  const activeService = editing || viewing;
  return (
    <>
      <Head
        title="Services & schedules"
        sub="View and manage clinic services."
        action={
          <Button
            size="icon"
            title="Create service"
            aria-label="Create service"
            onClick={() => setCreating(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        }
      />
      <Panel title="Service catalogue">
        {services.map((s: any) => (
          <Row
            key={s.id}
            title={s.name}
            detail={`${s.description} · ${s.capacity}/day · ${s.duration} min`}
            badge="Active"
            actions={
              <Button
                size="icon"
                variant="outline"
                title={`View ${s.name}`}
                aria-label={`View ${s.name}`}
                onClick={() => {
                  setViewing({ ...s });
                  setEditing(null);
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            }
          />
        ))}
      </Panel>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-2xl rounded-2xl p-0">
          <DialogHeader className="border-b border-border bg-muted/30 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 font-display text-2xl">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft">
                <Stethoscope className="w-5 h-5 text-primary" />
              </span>
              Create clinic service
            </DialogTitle>
            <DialogDescription>
              Define the service, expected duration, and daily capacity before
              making it available to patients.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">{formFields}</div>
          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={create}>
              <Plus className="w-4 h-4 mr-2" />
              Create service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!activeService}
        onOpenChange={(open) => {
          if (!open) {
            setViewing(null);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-2xl p-0">
          <DialogHeader className="border-b border-border bg-muted/30 px-6 py-5">
            <DialogTitle className="font-display text-2xl">
              {editing ? "Edit service" : "Service details"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the complete service configuration. Changes apply to future bookings in this local prototype."
                : "Review the service details before editing or deleting it."}
            </DialogDescription>
          </DialogHeader>
          {activeService && (
            <div className="px-6 py-5">
              {editing ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    label="Service name"
                    value={editing.name}
                    onChange={(v: string) =>
                      setEditing({ ...editing, name: v })
                    }
                  />
                  <div><Label>Queue building</Label><select value={editing.queueArea || "General Clinic"} onChange={(event) => setEditing({ ...editing, queueArea: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>General Clinic</option><option>Animal Bite Center</option></select></div>
                  <label className="mt-6 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(editing.followUpEligible)} onChange={(event) => setEditing({ ...editing, followUpEligible: event.target.checked })} />Follow-up check-up applicable</label>
                  <Field
                    label="Description"
                    value={editing.description}
                    onChange={(v: string) =>
                      setEditing({ ...editing, description: v })
                    }
                  />
                  <Field
                    label="Duration (minutes)"
                    value={String(editing.duration)}
                    onChange={(v: string) =>
                      setEditing({ ...editing, duration: v })
                    }
                  />
                  <Field
                    label="Daily capacity"
                    value={String(editing.capacity)}
                    onChange={(v: string) =>
                      setEditing({ ...editing, capacity: v })
                    }
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-primary-soft p-4">
                    <p className="font-display text-xl font-bold">
                      {viewing.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {viewing.description || "No description added."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Expected duration
                      </p>
                      <p className="mt-1 font-semibold">
                        {viewing.duration} minutes
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Daily capacity
                      </p>
                      <p className="mt-1 font-semibold">
                        {viewing.capacity} patients
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Queue: {viewing.queueArea || "General Clinic"} · Follow-up: {viewing.followUpEligible ? "Applicable" : "Not configured"}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button onClick={saveEdit}>Save service changes</Button>
              </>
            ) : (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setDeleting(viewing)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete service
                </Button>
                <div className="flex-1" />
                <Button variant="outline" onClick={() => setViewing(null)}>
                  Close
                </Button>
                <Button onClick={() => setEditing({ ...viewing })}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit service
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deleting?.name}? This removes it from future booking
              choices in this local prototype.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                remove(deleting.id);
                setDeleting(null);
                setViewing(null);
                setEditing(null);
              }}
            >
              Delete service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
type ConsultationTemplateForm = Pick<
  ConsultationTemplate,
  "assessment" | "clinicalNotes" | "active"
>;

const emptyConsultationTemplate: ConsultationTemplateForm = {
  assessment: "",
  clinicalNotes: "",
  active: true,
};

function ConsultationTemplatePage({
  templates,
  add,
  update,
  remove,
}: {
  templates: ConsultationTemplate[];
  add: (template: ConsultationTemplateForm) => boolean;
  update: (
    id: string,
    patch: Partial<Omit<ConsultationTemplate, "id" | "createdAt">>,
  ) => void;
  remove: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ConsultationTemplateForm>(
    emptyConsultationTemplate,
  );
  const [viewing, setViewing] = useState<ConsultationTemplate | null>(null);
  const [editing, setEditing] = useState<ConsultationTemplate | null>(null);
  const [deleting, setDeleting] = useState<ConsultationTemplate | null>(null);
  const [formError, setFormError] = useState("");
  const activeTemplate = editing || viewing;

  const validate = (template: ConsultationTemplateForm) => {
    if (!template.assessment.trim() || !template.clinicalNotes.trim()) {
      setFormError("Add both the assessment / diagnosis and clinical notes.");
      return false;
    }
    return true;
  };

  const openCreate = () => {
    setForm(emptyConsultationTemplate);
    setFormError("");
    setCreating(true);
  };

  const create = () => {
    if (!validate(form)) return;
    if (!add(form)) {
      setFormError(
        "A template with this assessment / diagnosis already exists.",
      );
      return;
    }
    setCreating(false);
    setForm(emptyConsultationTemplate);
  };

  const saveEdit = () => {
    if (!editing || !validate(editing)) return;
    update(editing.id, {
      assessment: editing.assessment,
      clinicalNotes: editing.clinicalNotes,
      active: editing.active,
    });
    setViewing({
      ...editing,
      assessment: editing.assessment.trim(),
      clinicalNotes: editing.clinicalNotes.trim(),
    });
    setEditing(null);
  };

  return (
    <>
      <Head
        title="Consultation templates"
        sub="Create reusable assessment and clinical-note starters for Doctors. Doctors may always modify a template before saving a patient's consultation."
        action={
          <Button
            size="icon"
            title="Create consultation template"
            aria-label="Create consultation template"
            onClick={openCreate}
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />
      <Panel title="Doctor consultation library">
        {templates.map((template) => (
          <Row
            key={template.id}
            title={template.assessment}
            detail={
              template.clinicalNotes.length > 112
                ? `${template.clinicalNotes.slice(0, 112)}…`
                : template.clinicalNotes
            }
            badge={template.active ? "Available to Doctors" : "Inactive"}
            actions={
              <Button
                size="icon"
                variant="outline"
                title={`View ${template.assessment}`}
                aria-label={`View ${template.assessment}`}
                onClick={() => {
                  setViewing({ ...template });
                  setEditing(null);
                  setFormError("");
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            }
          />
        ))}
        {!templates.length ? (
          <Empty text="No consultation templates yet. Create a template to give Doctors a consistent assessment and clinical-note starting point." />
        ) : null}
      </Panel>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl p-0">
          <DialogHeader className="border-b border-border bg-muted/30 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 font-display text-2xl">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft">
                <ClipboardPlus className="h-5 w-5 text-primary" />
              </span>
              Create consultation template
            </DialogTitle>
            <DialogDescription>
              This is a reusable clinical starting point. It does not create a
              patient record until a Doctor applies it during a consultation.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">
            <ConsultationTemplateFields
              value={form}
              onChange={(patch) => {
                setForm((current) => ({ ...current, ...patch }));
                setFormError("");
              }}
            />
            {formError ? (
              <p className="mt-3 text-sm text-destructive">{formError}</p>
            ) : null}
          </div>
          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={create}>
              <Plus className="mr-2 h-4 w-4" />
              Create template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!activeTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setViewing(null);
            setEditing(null);
            setFormError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl p-0">
          <DialogHeader className="border-b border-border bg-muted/30 px-6 py-5">
            <DialogTitle className="font-display text-2xl">
              {editing ? "Edit consultation template" : "Consultation template"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the reusable assessment and clinical-note starter available to Doctors."
                : "Review the template before editing, deactivating, or deleting it."}
            </DialogDescription>
          </DialogHeader>
          {activeTemplate ? (
            <div className="px-6 py-5">
              {editing ? (
                <>
                  <ConsultationTemplateFields
                    value={editing}
                    onChange={(patch) => {
                      setEditing((current) =>
                        current ? { ...current, ...patch } : current,
                      );
                      setFormError("");
                    }}
                  />
                  {formError ? (
                    <p className="mt-3 text-sm text-destructive">{formError}</p>
                  ) : null}
                </>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-xl bg-primary-soft p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Assessment / diagnosis
                    </p>
                    <p className="mt-2 font-display text-xl font-bold">
                      {viewing?.assessment}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Clinical notes
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {viewing?.clinicalNotes}
                    </p>
                  </div>
                  <Badge
                    className={
                      viewing?.active
                        ? "border-0 bg-primary-soft text-primary"
                        : "border-0 bg-muted text-muted-foreground"
                    }
                  >
                    {viewing?.active
                      ? "Available to Doctors"
                      : "Inactive template"}
                  </Badge>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setFormError("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={saveEdit}>
                  Save template changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setDeleting(viewing)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete template
                </Button>
                <div className="flex-1" />
                <Button variant="outline" onClick={() => setViewing(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setEditing({ ...viewing! });
                    setFormError("");
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit template
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete consultation template?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete “{deleting?.assessment}”? Existing patient consultation
              records are not changed, but Doctors will no longer be able to
              select this template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleting) return;
                remove(deleting.id);
                setDeleting(null);
                setViewing(null);
                setEditing(null);
              }}
            >
              Delete template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ConsultationTemplateFields({
  value,
  onChange,
}: {
  value: ConsultationTemplateForm;
  onChange: (patch: Partial<ConsultationTemplateForm>) => void;
}) {
  return (
    <div className="grid gap-4">
      <Field
        label="Assessment / diagnosis"
        value={value.assessment}
        onChange={(assessment: string) => onChange({ assessment })}
      />
      <div>
        <Label>Clinical notes</Label>
        <Textarea
          value={value.clinicalNotes}
          onChange={(event) => onChange({ clinicalNotes: event.target.value })}
          placeholder="Example: Advise rest, fluids, treatment plan, monitoring, and return precautions."
          className="mt-1 min-h-32"
        />
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
        <input
          type="checkbox"
          checked={value.active}
          onChange={(event) => onChange({ active: event.target.checked })}
          className="mt-1 h-4 w-4 accent-primary"
        />
        <span>
          <span className="block text-sm font-semibold">
            Available to Doctors
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Inactive templates remain in Admin for future use but are hidden
            from the Doctor template picker.
          </span>
        </span>
      </label>
    </div>
  );
}

type AccountDialog = "staff" | "doctor" | "admin" | "edit" | "reset" | null;
type AccountForm = {
  fullName: string;
  username: string;
  password: string;
  confirmPassword: string;
  active: boolean;
  doctorStatus: DoctorAvailability;
  recoveryEmail: string;
  mobile: string;
  title: string;
  notes: string;
  assignedAreas: ("General Clinic" | "Animal Bite Center")[];
};

const blankAccountForm = (): AccountForm => ({
  fullName: "",
  username: "",
  password: "",
  confirmPassword: "",
  active: true,
  doctorStatus: "Available",
  recoveryEmail: "",
  mobile: "",
  title: "Clinic Administrator",
  notes: "",
  assignedAreas: ["General Clinic"],
});
const staffRoles: StaffRole[] = ["Front desk", "Nurse / Triage", "Pharmacy"];
const doctorStatuses: DoctorAvailability[] = [
  "Available",
  "With patient",
  "On break",
  "Off duty",
  "On leave",
];

function StaffPage({
  users,
  add,
  update,
  remove,
}: {
  users: StaffUser[];
  add: (user: Omit<StaffUser, "id">) => boolean;
  update: (id: string, patch: Partial<StaffUser>) => boolean;
  remove: (id: string) => void;
}) {
  const [dialog, setDialog] = useState<AccountDialog>(null);
  const [selected, setSelected] = useState<StaffUser | null>(null);
  const [form, setForm] = useState<AccountForm>(blankAccountForm);
  const [createRole, setCreateRole] = useState<StaffRole>("Front desk");
  const [error, setError] = useState("");
  const isDoctor = dialog === "doctor" || (dialog === "edit" && selected?.role === "Doctor");
  const isAdmin = dialog === "admin" || (dialog === "edit" && selected?.role === "Administrator");

  const close = () => {
    setDialog(null);
    setSelected(null);
    setForm(blankAccountForm());
    setError("");
  };
  const openCreate = (kind: Extract<AccountDialog, "staff" | "doctor" | "admin">) => {
    setDialog(kind);
    setSelected(null);
    setForm(blankAccountForm());
    setCreateRole("Front desk");
    setError("");
  };
  const openEdit = (user: StaffUser) => {
    setSelected(user);
    setDialog("edit");
    setForm({
      fullName: user.fullName,
      username: user.username,
      password: "",
      confirmPassword: "",
      active: user.active,
      doctorStatus: user.doctorStatus || "Available",
      recoveryEmail: user.recoveryEmail || "",
      mobile: user.mobile || "",
      title: user.title || "Clinic Administrator",
      notes: user.notes || "",
      assignedAreas: user.assignedAreas || ["General Clinic"],
    });
    setError("");
  };
  const openReset = (user: StaffUser) => {
    setSelected(user);
    setDialog("reset");
    setForm(blankAccountForm());
    setError("");
  };
  const save = () => {
    if (dialog === "reset") {
      if (!selected || form.password.length < 4 || form.password !== form.confirmPassword) {
        setError("Use a temporary password of at least 4 characters and confirm it exactly.");
        return;
      }
      update(selected.id, { password: form.password, passwordChangeRequired: true });
      close();
      return;
    }
    if (!form.fullName.trim() || !form.username.trim()) {
      setError("Enter the account holder’s name and a username.");
      return;
    }
    if (dialog === "edit" && selected) {
      const updated = update(selected.id, {
        fullName: form.fullName,
        username: form.username,
        active: form.active,
        doctorStatus: selected.role === "Doctor" ? form.doctorStatus : undefined,
        recoveryEmail: selected.role === "Administrator" ? form.recoveryEmail : undefined,
        mobile: selected.role === "Administrator" ? form.mobile : undefined,
        title: selected.role === "Administrator" ? form.title : undefined,
        notes: selected.role === "Administrator" ? form.notes : undefined,
        assignedAreas: form.assignedAreas,
      });
      if (!updated) {
        setError("That username is already in use. Choose another username.");
        return;
      }
      close();
      return;
    }
    if (form.password.length < 4 || form.password !== form.confirmPassword) {
      setError("Use a temporary password of at least 4 characters and confirm it exactly.");
      return;
    }
    const role: StaffRole =
      dialog === "doctor" ? "Doctor" : dialog === "admin" ? "Administrator" : createRole;
    const created = add({
      fullName: form.fullName,
      username: form.username,
      password: form.password,
      role,
      active: form.active,
      passwordChangeRequired: true,
      doctorStatus: role === "Doctor" ? form.doctorStatus : undefined,
      recoveryEmail: role === "Administrator" ? form.recoveryEmail : undefined,
      mobile: role === "Administrator" ? form.mobile : undefined,
      title: role === "Administrator" ? form.title : undefined,
      notes: role === "Administrator" ? form.notes : undefined,
      assignedAreas: form.assignedAreas,
    });
    if (!created) {
      setError("That username is already in use. Choose another username.");
      return;
    }
    close();
  };
  const dialogTitle =
    dialog === "staff"
      ? "Create staff account"
      : dialog === "doctor"
        ? "Create doctor account"
        : dialog === "admin"
          ? "Set up administrator"
          : dialog === "reset"
            ? `Reset temporary password${selected ? ` · ${selected.fullName}` : ""}`
            : `Edit account${selected ? ` · ${selected.fullName}` : ""}`;
  const dialogDescription =
    dialog === "admin"
      ? "Administrator accounts include recovery details. Passwords are never shown again after you save."
      : dialog === "doctor"
        ? "Only doctor accounts have an availability status that patients can view before booking."
        : dialog === "reset"
          ? "Set a new temporary password. The user must change it at first sign-in in the production version."
          : "Local prototype credentials route this user to the workspace assigned to their role.";

  return (
    <>
      <Head
        title="Staff & roles"
        sub="Simple role-based login accounts. Only doctors publish an availability status to patients."
        action={
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => openCreate("staff")} title="Create staff account" aria-label="Create staff account">
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => openCreate("doctor")} title="Create doctor account" aria-label="Create doctor account">
              <Stethoscope className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={() => openCreate("admin")} title="Set up administrator" aria-label="Set up administrator">
              <ShieldCheck className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-semibold text-primary">Staff accounts</p>
          <p className="mt-1 text-xs text-muted-foreground">Name, role, username, and temporary password.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-semibold text-primary">Doctor accounts</p>
          <p className="mt-1 text-xs text-muted-foreground">A patient-visible care availability status is included.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-semibold text-primary">Administrator accounts</p>
          <p className="mt-1 text-xs text-muted-foreground">Adds recovery and internal contact details for secure setup.</p>
        </div>
      </div>
      <Panel title="Account directory">
        {users.map((user) => {
          const detail = [
            `@${user.username}`,
            user.active ? "Account active" : "Account disabled",
            user.role === "Doctor" ? `Patient view: ${doctorAvailabilityLabel(user.doctorStatus)}` : "",
            user.role === "Administrator" && user.recoveryEmail ? user.recoveryEmail : "",
            `Assignment: ${user.assignedAreas?.includes("Animal Bite Center") ? "Animal Bite Center" : "General Clinic"}`,
          ].filter(Boolean).join(" · ");
          return (
            <Row
              key={user.id}
              title={user.fullName}
              detail={detail}
              badge={user.role}
              actions={
                <>
                  <Button size="icon" variant="outline" onClick={() => openEdit(user)} title="Edit account" aria-label={`Edit ${user.fullName}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => openReset(user)} title="Reset temporary password" aria-label={`Reset password for ${user.fullName}`}>
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => update(user.id, { active: !user.active })} title={user.active ? "Disable account" : "Enable account"} aria-label={user.active ? `Disable ${user.fullName}` : `Enable ${user.fullName}`}>
                    <ShieldCheck className={`h-4 w-4 ${user.active ? "text-secondary" : "text-muted-foreground"}`} />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => window.confirm(`Delete ${user.fullName}? This removes their local login.`) && remove(user.id)} title="Delete account" aria-label={`Delete ${user.fullName}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              }
            />
          );
        })}
        {!users.length ? <Empty text="No login accounts yet. Select an icon above to create staff, doctor, or administrator access." /> : null}
      </Panel>
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl p-0">
          <DialogHeader className="border-b border-border bg-muted/30 px-6 py-5 pr-14">
            <DialogTitle className="flex items-center gap-2 font-display text-2xl">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft">
                {dialog === "admin" ? <ShieldCheck className="h-5 w-5 text-primary" /> : dialog === "doctor" ? <Stethoscope className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
              </span>
              {dialogTitle}
            </DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-5">
            {dialog === "reset" ? null : (
              <>
                <Field label="Full name" value={form.fullName} onChange={(fullName: string) => setForm({ ...form, fullName })} />
                <Field label="Username" value={form.username} onChange={(username: string) => setForm({ ...form, username })} />
                {dialog === "staff" ? (
                  <div>
                    <Label htmlFor="staff-role">Role</Label>
                    <select id="staff-role" value={createRole} onChange={(event) => setCreateRole(event.target.value as StaffRole)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      {staffRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                ) : null}
                {isDoctor ? (
                  <div>
                    <Label htmlFor="doctor-status">Doctor availability</Label>
                    <select id="doctor-status" value={form.doctorStatus} onChange={(event) => setForm({ ...form, doctorStatus: event.target.value as DoctorAvailability })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      {doctorStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">Patients see a privacy-safe availability message, not leave reasons.</p>
                  </div>
                ) : null}
                {!isAdmin ? (
                  <div className="rounded-xl border border-warning/20 bg-warning/10 px-3 py-3 text-sm">
                    <Label htmlFor="clinic-assignment">Clinic assignment</Label>
                    <select id="clinic-assignment" value={form.assignedAreas.includes("Animal Bite Center") ? "Animal Bite Center" : "General Clinic"} onChange={(event) => setForm({ ...form, assignedAreas: [event.target.value as "General Clinic" | "Animal Bite Center"] })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>General Clinic</option><option>Animal Bite Center</option></select>
                    <p className="mt-2 text-xs text-muted-foreground">Staff and triage accounts use only the workspace and queue for this assigned care area. Animal Bite assessments are required before doctor handoff.</p>
                  </div>
                ) : null}
                {isAdmin ? (
                  <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                    <Field label="Title / position" value={form.title} onChange={(title: string) => setForm({ ...form, title })} />
                    <Field label="Recovery email" value={form.recoveryEmail} onChange={(recoveryEmail: string) => setForm({ ...form, recoveryEmail })} />
                    <Field label="Mobile number" value={form.mobile} onChange={(mobile: string) => setForm({ ...form, mobile })} />
                    <div className="sm:col-span-2">
                      <Label htmlFor="admin-notes">Internal setup notes</Label>
                      <Textarea id="admin-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-1 min-h-20" placeholder="Optional: scope, turnover note, or recovery instruction" />
                    </div>
                  </div>
                ) : null}
                <label className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm">
                  <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                  Account is active and can sign in
                </label>
              </>
            )}
            {(dialog !== "edit" || dialog === "reset") ? (
              <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="temporary-password">Temporary password</Label>
                  <Input id="temporary-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1" autoComplete="new-password" />
                </div>
                <div>
                  <Label htmlFor="confirm-temporary-password">Confirm temporary password</Label>
                  <Input id="confirm-temporary-password" type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} className="mt-1" autoComplete="new-password" />
                </div>
              </div>
            ) : null}
            {error ? <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={save}><KeyRound className="mr-2 h-4 w-4" />{dialog === "edit" ? "Save account" : dialog === "reset" ? "Save temporary password" : "Create account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function doctorAvailabilityLabel(status?: DoctorAvailability) {
  if (status === "Available") return "Available for consultation";
  if (status === "With patient") return "Currently attending patients";
  return "Not available today";
}

type CastTarget = {
  id: string;
  label: string;
  description: string;
};

const castTargets: CastTarget[] = [
  {
    id: "queue-tv",
    label: "SmartServe Queue Board",
    description: "Public TV board for General Clinic queue numbers only.",
  },
  {
    id: "animal-bite-queue-tv",
    label: "Animal Bite Queue Board",
    description: "Public TV board for Animal Bite Center queue numbers only.",
  },
];

function CastCenter() {
  const [selectedId, setSelectedId] = useState("queue-tv");
  const [smartTvUrls, setSmartTvUrls] = useState<string[]>([]);
  const [smartTvMessage, setSmartTvMessage] = useState("Preparing a local Smart TV display link…");
  const selected = castTargets.find((target) => target.id === selectedId) || castTargets[0];
  const smartTvUrl = smartTvUrls[0]
    ? selected.id === "animal-bite-queue-tv"
      ? `${smartTvUrls[0].replace(/\/\?.*$/, "")}/animal-bite-queue`
      : smartTvUrls[0]
    : "";
  const loadSmartTvLinks = useCallback(async () => {
    try {
      const response = await fetch("/api/smart-tv-link", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Smart TV link is unavailable");
      const result = (await response.json()) as { urls?: string[] };
      const urls = Array.isArray(result.urls) ? result.urls : [];
      setSmartTvUrls(urls);
      setSmartTvMessage(
        urls.length
          ? "Open this public, queue-numbers-only link in the Smart TV browser."
          : "No LAN address was found. Start SmartServe on the clinic computer, then refresh this page.",
      );
    } catch {
      setSmartTvUrls([]);
      setSmartTvMessage("The Smart TV display link is available only while SmartServe is running through its local development server.");
    }
  }, []);

  useEffect(() => {
    void loadSmartTvLinks();
  }, [loadSmartTvLinks]);

  return (
    <>
      <Head title="Queue Display Center" sub="Choose the public queue board to open in the TV browser." />
      <div className="grid gap-5 xl:grid-cols-[1.2fr,.8fr]">
        <Panel title="Public queue boards">
          <div className="grid gap-3 sm:grid-cols-2">
            {castTargets.map((target) => {
              const active = selectedId === target.id;
              return (
                <button key={target.id} type="button" onClick={() => setSelectedId(target.id)} className={`rounded-2xl border p-4 text-left transition-smooth ${active ? "border-primary bg-primary-soft shadow-soft" : "border-border bg-card hover:border-primary/40"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-background text-primary"><Tv className="h-4 w-4" /></div>
                    <Badge className="border-0 bg-secondary-soft text-secondary">Public-safe</Badge>
                  </div>
                  <p className="mt-3 font-semibold">{target.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{target.description}</p>
                  <p className="mt-3 font-mono text-[10px] text-primary">ID: {target.id}</p>
                </button>
              );
            })}
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel title="Open on the TV browser">
            <div className="rounded-2xl border border-secondary/20 bg-secondary-soft p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card text-secondary shadow-soft"><Tv className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-semibold">Use the TV browser</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Use the TV’s built-in browser while it is on the same clinic network. The page receives only public queue numbers, rooms, and queue states from the local staff workspace.</p>
                </div>
              </div>
              {smartTvUrl ? (
                <>
                  <code className="mt-4 block break-all rounded-xl bg-card/80 px-3 py-2 text-xs text-primary">{smartTvUrl}</code>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(smartTvUrl).then(() => setSmartTvMessage("Smart TV link copied. Open it in the TV browser.")).catch(() => setSmartTvMessage("Copy was blocked by this browser. Enter the displayed address manually on the TV."))}>
                      <Copy className="mr-2 h-4 w-4" />Copy TV link
                    </Button>
                    <a href={smartTvUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">Preview queue board</a>
                  </div>
                </>
              ) : null}
            </div>
            <p role="status" className="mt-3 text-xs leading-5 text-muted-foreground">{smartTvMessage}</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
type InventoryHistoryKind = "all" | "stock-in" | "dispense";
type InventoryHistoryRange = "7" | "30" | "custom";
type InventoryTransaction = {
  id: string;
  at: string;
  type: Exclude<InventoryHistoryKind, "all">;
  quantity: number;
  medicine: string;
  batch: string;
};

const csvValue = (value: string | number) =>
  `"${String(value).replaceAll('"', '""')}"`;

function MedicinePage({ medicines, audit, add, update, remove }: any) {
  const [name, setName] = useState("");
  const [inventoryArea, setInventoryArea] = useState("General Pharmacy");
  const [category, setCategory] = useState("Medicine");
  const [historyOpen, setHistoryOpen] = useState(false);
  if (historyOpen)
    return (
      <InventoryHistory
        medicines={medicines}
        audit={audit}
        onClose={() => setHistoryOpen(false)}
      />
    );
  return (
    <>
      <Head
        title="Medicine catalogue"
        sub="Create, edit, or remove local medicine items."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                if (!name) return;
                add({
                  name,
                  strength: "",
                  form: "Tablet",
                  stock: 0,
                  reorderLevel: 0,
                  expiry: "Not set",
                  batch: "Not set",
                  inventoryArea,
                  category,
                });
                setName("");
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add medicine
            </Button>
            <Button
              variant="outline"
              onClick={() => setHistoryOpen(true)}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Transaction history
            </Button>
          </div>
        }
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New medicine name"
        className="mb-4"
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <select aria-label="Inventory location" value={inventoryArea} onChange={(event) => setInventoryArea(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>General Pharmacy</option><option>Animal Bite Center</option></select>
        <select aria-label="Inventory category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Medicine</option><option>Vaccine</option><option>Immunoglobulin</option><option>Supply</option></select>
      </div>
      <Panel title="Medicine items">
        {medicines.map((m: any) => (
          <Row
            key={m.id}
            title={`${m.name} ${m.strength}`}
            detail={`${m.form} · ${m.stock} in stock · Batch ${m.batch} · ${m.inventoryArea || "General Pharmacy"}`}
            badge={m.category || "Medicine"}
            actions={
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const stock = window.prompt("Stock", String(m.stock));
                    if (stock !== null)
                      update(m.id, { stock: Number(stock) || 0 });
                  }}
                >
                  Edit stock
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    window.confirm(`Delete ${m.name}?`) && remove(m.id)
                  }
                >
                  Delete
                </Button>
              </>
            }
          />
        ))}
      </Panel>
    </>
  );
}

function InventoryHistory({
  medicines,
  audit,
  onClose,
}: {
  medicines: any[];
  audit: AuditEvent[];
  onClose: () => void;
}) {
  const [kind, setKind] = useState<InventoryHistoryKind>("all");
  const [range, setRange] = useState<InventoryHistoryRange>("30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const transactions = useMemo<InventoryTransaction[]>(() => {
    const medicinesById = new Map(
      medicines.map((medicine) => [medicine.id, medicine]),
    );
    return audit.flatMap((event) => {
      const quantityMatch = event.action.match(/(?:Received|Dispensed)\s+(\d+)/i);
      if (!quantityMatch) return [];
      const quantity = Number(quantityMatch[1]);
      const isStockIn = event.action.startsWith("Received ");
      const isDispense = event.action.startsWith("Dispensed ");
      if (!isStockIn && !isDispense) return [];
      const medicineId = isDispense
        ? event.reference.split("/").at(-1) || ""
        : event.reference;
      const medicine = medicinesById.get(medicineId);
      return [
        {
          id: event.id,
          at: event.at,
          type: isStockIn ? "stock-in" : "dispense",
          quantity,
          medicine: medicine
            ? `${medicine.name} ${medicine.strength}`.trim()
            : "Deleted medicine",
          batch: medicine?.batch || "Not available",
        },
      ];
    });
  }, [audit, medicines]);
  const dateBounds = useMemo(() => {
    if (range === "custom") {
      return {
        from: from ? new Date(`${from}T00:00:00`) : undefined,
        to: to ? new Date(`${to}T23:59:59.999`) : undefined,
      };
    }
    const toDate = new Date();
    toDate.setHours(23, 59, 59, 999);
    const fromDate = new Date(toDate);
    fromDate.setDate(toDate.getDate() - (Number(range) - 1));
    fromDate.setHours(0, 0, 0, 0);
    return { from: fromDate, to: toDate };
  }, [from, range, to]);
  const filteredTransactions = useMemo(
    () =>
      transactions
        .filter((transaction) => {
          const at = new Date(transaction.at);
          return (
            (kind === "all" || transaction.type === kind) &&
            (!dateBounds.from || at >= dateBounds.from) &&
            (!dateBounds.to || at <= dateBounds.to)
          );
        })
        .toSorted(
          (left, right) =>
            new Date(right.at).getTime() - new Date(left.at).getTime(),
        ),
    [dateBounds, kind, transactions],
  );
  const chartData = useMemo(() => {
    const daily = new Map<string, { date: string; stockIn: number; dispensed: number }>();
    filteredTransactions.forEach((transaction) => {
      const date = transaction.at.slice(0, 10);
      const current = daily.get(date) || { date, stockIn: 0, dispensed: 0 };
      if (transaction.type === "stock-in") current.stockIn += transaction.quantity;
      else current.dispensed += transaction.quantity;
      daily.set(date, current);
    });
    return Array.from(daily.values()).toSorted((left, right) =>
      left.date.localeCompare(right.date),
    );
  }, [filteredTransactions]);
  const totalStockIn = filteredTransactions
    .filter((transaction) => transaction.type === "stock-in")
    .reduce((total, transaction) => total + transaction.quantity, 0);
  const totalDispensed = filteredTransactions
    .filter((transaction) => transaction.type === "dispense")
    .reduce((total, transaction) => total + transaction.quantity, 0);
  const exportHistory = () => {
    const csv = [
      ["Date and time", "Transaction", "Medicine", "Batch", "Quantity"],
      ...filteredTransactions.map((transaction) => [
        new Date(transaction.at).toLocaleString("en-PH"),
        transaction.type === "stock-in" ? "Stock-in" : "Dispensed",
        transaction.medicine,
        transaction.batch,
        transaction.quantity,
      ]),
    ]
      .map((row) => row.map(csvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smartserve-inventory-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <Head
        title="Inventory transaction history"
        sub="Review local stock-in and dispensing activity, then export the filtered report."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportHistory}>
              <Download className="mr-2 h-4 w-4" />
              Export report
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Close history
            </Button>
          </div>
        }
      />
      <Panel title="History filters">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Show</Label>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as InventoryHistoryKind)}
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="all">Stock-in and dispensing</option>
              <option value="stock-in">Stock-in only</option>
              <option value="dispense">Dispensing only</option>
            </select>
          </div>
          <div>
            <Label>Period</Label>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as InventoryHistoryRange)}
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          {range === "custom" ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>From</Label>
                <Input
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>To</Label>
                <Input
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {range === "7" ? "Seven-day" : "Thirty-day"} rolling window
            </div>
          )}
        </div>
      </Panel>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Kpi label="Transactions" value={filteredTransactions.length} />
        <Kpi label="Stock-in units" value={totalStockIn} />
        <Kpi label="Dispensed units" value={totalDispensed} />
      </div>
      <Panel
        title="Medicine movement"
        action={<span className="text-xs text-muted-foreground">Units by day</span>}
      >
        {chartData.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
                {kind !== "dispense" ? (
                  <Bar dataKey="stockIn" name="Stock-in" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                ) : null}
                {kind !== "stock-in" ? (
                  <Bar dataKey="dispensed" name="Dispensed" fill="#f97316" radius={[6, 6, 0, 0]} />
                ) : null}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-14 text-center text-sm text-muted-foreground">
            No inventory transactions match this filter yet.
          </div>
        )}
      </Panel>
      <Panel title="Filtered transaction records">
        {filteredTransactions.length ? (
          <div className="divide-y divide-border">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium">{transaction.medicine}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.at).toLocaleString("en-PH")} · Batch {transaction.batch}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      transaction.type === "stock-in"
                        ? "border-0 bg-secondary-soft text-secondary"
                        : "border-0 bg-warning/15 text-warning"
                    }
                  >
                    {transaction.type === "stock-in" ? "Stock-in" : "Dispensed"}
                  </Badge>
                  <span className="font-display text-lg font-bold">
                    {transaction.type === "stock-in" ? "+" : "−"}
                    {transaction.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            No records to display.
          </p>
        )}
      </Panel>
    </div>
  );
}
function Head({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: any;
}) {
  return (
    <div className="mb-6 flex flex-wrap justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[.15em] text-primary">
          Administration
        </p>
        <h2 className="font-display text-3xl font-bold">{title}</h2>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: any;
  children: any;
}) {
  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display font-bold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
function Row({ title, detail, badge, actions, onClick }: any) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <p className="font-medium hover:text-primary">{title}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </button>
      ) : (
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Badge className="bg-primary-soft text-primary border-0">{badge}</Badge>
        {actions}
      </div>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 disabled:bg-muted disabled:text-muted-foreground"
      />
    </div>
  );
}
function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-soft">
      <p className="font-display text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs leading-none text-muted-foreground">{label}</p>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="p-5 text-center text-sm text-muted-foreground">{text}</p>
  );
}
