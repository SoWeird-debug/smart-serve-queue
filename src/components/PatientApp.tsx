import { useEffect, useState } from "react";
import {
  Stethoscope,
  Baby,
  Brain,
  Syringe,
  Smile,
  TestTube,
  ShieldPlus,
  Bell,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Home,
  User,
  ListChecks,
  MapPin,
  Phone,
  ArrowRight,
  Sparkles,
  LogIn,
  LogOut,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { helpers, type Patient, type Service } from "@/data/mockData";
import {
  LocationPickerMap,
  type PinnedLocation,
} from "@/components/LocationPickerMap";
import { usePrototypeStore } from "@/lib/prototype-store";
import { calculateAge } from "@/lib/patient-age";
import { reverseGeocodePhilippineAddress } from "@/lib/location-address";

const iconMap = {
  Stethoscope,
  Baby,
  Brain,
  Syringe,
  Smile,
  TestTube,
  ShieldPlus,
};
const rememberedSessionKey = "smartserve-patient-remembered-session";
const rememberedMobileKey = "smartserve-patient-remembered-mobile";

type Screen =
  | "login"
  | "register"
  | "home"
  | "services"
  | "schedule"
  | "confirm"
  | "myAppts"
  | "records"
  | "notif";

export function PatientApp() {
  const [patientId, setPatientId] = useState<string | null>(() =>
    localStorage.getItem(rememberedSessionKey),
  );
  const [screen, setScreen] = useState<Screen>(() =>
    localStorage.getItem(rememberedSessionKey) ? "home" : "login",
  );
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(
    new Date().getDate() + 1,
  );
  const [selectedLocation, setSelectedLocation] =
    useState<PinnedLocation | null>(null);
  const {
    patients,
    services,
    bookAppointment,
    registerPortalPatient,
    loginPatient,
  } = usePrototypeStore();
  const me = patients.find((patient) => patient.id === patientId) || null;
  useEffect(() => {
    if (patientId && !me) {
      localStorage.removeItem(rememberedSessionKey);
      setPatientId(null);
      setScreen("login");
    }
  }, [me, patientId]);
  const authenticate = (id: string, remember: boolean) => {
    if (remember) localStorage.setItem(rememberedSessionKey, id);
    else localStorage.removeItem(rememberedSessionKey);
    setPatientId(id);
    setScreen("home");
  };
  const signOut = () => {
    localStorage.removeItem(rememberedSessionKey);
    setPatientId(null);
    setScreen("login");
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center max-w-xl">
        <Badge
          variant="secondary"
          className="mb-2 bg-primary-soft text-primary border-0"
        >
          Patient Mobile App
        </Badge>
        <h2 className="text-2xl md:text-3xl font-display font-bold">
          Book, queue, and track visits — from your phone
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          A walkthrough of the patient-facing experience.
        </p>
      </div>

      <div className="phone-frame">
        {/* notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/90 rounded-b-2xl z-20" />
        <div className="h-full overflow-y-auto pb-24 bg-background">
          {screen === "login" && (
            <LoginScreen
              onAuthenticated={authenticate}
              register={registerPortalPatient}
              login={loginPatient}
              onStartRegistration={() => setScreen("register")}
            />
          )}
          {screen === "register" && (
            <OnlineRegistrationWizard
              register={registerPortalPatient}
              onAuthenticated={authenticate}
              onBack={() => setScreen("login")}
            />
          )}
          {screen === "home" && me && (
            <HomeScreen
              me={me}
              services={services}
              onBook={() => setScreen("services")}
              onView={() => setScreen("myAppts")}
              onNotif={() => setScreen("notif")}
              onSignOut={signOut}
            />
          )}
          {screen === "services" && (
            <ServicesScreen
              services={services}
              onBack={() => setScreen("home")}
              onPick={(id) => {
                setSelectedService(id);
                setSelectedLocation(null);
                setScreen("schedule");
              }}
            />
          )}
          {screen === "schedule" && (
            <ScheduleScreen
              services={services}
              serviceId={selectedService!}
              date={selectedDate}
              location={selectedLocation}
              onDate={setSelectedDate}
              onLocation={setSelectedLocation}
              onBack={() => setScreen("services")}
              onConfirm={() => setScreen("confirm")}
            />
          )}
          {screen === "confirm" && me && (
            <ConfirmScreen
              services={services}
              serviceId={selectedService!}
              date={selectedDate}
              location={selectedLocation!}
              onDone={() => {
                bookAppointment(
                  me.id,
                  selectedService!,
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    selectedDate,
                  )
                    .toISOString()
                    .slice(0, 10),
                );
                setScreen("myAppts");
              }}
            />
          )}
          {screen === "myAppts" && me && (
            <MyAppointmentsScreen
              services={services}
              patientId={me.id}
              onBack={() => setScreen("home")}
            />
          )}
          {screen === "records" && me && (
            <MedicalRecordsScreen
              patientId={me.id}
              onBack={() => setScreen("home")}
            />
          )}
          {screen === "notif" && (
            <NotifScreen onBack={() => setScreen("home")} />
          )}
        </div>

        {screen !== "login" && screen !== "register" && (
          <BottomNav screen={screen} setScreen={setScreen} />
        )}
      </div>
    </div>
  );
}

/* ---------------- screens ---------------- */

function LoginScreen({
  onAuthenticated,
  register,
  login,
  onStartRegistration,
}: {
  onAuthenticated: (id: string, remember: boolean) => void;
  register: any;
  login: any;
  onStartRegistration: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState(() => ({
    fullName: "",
    dob: "",
    gender: "Female" as "Female" | "Male",
    mobile: localStorage.getItem(rememberedMobileKey) || "",
    barangay: "",
    municipality: "",
    postalCode: "",
    address: "",
    password: "",
  }));
  const [registrationLocation, setRegistrationLocation] =
    useState<PinnedLocation | null>(null);
  const [registrationLocationSource, setRegistrationLocationSource] = useState<
    "Current device location" | "Patient-selected pin"
  >("Patient-selected pin");
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [locationDetailsStatus, setLocationDetailsStatus] = useState("");
  const [remember, setRemember] = useState(() =>
    Boolean(localStorage.getItem(rememberedMobileKey)),
  );
  const [error, setError] = useState("");
  const age = calculateAge(form.dob);
  const fillDetectedLocationDetails = async (location: PinnedLocation) => {
    setLocationDetailsStatus(
      "Looking up the municipality, barangay, and postal code…",
    );
    try {
      const details = await reverseGeocodePhilippineAddress(location);
      setForm((current) => ({
        ...current,
        barangay: details.barangay || current.barangay,
        municipality: details.municipality || current.municipality,
        postalCode: details.postalCode || current.postalCode,
      }));
      const updated = [
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
  const submit = () => {
    if (mode === "login") {
      const patient = login(form.mobile, form.password);
      if (!patient)
        return setError(
          "Mobile number or password is not registered on this device.",
        );
      if (remember)
        localStorage.setItem(rememberedMobileKey, form.mobile.trim());
      else localStorage.removeItem(rememberedMobileKey);
      onAuthenticated(patient.id, remember);
      return;
    }
    if (
      !form.fullName ||
      !form.dob ||
      !form.mobile ||
      !form.barangay ||
      !form.municipality ||
      !form.postalCode ||
      form.password.length < 4
    )
      return setError(
        "Complete the required details and use a password with at least 4 characters.",
      );
    const patient = register(
      {
        fullName: form.fullName,
        dob: form.dob,
        gender: form.gender,
        contact: form.mobile,
        barangay: form.barangay,
        municipality: form.municipality,
        postalCode: form.postalCode,
        address: form.address || form.barangay,
        latitude: registrationLocation?.latitude,
        longitude: registrationLocation?.longitude,
        locationAccuracy: registrationLocation?.accuracy,
        locationSource: registrationLocation
          ? registrationLocationSource
          : "Barangay fallback",
        locationVerified: Boolean(registrationLocation && locationConfirmed),
        locationVerifiedAt:
          registrationLocation && locationConfirmed
            ? new Date().toISOString()
            : undefined,
      },
      form.password,
    );
    if (!patient)
      return setError(
        "That mobile number already has an account on this device.",
      );
    onAuthenticated(patient.id, false);
  };
  return (
    <div className="min-h-full bg-gradient-hero p-6 pt-12 text-primary-foreground flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-card/20 backdrop-blur flex items-center justify-center mb-4 shadow-glow">
          <Sparkles className="w-10 h-10" />
        </div>
        <h1 className="font-display text-3xl font-bold">SmartServe</h1>
        <p className="text-primary-foreground/80 text-sm mt-1 mb-8">
          Super Health Center · Jones, Isabela
        </p>

        <div className="w-full bg-card text-card-foreground rounded-3xl p-6 shadow-card">
          <div className="flex p-1 bg-muted rounded-xl mb-5">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() =>
                  m === "register" ? onStartRegistration() : setMode(m)
                }
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-smooth",
                  mode === m
                    ? "bg-card text-primary shadow-soft"
                    : "text-muted-foreground",
                )}
              >
                {m === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          <div className="space-y-3 text-left">
            {mode === "register" && (
              <>
                <div>
                  <Label className="text-xs">Full name</Label>
                  <Input
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    placeholder="Juan Dela Cruz"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs">Date of birth</Label>
                  <Input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={form.dob}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dob: e.target.value }))
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="rounded-xl border border-primary/15 bg-primary-soft px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-primary">
                    Age
                  </p>
                  <p className="font-display text-lg font-bold text-foreground">
                    {age === null ? "—" : `${age} years old`}
                  </p>
                </div>
                <div>
                  <Label className="text-xs">City / municipality</Label>
                  <Input
                    value={form.municipality}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, municipality: e.target.value }))
                    }
                    placeholder="Jones"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs">Barangay</Label>
                  <Input
                    value={form.barangay}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, barangay: e.target.value }))
                    }
                    placeholder="Poblacion 1"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs">Postal code</Label>
                  <Input
                    value={form.postalCode}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        postalCode: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4),
                      }))
                    }
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="3313"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs">Home address / purok</Label>
                  <Input
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    placeholder="Purok, street, or landmark"
                    className="rounded-xl"
                  />
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold text-foreground">
                    Residence pin
                  </p>
                  <p className="mb-2 text-[10px] text-muted-foreground">
                    Use your current location or tap the map where you live. You
                    can continue with barangay only if no precise pin is
                    available.
                  </p>
                  <LocationPickerMap
                    value={registrationLocation}
                    onChange={(location) => {
                      setRegistrationLocation(location);
                      setRegistrationLocationSource("Patient-selected pin");
                      setLocationConfirmed(false);
                      void fillDetectedLocationDetails(location);
                    }}
                    onLocationMethodChange={(method) => {
                      setRegistrationLocationSource(
                        method === "Current device location"
                          ? "Current device location"
                          : "Patient-selected pin",
                      );
                      setLocationConfirmed(false);
                    }}
                  />
                  {locationDetailsStatus ? (
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {locationDetailsStatus}
                    </p>
                  ) : null}
                  {registrationLocation ? (
                    <label className="mt-2 flex items-start gap-2 text-[10px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={locationConfirmed}
                        onChange={(event) =>
                          setLocationConfirmed(event.target.checked)
                        }
                        className="mt-0.5"
                      />
                      <span>
                        I confirm this pin shows my residence for disease-trend
                        monitoring.
                      </span>
                    </label>
                  ) : null}
                </div>
              </>
            )}
            <div>
              <Label className="text-xs">Mobile Number</Label>
              <Input
                value={form.mobile}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mobile: e.target.value }))
                }
                placeholder="+63 9XX XXX XXXX"
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                type="password"
                placeholder="••••••••"
                className="rounded-xl"
              />
            </div>
            {mode === "login" && (
              <label className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <strong className="text-foreground">
                    Remember me on this device
                  </strong>
                  <br />
                  Do not enable this on a shared or public device.
                </span>
              </label>
            )}
            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
            <Button
              onClick={submit}
              className="w-full rounded-xl bg-gradient-primary border-0 shadow-glow h-11"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              By continuing, you agree to our Privacy Notice (Data Privacy Act).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type OnlineRegistrationStep = 1 | 2 | 3 | 4;

function PortalInput({
  id,
  label,
  value,
  onChange,
  required = false,
  type = "text",
  inputMode,
  maxLength,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "date" | "email" | "password";
  inputMode?: "numeric" | "tel" | "email";
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input
        id={id}
        type={type}
        max={
          type === "date" ? new Date().toISOString().slice(0, 10) : undefined
        }
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl"
      />
    </div>
  );
}

function OnlineRegistrationWizard({
  register,
  onAuthenticated,
  onBack,
}: {
  register: any;
  onAuthenticated: (id: string, remember: boolean) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<OnlineRegistrationStep>(1);
  const [form, setForm] = useState({
    familyName: "",
    givenName: "",
    middleName: "",
    suffix: "",
    dob: "",
    gender: "Female" as Patient["gender"],
    civilStatus: "",
    nationality: "Filipino",
    preferredLanguage: "Filipino",
    mobile: "",
    alternateContact: "",
    email: "",
    addressLine: "",
    barangay: "",
    municipality: "",
    province: "",
    postalCode: "",
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
    password: "",
    privacyAcknowledged: false,
  });
  const [residencePin, setResidencePin] = useState<PinnedLocation | null>(null);
  const [pinSource, setPinSource] = useState<
    "Current device location" | "Patient-selected pin"
  >("Patient-selected pin");
  const [pinConfirmed, setPinConfirmed] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [error, setError] = useState("");
  const age = calculateAge(form.dob);
  const needsGuardian = age !== null && age < 18;
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
  const set = (key: string, value: any) =>
    setForm((current) => ({ ...current, [key]: value }));
  const fillLocationDetails = async (location: PinnedLocation) => {
    setLocationStatus(
      "Looking up your province, municipality, barangay, and postal code…",
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
      setLocationStatus(
        "Location details were auto-filled. Please review them.",
      );
    } catch {
      setLocationStatus(
        "Your pin was saved, but please enter any missing address details manually.",
      );
    }
  };
  const stepProblem = () => {
    if (step === 1 && (!form.familyName || !form.givenName || !form.dob))
      return "Enter your last name, first name, and date of birth.";
    if (
      step === 2 &&
      (!form.mobile ||
        !form.addressLine ||
        !form.barangay ||
        !form.municipality ||
        !form.province ||
        !form.postalCode)
    )
      return "Complete your mobile number and full residence address.";
    if (
      step === 3 &&
      ((form.philHealthClientType !== "Not enrolled" && !form.philHealthPin) ||
        (form.philHealthClientType === "Dependent" &&
          (!form.philHealthMemberName || !form.philHealthMemberPin)) ||
        (needsGuardian &&
          (!form.guardianName ||
            !form.guardianRelationship ||
            !form.guardianContact)))
    )
      return needsGuardian
        ? "Add the required guardian information and any applicable PhilHealth details."
        : "Complete the PhilHealth details for the selected client type.";
    if (step === 4 && (!form.privacyAcknowledged || form.password.length < 4))
      return "Create a password with at least 4 characters and acknowledge the Privacy Notice.";
    return "";
  };
  const next = () => {
    const problem = stepProblem();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep((current) => Math.min(4, current + 1) as OnlineRegistrationStep);
  };
  const submit = () => {
    const problem = stepProblem();
    if (problem) {
      setError(problem);
      return;
    }
    const patient = register(
      {
        fullName,
        givenName: form.givenName,
        familyName: form.familyName,
        middleName: form.middleName,
        suffix: form.suffix,
        dob: form.dob,
        gender: form.gender,
        civilStatus: form.civilStatus,
        nationality: form.nationality,
        preferredLanguage: form.preferredLanguage,
        contact: form.mobile,
        alternateContact: form.alternateContact,
        email: form.email,
        address,
        addressLine: form.addressLine,
        barangay: form.barangay,
        municipality: form.municipality,
        province: form.province,
        postalCode: form.postalCode,
        philHealthClientType: form.philHealthClientType,
        philHealthPin: form.philHealthPin,
        philHealthMemberName: form.philHealthMemberName,
        philHealthMemberPin: form.philHealthMemberPin,
        guardianName: form.guardianName,
        guardianRelationship: form.guardianRelationship,
        guardianContact: form.guardianContact,
        emergencyContactName: form.emergencyContactName,
        emergencyContactRelationship: form.emergencyContactRelationship,
        emergencyContactPhone: form.emergencyContactPhone,
        latitude: residencePin?.latitude,
        longitude: residencePin?.longitude,
        locationAccuracy: residencePin?.accuracy,
        locationSource: residencePin ? pinSource : "Barangay fallback",
        locationVerified: Boolean(residencePin && pinConfirmed),
        locationVerifiedAt:
          residencePin && pinConfirmed ? new Date().toISOString() : undefined,
      },
      form.password,
    );
    if (!patient) {
      setError(
        "This mobile number already has a portal account. Sign in instead.",
      );
      return;
    }
    onAuthenticated(patient.id, false);
  };
  const steps = [
    ["Identity", "Your legal patient details"],
    ["Contact", "Contact and residence"],
    ["Coverage", "PhilHealth and guardian"],
    ["Review", "Pin, privacy, and account"],
  ] as const;
  return (
    <div className="min-h-full bg-gradient-hero p-5 pt-12 text-primary-foreground">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="grid h-10 w-10 place-items-center rounded-xl bg-card/15 backdrop-blur"
          aria-label="Back to sign in"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground/70">
            Clinic registration
          </p>
          <h1 className="font-display text-2xl font-bold">
            Create your patient record
          </h1>
        </div>
      </div>
      <div className="mb-5 grid grid-cols-4 gap-1.5">
        {steps.map(([label], index) => {
          const active = index + 1 <= step;
          return (
            <div key={label}>
              <div
                className={cn(
                  "h-1.5 rounded-full",
                  active ? "bg-secondary" : "bg-card/25",
                )}
              />
              <p className="mt-1 truncate text-[9px] text-primary-foreground/80">
                {index + 1}. {label}
              </p>
            </div>
          );
        })}
      </div>
      <div className="rounded-3xl bg-card p-5 text-card-foreground shadow-card">
        <div className="mb-5">
          <p className="text-xs font-semibold text-primary">Step {step} of 4</p>
          <h2 className="font-display text-xl font-bold">
            {steps[step - 1][0]}
          </h2>
          <p className="text-xs text-muted-foreground">{steps[step - 1][1]}</p>
        </div>
        {step === 1 ? (
          <div className="space-y-3">
            <PortalInput
              id="online-family-name"
              label="Last / family name"
              required
              value={form.familyName}
              onChange={(value) => set("familyName", value)}
            />
            <PortalInput
              id="online-given-name"
              label="First / given name"
              required
              value={form.givenName}
              onChange={(value) => set("givenName", value)}
            />
            <PortalInput
              id="online-middle-name"
              label="Middle name"
              value={form.middleName}
              onChange={(value) => set("middleName", value)}
            />
            <PortalInput
              id="online-suffix"
              label="Name suffix (Jr., Sr., III)"
              value={form.suffix}
              onChange={(value) => set("suffix", value)}
            />
            <PortalInput
              id="online-dob"
              label="Date of birth"
              required
              type="date"
              value={form.dob}
              onChange={(value) => set("dob", value)}
            />
            <div className="rounded-xl border border-primary/15 bg-primary-soft px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-primary">
                Age
              </p>
              <p className="font-display text-lg font-bold">
                {age === null ? "—" : [age, " years old"].join("")}
              </p>
            </div>
            <div>
              <Label htmlFor="online-gender" className="text-xs">
                Sex / administrative gender *
              </Label>
              <select
                id="online-gender"
                value={form.gender}
                onChange={(event) => set("gender", event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
                <option>Unknown</option>
              </select>
            </div>
            <PortalInput
              id="online-civil-status"
              label="Civil status"
              value={form.civilStatus}
              onChange={(value) => set("civilStatus", value)}
            />
            <PortalInput
              id="online-nationality"
              label="Nationality"
              required
              value={form.nationality}
              onChange={(value) => set("nationality", value)}
            />
            <PortalInput
              id="online-language"
              label="Preferred language"
              value={form.preferredLanguage}
              onChange={(value) => set("preferredLanguage", value)}
            />
            <div className="rounded-xl bg-muted px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                Official record name:{" "}
              </span>
              <strong>{fullName || "Enter your legal name"}</strong>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-3">
            <PortalInput
              id="online-mobile"
              label="Mobile number"
              required
              inputMode="tel"
              value={form.mobile}
              onChange={(value) => set("mobile", value)}
              placeholder="+63 9XX XXX XXXX"
            />
            <PortalInput
              id="online-alternate-mobile"
              label="Alternate number"
              inputMode="tel"
              value={form.alternateContact}
              onChange={(value) => set("alternateContact", value)}
            />
            <PortalInput
              id="online-email"
              label="Email address"
              type="email"
              inputMode="email"
              value={form.email}
              onChange={(value) => set("email", value)}
            />
            <PortalInput
              id="online-address"
              label="House no., street, purok / sitio"
              required
              value={form.addressLine}
              onChange={(value) => set("addressLine", value)}
            />
            <PortalInput
              id="online-barangay"
              label="Barangay"
              required
              value={form.barangay}
              onChange={(value) => set("barangay", value)}
            />
            <PortalInput
              id="online-municipality"
              label="Municipality / city"
              required
              value={form.municipality}
              onChange={(value) => set("municipality", value)}
            />
            <PortalInput
              id="online-province"
              label="Province"
              required
              value={form.province}
              onChange={(value) => set("province", value)}
            />
            <PortalInput
              id="online-postal"
              label="Postal code"
              required
              inputMode="numeric"
              maxLength={4}
              value={form.postalCode}
              onChange={(value) =>
                set("postalCode", value.replace(/\D/g, "").slice(0, 4))
              }
            />
          </div>
        ) : step === 3 ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="online-client-type" className="text-xs">
                PhilHealth client type
              </Label>
              <select
                id="online-client-type"
                value={form.philHealthClientType}
                onChange={(event) =>
                  set("philHealthClientType", event.target.value)
                }
                className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option>Not enrolled</option>
                <option>Member</option>
                <option>Dependent</option>
              </select>
            </div>
            <PortalInput
              id="online-philhealth-pin"
              label="PhilHealth PIN"
              required={form.philHealthClientType !== "Not enrolled"}
              inputMode="numeric"
              value={form.philHealthPin}
              onChange={(value) => set("philHealthPin", value)}
            />
            {form.philHealthClientType === "Dependent" ? (
              <>
                <PortalInput
                  id="online-sponsor-name"
                  label="Member / sponsor name"
                  required
                  value={form.philHealthMemberName}
                  onChange={(value) => set("philHealthMemberName", value)}
                />
                <PortalInput
                  id="online-sponsor-pin"
                  label="Member / sponsor PIN"
                  required
                  inputMode="numeric"
                  value={form.philHealthMemberPin}
                  onChange={(value) => set("philHealthMemberPin", value)}
                />
              </>
            ) : null}
            <div className="border-t border-border pt-3">
              <p className="text-sm font-semibold">
                Guardian and emergency contact
              </p>
              <p className="mb-3 text-[11px] text-muted-foreground">
                {needsGuardian
                  ? "A parent or legal guardian is required because this patient is a minor."
                  : "Add a guardian when applicable and an emergency contact for safe follow-up."}
              </p>
              <div className="space-y-3">
                <PortalInput
                  id="online-guardian-name"
                  label="Parent / legal guardian name"
                  required={needsGuardian}
                  value={form.guardianName}
                  onChange={(value) => set("guardianName", value)}
                />
                <PortalInput
                  id="online-guardian-relationship"
                  label="Guardian relationship"
                  required={needsGuardian}
                  value={form.guardianRelationship}
                  onChange={(value) => set("guardianRelationship", value)}
                />
                <PortalInput
                  id="online-guardian-contact"
                  label="Guardian mobile number"
                  required={needsGuardian}
                  inputMode="tel"
                  value={form.guardianContact}
                  onChange={(value) => set("guardianContact", value)}
                />
                <PortalInput
                  id="online-emergency-name"
                  label="Emergency contact name"
                  value={form.emergencyContactName}
                  onChange={(value) => set("emergencyContactName", value)}
                />
                <PortalInput
                  id="online-emergency-relationship"
                  label="Emergency contact relationship"
                  value={form.emergencyContactRelationship}
                  onChange={(value) =>
                    set("emergencyContactRelationship", value)
                  }
                />
                <PortalInput
                  id="online-emergency-number"
                  label="Emergency contact number"
                  inputMode="tel"
                  value={form.emergencyContactPhone}
                  onChange={(value) => set("emergencyContactPhone", value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-muted/40 p-3">
              <p className="text-xs font-semibold">Residence pin</p>
              <p className="mb-2 text-[10px] text-muted-foreground">
                Use your current location only while you are at home, or tap the
                map to pin your residence. You may continue with barangay-level
                information if an exact pin is unavailable.
              </p>
              <LocationPickerMap
                value={residencePin}
                onChange={(location) => {
                  setResidencePin(location);
                  setPinSource("Patient-selected pin");
                  setPinConfirmed(false);
                  void fillLocationDetails(location);
                }}
                onLocationMethodChange={(method) => {
                  setPinSource(
                    method === "Current device location"
                      ? "Current device location"
                      : "Patient-selected pin",
                  );
                  setPinConfirmed(false);
                }}
              />
              {locationStatus ? (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {locationStatus}
                </p>
              ) : null}
              {residencePin ? (
                <label className="mt-2 flex items-start gap-2 text-[10px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={pinConfirmed}
                    onChange={(event) => setPinConfirmed(event.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I confirm this pin represents my residence for disease-trend
                    monitoring.
                  </span>
                </label>
              ) : null}
            </div>
            <PortalInput
              id="online-password"
              label="Create password"
              required
              type="password"
              value={form.password}
              onChange={(value) => set("password", value)}
              placeholder="At least 4 characters"
            />
            <label className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={form.privacyAcknowledged}
                onChange={(event) =>
                  set("privacyAcknowledged", event.target.checked)
                }
                className="mt-0.5"
              />
              <span>
                I have read the Privacy Notice and agree that the clinic may use
                my registration information for care, appointments, and
                authorized health-service processes.
              </span>
            </label>
          </div>
        )}
        {error ? (
          <p
            className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              step === 1
                ? onBack()
                : setStep((current) => (current - 1) as OnlineRegistrationStep)
            }
            className="flex-1 rounded-xl"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <Button
            type="button"
            onClick={step === 4 ? submit : next}
            className="flex-1 rounded-xl bg-gradient-primary"
          >
            {step === 4 ? "Create account" : "Continue"}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Your permanent patient ID is created after registration; future clinic
          records stay attached to the same profile.
        </p>
      </div>
    </div>
  );
}

function HomeScreen({
  me,
  services,
  onBook,
  onView,
  onNotif,
  onSignOut,
}: {
  me: any;
  services: Service[];
  onBook: () => void;
  onView: () => void;
  onNotif: () => void;
  onSignOut: () => void;
}) {
  const { appointments } = usePrototypeStore();
  const next = appointments.find((a) => a.patientId === me.id);
  const svc = next
    ? services.find((service) => service.id === next.serviceId)
    : null;
  return (
    <div className="bg-background">
      <div className="bg-gradient-hero p-5 pt-12 pb-20 text-primary-foreground rounded-b-[2rem]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-primary-foreground/70">
              Magandang umaga 👋
            </p>
            <h2 className="font-display font-bold text-xl">
              {me.fullName.split(" ")[0]}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onNotif}
              aria-label="View notifications"
              className="relative w-10 h-10 rounded-full bg-card/20 backdrop-blur flex items-center justify-center"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning rounded-full" />
            </button>
            <button
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="w-10 h-10 rounded-full bg-card/20 backdrop-blur flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-14 space-y-4">
        {/* Next appointment card */}
        <div className="bg-card rounded-2xl shadow-card p-4 border border-border animate-pop-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              Next Appointment
            </span>
            <Badge className="bg-secondary-soft text-secondary border-0">
              {next ? "Confirmed" : "No booking"}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {svc ? svc.name : "No upcoming appointment"}
              </p>
              <p className="text-xs text-muted-foreground">
                {next
                  ? `${helpers.formatDate(next.date)} · Clinic hours: 8:00 AM – 5:00 PM`
                  : "Book a clinic visit to begin."}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Booking</p>
              <p className="font-display font-bold text-primary">
                {next ? "Confirmed" : "—"}
              </p>
            </div>
          </div>
          <Button
            onClick={onView}
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-primary"
          >
            View queue status <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onBook}
            className="bg-gradient-primary text-primary-foreground rounded-2xl p-4 text-left shadow-soft active:scale-95 transition-smooth"
          >
            <Calendar className="w-6 h-6 mb-3" />
            <p className="font-semibold text-sm">Book a visit</p>
            <p className="text-xs opacity-80">Reserve your slot</p>
          </button>
          <button
            onClick={onView}
            className="bg-card border border-border rounded-2xl p-4 text-left shadow-soft active:scale-95 transition-smooth"
          >
            <ListChecks className="w-6 h-6 mb-3 text-secondary" />
            <p className="font-semibold text-sm">My queue</p>
            <p className="text-xs text-muted-foreground">Live status</p>
          </button>
        </div>

        {/* Services preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-semibold">Clinic Services</h3>
            <button
              onClick={onBook}
              className="text-xs text-primary font-medium"
            >
              See all
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {services.slice(0, 4).map((s) => {
              const Icon = (iconMap as any)[s.icon];
              return (
                <button
                  key={s.id}
                  onClick={onBook}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/50"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      s.color === "primary" && "bg-primary-soft text-primary",
                      s.color === "secondary" &&
                        "bg-secondary-soft text-secondary",
                      s.color === "accent" && "bg-accent-soft text-accent",
                      s.color === "info" && "bg-primary-soft text-info",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-center leading-tight">
                    {s.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Health tip */}
        <div className="bg-secondary-soft border border-secondary/20 rounded-2xl p-4 flex gap-3">
          <ShieldPlus className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-secondary-foreground">
              Free flu vaccination
            </p>
            <p className="text-xs text-muted-foreground">
              Available Mon–Fri, walk-ins accepted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServicesScreen({
  services,
  onBack,
  onPick,
}: {
  services: Service[];
  onBack: () => void;
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <ScreenHeader title="Choose a service" onBack={onBack} />
      <div className="p-5 space-y-3">
        {services.map((s) => {
          const Icon = (iconMap as any)[s.icon] || Stethoscope;
          return (
            <button
              key={s.id}
              onClick={() => onPick(s.id)}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-3 text-left active:scale-[0.98] transition-smooth shadow-soft"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  s.color === "primary" && "bg-primary-soft text-primary",
                  s.color === "secondary" && "bg-secondary-soft text-secondary",
                  s.color === "accent" && "bg-accent-soft text-accent",
                  s.color === "info" && "bg-primary-soft text-info",
                  s.color === "warning" && "bg-warning/15 text-warning",
                  s.color === "destructive" &&
                    "bg-destructive/15 text-destructive",
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {s.description}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ~{s.duration} min · {s.capacity} slots/day
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleScreen({
  services,
  serviceId,
  date,
  location,
  onDate,
  onLocation,
  onBack,
  onConfirm,
}: {
  services: Service[];
  serviceId: string;
  date: number;
  location: PinnedLocation | null;
  onDate: (date: number) => void;
  onLocation: (location: PinnedLocation | null) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const svc = services.find((service) => service.id === serviceId) || {
    name: "Selected service",
  };
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  return (
    <div>
      <ScreenHeader title="Select appointment date" onBack={onBack} />
      <div className="p-5 space-y-5">
        <div className="bg-primary-soft rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-card text-primary flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Service</p>
            <p className="font-semibold text-sm">{svc.name}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
            Select date
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {days.map((d, index) => {
              const active = d.getDate() === date;
              const holiday = index === 5;
              const full = index === 2;
              const available = 40 - ((index * 7 + 15) % 35);
              return (
                <button
                  key={d.toISOString()}
                  disabled={holiday || full}
                  onClick={() => onDate(d.getDate())}
                  className={cn(
                    "min-w-[60px] flex flex-col items-center py-3 rounded-2xl border transition-smooth",
                    active
                      ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow"
                      : "bg-card border-border",
                    (holiday || full) && "opacity-50",
                  )}
                >
                  <span className="text-[10px] uppercase">
                    {d.toLocaleDateString("en", { weekday: "short" })}
                  </span>
                  <span className="font-display font-bold text-lg">
                    {d.getDate()}
                  </span>
                  <span className="text-[10px]">
                    {d.toLocaleDateString("en", { month: "short" })}
                  </span>
                  <span className="text-[9px] mt-1">
                    {holiday ? "Closed" : full ? "Full" : `${available} slots`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-muted/50 rounded-2xl p-3 text-xs text-muted-foreground">
          Choose an available date only. Clinic consultation hours are 8:00 AM –
          5:00 PM; your queue number is assigned after clinic check-in.
        </div>

        <div>
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Patient location
              </p>
              <p className="text-[10px] text-muted-foreground">
                Required for local disease monitoring
              </p>
            </div>
            {location && (
              <Badge className="border-0 bg-secondary-soft text-secondary">
                Pinned
              </Badge>
            )}
          </div>
          <LocationPickerMap value={location} onChange={onLocation} />
          {location && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Saved pin: {location.latitude.toFixed(5)},{" "}
              {location.longitude.toFixed(5)}
            </p>
          )}
        </div>

        <Button
          disabled={!location}
          onClick={onConfirm}
          className="w-full h-12 rounded-2xl bg-gradient-primary border-0 shadow-glow"
        >
          Confirm booking <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        {!location && (
          <p className="-mt-3 text-center text-[10px] text-warning">
            Pin the patient location before confirming.
          </p>
        )}
      </div>
    </div>
  );
}

function ConfirmScreen({
  services,
  serviceId,
  date,
  location,
  onDone,
}: {
  services: Service[];
  serviceId: string;
  date: number;
  location: PinnedLocation;
  onDone: () => void;
}) {
  const svc = services.find((service) => service.id === serviceId) || {
    name: "Selected service",
  };
  return (
    <div className="p-6 pt-10 flex flex-col items-center text-center min-h-full bg-background">
      <div className="w-24 h-24 rounded-full bg-secondary-soft flex items-center justify-center mb-4 animate-pop-in">
        <CheckCircle2 className="w-12 h-12 text-secondary" />
      </div>
      <h2 className="font-display font-bold text-xl">Booking confirmed!</h2>
      <p className="text-sm text-muted-foreground mb-6">
        A reminder will be sent to your phone.
      </p>

      <div className="w-full bg-gradient-primary text-primary-foreground rounded-3xl p-6 shadow-glow">
        <p className="text-xs uppercase opacity-80">Booking reference</p>
        <p className="font-display font-extrabold text-3xl tracking-tight my-2">
          APT-2026-0098
        </p>
        <div className="border-t border-primary-foreground/20 my-3" />
        <div className="grid grid-cols-2 gap-2 text-left text-sm">
          <div>
            <p className="text-[10px] opacity-70 uppercase">Service</p>
            <p className="font-semibold truncate">{svc.name}</p>
          </div>
          <div>
            <p className="text-[10px] opacity-70 uppercase">Date</p>
            <p className="font-semibold">
              {new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                date,
              ).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-[10px] opacity-70 uppercase">Status</p>
            <p className="font-semibold">Confirmed</p>
          </div>
        </div>
      </div>

      <div className="w-full mt-5 bg-card border border-border rounded-2xl p-4 text-left text-xs space-y-2">
        <div className="flex gap-2">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span>Super Health Center, Jones, Isabela</span>
        </div>
        <div className="flex gap-2">
          <MapPin className="w-4 h-4 text-secondary shrink-0" />
          <span>
            Patient location saved ({location.latitude.toFixed(4)},{" "}
            {location.longitude.toFixed(4)})
          </span>
        </div>
        <div className="flex gap-2">
          <Phone className="w-4 h-4 text-primary shrink-0" />
          <span>(078) 000-0000</span>
        </div>
        <div className="flex gap-2">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span>
            Clinic consultation hours: 8:00 AM – 5:00 PM. Present your booking
            reference when checking in.
          </span>
        </div>
      </div>

      <Button onClick={onDone} className="w-full mt-5 h-12 rounded-2xl">
        View my appointments
      </Button>
    </div>
  );
}

function MyAppointmentsScreen({
  services,
  onBack,
  patientId,
}: {
  services: Service[];
  onBack: () => void;
  patientId: string;
}) {
  const { appointments } = usePrototypeStore();
  const list = appointments
    .filter((a) => a.patientId === patientId)
    .slice(0, 5);
  return (
    <div>
      <ScreenHeader title="My appointments" onBack={onBack} />
      <div className="p-5 space-y-3">
        {list.map((a, i) => {
          const svc = services.find((service) => service.id === a.serviceId);
          const isLive =
            a.queueStatus === "Now Serving" || a.queueStatus === "Waiting";
          return (
            <div
              key={a.id}
              className="bg-card border border-border rounded-2xl p-4 shadow-soft"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-bold text-primary">
                  APT-2026-00{a.id.slice(1)}
                </span>
                <Badge
                  className={cn(
                    "border-0",
                    a.queueStatus === "Now Serving" &&
                      "bg-secondary text-secondary-foreground",
                    a.queueStatus === "Waiting" && "bg-warning/20 text-warning",
                    a.queueStatus === "Completed" &&
                      "bg-muted text-muted-foreground",
                    a.queueStatus === "Scheduled" &&
                      "bg-primary-soft text-primary",
                  )}
                >
                  {a.queueStatus}
                </Badge>
              </div>
              <p className="font-semibold text-sm">
                {svc?.name || "Service no longer available"}
              </p>
              <p className="text-xs text-muted-foreground">
                {helpers.formatDate(a.date)} · Appointment{" "}
                {a.queueStatus === "Scheduled"
                  ? "Confirmed"
                  : a.attendanceStatus === "Present"
                    ? "Arrived"
                    : a.queueStatus}
              </p>
              {a.attendanceStatus === "Present" && (
                <p className="text-xs text-primary mt-2">
                  Queue {a.queueNumber} ·{" "}
                  {a.queueStatus === "Waiting"
                    ? "Waiting for triage"
                    : a.queueStatus}
                </p>
              )}
              {isLive && (
                <div className="mt-3 p-2 bg-secondary-soft rounded-xl text-xs text-secondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  {i === 0
                    ? "You are next!"
                    : `${i} patient(s) ahead · est. wait ${i * 12} min`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MedicalRecordsScreen({
  onBack,
  patientId,
}: {
  onBack: () => void;
  patientId: string;
}) {
  const { medicalRecords } = usePrototypeStore();
  const records = medicalRecords.filter(
    (record) => record.patientId === patientId,
  );
  return (
    <div>
      <ScreenHeader title="My medical records" onBack={onBack} />
      <div className="p-5 space-y-3">
        <div className="bg-primary-soft border border-primary/15 rounded-2xl p-4">
          <p className="font-semibold text-sm">Your private health history</p>
          <p className="text-xs text-muted-foreground mt-1">
            This demo shows records approved for the patient portal. In the live
            system, access requires secure sign-in and consent.
          </p>
        </div>
        {records.map((record) => (
          <div
            key={record.id}
            className="bg-card border border-border rounded-2xl p-4 shadow-soft"
          >
            <div className="flex justify-between gap-2">
              <p className="font-semibold text-sm">{record.diagnosis}</p>
              <Badge className="bg-secondary-soft text-secondary border-0">
                Consultation completed
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {record.date} · {record.clinician}
            </p>
            <p className="text-xs mt-3">{record.notes}</p>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              Follow the doctor’s clinic-approved instructions. Pharmacy
              dispensing history is recorded separately when applicable.
            </p>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground text-center">
          For corrections or older paper records, please contact the clinic
          records desk.
        </p>
      </div>
    </div>
  );
}

function NotifScreen({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <ScreenHeader title="Notifications" onBack={onBack} />
      <div className="p-5 space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={cn(
              "bg-card border rounded-2xl p-4 shadow-soft",
              n.read ? "border-border" : "border-primary/30 bg-primary-soft/40",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  n.type === "reminder" && "bg-primary-soft text-primary",
                  n.type === "update" && "bg-secondary-soft text-secondary",
                  n.type === "alert" && "bg-warning/20 text-warning",
                )}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{n.title}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {n.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {n.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- shared ---------- */

function ScreenHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h2 className="font-display font-semibold">{title}</h2>
    </div>
  );
}

function BottomNav({
  screen,
  setScreen,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
}) {
  const items: { id: Screen; icon: typeof Home; label: string }[] = [
    { id: "home", icon: Home, label: "Home" },
    { id: "services", icon: Calendar, label: "Book" },
    { id: "myAppts", icon: ListChecks, label: "Queue" },
    { id: "records", icon: FileText, label: "Records" },
    { id: "notif", icon: Bell, label: "Alerts" },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border px-2 py-2 flex justify-around">
      {items.map((it) => {
        const Icon = it.icon;
        const active = screen === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setScreen(it.id)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-smooth",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
