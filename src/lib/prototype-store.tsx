import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { medicines as seedMedicines } from "@/data/mockData";
import type { Appointment, MedicineItem, MedicalRecord, Patient } from "@/data/mockData";

export type TriageRecord = {
  appointmentId: string; priority: "Normal" | "Priority" | "Urgent" | "Emergency";
  bloodPressure: string; temperature: string; pulseRespiratory: string; allergies: string; complaint: string; completedAt: string;
};
export type AuditEvent = { id: string; at: string; role: string; action: string; reference: string };
type PortalAccount = { patientId: string; mobile: string; password: string };
export type RegistrationInput = Omit<Patient, "id" | "maskedName" | "latitude" | "longitude" | "locationSource" | "locationVerified"> & { latitude: number; longitude: number; locationSource: "Auto-pinned from address" | "Staff-adjusted" | "Barangay fallback" };
type Store = { patients: Patient[]; appointments: Appointment[]; medicines: MedicineItem[]; medicalRecords: MedicalRecord[]; triage: TriageRecord[]; audit: AuditEvent[]; accounts: PortalAccount[];
  checkIn: (id: string, queueNumber: string) => boolean; markAbsent: (id: string) => void; completeTriage: (record: Omit<TriageRecord, "completedAt">) => void;
  registerPatient: (input: RegistrationInput) => Patient; registerPortalPatient: (input: Pick<Patient, "fullName" | "dob" | "gender" | "contact" | "barangay" | "municipality" | "address">, password: string) => Patient | null; loginPatient: (mobile: string, password: string) => Patient | null; addWalkIn: (patientId: string, serviceId: string, queueNumber: string, reason: string) => boolean; callNext: (id: string) => void; sendToDoctor: (id: string) => void; completeConsultation: (id: string, diagnosis: string, notes: string) => void;
  bookAppointment: (patientId: string, serviceId: string, date: string) => void; cancelAppointment: (id: string) => void; rescheduleAppointment: (id: string, date: string) => void; recallQueue: (id: string) => void; skipQueue: (id: string) => void; addMedicine: (medicine: Omit<MedicineItem, "id">) => boolean; dispense: (patientId: string, medicineId: string, requested: number) => number; receiveStock: (medicineId: string, quantity: number) => boolean; reset: () => void;
};
const key = "smartserve-prototype-v3";
const StoreContext = createContext<Store | null>(null);
const now = () => new Date().toISOString();
const seed = () => ({ patients: [] as Patient[], appointments: [] as Appointment[], medicines: seedMedicines, medicalRecords: [] as MedicalRecord[], triage: [] as TriageRecord[], audit: [] as AuditEvent[], accounts: [] as PortalAccount[] });

export function PrototypeStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(() => {
    try { const saved = localStorage.getItem(key); return saved ? { ...seed(), ...JSON.parse(saved) } : seed(); } catch { return seed(); }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(data)); }, [data]);
  useEffect(() => { const sync = (event: StorageEvent) => { if (event.key === key && event.newValue) setData(JSON.parse(event.newValue)); }; window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync); }, []);
  const change = (role: string, action: string, reference: string, fn: (current: typeof data) => typeof data) => setData(current => {
    const next = fn(current); return { ...next, audit: [{ id: crypto.randomUUID(), at: now(), role, action, reference }, ...next.audit].slice(0, 100) };
  });
  const value = useMemo<Store>(() => ({ ...data,
    bookAppointment: (patientId, serviceId, date) => change("Patient", "Created booking", serviceId, d => ({ ...d, appointments: [{ id: crypto.randomUUID(), patientId, serviceId, date, timeSlot: "Clinic hours", queueNumber: "", attendanceStatus: "Pending", queueStatus: "Scheduled", room: "To be assigned", createdAt: now() }, ...d.appointments] })),
    cancelAppointment: id => change("Patient", "Cancelled appointment", id, d => ({ ...d, appointments: d.appointments.map(a => a.id === id ? { ...a, queueStatus: "Cancelled" } : a) })),
    rescheduleAppointment: (id, date) => change("Patient", "Rescheduled appointment", id, d => ({ ...d, appointments: d.appointments.map(a => a.id === id ? { ...a, date, queueStatus: "Scheduled", attendanceStatus: "Pending", queueNumber: "" } : a) })),
    recallQueue: id => change("Queue staff", "Recalled queue number", id, d => ({ ...d, appointments: d.appointments.map(a => a.id === id ? { ...a, queueStatus: "Called" } : a) })),
    skipQueue: id => change("Queue staff", "Skipped queue number", id, d => ({ ...d, appointments: d.appointments.map(a => a.id === id ? { ...a, queueStatus: "Skipped" } : a) })),
    checkIn: (id, givenNumber) => {
      const queueNumber = givenNumber.replace(/\D/g, "").padStart(3, "0");
      if (!/^(0(0[1-9]|[1-9][0-9])|100)$/.test(queueNumber) || data.appointments.some(a => a.id !== id && a.queueNumber === queueNumber && !["Completed", "Consultation Completed", "No Show"].includes(a.queueStatus))) return false;
      change("Front desk", `Checked in with queue number ${queueNumber}`, id, d => ({ ...d, appointments: d.appointments.map(a => a.id === id ? { ...a, attendanceStatus: "Present", queueStatus: "Waiting for Triage", queueNumber } : a) }));
      return true;
    },
    registerPatient: input => {
      const patient: Patient = { ...input, id: crypto.randomUUID(), patientNumber: `PT-${String(data.patients.length + 1).padStart(6, "0")}`, maskedName: `${input.fullName.split(" ")[0]?.[0] || "P"}. ${input.fullName.split(" ").at(-1) || "Patient"}`, locationVerified: false, consentToTreatment: input.consentToTreatment, privacyAcknowledged: input.privacyAcknowledged };
      change("Triage / intake", "Registered new patient", patient.id, d => ({ ...d, patients: [patient, ...d.patients] }));
      return patient;
    },
    registerPortalPatient: (input, password) => {
      const mobile = input.contact.trim();
      if (!password || data.accounts.some(account => account.mobile === mobile)) return null;
      const patient: Patient = { ...input, id: crypto.randomUUID(), patientNumber: `PT-${String(data.patients.length + 1).padStart(6, "0")}`, maskedName: `${input.fullName.split(" ")[0]?.[0] || "P"}. ${input.fullName.split(" ").at(-1) || "Patient"}`, latitude: 16.5613, longitude: 121.7023, locationSource: "Barangay fallback", locationVerified: false, consentToTreatment: false, privacyAcknowledged: true };
      change("Patient", "Created portal account", patient.id, d => ({ ...d, patients: [patient, ...d.patients], accounts: [...d.accounts, { patientId: patient.id, mobile, password }] }));
      return patient;
    },
    loginPatient: (mobile, password) => { const account = data.accounts.find(item => item.mobile === mobile.trim() && item.password === password); return account ? data.patients.find(patient => patient.id === account.patientId) || null : null; },
    addWalkIn: (patientId, serviceId, givenNumber, reason) => {
      const queueNumber = givenNumber.trim().padStart(3, "0");
      if (!/^(0(0[1-9]|[1-9][0-9])|100)$/.test(queueNumber) || data.appointments.some(a => a.queueNumber === queueNumber && !["Completed", "Consultation Completed", "No Show"].includes(a.queueStatus))) return false;
      change("Triage / intake", `Added walk-in with queue number ${queueNumber}`, patientId, d => ({ ...d, appointments: [{ id: crypto.randomUUID(), patientId, serviceId, date: new Date().toISOString().slice(0, 10), timeSlot: "Walk-in", queueNumber, attendanceStatus: "Present", queueStatus: "Waiting for Triage", room: "To be assigned", createdAt: now(), visitType: "Walk-in", visitReason: reason }, ...d.appointments] }));
      return true;
    },
    markAbsent: id => change("Front desk", "Marked absent", id, d => ({ ...d, appointments: d.appointments.map(a => a.id === id ? { ...a, attendanceStatus: "Absent", queueStatus: "No Show" } : a) })),
    completeTriage: record => change("Nurse / triage", record.priority === "Emergency" ? "Emergency triage: immediate clinical routing" : `Completed ${record.priority.toLowerCase()} triage`, record.appointmentId, d => ({ ...d, triage: [{ ...record, completedAt: now() }, ...d.triage.filter(t => t.appointmentId !== record.appointmentId)], appointments: d.appointments.map(a => a.id === record.appointmentId ? { ...a, queueStatus: record.priority === "Emergency" ? "In Consultation" : "Waiting for Doctor" } : a) })),
    callNext: id => change("Queue staff", "Called queue number", id, d => ({ ...d, appointments: d.appointments.map(a => a.id === id ? { ...a, queueStatus: "Called" } : a) })),
    sendToDoctor: id => change("Queue staff", "Patient arrived at consultation", id, d => ({ ...d, appointments: d.appointments.map(a => a.id === id ? { ...a, queueStatus: "In Consultation" } : a) })),
    completeConsultation: (id, diagnosis, notes) => change("Doctor", "Completed consultation", id, d => { const appointment = d.appointments.find(a => a.id === id); if (!appointment) return d; return { ...d, appointments: d.appointments.map(a => a.id === id ? { ...a, queueStatus: "Consultation Completed" } : a), medicalRecords: [{ id: crypto.randomUUID(), patientId: appointment.patientId, date: new Date().toISOString().slice(0, 10), clinician: "Dr. Joseph Mariano", diagnosis, notes, prescription: [], status: "Prescribed" }, ...d.medicalRecords] }; }),
    dispense: (patientId, medicineId, requested) => { const available = data.medicines.find(m => m.id === medicineId)?.stock ?? 0; const actual = Math.max(0, Math.min(requested, available)); change("Pharmacy", `Dispensed ${actual} item(s)`, `${patientId}/${medicineId}`, d => ({ ...d, medicines: d.medicines.map(m => m.id === medicineId ? { ...m, stock: m.stock - actual } : m) })); return actual; },
    addMedicine: medicine => { if (!medicine.name.trim() || data.medicines.some(item => item.name.toLowerCase() === medicine.name.trim().toLowerCase() && item.strength === medicine.strength && item.form === medicine.form)) return false; change("Inventory", "Added medicine catalogue item", medicine.name, d => ({ ...d, medicines: [{ ...medicine, id: crypto.randomUUID() }, ...d.medicines] })); return true; },
    receiveStock: (medicineId, quantity) => {
      const amount = Math.floor(quantity);
      if (!data.medicines.some(m => m.id === medicineId) || amount < 1) return false;
      change("Inventory", `Received ${amount} item(s)`, medicineId, d => ({ ...d, medicines: d.medicines.map(m => m.id === medicineId ? { ...m, stock: m.stock + amount } : m) }));
      return true;
    },
    reset: () => setData(seed()),
  }), [data]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export const usePrototypeStore = () => { const value = useContext(StoreContext); if (!value) throw new Error("Prototype store is missing"); return value; };
