import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Calendar,
  Cast,
  ChevronDown,
  ClipboardPlus,
  Copy,
  DatabaseZap,
  Download,
  Eye,
  FileText,
  Folder,
  KeyRound,
  LayoutDashboard,
  ListFilter,
  LogOut,
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
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
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
import superHealthCenterLogo from "@/assets/super-health-center-jones-logo.png";
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
  | "cast"
  | "settings"
  | "analytics"
  | "reports";
const workspaceNav: [Page, string, any][] = [
  ["overview", "Overview", LayoutDashboard],
  ["appointments", "Appointments", Calendar],
  ["patients", "Patient Records", Users],
  ["trends", "Disease Trends", TrendingUp],
];
const settingsNav: [Page, string, any][] = [
  ["settings", "System & data", Settings],
  ["analytics", "Analytics", TrendingUp],
  ["reports", "Reports", FileText],
  ["services", "Services & schedules", Stethoscope],
  ["consultationTemplates", "Consultation templates", ClipboardPlus],
  ["inventory", "Inventory", Package],
  ["users", "Staff & Roles", UserCog],
  ["cast", "Cast Center", Cast],
];
const kpiPresentation: Record<
  string,
  { Icon: typeof Calendar; tone: string }
> = {
  "Filtered appointments": {
    Icon: Calendar,
    tone: "bg-primary-soft text-primary",
  },
  "Present check-ins": {
    Icon: Users,
    tone: "bg-secondary-soft text-secondary",
  },
  "Completed checkups": {
    Icon: Stethoscope,
    tone: "bg-violet-50 text-violet-600",
  },
  "Currently in queue": {
    Icon: TrendingUp,
    tone: "bg-amber-50 text-amber-600",
  },
  "Low-stock medicines": {
    Icon: Package,
    tone: "bg-rose-50 text-rose-600",
  },
  "Active staff accounts": {
    Icon: ShieldCheck,
    tone: "bg-cyan-50 text-cyan-600",
  },
};
const defaultKpiPresentation = {
  Icon: LayoutDashboard,
  tone: "bg-muted text-muted-foreground",
};
export function AdminApp({
  currentUser,
  onSignOut,
}: {
  currentUser?: StaffUser;
  onSignOut?: () => void;
}) {
  const [page, setPage] = useState<Page>("overview");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const store = usePrototypeStore();
  const fillsWorkspace =
    page === "overview" || page === "trends" || page === "analytics";
  const isSettingsPage = settingsNav.some(([id]) => id === page);
  const selectPage = (nextPage: Page) => {
    setPage(nextPage);
    if (settingsNav.some(([id]) => id === nextPage)) setSettingsOpen(true);
  };
  const displayName = currentUser?.fullName || "Administrator";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();
  return (
    <div className="min-h-screen overflow-hidden bg-[#f4f7fb] lg:h-screen lg:min-h-0">
      <div className="grid min-h-screen lg:h-full lg:min-h-0 lg:grid-cols-[260px,minmax(0,1fr)]">
        <aside className="flex min-w-0 flex-col bg-gradient-to-b from-[#087fc9] via-[#0871bd] to-[#075caa] p-4 text-primary-foreground lg:h-full lg:overflow-hidden lg:p-5">
          <div className="mb-5 flex items-center gap-3 lg:mb-8">
            <img
              src={superHealthCenterLogo}
              alt="Jones Super Health Center seal"
              className="h-20 w-20 shrink-0 object-contain drop-shadow-md"
            />
            <div className="min-w-0">
              <p className="font-display text-xl font-bold">SmartServe</p>
              <p className="text-sm opacity-70">
                Super Health Center · Jones, Isabela
              </p>
            </div>
          </div>
          <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-[.16em] opacity-60 lg:block">
            Workspace
          </p>
          <nav
            className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible"
            aria-label="Administration navigation"
          >
            {workspaceNav.map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => selectPage(id)}
                className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-3 text-left text-base transition-colors lg:w-full ${page === id ? "bg-card text-primary shadow-card" : "text-primary-foreground/75 hover:bg-card/10"}`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
            <div className="shrink-0 lg:pt-1">
              <button
                type="button"
                onClick={() => setSettingsOpen((open) => !open)}
                aria-expanded={settingsOpen}
                aria-controls="settings-submenu"
                className={`flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-3 py-3 text-left text-base transition-colors ${isSettingsPage ? "bg-card/15 text-primary-foreground" : "text-primary-foreground/75 hover:bg-card/10"}`}
              >
                <Settings className="h-5 w-5" />
                <span className="flex-1">Settings</span>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${settingsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {settingsOpen ? (
                <div
                  id="settings-submenu"
                  className="mt-1 flex gap-1 border-primary-foreground/20 pl-3 lg:block lg:space-y-1 lg:border-l"
                >
                  {settingsNav.map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => selectPage(id)}
                      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm transition-colors lg:w-full ${page === id ? "bg-card text-primary shadow-soft" : "text-primary-foreground/75 hover:bg-card/10"}`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>
          <div className="mt-auto pt-6">
            {!settingsOpen ? (
              <div className="mb-4 hidden 2xl:block">
                <SidebarCalendar />
              </div>
            ) : null}
            <div className="relative">
              {accountMenuOpen ? (
                <div
                  id="admin-account-menu"
                  className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-2xl border border-primary-foreground/20 bg-card p-2 text-foreground shadow-card"
                >
                  <p className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
                    Signed in as
                  </p>
                  <p className="truncate px-2 pb-2 pt-1 text-sm font-semibold">
                    {displayName}
                  </p>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-expanded={accountMenuOpen}
                aria-controls="admin-account-menu"
                className="flex w-full items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-card/10 p-2 text-left transition-colors hover:bg-card/15"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-sm font-bold text-primary shadow-soft">
                  {initials || "AD"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {displayName}
                  </span>
                  <span className="block text-[10px] text-primary-foreground/70">
                    Administrator · account menu
                  </span>
                </span>
              </button>
            </div>
          </div>
        </aside>
        <main
          className={`min-w-0 bg-[#f4f7fb] lg:h-full ${fillsWorkspace ? "p-3 sm:p-4 xl:p-4 lg:overflow-y-hidden" : "p-4 sm:p-6 xl:p-8 lg:overflow-y-auto"}`}
        >
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
      className="rounded-2xl border border-primary-foreground/15 bg-card/10 p-3 backdrop-blur-sm"
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
  if (page === "settings") return <SettingsPage store={store} />;
  if (page === "analytics") return <AnalyticsPage store={store} />;
  if (page === "reports") return <ReportsPage store={store} />;
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
  if (page === "trends")
    return <DiseaseTrendsPage patients={patients} medicalRecords={medicalRecords} />;
  return null;
}

function DiseaseTrendsPage({ patients, medicalRecords }: any) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    diagnosis: "all",
    municipality: "all",
  });
  const records = useMemo(
    () =>
      medicalRecords.flatMap((record: any) => {
        const patient = patients.find((item: any) => item.id === record.patientId);
        return patient && patient.locationSource !== "Barangay fallback" && patient.locationVerified
          ? [
              {
                id: record.id,
                category: "Consultation diagnosis",
                diagnosis: record.diagnosis,
                date: record.date,
                count: 1,
                barangay: patient.mobileLocationBarangay || patient.barangay,
                municipality: patient.mobileLocationMunicipality || patient.municipality,
                latitude: patient.latitude,
                longitude: patient.longitude,
              },
            ]
          : [];
      }),
    [medicalRecords, patients],
  );
  const diagnoses = useMemo(
    () => [...new Set(records.map((record: any) => record.diagnosis))].sort(),
    [records],
  );
  const municipalities = useMemo(
    () => [...new Set(records.map((record: any) => record.municipality))].sort(),
    [records],
  );
  const filteredRecords = useMemo(
    () =>
      records.filter((record: any) => {
        if (filters.from && record.date < filters.from) return false;
        if (filters.to && record.date > filters.to) return false;
        if (filters.diagnosis !== "all" && record.diagnosis !== filters.diagnosis)
          return false;
        if (filters.municipality !== "all" && record.municipality !== filters.municipality)
          return false;
        return true;
      }),
    [filters, records],
  );
  const activeFilterCount = [
    filters.from,
    filters.to,
    filters.diagnosis !== "all" ? filters.diagnosis : "",
    filters.municipality !== "all" ? filters.municipality : "",
  ].filter(Boolean).length;
  const resetFilters = () =>
    setFilters({ from: "", to: "", diagnosis: "all", municipality: "all" });
  const exportTrendData = () => {
    const rows = [
      ["Date", "Diagnosis", "Barangay", "Municipality", "Recorded cases"],
      ...filteredRecords.map((record: any) => [
        record.date,
        record.diagnosis,
        record.barangay,
        record.municipality,
        record.count,
      ]),
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
    link.download = `smartserve-disease-trends-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const barangayOnlyCases = medicalRecords.length - records.length;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Head
        title="Disease trends"
        sub="Completed consultation diagnoses mapped from verified current locations captured when patients selected a service."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {activeFilterCount ? (
              <Badge className="border-0 bg-primary-soft text-primary">
                {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
              </Badge>
            ) : null}
            {activeFilterCount ? (
              <Button type="button" variant="ghost" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="disease-trend-filters"
            >
              <ListFilter className="mr-2 h-4 w-4" />
              {filtersOpen ? "Hide filters" : "Filter"}
            </Button>
            <Button type="button" onClick={exportTrendData} disabled={!filteredRecords.length}>
              <Download className="mr-2 h-4 w-4" />
              Export data
            </Button>
          </div>
        }
      />
      {filtersOpen ? (
        <section
          id="disease-trend-filters"
          className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DateFilter
              label="From date"
              value={filters.from}
              onChange={(from) => setFilters((current) => ({ ...current, from }))}
            />
            <DateFilter
              label="To date"
              value={filters.to}
              onChange={(to) => setFilters((current) => ({ ...current, to }))}
            />
            <SelectFilter
              label="Diagnosis"
              value={filters.diagnosis}
              onChange={(diagnosis) =>
                setFilters((current) => ({ ...current, diagnosis }))
              }
              options={[
                { value: "all", label: "All diagnoses" },
                ...diagnoses.map((diagnosis) => ({ value: diagnosis, label: diagnosis })),
              ]}
            />
            <SelectFilter
              label="Municipality"
              value={filters.municipality}
              onChange={(municipality) =>
                setFilters((current) => ({ ...current, municipality }))
              }
              options={[
                { value: "all", label: "All municipalities" },
                ...municipalities.map((municipality) => ({
                  value: municipality,
                  label: municipality,
                })),
              ]}
            />
          </div>
        </section>
      ) : null}
      {records.length ? (
        <DiseaseTrendMap records={filteredRecords} className="min-h-0 flex-1" />
      ) : (
        <Empty text="No completed consultation diagnosis with a verified map location has been recorded yet." />
      )}
      {barangayOnlyCases > 0 ? (
        <p className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {barangayOnlyCases} case{barangayOnlyCases === 1 ? "" : "s"} is
          recorded by barangay only or has an unverified pin, so it is
          intentionally excluded from the precise location map.
        </p>
      ) : null}
    </div>
  );
}
type DiagnosisSummary = {
  name: string;
  code: string;
  value: number;
  color: string;
};
type DashboardSlice = {
  name: string;
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
const dashboardChartColors = [
  "#0ea5e9",
  "#16a34a",
  "#2563eb",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
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

const serviceAcronym = (serviceName: string) => {
  const normalized = serviceName.trim().toLowerCase();
  const known: Record<string, string> = {
    "general consultation": "GC",
    "prenatal check-up": "PNC",
    "family planning": "FP",
    "mental health": "MH",
    "animal bite": "AB",
    "child immunization": "CI",
    "dental care": "DC",
  };
  if (known[normalized]) return known[normalized];
  const letters = serviceName
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
  } = store;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [serviceId, setServiceId] = useState("all");
  const [status, setStatus] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState({
    from: "",
    to: "",
    serviceId: "all",
    status: "all",
  });
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
  const patientProfileData = useMemo<DashboardSlice[]>(() => {
    const counts = patients.reduce((result: Record<string, number>, patient: any) => {
      const label = patient.gender || "Not recorded";
      result[label] = (result[label] || 0) + 1;
      return result;
    }, {});
    return Object.entries(counts)
      .map(([name, value], index) => ({
        name,
        value: Number(value),
        color: dashboardChartColors[index % dashboardChartColors.length],
      }))
      .sort((first, second) => second.value - first.value);
  }, [patients]);
  const workflowData = useMemo<DashboardSlice[]>(
    () =>
      statusData.map((item, index) => ({
        name: item.name,
        value: Number(item.value),
        color: dashboardChartColors[index % dashboardChartColors.length],
      })),
    [statusData],
  );
  const serviceUtilizationData = useMemo(
    () =>
      services
        .map((service: any) => ({
          name: service.name,
          shortName: serviceAcronym(service.name),
          appointments: filteredAppointments.filter(
            (appointment: any) => appointment.serviceId === service.id,
          ).length,
        }))
        .sort((first: any, second: any) => second.appointments - first.appointments)
        .slice(0, 6),
    [services, filteredAppointments],
  );
  const upcomingAppointments = useMemo(() => {
    const actionable = filteredAppointments.filter((appointment: any) =>
      !["Completed", "Consultation Completed", "Cancelled", "No Show"].includes(
        appointment.queueStatus,
      ),
    );
    const today = new Date().toISOString().slice(0, 10);
    const futureAppointments = actionable.filter(
      (appointment: any) => appointment.date >= today,
    );
    return [...(futureAppointments.length ? futureAppointments : actionable)]
      .sort((first: any, second: any) =>
        `${first.date} ${first.timeSlot}`.localeCompare(
          `${second.date} ${second.timeSlot}`,
        ),
      )
      .slice(0, 3);
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
    setFilterDraft({ from: "", to: "", serviceId: "all", status: "all" });
  };
  const applyFilters = () => {
    setFrom(filterDraft.from);
    setTo(filterDraft.to);
    setServiceId(filterDraft.serviceId);
    setStatus(filterDraft.status);
    setFiltersOpen(false);
  };
  const activeFilterCount = [
    from,
    to,
    serviceId !== "all" ? serviceId : "",
    status !== "all" ? status : "",
  ].filter(Boolean).length;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <section className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1
            className="min-w-0 flex-1 truncate font-display text-sm font-bold tracking-tight text-slate-800 xl:text-base"
            title="AN INTEGRATED WEB APPLICATION FOR SERVICE BOOKING WITH DISEASE TREND MONITORING IN SUPER HEALTH CENTER OF JONES, ISABELA"
          >
            AN INTEGRATED WEB APPLICATION FOR SERVICE BOOKING WITH DISEASE TREND MONITORING IN SUPER HEALTH CENTER OF JONES, ISABELA
          </h1>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {activeFilterCount ? (
            <Badge className="border-0 bg-primary-soft text-primary">
              {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
            </Badge>
          ) : null}
          {activeFilterCount ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="dashboard-filters"
          >
            <ListFilter className="mr-2 h-4 w-4" />
            {filtersOpen ? "Hide filters" : "Filter dashboard"}
          </Button>
          </div>
        </div>
        {filtersOpen ? (
          <form
            id="dashboard-filters"
            className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters();
            }}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">Dashboard filters</h2>
                <p className="text-sm text-muted-foreground">
                  Select a date range, service, or appointment status, then apply.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Reset
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DateFilter
                label="From date"
                value={filterDraft.from}
                onChange={(value) =>
                  setFilterDraft((draft) => ({ ...draft, from: value }))
                }
              />
              <DateFilter
                label="To date"
                value={filterDraft.to}
                onChange={(value) =>
                  setFilterDraft((draft) => ({ ...draft, to: value }))
                }
              />
              <SelectFilter
                label="Service"
                value={filterDraft.serviceId}
                onChange={(value) =>
                  setFilterDraft((draft) => ({ ...draft, serviceId: value }))
                }
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
                value={filterDraft.status}
                onChange={(value) =>
                  setFilterDraft((draft) => ({ ...draft, status: value }))
                }
                options={[
                  { value: "all", label: "All statuses" },
                  ...statuses.map((item: string) => ({ value: item, label: item })),
                ]}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="submit">
                <ListFilter className="mr-2 h-4 w-4" />
                Apply filters
              </Button>
            </div>
          </form>
        ) : null}
      </section>
      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
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
      <div className="grid min-h-0 flex-1 auto-rows-max gap-3 lg:grid-cols-3 lg:auto-rows-fr">
        <DashboardCard
          title="Appointment overview"
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-2 flex shrink-0 flex-wrap gap-3 text-xs font-medium">
              <span className="flex items-center gap-2">
                <i className="h-2 w-2 rounded-full bg-primary" />
                Appointments
              </span>
              <span className="flex items-center gap-2">
                <i className="h-2 w-2 rounded-full bg-accent" />
                Completed cases
              </span>
            </div>
            <div className="min-h-[130px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ left: -18, right: 12, top: 8, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
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
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    name="Appointments"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cases"
                    name="Completed cases"
                    stroke="hsl(var(--accent))"
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 0, fill: "hsl(var(--accent))" }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {!filteredAppointments.length && !filteredRecords.length && (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                No matching records yet — the chart is ready for the first clinic
                activity.
              </p>
            )}
          </div>
        </DashboardCard>
        <DashboardCard
          title="Patient statistics"
        >
          <div className="grid h-full min-h-[130px] flex-1 gap-4 sm:grid-cols-2">
            <DashboardDonut
              title="Patient profile"
              data={patientProfileData}
              emptyText="No registered patients yet."
            />
            <DashboardDonut
              title="Visit workflow"
              data={workflowData.filter((item) => item.value > 0)}
              emptyText="No matching appointments yet."
            />
          </div>
        </DashboardCard>
        <div className="contents">
        <DashboardCard
          title="Cases by diagnosis"
        >
          <div className="min-h-[130px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={diagnosisData}
                margin={{ left: -18, right: 12, top: 12, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="code"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fontWeight: 700 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
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
          </div>
        </DashboardCard>
        <DashboardCard
          title="Service utilization"
        >
          <div className="min-h-[130px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serviceUtilizationData}
                margin={{ left: -18, right: 8, top: 12, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="shortName"
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "hsl(var(--border))",
                  }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.name || "Service"}
                />
                <Bar dataKey="appointments" name="Appointments" radius={[7, 7, 2, 2]}>
                  {serviceUtilizationData.map((service: any, index: number) => (
                    <Cell
                      key={service.name}
                      fill={dashboardChartColors[index % dashboardChartColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
        </div>
        <div className="contents">
        <DashboardCard
          title="Upcoming appointments"
        >
          {upcomingAppointments.length ? (
            <div className="space-y-2">
              {upcomingAppointments.map((appointment: any) => {
                const patient = patients.find(
                  (item: any) => item.id === appointment.patientId,
                );
                const service = services.find(
                  (item: any) => item.id === appointment.serviceId,
                );
                return (
                  <div
                    key={appointment.id}
                    className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {patient?.fullName || patient?.patientNumber || "Patient record"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatChartDate(appointment.date)} · {appointment.timeSlot} · {service?.name || "Service"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary-soft px-2 py-1 text-xs font-semibold text-primary">
                      {appointment.queueStatus || "Scheduled"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <ChartEmpty text="No active appointments match the current filters." />
          )}
        </DashboardCard>
        <DashboardCard
          title="Alerts & notifications"
        >
          <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2">
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
      </div>
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
    </div>
  );
}
function AnalyticsPage({ store }: any) {
  const { appointments = [], medicalRecords = [], medicines = [], patients = [], services = [], staffUsers = [] } = store;
  const [range, setRange] = useState("all");
  const [area, setArea] = useState("all");
  const cutoff = useMemo(() => {
    if (range === "all") return "";
    const date = new Date();
    date.setDate(date.getDate() - Number(range) + 1);
    return date.toISOString().slice(0, 10);
  }, [range]);
  const serviceById = useMemo(
    () => new Map(services.map((service: any) => [service.id, service])),
    [services],
  );
  const matchesArea = useCallback(
    (item: any) => {
      if (area === "all") return true;
      const service = serviceById.get(item.serviceId);
      return (item.careArea || item.queueArea || service?.queueArea || "General Clinic") === area;
    },
    [area, serviceById],
  );
  const filteredAppointments = useMemo(
    () => appointments.filter((item: any) => (!cutoff || item.date >= cutoff) && matchesArea(item)),
    [appointments, cutoff, matchesArea],
  );
  const filteredRecords = useMemo(
    () => medicalRecords.filter((item: any) => (!cutoff || item.date >= cutoff) && matchesArea(item)),
    [medicalRecords, cutoff, matchesArea],
  );
  const activity = useMemo(() => {
    const dates = Array.from(
      new Set([...filteredAppointments, ...filteredRecords].map((item: any) => item.date).filter(Boolean)),
    ).sort();
    return dates.map((date) => ({
      date: new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
      appointments: filteredAppointments.filter((item: any) => item.date === date).length,
      completed: filteredRecords.filter((item: any) => item.date === date).length,
    }));
  }, [filteredAppointments, filteredRecords]);
  const serviceData = useMemo(
    () => services
      .map((service: any) => ({
        name: serviceAcronym(service.name),
        fullName: service.name,
        visits: filteredAppointments.filter((item: any) => item.serviceId === service.id).length,
      }))
      .filter((item: any) => item.visits > 0)
      .sort((a: any, b: any) => b.visits - a.visits)
      .slice(0, 6),
    [services, filteredAppointments],
  );
  const workflowData = useMemo(() => Object.entries(
    filteredAppointments.reduce((counts: Record<string, number>, item: any) => {
      const status = item.queueStatus || "Scheduled";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {}),
  ).map(([name, value], index) => ({ name, value, color: dashboardChartColors[index % dashboardChartColors.length] })), [filteredAppointments]);
  const diagnosisData = useMemo(() => Object.entries(
    filteredRecords.reduce((counts: Record<string, number>, item: any) => {
      const diagnosis = item.diagnosis?.trim() || "Not recorded";
      counts[diagnosis] = (counts[diagnosis] || 0) + 1;
      return counts;
    }, {}),
  ).map(([name, value]) => ({ name, code: diagnosisAcronym(name), value }))
    .sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 6), [filteredRecords]);
  const waiting = filteredAppointments.filter((item: any) => ["Waiting", "Waiting for Triage", "Triage", "Waiting for Doctor", "Called", "In Consultation", "Now Serving"].includes(item.queueStatus)).length;
  const present = filteredAppointments.filter((item: any) => item.attendanceStatus === "Present").length;
  const lowStock = medicines.filter((item: any) => item.stock <= item.reorderLevel).length;
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden [&>div:first-child]:mb-0">
      <Head
        title="Analytics"
        sub="Live service, queue, consultation, and stock performance summary."
        action={
          <div className="flex flex-wrap gap-2">
            <select value={range} onChange={(event) => setRange(event.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm font-medium">
              <option value="all">All recorded dates</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <select value={area} onChange={(event) => setArea(event.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm font-medium">
              <option value="all">All care areas</option>
              <option value="General Clinic">General Clinic</option>
              <option value="Animal Bite Center">Animal Bite Center</option>
            </select>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <Kpi label="Filtered appointments" value={filteredAppointments.length} />
        <Kpi label="Present check-ins" value={present} />
        <Kpi label="Completed checkups" value={filteredRecords.length} />
        <Kpi label="Currently in queue" value={waiting} />
        <Kpi label="Low-stock medicines" value={lowStock} />
        <Kpi label="Active staff accounts" value={staffUsers.filter((item: any) => item.active).length} />
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-4 gap-3 xl:grid-cols-2 xl:grid-rows-2">
        <Panel title="Appointment activity" className="mb-0 flex h-full min-h-0 flex-col p-4">
          <div className="min-h-0 flex-1">
            {activity.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={activity}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Line type="monotone" dataKey="appointments" name="Appointments" stroke="#0ea5e9" strokeWidth={3} /><Line type="monotone" dataKey="completed" name="Completed checkups" stroke="#16a34a" strokeWidth={3} /></LineChart></ResponsiveContainer> : <Empty text="No activity matches the selected filters." />}
          </div>
        </Panel>
        <Panel title="Visit workflow" className="mb-0 flex h-full min-h-0 flex-col p-4">
          <div className="flex min-h-0 flex-1 items-center">
            {workflowData.length ? <><div className="h-full w-3/5"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={workflowData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>{workflowData.map((item: any) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="space-y-2 text-sm">{workflowData.slice(0, 5).map((item: any) => <div key={item.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="max-w-36 truncate">{item.name}</span><b>{item.value}</b></div>)}</div></> : <Empty text="No queue workflow data matches the selected filters." />}
          </div>
        </Panel>
        <Panel title="Service utilization" className="mb-0 flex h-full min-h-0 flex-col p-4">
          <div className="min-h-0 flex-1">
            {serviceData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={serviceData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip formatter={(value: any, _name: any, context: any) => [value, context?.payload?.fullName || "Visits"]} /><Bar dataKey="visits" name="Visits" fill="#0ea5e9" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <Empty text="No service visits match the selected filters." />}
          </div>
        </Panel>
        <Panel title="Cases by diagnosis" className="mb-0 flex h-full min-h-0 flex-col p-4">
          <div className="min-h-0 flex-1">
            {diagnosisData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={diagnosisData} layout="vertical" margin={{ left: 8 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} fontSize={12} /><YAxis type="category" dataKey="code" width={45} fontSize={12} /><Tooltip formatter={(value: any, _name: any, context: any) => [value, context?.payload?.name || "Cases"]} /><Bar dataKey="value" name="Cases" fill="#8b5cf6" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer> : <Empty text="No completed diagnoses match the selected filters." />}
          </div>
        </Panel>
      </div>
    </div>
  );
}

type ReportKind = "appointments" | "patients" | "consultations" | "disease" | "inventory" | "audit";
const reportLabels: Record<ReportKind, string> = {
  appointments: "Appointment register",
  patients: "Patient registry",
  consultations: "Consultation register",
  disease: "Disease trend summary",
  inventory: "Inventory stock report",
  audit: "Operational audit trail",
};

function ReportsPage({ store }: any) {
  const [kind, setKind] = useState<ReportKind>("appointments");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [area, setArea] = useState("all");
  const { appointments = [], patients = [], medicalRecords = [], medicines = [], audit = [], services = [] } = store;
  const patientById = useMemo(() => new Map(patients.map((item: any) => [item.id, item])), [patients]);
  const serviceById = useMemo(() => new Map(services.map((item: any) => [item.id, item])), [services]);
  const inRange = (date: string) => (!from || date >= from) && (!to || date <= to);
  const matchesArea = (item: any) => area === "all" || (item.careArea || item.queueArea || serviceById.get(item.serviceId)?.queueArea || "General Clinic") === area;
  const report = useMemo(() => {
    if (kind === "appointments") {
      const rows = appointments.filter((item: any) => inRange(item.date) && matchesArea(item)).map((item: any) => {
        const patient = patientById.get(item.patientId);
        const service = serviceById.get(item.serviceId);
        return [item.date, item.timeSlot, patient?.patientNumber || "—", patient?.fullName || "Unknown patient", service?.name || "Unknown service", item.visitType || "Scheduled", item.attendanceStatus, item.queueNumber || "—", item.queueStatus, item.queueArea || service?.queueArea || "General Clinic"];
      });
      return { headers: ["Date", "Time", "Patient no.", "Patient name", "Service", "Visit type", "Attendance", "Queue no.", "Queue status", "Care area"], rows };
    }
    if (kind === "patients") {
      const rows = patients.map((item: any) => [item.patientNumber || item.id, item.fullName, item.gender || "—", item.dob || "—", item.contact || "—", item.addressLine || item.address || "—", item.barangay || "—", item.municipality || "—", item.province || "Isabela", item.postalCode || "—"]);
      return { headers: ["Patient no.", "Full name", "Sex", "Birth date", "Contact", "Address", "Barangay", "Municipality", "Province", "Postal code"], rows };
    }
    if (kind === "consultations") {
      const rows = medicalRecords.filter((item: any) => inRange(item.date) && matchesArea(item)).map((item: any) => {
        const patient = patientById.get(item.patientId);
        return [item.date, patient?.patientNumber || "—", patient?.fullName || "Unknown patient", item.careArea || "General Clinic", item.diagnosis || "Not recorded", item.clinician || "—", item.status || "—", item.followUpPlan?.date || "—", item.followUpPlan?.type || "—", item.notes || "—"];
      });
      return { headers: ["Date", "Patient no.", "Patient name", "Care area", "Diagnosis", "Clinician", "Dispensing status", "Follow-up date", "Follow-up type", "Clinical notes"], rows };
    }
    if (kind === "disease") {
      const grouped = medicalRecords.filter((item: any) => inRange(item.date) && matchesArea(item)).reduce((result: Record<string, any>, item: any) => {
        const patient = patientById.get(item.patientId);
        const key = [item.diagnosis || "Not recorded", patient?.barangay || "Not recorded", patient?.municipality || "Not recorded"].join("|");
        if (!result[key]) result[key] = [item.diagnosis || "Not recorded", patient?.barangay || "Not recorded", patient?.municipality || "Not recorded", 0];
        result[key][3] += 1;
        return result;
      }, {});
      return { headers: ["Diagnosis", "Barangay", "Municipality", "Completed cases"], rows: Object.values(grouped).sort((a: any, b: any) => b[3] - a[3]) };
    }
    if (kind === "inventory") {
      const rows = medicines.slice().sort((a: any, b: any) => a.name.localeCompare(b.name)).map((item: any) => [item.name, item.strength || "—", item.form || "—", item.category || "Medicine", item.inventoryArea || "General Pharmacy", item.stock, item.reorderLevel, item.stock <= item.reorderLevel ? "Low stock" : "In stock", item.batch || "—", item.expiry || "—", item.supplier || "—"]);
      return { headers: ["Item", "Strength", "Form", "Category", "Location", "Current stock", "Reorder level", "Stock status", "Batch", "Expiry", "Supplier"], rows };
    }
    const rows = audit.filter((item: any) => inRange(item.at?.slice(0, 10) || "")).map((item: any) => [item.at, item.role, item.action, item.reference]);
    return { headers: ["Recorded at", "Role", "Action", "Reference"], rows };
  }, [kind, appointments, patients, medicalRecords, medicines, audit, from, to, area, patientById, serviceById]);
  const download = () => {
    const csv = [report.headers, ...report.rows].map((row: any[]) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const file = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smartserve-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <style>{`@page { size: A4 landscape; margin: 12mm; } @media print { aside, .no-print { display: none !important; } main { height: auto !important; overflow: visible !important; padding: 0 !important; background: white !important; } .print-report { border: 0 !important; box-shadow: none !important; } .report-metadata { display: grid !important; grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 8px !important; } .report-table { min-width: 0 !important; table-layout: fixed !important; font-size: 8px !important; } .report-table th, .report-table td { white-space: normal !important; overflow-wrap: anywhere !important; padding: 5px !important; } .report-table tr { break-inside: avoid; } }`}</style>
      <div className="no-print mb-4 flex flex-wrap justify-end gap-2">
        <label className="sr-only" htmlFor="report-content">Report content</label>
        <select id="report-content" value={kind} onChange={(event) => setKind(event.target.value as ReportKind)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm font-medium">
          <option value="appointments">Appointment register</option>
          <option value="patients">Patient registry</option>
          <option value="consultations">Consultation register</option>
          <option value="disease">Disease trend summary</option>
          <option value="inventory">Inventory stock report</option>
          <option value="audit">Operational audit trail</option>
        </select>
        <Button variant="outline" onClick={() => window.print()}><FileText className="mr-2 h-4 w-4" />Print report</Button>
        <Button onClick={download}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
      </div>
      <section className="print-report overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-6 py-5"><div className="flex flex-wrap items-center justify-between gap-5"><div className="flex items-center gap-4"><img src={superHealthCenterLogo} alt="Jones Super Health Center seal" className="h-20 w-20 shrink-0 object-contain" /><div><p className="text-sm font-bold uppercase tracking-[.12em] text-primary">Super Health Center of Jones, Isabela</p><p className="mt-1 text-sm text-muted-foreground">Municipality of Jones · Province of Isabela</p><h2 className="mt-2 font-display text-2xl font-bold">{reportLabels[kind]}</h2></div></div><div className="flex items-center gap-3 text-right"><div><p className="text-sm font-bold uppercase tracking-[.1em] text-slate-700">Department of Health</p><p className="mt-1 text-xs text-muted-foreground">Republic of the Philippines</p></div><span className="grid h-14 w-14 place-items-center rounded-full border-2 border-primary/30 bg-primary-soft text-primary"><ShieldCheck className="h-7 w-7" aria-label="Department of Health identifier" /></span></div></div><div className="report-metadata mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-lg bg-muted px-3 py-2"><p className="text-xs text-muted-foreground">Date range</p><p className="mt-1 text-sm font-semibold">{from || "All recorded dates"}{to ? ` to ${to}` : ""}</p></div><div className="rounded-lg bg-muted px-3 py-2"><p className="text-xs text-muted-foreground">Care area</p><p className="mt-1 text-sm font-semibold">{area === "all" ? "All care areas" : area}</p></div><div className="rounded-lg bg-muted px-3 py-2"><p className="text-xs text-muted-foreground">Records included</p><p className="mt-1 text-sm font-semibold">{report.rows.length}</p></div><div className="rounded-lg bg-muted px-3 py-2"><p className="text-xs text-muted-foreground">Generated</p><p className="mt-1 text-sm font-semibold">{new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</p></div></div></div>
        <div className="overflow-x-auto"><table className="report-table w-full min-w-[760px] text-left text-sm"><thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground"><tr>{report.headers.map((header: string) => <th key={header} className="whitespace-nowrap px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody>{report.rows.length ? report.rows.map((row: any[], index: number) => <tr key={index} className="border-t border-border align-top">{row.map((cell: any, cellIndex: number) => <td key={cellIndex} className="max-w-72 px-4 py-3 leading-5">{String(cell ?? "—")}</td>)}</tr>) : <tr><td colSpan={report.headers.length} className="px-4 py-10 text-center text-muted-foreground">No records match the selected filters.</td></tr>}</tbody></table></div>
        <div className="border-t border-border px-6 py-3 text-xs text-muted-foreground">Confidential clinic record. Handle and store this report according to clinic privacy procedures.</div>
      </section>
    </div>
  );
}

function SettingsPage({ store }: any) {
  const [importOpen, setImportOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const exportOperationalData = () => {
    const patientById = new Map(
      store.patients.map((patient: any) => [patient.id, patient]),
    );
    const serviceById = new Map(
      store.services.map((service: any) => [service.id, service]),
    );
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
      ...store.appointments.map((appointment: any) => {
        const patient = patientById.get(appointment.patientId);
        const service = serviceById.get(appointment.serviceId);
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
      ...store.medicalRecords.map((record: any) => {
        const patient = patientById.get(record.patientId);
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
    link.download = `smartserve-operations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <Head
        title="Settings"
        sub="Import, export, and reset local prototype data."
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={() => setClearConfirmOpen(true)}>
              <DatabaseZap className="mr-2 h-4 w-4" />
              Clear patient data
            </Button>
            <Button onClick={exportOperationalData}>
              <Download className="mr-2 h-4 w-4" />
              Export data
            </Button>
          </div>
        }
      />
      <div className="grid gap-5 xl:grid-cols-3">
        <DashboardCard
          title="Import historical data"
          sub="Add a compatible SmartServe CSV without replacing existing data."
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Use this for verified historical patient, appointment, and checkup
            records during migration.
          </p>
          <Button className="mt-4" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Choose CSV file
          </Button>
        </DashboardCard>
        <DashboardCard
          title="Export clinic data"
          sub="Download the current appointment and completed-checkup records."
        >
          <p className="text-sm leading-6 text-muted-foreground">
            The export is a local CSV file for authorized clinic reporting and
            backup. It excludes account passwords.
          </p>
          <Button variant="outline" className="mt-4" onClick={exportOperationalData}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </DashboardCard>
        <DashboardCard
          title="Reset local prototype"
          sub="Remove locally stored prototype records from this browser."
        >
          <p className="text-sm leading-6 text-muted-foreground">
            This action removes local patient, appointment, consultation, and
            staff-account data. It cannot be undone.
          </p>
          <Button
            variant="outline"
            className="mt-4 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setClearConfirmOpen(true)}
          >
            <DatabaseZap className="mr-2 h-4 w-4" />
            Clear local data
          </Button>
        </DashboardCard>
      </div>
      <ImportMigrationDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={store.importMigration}
      />
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear local prototype data?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. All locally saved patient profiles,
              appointments, consultations, and staff accounts in this browser
              will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={store.reset}
            >
              Clear local data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
function DashboardDonut({
  title,
  data,
  emptyText,
}: {
  title: string;
  data: DashboardSlice[];
  emptyText: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <section className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-muted/20 p-2">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {total ? (
        <>
          <div className="relative mx-auto h-[clamp(6rem,15vh,11rem)] w-full max-w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={29}
                  outerRadius={43}
                  paddingAngle={data.length > 1 ? 3 : 0}
                  cornerRadius={5}
                  stroke="transparent"
                >
                  {data.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-display text-2xl font-bold text-slate-800">
                  {total}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  total
                </p>
              </div>
            </div>
          </div>
          <ul className="space-y-1">
            {data.slice(0, 2).map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                  <i
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-semibold text-slate-700">
                  {Math.round((item.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
      <div className="grid min-h-28 flex-1 place-items-center text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}
    </section>
  );
}
function DashboardCard({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: any;
}) {
  return (
    <section className="flex h-full min-w-0 min-h-0 flex-col rounded-2xl border border-border bg-card p-3 shadow-soft">
      <div className={sub ? "mb-2" : "mb-3"}>
        <h3 className="font-display text-base font-bold">{title}</h3>
        {sub ? (
          <p className="truncate text-sm text-muted-foreground" title={sub}>
            {sub}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="grid h-28 place-items-center rounded-xl border border-dashed border-border bg-muted/20 p-3 text-center text-sm text-muted-foreground">
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
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-1.5">
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
  const [selectedBarangayKey, setSelectedBarangayKey] = useState("");
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
    patients.forEach((patient: any) => {
      const name = patient.barangay?.trim() || "Unspecified barangay";
      const municipality = patient.municipality?.trim() || "Unspecified municipality";
      const key = `${normalizeBarangayName(municipality)}::${normalizeBarangayName(name)}`;
      const existing = directory.get(key);
      directory.set(key, {
        ...existing,
        key,
        name: existing?.name || name,
        municipality: existing?.municipality || municipality,
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
        (!selectedBarangayKey ||
          `${normalizeBarangayName(patient.municipality || "Unspecified municipality")}::${normalizeBarangayName(patient.barangay || "Unspecified barangay")}` ===
            selectedBarangayKey) &&
        [patient.fullName, patient.patientNumber, patient.contact]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("en-PH")
          .includes(patientQuery.trim().toLocaleLowerCase("en-PH")),
    )
    .sort((left: any, right: any) =>
      left.fullName.localeCompare(right.fullName, "en-PH"),
    );
  const selectedBarangay = barangays.find((barangay) => barangay.key === selectedBarangayKey);
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
        sub="Barangays appear automatically after a patient registers there."
      />
      {!selectedBarangayKey ? (
        <Panel title={`Barangay directory (${barangays.length})`}>
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
                      setSelectedBarangayKey(barangay.key);
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
                </div>
              ))}
            </div>
          ) : (
            <Empty text="No barangay matches your search." />
          )}
        </Panel>
      ) : (
        <Panel
          title={`Patients in ${selectedBarangay?.name || "barangay"} (${visiblePatients.length})`}
          action={
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Close patient list and return to barangay directory"
              title="Return to barangay directory"
              onClick={() => {
                setSelectedBarangayKey("");
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
function AppointmentPage({ appointments, patients, update }: any) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment: any) => {
        if (from && appointment.date < from) return false;
        if (to && appointment.date > to) return false;
        return true;
      }),
    [appointments, from, to],
  );
  const groupedByDate = useMemo(() => {
    const dates = new Map<string, Map<string, any[]>>();
    filteredAppointments.forEach((appointment: any) => {
      const patient = patients.find((item: any) => item.id === appointment.patientId);
      const barangay = patient?.mobileLocationBarangay || patient?.barangay || "Barangay not recorded";
      if (!dates.has(appointment.date)) dates.set(appointment.date, new Map());
      const barangays = dates.get(appointment.date)!;
      if (!barangays.has(barangay)) barangays.set(barangay, []);
      barangays.get(barangay)!.push(appointment);
    });
    return [...dates.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([date, barangays]) => ({
        date,
        barangays: [...barangays.entries()].sort(([first], [second]) =>
          first.localeCompare(second),
        ),
      }));
  }, [filteredAppointments, patients]);
  const clearFilters = () => {
    setFrom("");
    setTo("");
  };
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  return (
    <>
      <Head
        title="Appointments"
        sub="View and manage scheduled visits by date and barangay."
        action={
          <div className="flex items-center gap-2">
            {from || to ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="appointment-filters"
            >
              <ListFilter className="mr-2 h-4 w-4" />
              {filtersOpen ? "Hide filter" : "Filter dates"}
            </Button>
          </div>
        }
      />
      {filtersOpen ? (
        <section
          id="appointment-filters"
          className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-soft"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <DateFilter label="From date" value={from} onChange={setFrom} />
            <DateFilter label="To date" value={to} onChange={setTo} />
          </div>
        </section>
      ) : null}
      <Panel title={`Visits · ${filteredAppointments.length} appointment${filteredAppointments.length === 1 ? "" : "s"}`}>
        {groupedByDate.length ? (
          <div className="space-y-5">
            {groupedByDate.map(({ date, barangays }) => (
              <section key={date}>
                <div className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-2">
                  <h3 className="font-display text-lg font-bold">{formatDate(date)}</h3>
                  <Badge variant="secondary">
                    {barangays.reduce((total, [, items]) => total + items.length, 0)} appointment{barangays.reduce((total, [, items]) => total + items.length, 0) === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {barangays.map(([barangay, items]) => {
                    const folderKey = `${date}:${barangay}`;
                    const expanded = expandedFolders[folderKey];
                    return (
                      <div key={folderKey} className="overflow-hidden rounded-xl border border-border">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedFolders((current) => ({
                              ...current,
                              [folderKey]: !current[folderKey],
                            }))
                          }
                          aria-expanded={expanded}
                          className="flex w-full items-center gap-3 bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <Folder className="h-5 w-5 shrink-0 text-primary" />
                          <span className="min-w-0 flex-1 truncate font-semibold">{barangay}</span>
                          <Badge className="border-0 bg-primary-soft text-primary">
                            {items.length}
                          </Badge>
                          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                        </button>
                        {expanded ? (
                          <div className="px-4">
                            {items.map((appointment: any) => {
                              const patient = patients.find((item: any) => item.id === appointment.patientId);
                              return (
                                <Row
                                  key={appointment.id}
                                  title={`${patient?.fullName || "Unknown patient"} · ${appointment.queueNumber || "No number"}`}
                                  detail={`${appointment.timeSlot || "Time not set"} · ${appointment.queueStatus}`}
                                  badge={appointment.visitType || "Scheduled"}
                                  actions={
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const nextDate = window.prompt("Date (YYYY-MM-DD)", appointment.date);
                                        if (nextDate) update(appointment.id, { date: nextDate });
                                      }}
                                    >
                                      Reschedule
                                    </Button>
                                  }
                                />
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <Empty text={appointments.length ? "No visits match the selected date range." : "No visits yet."} />
        )}
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
  const emptyMedicine = { name: "", strength: "", form: "Tablet", stock: 0, reorderLevel: 0, expiry: "", batch: "", inventoryArea: "General Pharmacy", category: "Medicine" };
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>(emptyMedicine);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [medicineQuery, setMedicineQuery] = useState("");
  const openAdd = () => { setEditingId(null); setDraft({ ...emptyMedicine }); setEditorOpen(true); };
  const openEdit = (medicine: any) => { setEditingId(medicine.id); setDraft({ ...emptyMedicine, ...medicine }); setEditorOpen(true); };
  const saveMedicine = () => {
    if (!draft.name.trim()) return;
    const payload = { ...draft, name: draft.name.trim(), stock: Math.max(0, Number(draft.stock) || 0), reorderLevel: Math.max(0, Number(draft.reorderLevel) || 0), expiry: draft.expiry.trim() || "Not set", batch: draft.batch.trim() || "Not set" };
    if (editingId) update(editingId, payload);
    else add(payload);
    setEditorOpen(false);
  };
  const visibleMedicines = medicines
    .filter((medicine: any) =>
      [medicine.name, medicine.strength, medicine.category, medicine.inventoryArea]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("en-PH")
        .includes(medicineQuery.trim().toLocaleLowerCase("en-PH")),
    )
    .toSorted((left: any, right: any) =>
      `${left.name} ${left.strength}`.localeCompare(`${right.name} ${right.strength}`, "en-PH"),
    );
  const lowStockMedicines = medicines
    .filter((medicine: any) => medicine.stock <= (medicine.reorderLevel || 0))
    .toSorted((left: any, right: any) => left.stock - right.stock || left.name.localeCompare(right.name, "en-PH"));
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
              onClick={openAdd}
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
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Panel title={`Medicine items (${visibleMedicines.length})`}>
          <div className="mb-4 max-w-xl">
            <Label htmlFor="medicine-search">Search medicine</Label>
            <Input id="medicine-search" value={medicineQuery} onChange={(event) => setMedicineQuery(event.target.value)} placeholder="Name, strength, category, or storage area" className="mt-1" />
          </div>
          {visibleMedicines.length ? visibleMedicines.map((m: any) => (
            <div key={m.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)_6rem_auto] items-center gap-3 border-b border-border py-3 last:border-0">
              <Button size="icon" variant="ghost" aria-label={`Edit ${m.name}`} title="Edit medicine" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
              <div className="min-w-0"><p className="font-medium truncate">{m.name} {m.strength}</p><p className="text-xs text-muted-foreground">{m.form} · Batch {m.batch} · {m.inventoryArea || "General Pharmacy"}</p></div>
              <div className="text-center"><p className="font-display text-lg font-bold">{m.stock}</p><p className="text-[11px] text-muted-foreground">in stock</p></div>
              <Badge className="bg-primary-soft text-primary border-0">{m.category || "Medicine"}</Badge>
            </div>
          )) : <Empty text="No medicine matches your search." />}
        </Panel>
        <Panel title={`Low-stock medicines (${lowStockMedicines.length})`}>
          <p className="mb-3 text-sm text-muted-foreground">Items at or below their reorder level. Select an item to update stock.</p>
          {lowStockMedicines.length ? lowStockMedicines.map((m: any) => (
            <button key={m.id} type="button" onClick={() => openEdit(m)} className="mb-2 flex w-full items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-left transition-smooth hover:border-destructive/45">
              <span className="min-w-0"><span className="block truncate font-medium">{m.name} {m.strength}</span><span className="text-xs text-muted-foreground">Reorder at {m.reorderLevel} · {m.inventoryArea || "General Pharmacy"}</span></span>
              <span className="shrink-0 text-right"><span className="block font-display text-xl font-bold text-destructive">{m.stock}</span><span className="text-[11px] text-muted-foreground">in stock</span></span>
            </button>
          )) : <Empty text="All medicines are above their reorder levels." />}
        </Panel>
      </div>
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Edit medicine" : "Add medicine"}</DialogTitle><DialogDescription>Record the medicine details, stock level, batch, expiry, and storage area.</DialogDescription></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Medicine name" value={draft.name} onChange={(v) => setDraft((d: any) => ({ ...d, name: v }))} />
            <Field label="Strength" value={draft.strength} onChange={(v) => setDraft((d: any) => ({ ...d, strength: v }))} />
            <Field label="Form (tablet, vial, etc.)" value={draft.form} onChange={(v) => setDraft((d: any) => ({ ...d, form: v }))} />
            <Field label="Batch / lot number" value={draft.batch} onChange={(v) => setDraft((d: any) => ({ ...d, batch: v }))} />
            <Field label="Expiry date" value={draft.expiry} onChange={(v) => setDraft((d: any) => ({ ...d, expiry: v }))} />
            <div><Label>Stock quantity</Label><Input type="number" min="0" value={draft.stock} onChange={(e) => setDraft((d: any) => ({ ...d, stock: e.target.value }))} className="mt-1" /></div>
            <div><Label>Low-stock threshold</Label><Input type="number" min="0" value={draft.reorderLevel} onChange={(e) => setDraft((d: any) => ({ ...d, reorderLevel: e.target.value }))} className="mt-1" /></div>
            <div><Label>Storage area</Label><select value={draft.inventoryArea} onChange={(e) => setDraft((d: any) => ({ ...d, inventoryArea: e.target.value }))} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>General Pharmacy</option><option>Animal Bite Center</option></select></div>
            <div><Label>Category</Label><select value={draft.category} onChange={(e) => setDraft((d: any) => ({ ...d, category: e.target.value }))} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Medicine</option><option>Vaccine</option><option>Immunoglobulin</option><option>Supply</option></select></div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {editingId ? <Button type="button" variant="destructive" onClick={() => { if (window.confirm(`Delete ${draft.name}?`)) { remove(editingId); setEditorOpen(false); } }}><Trash2 className="mr-2 h-4 w-4" />Delete</Button> : <span />}
            <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button><Button type="button" onClick={saveMedicine} disabled={!draft.name.trim()}>Save medicine</Button></div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  className = "",
}: {
  title: string;
  action?: any;
  children: any;
  className?: string;
}) {
  return (
    <section className={`mb-5 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft ${className}`}>
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
  const item = kpiPresentation[label] || defaultKpiPresentation;
  const Icon = item.Icon;
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-card p-2.5 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-4 text-muted-foreground">
          {label}
        </p>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold leading-none text-slate-800">
        {value}
      </p>
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="p-5 text-center text-sm text-muted-foreground">{text}</p>
  );
}
