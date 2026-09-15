import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ClipboardPlus,
  Clock,
  MapPin,
  Phone,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type Appointment, type Patient, type Service } from "@/data/mockData";
import {
  LocationPickerMap,
  type PinnedLocation,
} from "@/components/LocationPickerMap";
import { usePrototypeStore, type StaffUser } from "@/lib/prototype-store";
import { calculateAge } from "@/lib/patient-age";
import { reverseGeocodePhilippineAddress } from "@/lib/location-address";
import { appointmentPriority, orderDoctorQueue } from "@/lib/queue-priority";

type FrontDeskTab = "checkin" | "intake" | "queue";
export type CareArea = "General Clinic" | "Animal Bite Center";
export type QueueDisplayAppointment = Pick<
  Appointment,
  | "id"
  | "queueNumber"
  | "queueStatus"
  | "room"
  | "triagePriority"
  | "queueArea"
  | "queueEnteredAt"
  | "createdAt"
>;
export type QueueDisplayState = {
  appointments: QueueDisplayAppointment[];
  updatedAt: string;
};

export const createPublicQueueSnapshot = (
  appointments: Appointment[],
  area?: CareArea,
): QueueDisplayState => ({
  appointments: appointments
    .filter(
      (appointment) =>
        Boolean(appointment.queueNumber) &&
        (!area || (appointment.queueArea || "General Clinic") === area),
    )
    .map(
      ({
        id,
        queueNumber,
        queueStatus,
        room,
        triagePriority,
        queueArea,
        queueEnteredAt,
        createdAt,
      }) => ({
        id,
        queueNumber,
        queueStatus,
        room,
        triagePriority,
        queueArea,
        queueEnteredAt,
        createdAt,
      }),
    ),
  updatedAt: new Date().toISOString(),
});

// Each care area publishes only its own queue. This stops a General Clinic
// workspace from replacing the Animal Bite TV feed (and vice versa).
export const publishPublicQueueArea = (
  appointments: Appointment[],
  area: CareArea,
) => {
  const snapshot = createPublicQueueSnapshot(appointments, area);
  return fetch("/api/queue-display", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...snapshot, area }),
  });
};
const label = (patients: Patient[], id: string) =>
  patients.find((p) => p.id === id)?.fullName || "Unknown patient";
const normalizePatientIdentity = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("en-PH")
    .replace(/[^a-z0-9]/g, "");

type LocationSource =
  "Auto-pinned from address" | "Staff-adjusted";
type AddressCandidate = PinnedLocation & { displayName: string };
type NominatimSearchResult = { lat: string; lon: string; display_name: string };

async function searchAddressCandidates(
  address: string,
  signal?: AbortSignal,
): Promise<AddressCandidate[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=ph&accept-language=en&q=${encodeURIComponent(address)}`,
    { signal },
  );

  if (!response.ok) throw new Error("Address search is unavailable");
  const results = (await response.json()) as NominatimSearchResult[];

  return results
    .map((result) => ({
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      displayName: result.display_name,
    }))
    .filter(
      (result) =>
        Number.isFinite(result.latitude) && Number.isFinite(result.longitude),
    );
}

export function StaffApp({ currentUser }: { currentUser?: StaffUser }) {
  const [tab, setTab] = useState<FrontDeskTab>("checkin");
  const store = usePrototypeStore();
  const staffUser = currentUser ? store.staffUsers.find((user) => user.id === currentUser.id) : undefined;
  // A staff account has one clinic assignment. Legacy accounts tagged for Animal Bite
  // Center are routed there so their workspace never mixes general-clinic cases.
  const careArea: CareArea = staffUser?.assignedAreas?.includes("Animal Bite Center")
    ? "Animal Bite Center"
    : "General Clinic";
  const isAnimalBiteWorkspace = careArea === "Animal Bite Center";
  const isNurseTriage = staffUser?.role === "Nurse / Triage";
  useEffect(() => {
    void publishPublicQueueArea(store.appointments, careArea).catch(
      () => undefined,
    );
  }, [store.appointments, careArea]);
  const frontDeskTabs = [
    { id: "checkin" as FrontDeskTab, label: isAnimalBiteWorkspace ? "Bite Patient Check-in" : "Scheduled Check-in", icon: UserCheck },
    {
      id: "intake" as FrontDeskTab,
      label: "Register / verify & walk-in",
      icon: UserPlus,
    },
    { id: "queue" as FrontDeskTab, label: isAnimalBiteWorkspace ? "Animal Bite Queue" : "Queue Control", icon: Activity },
  ];
  return (
    <div className="space-y-6">
      <div className="text-center max-w-3xl mx-auto">
        <Badge
          variant="secondary"
          className="mb-2 bg-secondary-soft text-secondary border-0"
        >
          {isAnimalBiteWorkspace ? "Animal Bite Center" : "SmartServe General Clinic"} · {isNurseTriage ? "Nurse / Triage workspace" : "Front desk workspace"} · local prototype
        </Badge>
        <h2 className="text-2xl md:text-3xl font-display font-bold">
          {isNurseTriage
            ? isAnimalBiteWorkspace
              ? "Animal Bite assessment before doctor handoff"
              : "Patient assessment before doctor handoff"
            : isAnimalBiteWorkspace
              ? "Animal Bite patient intake and queue"
              : "General Clinic patient intake and queue"}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {isNurseTriage
            ? isAnimalBiteWorkspace
              ? "Only Animal Bite Center patients appear here. Complete the required bite assessment before doctor handoff."
              : "Only General Clinic patients awaiting triage appear here. Record the assessment before doctor handoff."
            : isAnimalBiteWorkspace
              ? "Check in, register or verify, add Animal Bite walk-ins, and manage only the Animal Bite queue."
              : "Check in, register or verify, add General Clinic walk-ins, and manage only the General Clinic queue."}
        </p>
      </div>
      {isNurseTriage ? (
        <TriageForm area={careArea} />
      ) : (
        <>
          <div className="flex justify-center">
            <div className="inline-flex flex-wrap justify-center p-1 bg-muted rounded-2xl">
              {frontDeskTabs.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
                      tab === item.id
                        ? "bg-card text-primary shadow-soft"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          {tab === "checkin" && (
            <Checkin
              appts={store.appointments}
              patients={store.patients}
              services={store.services}
              checkIn={store.checkIn}
              markAbsent={store.markAbsent}
              area={careArea}
            />
          )}
          {tab === "intake" && <FrontDeskIntake services={store.services} area={careArea} />}
          {tab === "queue" && (
            <Queue appts={store.appointments} patients={store.patients} call={store.callNext} absent={store.markAbsent} area={careArea} />
          )}
        </>
      )}
    </div>
  );
}

const displayPriorityRank = {
  Emergency: 0,
  Urgent: 1,
  Priority: 2,
  Normal: 3,
} as const;
const displayQueueNumberRank = (queueNumber: string) => {
  const value = Number.parseInt(queueNumber.replace(/\D/g, ""), 10);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
};
const orderPublicDoctorQueue = (appointments: QueueDisplayAppointment[]) =>
  appointments
    .filter((appointment) => appointment.queueStatus === "Waiting for Doctor")
    .toSorted((left, right) => {
      const priorityDifference =
        displayPriorityRank[left.triagePriority || "Normal"] -
        displayPriorityRank[right.triagePriority || "Normal"];
      if (priorityDifference) return priorityDifference;
      return displayQueueNumberRank(left.queueNumber) - displayQueueNumberRank(right.queueNumber);
    });

function Board({
  appts,
  now,
  area = "General Clinic",
}: {
  appts: QueueDisplayAppointment[];
  now: Date;
  area?: "General Clinic" | "Animal Bite Center";
}) {
  const areaAppointments = appts.filter((appointment) => (appointment.queueArea || "General Clinic") === area);
  const called = appts.filter(
    (appointment) =>
      (appointment.queueArea || "General Clinic") === area &&
      ["Called", "In Consultation"].includes(appointment.queueStatus),
  );
  const triageWaiting = areaAppointments
    .filter((appointment) => appointment.queueStatus === "Waiting for Triage")
    .sort((left, right) =>
      left.queueNumber.localeCompare(right.queueNumber, undefined, {
        numeric: true,
      }),
    );
  const upNext = [...orderPublicDoctorQueue(areaAppointments), ...triageWaiting];

  return (
    <div className="tv-frame max-w-[1200px]">
      <div className="bg-gradient-tv text-primary-foreground p-6 md:p-8">
        <div className="flex justify-between mb-6">
          <div>
            <h2 className="font-display font-extrabold text-xl md:text-2xl">
              {area === "Animal Bite Center" ? "ANIMAL BITE CENTER" : "SUPER HEALTH CENTER"}
            </h2>
            <p className="text-xs text-primary-foreground/60 uppercase">
              Jones, Isabela · {area === "Animal Bite Center" ? "Animal Bite" : "SmartServe"} privacy-safe live queue
            </p>
          </div>
          <p className="font-display font-bold text-2xl">
            {now.toLocaleTimeString("en-PH", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {called.length ? (
            called.map((a) => (
              <div
                key={a.id}
                className="bg-gradient-primary rounded-2xl p-6 shadow-glow"
              >
                <p className="text-xs uppercase opacity-80">Now serving</p>
                <p className="font-display font-extrabold text-7xl my-1">
                  {a.queueNumber}
                </p>
                <p className="text-sm opacity-90">
                  Please proceed to {a.room || "the assigned room"}
                </p>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 bg-card/5 rounded-2xl p-10 text-center text-primary-foreground/60">
              No queue number is currently being served.
            </div>
          )}
        </div>
        <div className="bg-card/5 rounded-2xl p-5">
          <h3 className="font-display font-bold text-lg mb-3">Up next</h3>
          {upNext.map((a, i) => (
            <div
              key={a.id}
              className="flex gap-3 bg-card/5 rounded-xl p-3 mb-2"
            >
              <span className="font-display font-bold text-2xl text-secondary w-20">
                {a.queueNumber}
              </span>
              <div>
                <p className="font-semibold">Queue position #{i + 1}</p>
                <p className="text-xs text-primary-foreground/60">
                  {a.queueStatus === "Waiting for Triage"
                    ? "Triage"
                    : "Consultation"}
                </p>
              </div>
            </div>
          ))}
          {!upNext.length && (
            <p className="text-primary-foreground/50">Queue is clear.</p>
          )}
        </div>
        <p className="text-center text-xs text-primary-foreground/50 mt-6">
          Please listen for your queue number. Patient names are not displayed
          on this monitor.
        </p>
      </div>
    </div>
  );
}

export function QueueTvDisplay({ area: forcedArea }: { area?: CareArea }) {
  const [now, setNow] = useState(new Date());
  const [queue, setQueue] = useState<QueueDisplayState>({
    appointments: [],
    updatedAt: "",
  });
  const [connection, setConnection] = useState("Connecting to the local SmartServe queue…");
  const area = forcedArea || (new URLSearchParams(window.location.search).get("area") === "animal-bite" ? "Animal Bite Center" : "General Clinic");

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/queue-display", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Queue display is unavailable");
        const state = (await response.json()) as QueueDisplayState;
        if (!active) return;
        setQueue({
          appointments: Array.isArray(state.appointments)
            ? state.appointments
            : [],
          updatedAt: state.updatedAt || "",
        });
        setConnection(
          state.updatedAt
            ? `Live local queue · last staff update ${new Date(state.updatedAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
            : "Waiting for the staff queue workspace to publish the first update.",
        );
      } catch {
        if (active)
          setConnection("Waiting for the local SmartServe server. Keep this TV on the same clinic network.");
      }
    };
    void refresh();
    const poll = window.setInterval(() => void refresh(), 2500);
    return () => {
      active = false;
      window.clearInterval(poll);
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-3 md:p-6">
      <Board appts={queue.appointments} now={now} area={area} />
      <p className="mt-3 text-center text-xs text-slate-400">{connection}</p>
    </main>
  );
}

function Checkin({ appts, patients, services, checkIn, markAbsent, area }: any) {
  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const scheduled = appts.filter((appointment: Appointment) => {
    const service = services.find(
      (item: Service) => item.id === appointment.serviceId,
    );
    const appointmentArea = service?.queueArea || appointment.queueArea || "General Clinic";
    return (
      appointment.visitType === "Scheduled" &&
      appointment.queueStatus === "Scheduled" &&
      appointmentArea === area
    );
  });
  return (
    <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden max-w-5xl mx-auto">
      <div className="p-5 border-b border-border">
        <h3 className="font-display font-bold text-lg">
          {area === "Animal Bite Center" ? "Animal Bite patient check-in" : "Scheduled patient check-in"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Verify the booking and identity privately, then input the physical
          number issued to the patient.
        </p>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </div>
      {scheduled.map((a: Appointment) => (
        <div
          key={a.id}
          className="flex flex-col md:flex-row md:items-center gap-3 p-4 border-b border-border"
        >
          <span className="font-display font-bold text-primary w-16">
            {a.queueNumber || "—"}
          </span>
          <div className="flex-1">
            <p className="font-semibold">{label(patients, a.patientId)}</p>
            <p className="text-xs text-muted-foreground">
              {services.find((s: Service) => s.id === a.serviceId)?.name} ·{" "}
              {a.attendanceStatus}
            </p>
          </div>
          {a.attendanceStatus !== "Present" && (
            <Input
              value={numbers[a.id] || ""}
              onChange={(e) =>
                setNumbers((x) => ({ ...x, [a.id]: e.target.value }))
              }
              placeholder="001–100"
              className="md:w-28"
            />
          )}
          <Button
            size="sm"
            disabled={
              a.attendanceStatus === "Present" || !(numbers[a.id] || "").trim()
            }
            onClick={() =>
              checkIn(a.id, numbers[a.id])
                ? setError("")
                : setError("Use a unique active queue number from 001 to 100.")
            }
          >
            <UserCheck className="w-4 h-4 mr-1" />
            Confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={a.attendanceStatus === "Present"}
            onClick={() => markAbsent(a.id)}
          >
            Absent
          </Button>
        </div>
      ))}
      {!scheduled.length ? (
        <p className="p-5 text-sm text-muted-foreground">
          No scheduled {area === "Animal Bite Center" ? "Animal Bite" : "General Clinic"} appointments are awaiting check-in.
        </p>
      ) : null}
    </div>
  );
}

function FrontDeskIntake({ services, area }: { services: Service[]; area: CareArea }) {
  const [mode, setMode] = useState<"register" | "walkin">("register");
  const [newlyRegisteredPatientId, setNewlyRegisteredPatientId] = useState("");
  const isAnimalBiteWorkspace = area === "Animal Bite Center";
  const areaServices = services.filter((service) => (service.queueArea || "General Clinic") === area);
  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid md:grid-cols-2 gap-3 mb-5">
        <Action
          active={mode === "register"}
          icon={UserPlus}
          title="Register / verify patient"
          description="Create or find the shared permanent patient record."
          onClick={() => setMode("register")}
        />
        <Action
          active={mode === "walkin"}
          icon={Users}
          title={isAnimalBiteWorkspace ? "Add Animal Bite walk-in" : "Add registered walk-in"}
          description={isAnimalBiteWorkspace ? "Issue a number only for Animal Bite Center care." : "Find an existing patient and issue a queue number."}
          onClick={() => setMode("walkin")}
        />
      </div>
      {mode === "register" && (
        <RegistrationForm
          onRegistered={(patientId) => {
            setNewlyRegisteredPatientId(patientId);
            setMode("walkin");
          }}
        />
      )}{" "}
      {mode === "walkin" && (
        <WalkInForm
          services={areaServices}
          area={area}
          initialPatientId={newlyRegisteredPatientId}
        />
      )}
    </div>
  );
}
function Action({ active, icon: Icon, title, description, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-2xl border p-4 transition-smooth",
        active
          ? "border-primary bg-primary-soft shadow-soft"
          : "border-border bg-card hover:bg-muted/50",
      )}
    >
      <Icon className="w-5 h-5 text-primary mb-3" />
      <p className="font-display font-bold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </button>
  );
}

function RegistrationTextInput({
  id,
  label,
  value,
  onChange,
  required = false,
  type = "text",
  inputMode,
  maxLength,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "date" | "email";
  inputMode?: "numeric" | "tel" | "email";
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input
        id={id}
        type={type}
        required={required}
        max={
          type === "date" ? new Date().toISOString().slice(0, 10) : undefined
        }
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1"
      />
    </div>
  );
}

function RegistrationForm({ onRegistered }: { onRegistered: (patientId: string) => void }) {
  const { patients, registerPatient } = usePrototypeStore();
  const [form, setForm] = useState({
    givenName: "",
    familyName: "",
    middleName: "",
    suffix: "",
    dob: "",
    gender: "Female" as Patient["gender"],
    contact: "",
    alternateContact: "",
    email: "",
    addressLine: "",
    barangay: "",
    municipality: "",
    province: "",
    postalCode: "",
    civilStatus: "",
    nationality: "Filipino",
    preferredLanguage: "Filipino",
    philHealthClientType: "Not enrolled" as NonNullable<
      Patient["philHealthClientType"]
    >,
    philHealthPin: "",
    philHealthMemberName: "",
    philHealthMemberPin: "",
    guardianName: "",
    guardianRelationship: "",
    guardianContact: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    consentToTreatment: false,
    privacyAcknowledged: false,
  });
  const [pin, setPin] = useState<PinnedLocation | null>(null);
  const [pinStatus, setPinStatus] = useState(
    "Enter the residence address to locate it, then place or adjust the pin with the patient.",
  );
  const [candidates, setCandidates] = useState<AddressCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationSource, setLocationSource] = useState<LocationSource>(
    "Auto-pinned from address",
  );
  const [locationVerified, setLocationVerified] = useState(false);
  const [verifiedAddress, setVerifiedAddress] = useState("");
  const [locationDetailsStatus, setLocationDetailsStatus] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const fullName = [
    form.givenName,
    form.middleName,
    form.familyName,
    form.suffix,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const address = [
    form.addressLine,
    form.barangay,
    form.municipality,
    form.province,
    form.postalCode,
    "Philippines",
  ]
    .filter(Boolean)
    .join(", ");
  // Barangay is a form label rather than part of the locality name in many
  // OpenStreetMap records (for example, "Baluarte" rather than
  // "Barangay Baluarte"). Keep the recorded address unchanged, but remove
  // that label from the search query so the entered address resolves reliably.
  const addressSearchQuery = [
    form.addressLine,
    form.barangay.replace(/^\s*barangay\s+/i, ""),
    form.municipality,
    form.province,
    form.postalCode,
    "Philippines",
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
  const addressReady = Boolean(
    form.addressLine.trim() &&
      form.barangay.trim() &&
      form.municipality.trim() &&
      form.province.trim() &&
      form.postalCode.trim(),
  );
  const age = calculateAge(form.dob);
  const requiresGuardian = age !== null && age < 18;
  const set = (key: string, value: any) => {
    if (
      ["addressLine", "barangay", "municipality", "province", "postalCode"].includes(
        key,
      )
    ) {
      setLocationVerified(false);
      setVerifiedAddress("");
      setCandidates([]);
      setPin(null);
    }
    setForm((current) => ({ ...current, [key]: value }));
  };
  const fillDetectedLocationDetails = async (location: PinnedLocation) => {
    setLocationDetailsStatus(
      "Looking up the province, municipality, barangay, and postal code…",
    );
    try {
      const details = await reverseGeocodePhilippineAddress(location);
      setForm((current) => ({
        ...current,
        barangay: details.barangay || current.barangay,
        municipality: details.municipality || current.municipality,
        province: details.province || current.province,
        postalCode: details.postalCode || current.postalCode,
      }));
      const updated = [
        details.province && "province",
        details.municipality && "municipality",
        details.barangay && "barangay",
        details.postalCode && "postal code",
      ].filter(Boolean);
      setLocationDetailsStatus(
        updated.length
          ? updated.join(", ") +
              " auto-filled from the selected location. Please review the details."
          : "The location was saved, but the area details were not available. Please complete them manually.",
      );
    } catch {
      setLocationDetailsStatus(
        "The location was saved, but area details could not be found. Please complete them manually.",
      );
    }
  };
  const hasUsableLocation =
    Boolean(pin) && locationVerified && verifiedAddress === address;
  const searchLocation = async () => {
    if (!addressReady) {
      setCandidates([]);
      setPinStatus(
        "Complete the house or street, barangay, municipality or city, province, and postal code before searching.",
      );
      return;
    }
    setIsSearching(true);
    setCandidates([]);
    setPin(null);
    setLocationVerified(false);
    setVerifiedAddress("");
    setPinStatus("Searching for the entered Philippine residence address…");
    try {
      const results = await searchAddressCandidates(addressSearchQuery);
      if (!results.length) {
        setPinStatus(
          "No exact address match was found. Tap the map to place the residence pin, then verify it with the patient.",
        );
      } else {
        const bestMatch = results[0];
        setCandidates(results);
        setPin({
          latitude: bestMatch.latitude,
          longitude: bestMatch.longitude,
        });
        setLocationSource("Auto-pinned from address");
        setPinStatus(
          "Best address match is previewed on the map. Compare the suggestions, then verify the pin with the patient.",
        );
      }
    } catch {
      setPinStatus(
        "Address search is unavailable right now. Place the residence pin manually, then verify it with the patient.",
      );
    } finally {
      setIsSearching(false);
    }
  };
  const selectCandidate = (candidate: AddressCandidate) => {
    const selectedPin = {
      latitude: candidate.latitude,
      longitude: candidate.longitude,
    };
    setPin(selectedPin);
    void fillDetectedLocationDetails(selectedPin);
    setCandidates([]);
    setLocationSource("Auto-pinned from address");
    setLocationVerified(false);
    setVerifiedAddress("");
    setPinStatus(
      "Address result selected. Review the pin with the patient and mark it verified.",
    );
  };
  const submit = () => {
    setRegistrationError("");
    if (
      !form.givenName ||
      !form.familyName ||
      !form.dob ||
      !form.contact ||
      !form.addressLine ||
      !form.barangay ||
      !form.municipality ||
      !form.province ||
      !form.postalCode ||
      (requiresGuardian &&
        (!form.guardianName ||
          !form.guardianRelationship ||
          !form.guardianContact)) ||
      (form.philHealthClientType !== "Not enrolled" && !form.philHealthPin) ||
      (form.philHealthClientType === "Dependent" &&
        (!form.philHealthMemberName || !form.philHealthMemberPin)) ||
      !pin ||
      !hasUsableLocation ||
      !form.consentToTreatment ||
      !form.privacyAcknowledged
    ) {
      setRegistrationError(
        "Complete the required identity, contact, address, verified residence pin, coverage, and consent details before saving.",
      );
      return;
    }
    const existingPatient = patients.find((patient) => {
      const philHealthMatches =
        Boolean(form.philHealthPin) &&
        normalizePatientIdentity(patient.philHealthPin || "") ===
          normalizePatientIdentity(form.philHealthPin);
      const nameAndBirthDateMatch =
        normalizePatientIdentity(patient.fullName) ===
          normalizePatientIdentity(fullName) && patient.dob === form.dob;
      return philHealthMatches || nameAndBirthDateMatch;
    });
    if (existingPatient) {
      setRegistrationError(
        `A matching patient record already exists (${existingPatient.patientNumber || existingPatient.fullName}). Search for that patient and add the visit instead of creating a duplicate.`,
      );
      return;
    }
    const patient = registerPatient({
      ...form,
      fullName,
      address,
      latitude: pin.latitude,
      longitude: pin.longitude,
      locationSource,
      locationAccuracy: pin.accuracy,
      locationVerified,
      locationVerifiedAt: locationVerified
        ? new Date().toISOString()
        : undefined,
    });
    onRegistered(patient.id);
  };
  const identityFields = [
    ["familyName", "Last / family name", true, "family-name"],
    ["givenName", "First / given name", true, "given-name"],
    ["middleName", "Middle name", false, "additional-name"],
    ["suffix", "Name suffix (Jr., Sr., III)", false, "honorific-suffix"],
    ["dob", "Date of birth", true, "bday"],
    ["civilStatus", "Civil status", false, "off"],
    ["nationality", "Nationality", true, "country-name"],
    ["preferredLanguage", "Preferred language", false, "language"],
  ] as const;
  const contactFields = [
    ["contact", "Mobile number", true, "tel"],
    ["alternateContact", "Alternate number", false, "tel"],
    ["email", "Email address", false, "email"],
  ] as const;
  const addressFields = [
    ["addressLine", "House no., street, purok / sitio", true, "street-address"],
    ["barangay", "Barangay", true, "address-level3"],
    ["municipality", "Municipality / city", true, "address-level2"],
    ["province", "Province", true, "address-level1"],
    ["postalCode", "Postal code", true, "postal-code"],
  ] as const;
  return (
    <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <h3 className="font-display font-bold text-lg">
        Manual patient registration
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        This uses the same patient-profile standard as online registration.
        Complete it with the patient, then search and confirm the residence
        location. Enter the complete address first, then search for and verify
        the exact residence pin before saving.
      </p>
      <div className="mb-5 rounded-xl border border-primary/20 bg-primary-soft/60 px-4 py-3 text-sm text-primary">
        A permanent SmartServe patient ID is created on save. Future walk-ins,
        appointments, triage, consultations, prescriptions, and checkups are
        attached to that ID instead of creating another patient profile.
      </div>
      <div className="space-y-5">
        <section className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-4">
            <h4 className="font-display font-bold">Patient identity</h4>
            <p className="text-xs text-muted-foreground">
              Use the legal name shown on the patient’s available record.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {identityFields.map(([key, label, required, autoComplete]) => (
              <RegistrationTextInput
                key={key}
                id={`patient-${key}`}
                label={label}
                required={required}
                type={key === "dob" ? "date" : "text"}
                autoComplete={autoComplete}
                value={form[key]}
                onChange={(value) => set(key, value)}
              />
            ))}
            <div className="md:col-span-2 rounded-xl border border-primary/15 bg-primary-soft/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Official record name:{" "}
              </span>
              <span className="font-semibold">
                {fullName || "Complete first and family name"}
              </span>
            </div>
            <div className="rounded-xl border border-primary/15 bg-primary-soft p-3">
              <p className="text-xs font-medium text-primary">Age</p>
              <p className="mt-1 font-display text-xl font-bold">
                {age === null ? "—" : `${age} years old`}
              </p>
            </div>
            <div>
              <Label htmlFor="patient-gender">
                Sex / administrative gender *
              </Label>
              <select
                id="patient-gender"
                value={form.gender}
                onChange={(event) => set("gender", event.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
                <option>Unknown</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-display font-bold">Contact details</h4>
              <span className="text-xs font-semibold text-destructive">
                Required: mobile number
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the patient&apos;s primary mobile number for appointment and
              follow-up contact.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {contactFields.map(([key, label, required, autoComplete]) => (
              <RegistrationTextInput
                key={key}
                id={`patient-${key}`}
                label={label}
                required={required}
                type={key === "email" ? "email" : "text"}
                inputMode={key === "email" ? "email" : "tel"}
                autoComplete={autoComplete}
                value={form[key]}
                onChange={(value) => set(key, value)}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-4">
            <h4 className="font-display font-bold">Residence address</h4>
            <p className="text-xs text-muted-foreground">
              All fields are required. The complete address is searched to find
              and verify the residence pin used for privacy-safe disease trend
              mapping.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {addressFields.map(([key, label, required, autoComplete]) => (
              <RegistrationTextInput
                key={key}
                id={`patient-${key}`}
                label={label}
                required={required}
                inputMode={key === "postalCode" ? "numeric" : undefined}
                maxLength={key === "postalCode" ? 4 : undefined}
                autoComplete={autoComplete}
                value={form[key]}
                onChange={(value) =>
                  set(
                    key,
                    key === "postalCode"
                      ? value.replace(/\D/g, "").slice(0, 4)
                      : value,
                  )
                }
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-4">
            <h4 className="font-display font-bold">PhilHealth coverage</h4>
            <p className="text-xs text-muted-foreground">
              Optional for clinic care. It is required only when the patient is
              recorded as a member or dependent.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="patient-philhealth-type">Client type</Label>
              <select
                id="patient-philhealth-type"
                value={form.philHealthClientType}
                onChange={(event) =>
                  set("philHealthClientType", event.target.value)
                }
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>Not enrolled</option>
                <option>Member</option>
                <option>Dependent</option>
              </select>
            </div>
            <RegistrationTextInput
              id="patient-philhealth-pin"
              label="PhilHealth PIN"
              required={form.philHealthClientType !== "Not enrolled"}
              value={form.philHealthPin}
              inputMode="numeric"
              autoComplete="off"
              onChange={(value) => set("philHealthPin", value)}
            />
            {form.philHealthClientType === "Dependent" ? (
              <>
                <RegistrationTextInput
                  id="patient-philhealth-member-name"
                  label="Member / sponsor name"
                  required
                  value={form.philHealthMemberName}
                  autoComplete="name"
                  onChange={(value) => set("philHealthMemberName", value)}
                />
                <RegistrationTextInput
                  id="patient-philhealth-member-pin"
                  label="Member / sponsor PIN"
                  required
                  value={form.philHealthMemberPin}
                  inputMode="numeric"
                  autoComplete="off"
                  onChange={(value) => set("philHealthMemberPin", value)}
                />
              </>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-4">
            <h4 className="font-display font-bold">
              Guardian and emergency contact
            </h4>
            <p className="text-xs text-muted-foreground">
              {requiresGuardian
                ? "A parent or legal guardian contact is required for this minor."
                : "Add a guardian when applicable and an emergency contact for safe follow-up."}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <RegistrationTextInput
              id="patient-guardian-name"
              label="Parent / legal guardian name"
              required={requiresGuardian}
              value={form.guardianName}
              autoComplete="name"
              onChange={(value) => set("guardianName", value)}
            />
            <RegistrationTextInput
              id="patient-guardian-relationship"
              label="Guardian relationship"
              required={requiresGuardian}
              value={form.guardianRelationship}
              onChange={(value) => set("guardianRelationship", value)}
            />
            <RegistrationTextInput
              id="patient-guardian-contact"
              label="Guardian mobile number"
              required={requiresGuardian}
              value={form.guardianContact}
              inputMode="tel"
              autoComplete="tel"
              onChange={(value) => set("guardianContact", value)}
            />
            <RegistrationTextInput
              id="patient-emergency-name"
              label="Emergency contact name"
              value={form.emergencyContactName}
              autoComplete="name"
              onChange={(value) => set("emergencyContactName", value)}
            />
            <RegistrationTextInput
              id="patient-emergency-relationship"
              label="Emergency contact relationship"
              value={form.emergencyContactRelationship}
              onChange={(value) => set("emergencyContactRelationship", value)}
            />
            <RegistrationTextInput
              id="patient-emergency-phone"
              label="Emergency contact number"
              value={form.emergencyContactPhone}
              inputMode="tel"
              autoComplete="tel"
              onChange={(value) => set("emergencyContactPhone", value)}
            />
          </div>
        </section>
      </div>
      <div className="mt-5 rounded-2xl border border-border bg-muted/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <Label>
                Verified residence location <span className="text-destructive">*</span>
              </Label>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Search the complete entered address, then adjust the map pin with
              the patient if needed and confirm it below.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={searchLocation}
            disabled={isSearching || !addressReady}
          >
            <Search className="mr-2 h-4 w-4" />
            {isSearching ? "Searching…" : "Search entered address"}
          </Button>
        </div>
        {candidates.length ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
            <p className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
              Choose the most precise match
            </p>
            {candidates.map((candidate, index) => (
              <button
                type="button"
                key={`${candidate.latitude}-${candidate.longitude}`}
                onClick={() => selectCandidate(candidate)}
                className="flex w-full items-start gap-3 border-b border-border px-3 py-3 text-left text-sm last:border-0 hover:bg-primary-soft"
              >
                <span className="mt-0.5 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span>{candidate.displayName}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-3">
          <LocationPickerMap
            value={pin}
            showCurrentLocation={false}
            onChange={(next) => {
              setPin(next);
              setLocationSource("Staff-adjusted");
              setLocationVerified(false);
              setVerifiedAddress("");
              void fillDetectedLocationDetails(next);
            }}
            onLocationMethodChange={() => {
              setLocationSource("Staff-adjusted");
              setLocationVerified(false);
              setVerifiedAddress("");
            }}
          />
        </div>
        {locationDetailsStatus ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {locationDetailsStatus}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{pinStatus}</span>
          {pin ? (
            <span>
              Pin: {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
              {pin.accuracy ? ` · device accuracy ±${pin.accuracy} m` : ""}
            </span>
          ) : null}
        </div>
        {pin ? (
          <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-primary/20 bg-primary-soft/50 p-3 text-sm">
            <input
              type="checkbox"
              checked={locationVerified && verifiedAddress === address}
              onChange={(event) => {
                const isVerified = event.target.checked;
                setLocationVerified(isVerified);
                setVerifiedAddress(isVerified ? address : "");
              }}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              <span className="font-semibold">
                Location verified with patient or guardian.
              </span>
              <br />
              <span className="text-xs text-muted-foreground">
                I confirmed this pin represents the complete residence address
                entered above.
              </span>
            </span>
          </label>
        ) : null}
        {!hasUsableLocation ? (
          <p className="mt-2 text-xs font-medium text-amber-700">
            Search the complete address or place an exact residence pin, then
            verify it with the patient before saving.
          </p>
        ) : null}
      </div>
      {registrationError ? (
        <p
          className="mt-4 rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
          role="alert"
        >
          {registrationError}
        </p>
      ) : null}
      <div className="flex gap-2 mt-5 text-sm">
        <input
          type="checkbox"
          checked={form.consentToTreatment}
          onChange={(event) => set("consentToTreatment", event.target.checked)}
        />
        <span>Patient/guardian consent to treatment was verified.</span>
      </div>
      <div className="flex gap-2 mt-2 text-sm">
        <input
          type="checkbox"
          checked={form.privacyAcknowledged}
          onChange={(event) => set("privacyAcknowledged", event.target.checked)}
        />
        <span>Privacy notice was acknowledged.</span>
      </div>
      <Button
        disabled={
          !form.givenName ||
          !form.familyName ||
          !form.dob ||
          !form.contact ||
          !form.addressLine ||
          !form.barangay ||
          !form.municipality ||
          !form.province ||
          !form.postalCode ||
          (requiresGuardian &&
            (!form.guardianName ||
              !form.guardianRelationship ||
              !form.guardianContact)) ||
          (form.philHealthClientType !== "Not enrolled" &&
            !form.philHealthPin) ||
          (form.philHealthClientType === "Dependent" &&
            (!form.philHealthMemberName || !form.philHealthMemberPin)) ||
          !hasUsableLocation ||
          !form.consentToTreatment ||
          !form.privacyAcknowledged
        }
        onClick={submit}
        className="mt-5"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Save patient & continue to walk-in
      </Button>
    </section>
  );
}

function WalkInForm({
  services,
  area,
  initialPatientId,
}: {
  services: Service[];
  area: CareArea;
  initialPatientId?: string;
}) {
  const { patients, addWalkIn } = usePrototypeStore();
  const [query, setQuery] = useState("");
  const [patientId, setPatientId] = useState("");
  const [serviceId, setServiceId] = useState(() => services[0]?.id || "");
  const [number, setNumber] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!services.some((service) => service.id === serviceId)) {
      setServiceId(services[0]?.id || "");
    }
  }, [services, serviceId]);
  useEffect(() => {
    const patient = patients.find((item) => item.id === initialPatientId);
    if (!patient) return;
    setPatientId(patient.id);
    setQuery(`${patient.fullName} · ${patient.patientNumber || ""}`);
  }, [initialPatientId, patients]);
  const matches = useMemo(
    () =>
      patients
        .filter((p) =>
          `${p.fullName} ${p.patientNumber || ""} ${p.contact} ${p.dob}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .slice(0, 6),
    [patients, query],
  );
  return (
    <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <h3 className="font-display font-bold text-lg">
        {area === "Animal Bite Center" ? "Add Animal Bite walk-in visit" : "Add registered walk-in visit"}
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        {area === "Animal Bite Center"
          ? "This creates an Animal Bite Center visit and places the patient in its bite-assessment queue."
          : "Search first to prevent duplicate registrations. This creates today’s visit and places the patient in the triage queue."}
      </p>
      <Label>
        Search patient by name, patient ID, mobile number, or birth date
      </Label>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPatientId("");
        }}
        placeholder="Search existing patient"
        className="mt-1"
      />
      {query && (
        <div className="border border-border rounded-xl mt-2 overflow-hidden">
          {matches.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPatientId(p.id);
                setQuery(`${p.fullName} · ${p.patientNumber || ""}`);
              }}
              className={cn(
                "w-full text-left p-3 border-b border-border last:border-0",
                patientId === p.id && "bg-primary-soft",
              )}
            >
              <p className="font-medium text-sm">{p.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {p.patientNumber || "Existing patient"} · {p.dob} · {p.barangay}
              </p>
            </button>
          ))}
          {!matches.length && (
            <p className="p-3 text-sm text-muted-foreground">
              No record found. Use Register new patient.
            </p>
          )}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          <Label>Requested service</Label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Physical queue number</Label>
          <Input
            value={number}
            onChange={(e) =>
              setNumber(e.target.value.replace(/\D/g, "").slice(0, 3))
            }
            placeholder="001–100"
            className="mt-1"
          />
        </div>
      </div>
      <div className="mt-4">
        <Label>Reason for visit</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Patient's reason for visit"
          className="mt-1"
        />
      </div>
      <Button
        disabled={!patientId || !serviceId || !number || !reason}
        onClick={() =>
          setMessage(
            addWalkIn(patientId, serviceId, number, reason, area)
              ? `${area === "Animal Bite Center" ? "Animal Bite" : "Walk-in"} visit saved. Patient is now waiting for triage.`
              : "Use an available queue number from 001–100 for this clinic.",
          )
        }
        className="mt-5"
      >
        <Users className="w-4 h-4 mr-2" />
        Add walk-in to queue
      </Button>
      {message && (
        <p
          className={cn(
            "mt-3 text-sm",
            message.startsWith("Walk") ? "text-secondary" : "text-destructive",
          )}
        >
          {message}
        </p>
      )}
    </section>
  );
}

function TriageForm({ area }: { area: CareArea }) {
  const { appointments, patients, completeTriage } = usePrototypeStore();
  const eligible = appointments.filter(
    (a) => a.queueStatus === "Waiting for Triage" && (a.queueArea || "General Clinic") === area,
  );
  const [id, setId] = useState("");
  const [priority, setPriority] = useState<
    "Normal" | "Priority" | "Urgent" | "Emergency"
  >("Normal");
  const [f, setF] = useState({
    bloodPressure: "",
    temperature: "",
    pulseRespiratory: "",
    allergies: "",
    complaint: "",
  });
  const [animalExposure, setAnimalExposure] = useState({
    animal: "Dog",
    exposure: "Bite",
    woundSite: "",
    animalStatus: "Unknown",
    firstAid: "",
  });
  useEffect(() => {
    if (!eligible.some((a) => a.id === id)) setId(eligible[0]?.id || "");
  }, [eligible, id]);
  const isAnimalBite = area === "Animal Bite Center";
  const animalAssessmentComplete = !isAnimalBite || Boolean(
    animalExposure.animal.trim() &&
    animalExposure.exposure.trim() &&
    animalExposure.woundSite.trim() &&
    animalExposure.animalStatus.trim() &&
    animalExposure.firstAid.trim(),
  );
  return (
    <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <h3 className="font-display font-bold text-lg">{isAnimalBite ? "Animal Bite assessment & doctor handoff" : "Vitals & triage handoff"}</h3>
      <p className="text-sm text-muted-foreground mb-2">
        {isAnimalBite ? "Only Animal Bite Center patients appear here. Complete the exposure assessment before doctor handoff." : "Scheduled and walk-in patients appear together once they have a valid active queue number."}
      </p>
      <p className="mb-5 rounded-xl border border-primary/15 bg-primary-soft px-3 py-2 text-xs text-primary">
        Queue rule: Emergency routes immediately. Otherwise, Urgent is called
        before Priority, Priority before Normal, and each level follows issued
        queue-number order.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Active patient</Label>
          <select
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select patient</option>
            {eligible.map((a) => (
              <option key={a.id} value={a.id}>
                {a.queueNumber} · {label(patients, a.patientId)} ·{" "}
                {a.visitType || "Scheduled"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Priority</Label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option>Normal</option>
            <option>Priority</option>
            <option>Urgent</option>
            <option>Emergency</option>
          </select>
        </div>
        {(
          [
            ["bloodPressure", "Blood pressure"],
            ["temperature", "Temperature"],
            ["pulseRespiratory", "Pulse / respiratory rate"],
            ["allergies", "Known allergies"],
          ] as const
        ).map(([key, title]) => (
          <div key={key}>
            <Label>{title}</Label>
            <Input
              value={f[key]}
              onChange={(e) => setF((x) => ({ ...x, [key]: e.target.value }))}
              className="mt-1"
            />
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Label>Chief complaint / initial assessment</Label>
        <Textarea
          value={f.complaint}
          onChange={(e) => setF((x) => ({ ...x, complaint: e.target.value }))}
          className="mt-1"
        />
      </div>
      {isAnimalBite ? (
        <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <p className="font-semibold text-sm">Animal Bite Center assessment</p>
          <p className="mt-1 text-xs text-muted-foreground">Record the exposure before routing this patient to the Animal Bite doctor queue.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div><Label>Animal</Label><select value={animalExposure.animal} onChange={(event) => setAnimalExposure((value) => ({ ...value, animal: event.target.value }))} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Dog</option><option>Cat</option><option>Other animal</option></select></div>
            <div><Label>Exposure</Label><select value={animalExposure.exposure} onChange={(event) => setAnimalExposure((value) => ({ ...value, exposure: event.target.value }))} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Bite</option><option>Scratch</option><option>Lick on broken skin</option><option>Other exposure</option></select></div>
            <div><Label>Wound site</Label><Input className="mt-1" value={animalExposure.woundSite} onChange={(event) => setAnimalExposure((value) => ({ ...value, woundSite: event.target.value }))} /></div>
            <div><Label>Animal status</Label><Input className="mt-1" value={animalExposure.animalStatus} onChange={(event) => setAnimalExposure((value) => ({ ...value, animalStatus: event.target.value }))} placeholder="Owned, stray, observable" /></div>
          </div>
          <Label className="mt-3 block">First aid already done</Label><Input className="mt-1" value={animalExposure.firstAid} onChange={(event) => setAnimalExposure((value) => ({ ...value, firstAid: event.target.value }))} placeholder="Wound washing, none, unknown" />
          {!animalAssessmentComplete && id ? <p className="mt-3 text-xs font-medium text-destructive">Complete the wound site, animal status, and first-aid fields before doctor handoff.</p> : null}
        </div>
      ) : null}
      <Button
        disabled={!id || !animalAssessmentComplete}
        onClick={() => {
          const completed = completeTriage({ appointmentId: id, priority, ...f, ...(isAnimalBite ? { animalExposure } : {}) });
          if (!completed) return;
          setF({
            bloodPressure: "",
            temperature: "",
            pulseRespiratory: "",
            allergies: "",
            complaint: "",
          });
          setAnimalExposure({ animal: "Dog", exposure: "Bite", woundSite: "", animalStatus: "Unknown", firstAid: "" });
        }}
        className="mt-5"
      >
        <ClipboardPlus className="w-4 h-4 mr-2" />
        {isAnimalBite ? "Complete bite assessment & send to doctor" : "Complete triage & send to doctor"}
      </Button>
    </section>
  );
}

function Queue({ appts, patients, call, absent, area }: any) {
  const areaAppointments = appts.filter((appointment: Appointment) => (appointment.queueArea || "General Clinic") === area);
  const waiting = orderDoctorQueue(areaAppointments);
  const current =
    areaAppointments.find((a: Appointment) => a.queueStatus === "Called") ||
    areaAppointments.find((a: Appointment) => a.queueStatus === "In Consultation");
  const next = waiting[0];
  const priorityTone: Record<string, string> = {
    Emergency: "bg-red-100 text-red-700",
    Urgent: "bg-red-100 text-red-700",
    Priority: "bg-amber-100 text-amber-700",
    Normal: "bg-primary-soft text-primary",
  };
  return (
    <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
      <div className="md:col-span-2 space-y-4">
        <div className="bg-gradient-primary text-primary-foreground rounded-2xl p-6">
          <p className="text-xs uppercase opacity-80">{area} · now serving</p>
          <p className="font-display font-extrabold text-5xl my-1">
            {current?.queueNumber || "—"}
          </p>
          {next ? (
            <p className="text-xs text-primary-foreground/80">
              Next by triage order: {next.queueNumber} ·{" "}
              {appointmentPriority(next)}
            </p>
          ) : null}
          <div className="flex gap-2 mt-4">
            <Button
              disabled={Boolean(current) || !next}
              onClick={() => call(area)}
              className="bg-card text-primary"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call next
            </Button>
            {current?.queueStatus === "Called" ? (
              <>
                <Button
                  variant="outline"
                  className="border-primary-foreground/30 text-primary-foreground"
                  onClick={() => absent(current.id)}
                >
                  No show
                </Button>
              </>
            ) : null}
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-display font-bold">Waiting to be called</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Urgent → Priority → Normal. Patients within the same level retain
              queue-number order.
            </p>
          </div>
          {waiting.map((a: Appointment, index) => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-3 border-b border-border"
            >
              <span className="font-display font-bold text-primary">
                {a.queueNumber}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {label(patients, a.patientId)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.visitType || "Scheduled"} · queue position #{index + 1}
                </p>
              </div>
              <Badge
                className={cn("border-0", priorityTone[appointmentPriority(a)])}
              >
                {appointmentPriority(a)}
              </Badge>
              {index === 0 ? <Badge variant="outline">Next</Badge> : null}
            </div>
          ))}
          {!waiting.length ? (
            <p className="p-4 text-sm text-muted-foreground">
              No patient is ready for the doctor.
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Emergency routing</p>
          <p className="mt-1 text-xs">
            Emergency patients are sent to clinical consultation immediately and
            do not wait on this queue.
          </p>
        </div>
        <Info
          label="Active numbers"
          value={
            areaAppointments.filter((a: Appointment) =>
              [
                "Waiting for Triage",
                "Waiting for Doctor",
                "Called",
                "In Consultation",
              ].includes(a.queueStatus),
            ).length
          }
        />
        <Info
          label="Completed visits"
          value={
            areaAppointments.filter(
              (a: Appointment) => a.queueStatus === "Consultation Completed",
            ).length
          }
        />
      </div>
    </div>
  );
}
function Info({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-display font-extrabold text-3xl">{value}</p>
    </div>
  );
}
