import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  medicines as seedMedicines,
  services as seedServices,
} from "@/data/mockData";
import type {
  Appointment,
  MedicineItem,
  MedicalRecord,
  Patient,
  Service,
  TriagePriority,
} from "@/data/mockData";
import { orderDoctorQueue } from "@/lib/queue-priority";

export type TriageRecord = {
  appointmentId: string;
  priority: TriagePriority;
  bloodPressure: string;
  temperature: string;
  pulseRespiratory: string;
  allergies: string;
  complaint: string;
  completedAt: string;
  animalExposure?: {
    animal: string;
    exposure: string;
    woundSite: string;
    animalStatus: string;
    firstAid: string;
  };
};
export type AuditEvent = {
  id: string;
  at: string;
  role: string;
  action: string;
  reference: string;
};
export type PatientNotification = {
  id: string;
  patientId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: "reminder" | "update" | "alert";
};
export type MigrationRow = Record<string, string>;
export type ImportSummary = {
  patientsAdded: number;
  appointmentsAdded: number;
  checkupsAdded: number;
  skipped: number;
};
type PortalAccount = { patientId: string; mobile: string; password: string };
export type StaffRole =
  | "Front desk"
  | "Nurse / Triage"
  | "Doctor"
  | "Pharmacy"
  | "Administrator";
export type DoctorAvailability =
  | "Available"
  | "With patient"
  | "On break"
  | "Off duty"
  | "On leave";
export type StaffUser = {
  id: string;
  fullName: string;
  username: string;
  /** Prototype only: production must store a server-side password hash, never this value. */
  password: string;
  role: StaffRole;
  active: boolean;
  passwordChangeRequired: boolean;
  /** Only doctors publish a care-availability state to the patient portal. */
  doctorStatus?: DoctorAvailability;
  recoveryEmail?: string;
  mobile?: string;
  title?: string;
  notes?: string;
  assignedAreas?: ("General Clinic" | "Animal Bite Center")[];
};
export type BarangayDirectoryEntry = {
  id: string;
  name: string;
  municipality: string;
  province: string;
  postalCode?: string;
};
export type ConsultationTemplate = {
  id: string;
  assessment: string;
  clinicalNotes: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
export type RegistrationInput = Omit<
  Patient,
  "id" | "maskedName" | "latitude" | "longitude"
> & {
  latitude: number;
  longitude: number;
  locationSource: NonNullable<Patient["locationSource"]>;
};
type PortalRegistrationInput = Pick<
  Patient,
  | "fullName"
  | "givenName"
  | "familyName"
  | "middleName"
  | "suffix"
  | "dob"
  | "gender"
  | "contact"
  | "alternateContact"
  | "email"
  | "civilStatus"
  | "nationality"
  | "preferredLanguage"
  | "barangay"
  | "municipality"
  | "province"
  | "postalCode"
  | "address"
  | "addressLine"
  | "philHealthClientType"
  | "philHealthPin"
  | "philHealthMemberName"
  | "philHealthMemberPin"
  | "guardianName"
  | "guardianRelationship"
  | "guardianContact"
  | "emergencyContactName"
  | "emergencyContactRelationship"
  | "emergencyContactPhone"
> &
  Partial<
    Pick<
      Patient,
      | "latitude"
      | "longitude"
      | "locationSource"
      | "locationAccuracy"
      | "locationVerified"
      | "locationVerifiedAt"
      | "mobileLocationVerifiedAt"
      | "mobileLocationBarangay"
      | "mobileLocationMunicipality"
      | "mobileLocationProvince"
      | "mobileLocationAccuracy"
      | "consentToTreatment"
      | "privacyAcknowledged"
    >
  >;
type Store = {
  patients: Patient[];
  appointments: Appointment[];
  medicines: MedicineItem[];
  services: Service[];
  consultationTemplates: ConsultationTemplate[];
  staffUsers: StaffUser[];
  barangays: BarangayDirectoryEntry[];
  medicalRecords: MedicalRecord[];
  triage: TriageRecord[];
  audit: AuditEvent[];
  accounts: PortalAccount[];
  notifications: PatientNotification[];
  checkIn: (id: string, queueNumber: string) => boolean;
  markAbsent: (id: string) => void;
  completeTriage: (record: Omit<TriageRecord, "completedAt">) => boolean;
  importMigration: (rows: MigrationRow[]) => ImportSummary;
  registerPatient: (input: RegistrationInput) => Patient;
  registerPortalPatient: (
    input: PortalRegistrationInput,
    password: string,
  ) => Patient | null;
  loginPatient: (mobile: string, password: string) => Patient | null;
  addWalkIn: (
    patientId: string,
    serviceId: string,
    queueNumber: string,
    reason: string,
  ) => boolean;
  callNext: (area?: "General Clinic" | "Animal Bite Center") => void;
  completeConsultation: (
    id: string,
    diagnosis: string,
    notes: string,
    prescription: MedicalRecord["prescription"],
    doctorId: string,
    followUp?: { date: string; type: string; reason: string },
  ) => void;
  updatePatient: (id: string, patch: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  updateMedicine: (id: string, patch: Partial<MedicineItem>) => void;
  deleteMedicine: (id: string) => void;
  addService: (service: Omit<Service, "id">) => boolean;
  updateService: (id: string, patch: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addConsultationTemplate: (
    template: Omit<ConsultationTemplate, "id" | "createdAt" | "updatedAt">,
  ) => boolean;
  updateConsultationTemplate: (
    id: string,
    patch: Partial<Omit<ConsultationTemplate, "id" | "createdAt">>,
  ) => void;
  deleteConsultationTemplate: (id: string) => void;
  addStaffUser: (user: Omit<StaffUser, "id">) => boolean;
  updateStaffUser: (id: string, patch: Partial<StaffUser>) => boolean;
  deleteStaffUser: (id: string) => void;
  loginStaff: (username: string, password: string) => StaffUser | null;
  markNotificationRead: (id: string) => void;
  addBarangay: (barangay: Omit<BarangayDirectoryEntry, "id">) => boolean;
  updateBarangay: (
    currentName: string,
    barangay: Omit<BarangayDirectoryEntry, "id">,
  ) => boolean;
  deleteBarangay: (name: string) => boolean;
  bookAppointment: (patientId: string, serviceId: string, date: string) => void;
  cancelAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, date: string) => void;
  recallQueue: (id: string) => void;
  skipQueue: (id: string) => void;
  addMedicine: (medicine: Omit<MedicineItem, "id">) => boolean;
  dispense: (
    patientId: string,
    medicineId: string,
    requested: number,
  ) => number;
  receiveStock: (medicineId: string, quantity: number) => boolean;
  reset: () => void;
};
const key = "smartserve-prototype-v3";
const StoreContext = createContext<Store | null>(null);
const now = () => new Date().toISOString();
const normalizePatientIdentity = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("en-PH")
    .replace(/[^a-z0-9]/g, "");
const seed = () => ({
  patients: [] as Patient[],
  appointments: [] as Appointment[],
  medicines: seedMedicines,
  services: seedServices,
  consultationTemplates: [] as ConsultationTemplate[],
  staffUsers: [] as StaffUser[],
  barangays: [] as BarangayDirectoryEntry[],
  medicalRecords: [] as MedicalRecord[],
  triage: [] as TriageRecord[],
  audit: [] as AuditEvent[],
  accounts: [] as PortalAccount[],
  notifications: [] as PatientNotification[],
});
const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");
const readMigrationField = (row: MigrationRow, ...aliases: string[]) => {
  const normalized = aliases.map(normalizeHeader);
  const entry = Object.entries(row).find(([header]) =>
    normalized.includes(normalizeHeader(header)),
  );
  return entry?.[1]?.trim() || "";
};
const mergeSeedServices = (savedServices: Service[]) => {
  const legacyNames: Record<string, string> = {
    s3: "Immunization",
    s4: "Dental Service",
    s6: "TB / DOTS",
  };
  const migrated = (Array.isArray(savedServices) ? savedServices : []).map(
    (service) => {
      const replacement = seedServices.find(
        (seedService) => seedService.id === service.id,
      );
      const isAnimalBite =
        service.id === "s9" || normalizeHeader(service.name) === "animalbite";
      const withSeedMetadata = replacement
        ? {
            ...service,
            queueArea: isAnimalBite
              ? "Animal Bite Center"
              : service.queueArea || replacement.queueArea,
            followUpEligible: service.followUpEligible ?? replacement.followUpEligible,
            building: service.building || replacement.building,
          }
        : service;
      return replacement && legacyNames[service.id] === service.name
        ? {
            ...withSeedMetadata,
            name: replacement.name,
            description: replacement.description,
            icon: replacement.icon,
            color: replacement.color,
          }
        : withSeedMetadata;
    },
  );
  const currentIds = new Set(migrated.map((service) => service.id));
  return [
    ...migrated,
    ...seedServices.filter((service) => !currentIds.has(service.id)),
  ];
};
const careAreaForService = (service?: Service): "General Clinic" | "Animal Bite Center" =>
  service?.id === "s9" || normalizeHeader(service?.name || "") === "animalbite"
    ? "Animal Bite Center"
    : service?.queueArea || "General Clinic";
const buildingForCareArea = (area: "General Clinic" | "Animal Bite Center") =>
  area === "Animal Bite Center" ? "Animal Bite Center building" : "Super Health Center";
const legacyAvailabilityToDoctorStatus = (value: unknown): DoctorAvailability => {
  switch (value) {
    case "On leave":
      return "On leave";
    case "Off duty":
      return "Off duty";
    case "Unavailable":
    case "In travel":
      return "On break";
    default:
      return "Available";
  }
};
const hydrate = (saved: Partial<ReturnType<typeof seed>>) => {
  const services = mergeSeedServices(saved.services || []);
  const appointments = Array.isArray(saved.appointments)
    ? saved.appointments.map((appointment) => {
        const service = services.find((item) => item.id === appointment.serviceId);
        const queueArea = service
          ? careAreaForService(service)
          : appointment.queueArea || "General Clinic";
        const shouldCorrectLegacyAnimalBiteRoom =
          queueArea === "Animal Bite Center" &&
          (!appointment.room || appointment.room === "Super Health Center");
        return {
          ...appointment,
          queueArea,
          room: shouldCorrectLegacyAnimalBiteRoom
            ? buildingForCareArea(queueArea)
            : appointment.room,
        };
      })
    : [];
  return {
    ...seed(),
    ...saved,
    appointments,
    notifications: Array.isArray(saved.notifications) ? saved.notifications : [],
    barangays: Array.isArray(saved.barangays) ? saved.barangays : [],
    staffUsers: Array.isArray(saved.staffUsers)
      ? saved.staffUsers.map((savedUser) => {
        const legacy = savedUser as StaffUser & { availability?: unknown; availabilityNote?: string };
        return {
          ...legacy,
          password: typeof legacy.password === "string" ? legacy.password : "",
          passwordChangeRequired: Boolean(legacy.passwordChangeRequired),
          doctorStatus:
            legacy.role === "Doctor"
              ? legacy.doctorStatus || legacyAvailabilityToDoctorStatus(legacy.availability)
              : undefined,
          notes: legacy.notes || legacy.availabilityNote || undefined,
        };
        })
      : [],
    services,
  };
};

export function PrototypeStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? hydrate(JSON.parse(saved)) : seed();
    } catch {
      return seed();
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [data]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === key && event.newValue)
        setData(hydrate(JSON.parse(event.newValue)));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const change = (
    role: string,
    action: string,
    reference: string,
    fn: (current: typeof data) => typeof data,
  ) =>
    setData((current) => {
      const next = fn(current);
      return {
        ...next,
        audit: [
          { id: crypto.randomUUID(), at: now(), role, action, reference },
          ...next.audit,
        ].slice(0, 100),
      };
    });
  const importMigration = (rows: MigrationRow[]): ImportSummary => {
    const summary: ImportSummary = {
      patientsAdded: 0,
      appointmentsAdded: 0,
      checkupsAdded: 0,
      skipped: 0,
    };
    const patientLookup = new Map<string, string>();
    data.patients.forEach((patient) => {
      patientLookup.set(patient.id.toLowerCase(), patient.id);
      if (patient.patientNumber)
        patientLookup.set(patient.patientNumber.toLowerCase(), patient.id);
      if (patient.contact)
        patientLookup.set(patient.contact.trim().toLowerCase(), patient.id);
    });
    const patientImports: Patient[] = [];
    rows.forEach((row) => {
      const recordType = readMigrationField(row, "Record type").toLowerCase();
      const fullName = readMigrationField(
        row,
        "Full name",
        "Patient name",
        "Name",
      );
      const dob = readMigrationField(row, "Date of birth", "DOB", "Birth date");
      const contact = readMigrationField(
        row,
        "Mobile number",
        "Mobile",
        "Contact",
        "Phone",
      );
      const barangay = readMigrationField(row, "Barangay");
      const sourceId = readMigrationField(
        row,
        "Patient ID",
        "Patient number",
        "Patient code",
        "ID",
      );
      const isPatientRow =
        recordType.includes("patient") ||
        (!recordType && Boolean(fullName && dob));
      if (!isPatientRow) return;
      const duplicateId = [sourceId, contact]
        .filter(Boolean)
        .map((value) => patientLookup.get(value.toLowerCase()))
        .find(Boolean);
      if (duplicateId || !fullName || !dob || !contact || !barangay) {
        summary.skipped += 1;
        if (duplicateId && sourceId)
          patientLookup.set(sourceId.toLowerCase(), duplicateId);
        return;
      }
      const parsedLatitude = Number(readMigrationField(row, "Latitude", "Lat"));
      const parsedLongitude = Number(
        readMigrationField(row, "Longitude", "Lng", "Long"),
      );
      const patient: Patient = {
        id: crypto.randomUUID(),
        patientNumber:
          sourceId ||
          `PT-${String(data.patients.length + patientImports.length + 1).padStart(6, "0")}`,
        fullName,
        maskedName: `${fullName.split(" ")[0]?.[0] || "P"}. ${fullName.split(" ").at(-1) || "Patient"}`,
        dob,
        gender:
          readMigrationField(row, "Gender", "Sex").toLowerCase() === "male"
            ? "Male"
            : readMigrationField(row, "Gender", "Sex").toLowerCase() === "other"
              ? "Other"
              : readMigrationField(row, "Gender", "Sex").toLowerCase() ===
                  "unknown"
                ? "Unknown"
                : "Female",
        contact,
        address:
          readMigrationField(
            row,
            "Address",
            "Home address",
            "Address / purok",
          ) || barangay,
        barangay,
        municipality:
          readMigrationField(row, "Municipality", "City") || "Jones",
        province: readMigrationField(row, "Province"),
        postalCode: readMigrationField(row, "Postal code", "ZIP code", "Zip"),
        givenName: readMigrationField(row, "First name", "Given name"),
        familyName: readMigrationField(
          row,
          "Last name",
          "Family name",
          "Surname",
        ),
        middleName: readMigrationField(row, "Middle name"),
        suffix: readMigrationField(row, "Suffix", "Name extension"),
        civilStatus: readMigrationField(row, "Civil status", "Marital status"),
        nationality: readMigrationField(row, "Nationality"),
        preferredLanguage: readMigrationField(
          row,
          "Preferred language",
          "Language",
        ),
        email: readMigrationField(row, "Email", "Email address"),
        alternateContact: readMigrationField(
          row,
          "Alternate contact",
          "Alternate number",
          "Secondary mobile",
        ),
        philHealthClientType: (() => {
          const value = readMigrationField(
            row,
            "PhilHealth client type",
            "Client type",
          ).toLowerCase();
          return value === "member"
            ? "Member"
            : value === "dependent"
              ? "Dependent"
              : "Not enrolled";
        })(),
        philHealthPin: readMigrationField(
          row,
          "PhilHealth PIN",
          "PhilHealth ID",
          "PIN",
        ),
        philHealthMemberName: readMigrationField(
          row,
          "PhilHealth member name",
          "Sponsor name",
        ),
        philHealthMemberPin: readMigrationField(
          row,
          "PhilHealth member PIN",
          "Sponsor PIN",
        ),
        guardianName: readMigrationField(row, "Guardian name", "Parent name"),
        guardianRelationship: readMigrationField(
          row,
          "Guardian relationship",
          "Parent relationship",
        ),
        guardianContact: readMigrationField(
          row,
          "Guardian contact",
          "Guardian mobile",
        ),
        emergencyContactName: readMigrationField(row, "Emergency contact name"),
        emergencyContactRelationship: readMigrationField(
          row,
          "Emergency contact relationship",
        ),
        emergencyContactPhone: readMigrationField(
          row,
          "Emergency contact number",
          "Emergency contact phone",
        ),
        latitude: Number.isFinite(parsedLatitude) ? parsedLatitude : 16.5613,
        longitude: Number.isFinite(parsedLongitude)
          ? parsedLongitude
          : 121.7023,
        locationSource: "Barangay fallback",
        locationVerified: false,
        privacyAcknowledged: true,
        consentToTreatment: false,
      };
      patientImports.push(patient);
      summary.patientsAdded += 1;
      patientLookup.set(patient.id.toLowerCase(), patient.id);
      patientLookup.set(patient.patientNumber!.toLowerCase(), patient.id);
      patientLookup.set(contact.toLowerCase(), patient.id);
    });
    const serviceLookup = new Map(
      data.services.flatMap((service) => [
        [service.id.toLowerCase(), service.id],
        [service.name.toLowerCase(), service.id],
      ]),
    );
    const appointmentImports: Appointment[] = [];
    const checkupImports: MedicalRecord[] = [];
    const activeAppointmentKeys = new Set(
      data.appointments.map(
        (appointment) =>
          `${appointment.patientId}|${appointment.date}|${appointment.serviceId}|${appointment.queueNumber}`,
      ),
    );
    const checkupKeys = new Set(
      data.medicalRecords.map(
        (record) =>
          `${record.patientId}|${record.date}|${record.diagnosis.toLowerCase()}`,
      ),
    );
    rows.forEach((row) => {
      const recordType = readMigrationField(row, "Record type").toLowerCase();
      const patientIdentifier = readMigrationField(
        row,
        "Patient ID",
        "Patient number",
        "Patient code",
        "Patient",
      );
      const patientId = patientLookup.get(patientIdentifier.toLowerCase());
      const date = readMigrationField(
        row,
        "Date",
        "Appointment date",
        "Visit date",
      );
      const serviceValue = readMigrationField(
        row,
        "Service",
        "Service name",
        "Service ID",
      ).toLowerCase();
      const isAppointment =
        recordType === "appointment" ||
        (!recordType && Boolean(serviceValue && date));
      const isCheckup =
        recordType.includes("checkup") ||
        recordType.includes("medical") ||
        (!recordType &&
          Boolean(
            readMigrationField(row, "Diagnosis") &&
            readMigrationField(row, "Clinician", "Doctor"),
          ));
      if (isAppointment) {
        const serviceId = serviceLookup.get(serviceValue);
        if (!patientId || !serviceId || !date) {
          summary.skipped += 1;
          return;
        }
        const queueNumber =
          readMigrationField(row, "Queue number", "Queue") || "";
        const duplicateKey = `${patientId}|${date}|${serviceId}|${queueNumber}`;
        if (activeAppointmentKeys.has(duplicateKey)) {
          summary.skipped += 1;
          return;
        }
        const status =
          readMigrationField(row, "Queue status", "Status") || "Scheduled";
        const attendance =
          readMigrationField(row, "Attendance", "Attendance status") ||
          "Pending";
        const validStatuses = [
          "Waiting",
          "Waiting for Triage",
          "Triage",
          "Waiting for Doctor",
          "Called",
          "In Consultation",
          "Now Serving",
          "Completed",
          "Consultation Completed",
          "No Show",
          "Skipped",
          "Cancelled",
          "Scheduled",
        ];
        const validAttendance = ["Pending", "Present", "Absent"];
        appointmentImports.push({
          id: crypto.randomUUID(),
          patientId,
          serviceId,
          date,
          timeSlot:
            readMigrationField(row, "Time", "Time slot") || "Imported record",
          queueNumber,
          attendanceStatus: (validAttendance.includes(attendance)
            ? attendance
            : "Pending") as Appointment["attendanceStatus"],
          queueStatus: (validStatuses.includes(status)
            ? status
            : "Scheduled") as Appointment["queueStatus"],
          room: readMigrationField(row, "Room") || "To be assigned",
          createdAt: now(),
          visitType:
            readMigrationField(row, "Visit type") === "Walk-in"
              ? "Walk-in"
              : "Scheduled",
        });
        activeAppointmentKeys.add(duplicateKey);
        summary.appointmentsAdded += 1;
        return;
      }
      if (isCheckup) {
        const diagnosis =
          readMigrationField(row, "Diagnosis") || "Imported clinical record";
        if (!patientId || !date) {
          summary.skipped += 1;
          return;
        }
        const duplicateKey = `${patientId}|${date}|${diagnosis.toLowerCase()}`;
        if (checkupKeys.has(duplicateKey)) {
          summary.skipped += 1;
          return;
        }
        const importStatus = readMigrationField(
          row,
          "Prescription status",
          "Status",
        );
        const allowedStatuses = [
          "Prescribed",
          "Ready for pickup",
          "Partially dispensed",
          "Dispensed",
        ];
        checkupImports.push({
          id: crypto.randomUUID(),
          patientId,
          date,
          clinician:
            readMigrationField(row, "Clinician", "Doctor") ||
            "Imported clinician",
          diagnosis,
          notes:
            readMigrationField(row, "Notes", "Clinical notes") ||
            "Imported historical record.",
          prescription: [],
          status: (allowedStatuses.includes(importStatus)
            ? importStatus
            : "Prescribed") as MedicalRecord["status"],
        });
        checkupKeys.add(duplicateKey);
        summary.checkupsAdded += 1;
      }
    });
    if (
      summary.patientsAdded ||
      summary.appointmentsAdded ||
      summary.checkupsAdded
    )
      change(
        "Administrator",
        `Imported ${summary.patientsAdded} patient(s), ${summary.appointmentsAdded} appointment(s), and ${summary.checkupsAdded} checkup(s)`,
        "CSV migration",
        (current) => ({
          ...current,
          patients: [...patientImports, ...current.patients],
          appointments: [...appointmentImports, ...current.appointments],
          medicalRecords: [...checkupImports, ...current.medicalRecords],
        }),
      );
    return summary;
  };
  const value = useMemo<Store>(
    () => ({
      ...data,
      importMigration,
      updatePatient: (id, patch) =>
        change("Administrator", "Updated patient record", id, (d) => ({
          ...d,
          patients: d.patients.map((patient) =>
            patient.id === id ? { ...patient, ...patch } : patient,
          ),
        })),
      deletePatient: (id) =>
        change("Administrator", "Deleted patient record", id, (d) => ({
          ...d,
          patients: d.patients.filter((patient) => patient.id !== id),
          appointments: d.appointments.filter(
            (appointment) => appointment.patientId !== id,
          ),
          medicalRecords: d.medicalRecords.filter(
            (record) => record.patientId !== id,
          ),
          accounts: d.accounts.filter((account) => account.patientId !== id),
          notifications: d.notifications.filter(
            (notification) => notification.patientId !== id,
          ),
        })),
      updateAppointment: (id, patch) =>
        change("Administrator", "Updated appointment", id, (d) => ({
          ...d,
          appointments: d.appointments.map((appointment) =>
            appointment.id === id ? { ...appointment, ...patch } : appointment,
          ),
        })),
      deleteAppointment: (id) =>
        change("Administrator", "Deleted appointment", id, (d) => ({
          ...d,
          appointments: d.appointments.filter(
            (appointment) => appointment.id !== id,
          ),
          triage: d.triage.filter((record) => record.appointmentId !== id),
        })),
      updateMedicine: (id, patch) =>
        change("Administrator", "Updated medicine catalogue item", id, (d) => ({
          ...d,
          medicines: d.medicines.map((medicine) =>
            medicine.id === id ? { ...medicine, ...patch } : medicine,
          ),
        })),
      deleteMedicine: (id) =>
        change("Administrator", "Deleted medicine catalogue item", id, (d) => ({
          ...d,
          medicines: d.medicines.filter((medicine) => medicine.id !== id),
        })),
      addService: (service) => {
        if (
          !service.name.trim() ||
          data.services.some(
            (item) =>
              item.name.toLowerCase() === service.name.trim().toLowerCase(),
          )
        )
          return false;
        change("Administrator", "Created service", service.name, (d) => ({
          ...d,
          services: [...d.services, { ...service, id: crypto.randomUUID() }],
        }));
        return true;
      },
      updateService: (id, patch) =>
        change("Administrator", "Updated service", id, (d) => ({
          ...d,
          services: d.services.map((service) =>
            service.id === id ? { ...service, ...patch } : service,
          ),
        })),
      deleteService: (id) =>
        change("Administrator", "Deleted service", id, (d) => ({
          ...d,
          services: d.services.filter((service) => service.id !== id),
        })),
      addConsultationTemplate: (template) => {
        const assessment = template.assessment.trim();
        if (
          !assessment ||
          !template.clinicalNotes.trim() ||
          data.consultationTemplates.some(
            (item) =>
              item.assessment.toLowerCase() === assessment.toLowerCase(),
          )
        )
          return false;
        change(
          "Administrator",
          "Created consultation template",
          assessment,
          (d) => ({
            ...d,
            consultationTemplates: [
              ...d.consultationTemplates,
              {
                ...template,
                assessment,
                clinicalNotes: template.clinicalNotes.trim(),
                id: crypto.randomUUID(),
                createdAt: now(),
                updatedAt: now(),
              },
            ],
          }),
        );
        return true;
      },
      updateConsultationTemplate: (id, patch) =>
        change("Administrator", "Updated consultation template", id, (d) => ({
          ...d,
          consultationTemplates: d.consultationTemplates.map((template) =>
            template.id === id
              ? {
                  ...template,
                  ...patch,
                  assessment: patch.assessment?.trim() || template.assessment,
                  clinicalNotes:
                    patch.clinicalNotes?.trim() || template.clinicalNotes,
                  updatedAt: now(),
                }
              : template,
          ),
        })),
      deleteConsultationTemplate: (id) =>
        change("Administrator", "Deleted consultation template", id, (d) => ({
          ...d,
          consultationTemplates: d.consultationTemplates.filter(
            (template) => template.id !== id,
          ),
        })),
      addStaffUser: (user) => {
        if (
          !user.fullName.trim() ||
          !user.username.trim() ||
          user.password.trim().length < 4 ||
          data.staffUsers.some(
            (item) =>
              item.username.toLowerCase() ===
              user.username.trim().toLowerCase(),
          )
        )
          return false;
        const normalized: Omit<StaffUser, "id"> = {
          ...user,
          fullName: user.fullName.trim(),
          username: user.username.trim(),
          password: user.password.trim(),
          doctorStatus:
            user.role === "Doctor" ? user.doctorStatus || "Available" : undefined,
        };
        change("Administrator", "Created staff user", normalized.username, (d) => ({
          ...d,
          staffUsers: [...d.staffUsers, { ...normalized, id: crypto.randomUUID() }],
        }));
        return true;
      },
      updateStaffUser: (id, patch) => {
        const username = patch.username?.trim();
        if (
          username &&
          data.staffUsers.some(
            (user) =>
              user.id !== id &&
              user.username.toLowerCase() === username.toLowerCase(),
          )
        )
          return false;
        change("Administrator", "Updated staff user", id, (d) => ({
          ...d,
          staffUsers: d.staffUsers.map((user) =>
            user.id === id
              ? {
                  ...user,
                  ...patch,
                  username: username || user.username,
                  doctorStatus:
                    (patch.role || user.role) === "Doctor"
                      ? patch.doctorStatus || user.doctorStatus || "Available"
                      : undefined,
                }
              : user,
          ),
        }));
        return true;
      },
      deleteStaffUser: (id) =>
        change("Administrator", "Deleted staff user", id, (d) => ({
          ...d,
          staffUsers: d.staffUsers.filter((user) => user.id !== id),
        })),
      loginStaff: (username, password) =>
        data.staffUsers.find(
          (user) =>
            user.active &&
            user.username.toLowerCase() === username.trim().toLowerCase() &&
            user.password === password,
        ) || null,
      markNotificationRead: (id) =>
        change("Patient", "Read notification", id, (d) => ({
          ...d,
          notifications: d.notifications.map((notification) =>
            notification.id === id
              ? { ...notification, read: true }
              : notification,
          ),
        })),
      addBarangay: (barangay) => {
        const name = barangay.name.trim();
        if (
          !name ||
          data.barangays.some(
            (item) =>
              normalizePatientIdentity(item.name) ===
              normalizePatientIdentity(name),
          )
        )
          return false;
        change("Administrator", "Added barangay directory entry", name, (d) => ({
          ...d,
          barangays: [
            ...d.barangays,
            {
              ...barangay,
              id: crypto.randomUUID(),
              name,
              municipality: barangay.municipality.trim(),
              province: barangay.province.trim(),
              postalCode: barangay.postalCode?.trim(),
            },
          ],
        }));
        return true;
      },
      updateBarangay: (currentName, barangay) => {
        const currentKey = normalizePatientIdentity(currentName);
        const name = barangay.name.trim();
        const nameKey = normalizePatientIdentity(name);
        if (
          !currentKey ||
          !name ||
          data.barangays.some(
            (item) =>
              normalizePatientIdentity(item.name) !== currentKey &&
              normalizePatientIdentity(item.name) === nameKey,
          )
        )
          return false;
        const existing = data.barangays.find(
          (item) => normalizePatientIdentity(item.name) === currentKey,
        );
        change("Administrator", "Updated barangay directory entry", name, (d) => ({
          ...d,
          barangays: existing
            ? d.barangays.map((item) =>
                item.id === existing.id
                  ? {
                      ...item,
                      ...barangay,
                      name,
                      municipality: barangay.municipality.trim(),
                      province: barangay.province.trim(),
                      postalCode: barangay.postalCode?.trim(),
                    }
                  : item,
              )
            : [
                ...d.barangays,
                {
                  ...barangay,
                  id: crypto.randomUUID(),
                  name,
                  municipality: barangay.municipality.trim(),
                  province: barangay.province.trim(),
                  postalCode: barangay.postalCode?.trim(),
                },
              ],
          patients: d.patients.map((patient) =>
            normalizePatientIdentity(patient.barangay) === currentKey
              ? { ...patient, barangay: name }
              : patient,
          ),
        }));
        return true;
      },
      deleteBarangay: (name) => {
        const nameKey = normalizePatientIdentity(name);
        const existing = data.barangays.find(
          (item) => normalizePatientIdentity(item.name) === nameKey,
        );
        if (
          !existing ||
          data.patients.some(
            (patient) => normalizePatientIdentity(patient.barangay) === nameKey,
          )
        )
          return false;
        change("Administrator", "Deleted barangay directory entry", name, (d) => ({
          ...d,
          barangays: d.barangays.filter((item) => item.id !== existing.id),
        }));
        return true;
      },
      bookAppointment: (patientId, serviceId, date) => {
        const createdAt = now();
        const service = data.services.find((item) => item.id === serviceId);
        const serviceName = service?.name || "clinic service";
        const queueArea = careAreaForService(service);
        const building = service?.building || buildingForCareArea(queueArea);
        change("Patient", "Created booking", serviceId, (d) => ({
          ...d,
          appointments: [
            {
              id: crypto.randomUUID(),
              patientId,
              serviceId,
              date,
              timeSlot: "Clinic hours",
              queueNumber: "",
              attendanceStatus: "Pending",
              queueStatus: "Scheduled",
              room: building,
              queueArea,
              createdAt,
            },
            ...d.appointments,
          ],
          notifications: [
            {
              id: crypto.randomUUID(),
              patientId,
              title: "Booking received",
              message: `Your ${serviceName} booking for ${date} was recorded. Check in at ${building} on your appointment date.`,
              createdAt,
              read: false,
              type: "update",
            },
            ...d.notifications,
          ].slice(0, 100),
        }));
      },
      cancelAppointment: (id) =>
        change("Patient", "Cancelled appointment", id, (d) => ({
          ...d,
          appointments: d.appointments.map((a) =>
            a.id === id ? { ...a, queueStatus: "Cancelled" } : a,
          ),
        })),
      rescheduleAppointment: (id, date) =>
        change("Patient", "Rescheduled appointment", id, (d) => ({
          ...d,
          appointments: d.appointments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  date,
                  queueStatus: "Scheduled",
                  attendanceStatus: "Pending",
                  queueNumber: "",
                }
              : a,
          ),
        })),
      recallQueue: (id) =>
        change("Queue staff", "Recalled queue number", id, (d) => ({
          ...d,
          appointments: d.appointments.map((a) =>
            a.id === id ? { ...a, queueStatus: "Called" } : a,
          ),
        })),
      skipQueue: (id) =>
        change("Queue staff", "Skipped queue number", id, (d) => ({
          ...d,
          appointments: d.appointments.map((a) =>
            a.id === id ? { ...a, queueStatus: "Skipped" } : a,
          ),
        })),
      checkIn: (id, givenNumber) => {
        const queueNumber = givenNumber.replace(/\D/g, "").padStart(3, "0");
        const appointmentToCheckIn = data.appointments.find((appointment) => appointment.id === id);
        const appointmentService = data.services.find(
          (service) => service.id === appointmentToCheckIn?.serviceId,
        );
        const queueArea = careAreaForService(appointmentService);
        if (
          !/^(0(0[1-9]|[1-9][0-9])|100)$/.test(queueNumber) ||
          data.appointments.some(
            (a) =>
              a.id !== id &&
              a.queueNumber === queueNumber &&
              (a.queueArea || "General Clinic") === queueArea &&
              !["Completed", "Consultation Completed", "No Show"].includes(
                a.queueStatus,
              ),
          )
        )
          return false;
        const checkedInAt = now();
        change(
          "Front desk",
          `Checked in with queue number ${queueNumber}`,
          id,
          (d) => ({
            ...d,
            appointments: d.appointments.map((a) =>
              a.id === id
                ? {
                    ...a,
                    attendanceStatus: "Present",
                    queueStatus: "Waiting for Triage",
                    queueNumber,
                    queueEnteredAt: checkedInAt,
                    queueArea,
                    room: appointmentService?.building || buildingForCareArea(queueArea),
                  }
                : a,
            ),
            notifications: (() => {
              const appointment = d.appointments.find((a) => a.id === id);
              if (!appointment) return d.notifications;
              return [
                {
                  id: crypto.randomUUID(),
                  patientId: appointment.patientId,
                  title: "Check-in confirmed",
                  message: `You are present at the clinic. Your queue number is ${queueNumber}. Please wait for your number to be called.`,
                  createdAt: checkedInAt,
                  read: false,
                  type: "alert" as const,
                },
                ...d.notifications,
              ].slice(0, 100);
            })(),
          }),
        );
        return true;
      },
      registerPatient: (input) => {
        const patient: Patient = {
          ...input,
          id: crypto.randomUUID(),
          patientNumber: `PT-${String(data.patients.length + 1).padStart(6, "0")}`,
          maskedName: `${input.fullName.split(" ")[0]?.[0] || "P"}. ${input.fullName.split(" ").at(-1) || "Patient"}`,
          locationVerified: input.locationVerified ?? false,
          locationVerifiedAt: input.locationVerified
            ? input.locationVerifiedAt || now()
            : undefined,
          consentToTreatment: input.consentToTreatment,
          privacyAcknowledged: input.privacyAcknowledged,
        };
        change(
          "Triage / intake",
          "Registered new patient",
          patient.id,
          (d) => ({ ...d, patients: [patient, ...d.patients] }),
        );
        return patient;
      },
      registerPortalPatient: (input, password) => {
        const mobile = input.contact.trim();
        if (
          !password ||
          data.accounts.some((account) => account.mobile === mobile)
        )
          return null;
        const existingPatient = data.patients.find((patient) =>
          Boolean(
            normalizePatientIdentity(patient.contact) ===
              normalizePatientIdentity(mobile) ||
            (input.philHealthPin &&
              normalizePatientIdentity(patient.philHealthPin || "") ===
                normalizePatientIdentity(input.philHealthPin)) ||
            (normalizePatientIdentity(patient.fullName) ===
              normalizePatientIdentity(input.fullName) &&
              patient.dob === input.dob),
          ),
        );
        if (existingPatient) {
          if (
            data.accounts.some(
              (account) => account.patientId === existingPatient.id,
            )
          )
            return null;
          change(
            "Patient",
            "Linked online account to existing patient record",
            existingPatient.id,
            (d) => ({
              ...d,
              accounts: [
                ...d.accounts,
                { patientId: existingPatient.id, mobile, password },
              ],
            }),
          );
          return existingPatient;
        }
        const patient: Patient = {
          ...input,
          id: crypto.randomUUID(),
          patientNumber: `PT-${String(data.patients.length + 1).padStart(6, "0")}`,
          maskedName: `${input.fullName.split(" ")[0]?.[0] || "P"}. ${input.fullName.split(" ").at(-1) || "Patient"}`,
          latitude: input.latitude ?? 16.5613,
          longitude: input.longitude ?? 121.7023,
          locationSource: input.locationSource ?? "Barangay fallback",
          locationVerified: input.locationVerified ?? false,
          locationVerifiedAt: input.locationVerified
            ? input.locationVerifiedAt || now()
            : undefined,
          // Existing clinic records never receive this flag when linked to a
          // portal account. Only a newly created portal patient is asked for
          // location at their first service selection.
          requiresInitialServiceLocation: true,
          consentToTreatment: input.consentToTreatment ?? false,
          privacyAcknowledged: input.privacyAcknowledged ?? false,
        };
        change("Patient", "Created portal account", patient.id, (d) => ({
          ...d,
          patients: [patient, ...d.patients],
          accounts: [
            ...d.accounts,
            { patientId: patient.id, mobile, password },
          ],
        }));
        return patient;
      },
      loginPatient: (mobile, password) => {
        const account = data.accounts.find(
          (item) => item.mobile === mobile.trim() && item.password === password,
        );
        return account
          ? data.patients.find((patient) => patient.id === account.patientId) ||
              null
          : null;
      },
      addWalkIn: (patientId, serviceId, givenNumber, reason) => {
        const queueNumber = givenNumber.trim().padStart(3, "0");
        const service = data.services.find((item) => item.id === serviceId);
        if (
          !/^(0(0[1-9]|[1-9][0-9])|100)$/.test(queueNumber) ||
          data.appointments.some(
            (a) =>
              a.queueNumber === queueNumber &&
              (a.queueArea || "General Clinic") === careAreaForService(service) &&
              !["Completed", "Consultation Completed", "No Show"].includes(
                a.queueStatus,
              ),
          )
        )
          return false;
        const checkedInAt = now();
        change(
          "Triage / intake",
          `Added walk-in with queue number ${queueNumber}`,
          patientId,
          (d) => ({
            ...d,
            appointments: [
              {
                id: crypto.randomUUID(),
                patientId,
                serviceId,
                date: new Date().toISOString().slice(0, 10),
                timeSlot: "Walk-in",
                queueNumber,
                attendanceStatus: "Present",
                queueStatus: "Waiting for Triage",
                room: service?.building || buildingForCareArea(careAreaForService(service)),
                queueArea: careAreaForService(service),
                createdAt: checkedInAt,
                queueEnteredAt: checkedInAt,
                visitType: "Walk-in",
                visitReason: reason,
              },
              ...d.appointments,
            ],
          }),
        );
        return true;
      },
      markAbsent: (id) =>
        change("Front desk", "Marked absent", id, (d) => ({
          ...d,
          appointments: d.appointments.map((a) =>
            a.id === id
              ? { ...a, attendanceStatus: "Absent", queueStatus: "No Show" }
              : a,
          ),
        })),
      completeTriage: (record) => {
        const appointment = data.appointments.find((item) => item.id === record.appointmentId);
        const appointmentService = data.services.find(
          (service) => service.id === appointment?.serviceId,
        );
        const queueArea = careAreaForService(appointmentService);
        const requiresAnimalAssessment = queueArea === "Animal Bite Center";
        const exposure = record.animalExposure;
        if (
          requiresAnimalAssessment &&
          (!exposure?.animal.trim() || !exposure.exposure.trim() || !exposure.woundSite.trim() || !exposure.animalStatus.trim() || !exposure.firstAid.trim())
        )
          return false;
        const triagedAt = now();
        change(
          "Nurse / triage",
          record.priority === "Emergency"
            ? "Emergency triage: immediate clinical routing"
            : `Completed ${record.priority.toLowerCase()} triage`,
          record.appointmentId,
          (d) => ({
            ...d,
            triage: [
              { ...record, completedAt: triagedAt },
              ...d.triage.filter(
                (t) => t.appointmentId !== record.appointmentId,
              ),
            ],
            appointments: d.appointments.map((a) =>
              a.id === record.appointmentId
                ? {
                    ...a,
                    triagePriority: record.priority,
                    triagedAt,
                    queueArea,
                    room: appointmentService?.building || buildingForCareArea(queueArea),
                    queueStatus:
                      record.priority === "Emergency"
                        ? "In Consultation"
                        : "Waiting for Doctor",
                  }
                : a,
            ),
          }),
        );
        return true;
      },
      callNext: (area = "General Clinic") => {
        if (
          data.appointments.some(
            (appointment) =>
              (appointment.queueArea || "General Clinic") === area &&
              appointment.queueStatus === "Called" ||
              (appointment.queueArea || "General Clinic") === area &&
              appointment.queueStatus === "In Consultation",
          )
        )
          return;
        const next = orderDoctorQueue(data.appointments.filter((appointment) => (appointment.queueArea || "General Clinic") === area))[0];
        if (!next) return;
        change(
          "Queue staff",
          `Called ${(next.triagePriority ?? "Normal").toLowerCase()} queue number for consultation`,
          next.id,
          (d) => ({
            ...d,
            appointments: d.appointments.map((appointment) =>
              appointment.id === next.id
                ? { ...appointment, queueStatus: "Called" }
                : appointment,
            ),
            notifications: [
              {
                id: crypto.randomUUID(),
                patientId: next.patientId,
                title: "You are now being served",
                message: `Queue number ${next.queueNumber || "assigned"} is now being served. Please proceed to ${next.room || "the assigned room"} for your consultation.`,
                createdAt: now(),
                read: false,
                type: "alert",
              },
              ...d.notifications,
            ].slice(0, 100),
          }),
        );
      },
      completeConsultation: (id, diagnosis, notes, prescription, doctorId, followUp) => {
        const clinician = data.staffUsers.find(
          (user) =>
            user.id === doctorId && user.role === "Doctor" && user.active,
        );
        if (!clinician) return;
        const permittedMedicineIds = new Set(
          data.medicines
            .filter((medicine) => medicine.stock > 0)
            .map((medicine) => medicine.id),
        );
        const recordedPrescription = prescription.reduce<
          MedicalRecord["prescription"]
        >((items, item) => {
          const quantity = Math.floor(item.quantity);
          if (
            !permittedMedicineIds.has(item.medicineId) ||
            quantity < 1 ||
            items.some((existing) => existing.medicineId === item.medicineId)
          )
            return items;
          return [
            ...items,
            {
              medicineId: item.medicineId,
              quantity,
              instructions: item.instructions.trim(),
            },
          ];
        }, []);
        change(
          "Doctor",
          `${clinician.fullName} completed consultation with ${recordedPrescription.length} clinic prescription item(s)`,
          id,
          (d) => {
            const appointment = d.appointments.find((a) => a.id === id);
            if (!appointment) return d;
            const recordId = crypto.randomUUID();
            const followUpAppointment = followUp?.date
              ? {
                  id: crypto.randomUUID(),
                  patientId: appointment.patientId,
                  serviceId: appointment.serviceId,
                  date: followUp.date,
                  timeSlot: "Doctor follow-up",
                  queueNumber: "",
                  attendanceStatus: "Pending" as const,
                  queueStatus: "Scheduled" as const,
                  room: appointment.room || "Super Health Center",
                  createdAt: now(),
                  queueArea: appointment.queueArea || "General Clinic",
                  parentAppointmentId: appointment.id,
                  followUpType: followUp.type,
                  followUpReason: followUp.reason,
                  followUpNumber: (appointment.followUpNumber || 0) + 1,
                }
              : null;
            return {
              ...d,
              medicalRecords: [
                {
                  id: recordId,
                  patientId: appointment.patientId,
                  appointmentId: appointment.id,
                  parentConsultationId: appointment.parentAppointmentId,
                  careArea: appointment.queueArea || "General Clinic",
                  followUpNumber: appointment.followUpNumber,
                  followUpPlan: followUp?.date
                    ? { ...followUp, building: appointment.room || "Super Health Center" }
                    : undefined,
                  date: new Date().toISOString().slice(0, 10),
                  clinicianId: clinician.id,
                  clinician: clinician.fullName,
                  diagnosis,
                  notes,
                  prescription: recordedPrescription,
                  status: recordedPrescription.length
                    ? "Ready for pickup"
                    : "Prescribed",
                },
                ...d.medicalRecords,
              ],
              appointments: followUpAppointment
                ? [followUpAppointment, ...d.appointments.map((a) => a.id === id ? { ...a, queueStatus: "Consultation Completed" as const } : a)]
                : d.appointments.map((a) => a.id === id ? { ...a, queueStatus: "Consultation Completed" as const } : a),
              notifications: followUpAppointment
                ? [{ id: crypto.randomUUID(), patientId: appointment.patientId, title: "Follow-up scheduled", message: `${followUp.type} is scheduled for ${followUp.date} at ${followUpAppointment.room}.`, createdAt: now(), read: false, type: "reminder" as const }, ...d.notifications].slice(0, 100)
                : d.notifications,
            };
          },
        );
      },
      dispense: (patientId, medicineId, requested) => {
        const record = data.medicalRecords.find(
          (item) =>
            item.patientId === patientId &&
            item.prescription.some(
              (prescription) =>
                prescription.medicineId === medicineId &&
                (prescription.dispensedQuantity ?? 0) < prescription.quantity,
            ),
        );
        const prescription = record?.prescription.find(
          (item) => item.medicineId === medicineId,
        );
        const available =
          data.medicines.find((medicine) => medicine.id === medicineId)
            ?.stock ?? 0;
        const remaining = prescription
          ? prescription.quantity - (prescription.dispensedQuantity ?? 0)
          : 0;
        const actual = Math.max(
          0,
          Math.min(Math.floor(requested), available, remaining),
        );
        if (!record || !prescription || actual < 1) return 0;
        const dispensedAt = now();
        change(
          "Pharmacy",
          `Dispensed ${actual} prescribed item(s)`,
          `${record.id}/${medicineId}`,
          (d) => ({
            ...d,
            medicines: d.medicines.map((medicine) =>
              medicine.id === medicineId
                ? { ...medicine, stock: medicine.stock - actual }
                : medicine,
            ),
            medicalRecords: d.medicalRecords.map((item) => {
              if (item.id !== record.id) return item;
              const updatedPrescription = item.prescription.map((entry) =>
                entry.medicineId === medicineId
                  ? {
                      ...entry,
                      dispensedQuantity:
                        (entry.dispensedQuantity ?? 0) + actual,
                      dispensedAt,
                    }
                  : entry,
              );
              const fullyDispensed = updatedPrescription.every(
                (entry) => (entry.dispensedQuantity ?? 0) >= entry.quantity,
              );
              return {
                ...item,
                prescription: updatedPrescription,
                status: fullyDispensed ? "Dispensed" : "Partially dispensed",
              };
            }),
          }),
        );
        return actual;
      },
      addMedicine: (medicine) => {
        if (
          !medicine.name.trim() ||
          data.medicines.some(
            (item) =>
              item.name.toLowerCase() === medicine.name.trim().toLowerCase() &&
              item.strength === medicine.strength &&
              item.form === medicine.form,
          )
        )
          return false;
        change(
          "Inventory",
          "Added medicine catalogue item",
          medicine.name,
          (d) => ({
            ...d,
            medicines: [
              { ...medicine, id: crypto.randomUUID() },
              ...d.medicines,
            ],
          }),
        );
        return true;
      },
      receiveStock: (medicineId, quantity) => {
        const amount = Math.floor(quantity);
        if (!data.medicines.some((m) => m.id === medicineId) || amount < 1)
          return false;
        change("Inventory", `Received ${amount} item(s)`, medicineId, (d) => ({
          ...d,
          medicines: d.medicines.map((m) =>
            m.id === medicineId ? { ...m, stock: m.stock + amount } : m,
          ),
        }));
        return true;
      },
      reset: () => setData(seed()),
    }),
    [data, change, importMigration],
  );
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
export const usePrototypeStore = () => {
  const value = useContext(StoreContext);
  if (!value) throw new Error("Prototype store is missing");
  return value;
};
