// SmartServe mock data – Super Health Center of Jones, Isabela
// Structured to be swappable with Firebase/Firestore later.

export type Role = "patient" | "staff" | "doctor" | "pharmacy" | "admin";

export type QueueStatus = "Waiting" | "Waiting for Triage" | "Triage" | "Waiting for Doctor" | "Called" | "In Consultation" | "Now Serving" | "Completed" | "Consultation Completed" | "No Show" | "Scheduled";
export type AttendanceStatus = "Pending" | "Present" | "Absent";

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  capacity: number; // per day
  icon: string; // lucide icon name
  color: string; // semantic token name
}

export interface Patient {
  id: string;
  fullName: string;
  maskedName: string;
  dob: string;
  gender: "Male" | "Female";
  contact: string;
  address: string;
  barangay: string;
  municipality: string;
  latitude: number;
  longitude: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  serviceId: string;
  date: string; // ISO date
  timeSlot: string; // e.g. "09:30 AM"
  queueNumber: string; // e.g. "A-012"
  attendanceStatus: AttendanceStatus;
  queueStatus: QueueStatus;
  room?: string;
  createdAt: string;
}

export interface DiseaseRecord {
  id: string;
  category: string;
  diagnosis: string;
  date: string;
  count: number;
  barangay: string;
  municipality: string;
  latitude: number;
  longitude: number;
}

export interface ResourceItem {
  id: string;
  name: string;
  type: "Staff" | "Equipment" | "Supplies";
  current: number;
  forecast: number;
  unit: string;
}

export interface MedicineItem {
  id: string;
  name: string;
  strength: string;
  form: string;
  stock: number;
  reorderLevel: number;
  expiry: string;
  batch: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  clinician: string;
  diagnosis: string;
  notes: string;
  prescription: { medicineId: string; quantity: number; instructions: string }[];
  status: "Prescribed" | "Ready for pickup" | "Partially dispensed" | "Dispensed";
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "reminder" | "update" | "alert";
}

const today = new Date().toISOString().slice(0, 10);

export const services: Service[] = [
  { id: "s1", name: "General Consultation", description: "Doctor consultation for common illnesses", duration: 20, capacity: 60, icon: "Stethoscope", color: "primary" },
  { id: "s2", name: "Prenatal Check-up", description: "Maternal health monitoring", duration: 30, capacity: 25, icon: "Baby", color: "secondary" },
  { id: "s3", name: "Immunization", description: "Routine vaccination for children", duration: 15, capacity: 40, icon: "Syringe", color: "accent" },
  { id: "s4", name: "Dental Service", description: "Tooth extraction & oral check-up", duration: 25, capacity: 20, icon: "Smile", color: "info" },
  { id: "s5", name: "Laboratory", description: "Blood, urine, and screening tests", duration: 20, capacity: 35, icon: "TestTube", color: "warning" },
  { id: "s6", name: "TB / DOTS", description: "Tuberculosis directly observed therapy", duration: 15, capacity: 30, icon: "ShieldPlus", color: "destructive" },
];

export const patients: Patient[] = [
  { id: "p1", fullName: "Maria Santos Cruz",        maskedName: "M. Cruz",      dob: "1992-04-12", gender: "Female", contact: "+63 917 123 4567", address: "Purok 2", barangay: "Poblacion 1", municipality: "Jones", latitude: 16.5613, longitude: 121.7023 },
  { id: "p2", fullName: "Juan Dela Peña",           maskedName: "J. Dela Peña", dob: "1985-11-03", gender: "Male",   contact: "+63 918 234 5678", address: "Sitio Manga", barangay: "Bantug", municipality: "Jones", latitude: 16.5734, longitude: 121.6921 },
  { id: "p3", fullName: "Liza Gonzales Aquino",     maskedName: "L. Aquino",    dob: "2018-02-20", gender: "Female", contact: "+63 919 345 6789", address: "Purok 5", barangay: "San Antonio", municipality: "Jones", latitude: 16.5029, longitude: 121.6857 },
  { id: "p4", fullName: "Roberto Mariano Castillo", maskedName: "R. Castillo",  dob: "1978-07-09", gender: "Male",   contact: "+63 920 456 7890", address: "Block 3", barangay: "Poblacion 2", municipality: "Jones", latitude: 16.5581, longitude: 121.7062 },
  { id: "p5", fullName: "Angelica Reyes Bautista",  maskedName: "A. Bautista",  dob: "1996-09-14", gender: "Female", contact: "+63 921 567 8901", address: "Purok 1", barangay: "Minanga", municipality: "Jones", latitude: 16.5425, longitude: 121.7288 },
  { id: "p6", fullName: "Mark Anthony Villanueva",  maskedName: "M. Villanueva",dob: "1989-01-25", gender: "Male",   contact: "+63 922 678 9012", address: "Sitio Mabini", barangay: "Cabaruan", municipality: "Jones", latitude: 16.5872, longitude: 121.7351 },
  { id: "p7", fullName: "Carmela Ocampo Lim",       maskedName: "C. Lim",       dob: "2001-06-30", gender: "Female", contact: "+63 923 789 0123", address: "Purok 4", barangay: "Poblacion 1", municipality: "Jones", latitude: 16.5631, longitude: 121.6997 },
  { id: "p8", fullName: "Eduardo Pineda Salazar",   maskedName: "E. Salazar",   dob: "1965-03-18", gender: "Male",   contact: "+63 924 890 1234", address: "Block 2", barangay: "Rang-ayan", municipality: "Jones", latitude: 16.6105, longitude: 121.6832 },
];

export const appointments: Appointment[] = [
  { id: "a1", patientId: "p1", serviceId: "s1", date: today, timeSlot: "08:00 AM", queueNumber: "A-001", attendanceStatus: "Present", queueStatus: "Completed",   room: "Room 1", createdAt: today },
  { id: "a2", patientId: "p2", serviceId: "s5", date: today, timeSlot: "08:30 AM", queueNumber: "A-002", attendanceStatus: "Present", queueStatus: "Completed",   room: "Lab 1",  createdAt: today },
  { id: "a3", patientId: "p3", serviceId: "s3", date: today, timeSlot: "09:00 AM", queueNumber: "A-003", attendanceStatus: "Present", queueStatus: "Now Serving", room: "Room 2", createdAt: today },
  { id: "a4", patientId: "p4", serviceId: "s1", date: today, timeSlot: "09:30 AM", queueNumber: "A-004", attendanceStatus: "Present", queueStatus: "Waiting",     room: "Room 1", createdAt: today },
  { id: "a5", patientId: "p5", serviceId: "s2", date: today, timeSlot: "10:00 AM", queueNumber: "A-005", attendanceStatus: "Present", queueStatus: "Waiting",     room: "OB Room",createdAt: today },
  { id: "a6", patientId: "p6", serviceId: "s4", date: today, timeSlot: "10:30 AM", queueNumber: "A-006", attendanceStatus: "Pending", queueStatus: "Scheduled",   room: "Dental", createdAt: today },
  { id: "a7", patientId: "p7", serviceId: "s1", date: today, timeSlot: "11:00 AM", queueNumber: "A-007", attendanceStatus: "Pending", queueStatus: "Scheduled",   room: "Room 1", createdAt: today },
  { id: "a8", patientId: "p8", serviceId: "s6", date: today, timeSlot: "11:30 AM", queueNumber: "A-008", attendanceStatus: "Absent",  queueStatus: "No Show",     room: "TB Room",createdAt: today },
];

export const diseaseRecords: DiseaseRecord[] = [
  { id: "d1", category: "Respiratory",  diagnosis: "Acute URI",     date: today, count: 18, barangay: "Poblacion 1", municipality: "Jones", latitude: 16.5613, longitude: 121.7023 },
  { id: "d2", category: "Respiratory",  diagnosis: "Influenza",     date: today, count: 9,  barangay: "Bantug", municipality: "Jones", latitude: 16.5734, longitude: 121.6921 },
  { id: "d3", category: "GI",           diagnosis: "Acute Gastro",  date: today, count: 12, barangay: "Minanga", municipality: "Jones", latitude: 16.5425, longitude: 121.7288 },
  { id: "d4", category: "Skin",         diagnosis: "Dermatitis",    date: today, count: 6,  barangay: "Cabaruan", municipality: "Jones", latitude: 16.5872, longitude: 121.7351 },
  { id: "d5", category: "Hypertension", diagnosis: "Stage 1 HTN",   date: today, count: 14, barangay: "Poblacion 2", municipality: "Jones", latitude: 16.5581, longitude: 121.7062 },
  { id: "d6", category: "Diabetes",     diagnosis: "Type 2 DM",     date: today, count: 7,  barangay: "Rang-ayan", municipality: "Jones", latitude: 16.6105, longitude: 121.6832 },
  { id: "d7", category: "Communicable", diagnosis: "Suspected TB",  date: today, count: 4,  barangay: "San Antonio", municipality: "Jones", latitude: 16.5029, longitude: 121.6857 },
  { id: "d8", category: "Respiratory",  diagnosis: "Influenza",     date: today, count: 8,  barangay: "Masaya Sur", municipality: "San Agustin", latitude: 16.4925, longitude: 121.7460 },
  { id: "d9", category: "GI",           diagnosis: "Acute Gastro",  date: today, count: 5,  barangay: "Ipil", municipality: "Echague", latitude: 16.6900, longitude: 121.6805 },
];

export const resources: ResourceItem[] = [
  { id: "r1", name: "General Physicians",  type: "Staff",     current: 3,   forecast: 5,    unit: "doctors" },
  { id: "r2", name: "Nurses",              type: "Staff",     current: 6,   forecast: 8,    unit: "nurses" },
  { id: "r3", name: "Midwives",            type: "Staff",     current: 2,   forecast: 3,    unit: "midwives" },
  { id: "r4", name: "BP Monitors",         type: "Equipment", current: 4,   forecast: 6,    unit: "units" },
  { id: "r5", name: "Vaccine Refrigerators",type:"Equipment", current: 2,   forecast: 3,    unit: "units" },
  { id: "r6", name: "Paracetamol 500mg",   type: "Supplies",  current: 1200,forecast: 1800, unit: "tablets" },
  { id: "r7", name: "Surgical Masks",      type: "Supplies",  current: 800, forecast: 1500, unit: "pcs" },
];

export const medicines: MedicineItem[] = [
  { id: "m1", name: "Paracetamol", strength: "500 mg", form: "Tablet", stock: 1200, reorderLevel: 500, expiry: "2027-04-30", batch: "PCM-2407" },
  { id: "m2", name: "Amoxicillin", strength: "500 mg", form: "Capsule", stock: 320, reorderLevel: 400, expiry: "2026-12-15", batch: "AMX-2411" },
  { id: "m3", name: "Losartan", strength: "50 mg", form: "Tablet", stock: 86, reorderLevel: 150, expiry: "2026-10-31", batch: "LOS-2403" },
  { id: "m4", name: "Oral Rehydration Salts", strength: "", form: "Sachet", stock: 540, reorderLevel: 200, expiry: "2027-02-28", batch: "ORS-2408" },
];

export const medicalRecords: MedicalRecord[] = [
  { id: "mr1", patientId: "p1", date: today, clinician: "Dr. Joseph Mariano", diagnosis: "Acute upper respiratory infection", notes: "No known drug allergies. Advise rest and adequate fluids.", prescription: [{ medicineId: "m1", quantity: 12, instructions: "Take 1 tablet every 6 hours as needed for fever." }], status: "Ready for pickup" },
  { id: "mr2", patientId: "p1", date: "2026-06-11", clinician: "Dr. Joseph Mariano", diagnosis: "Hypertension follow-up", notes: "Blood pressure controlled; continue maintenance medication.", prescription: [{ medicineId: "m3", quantity: 30, instructions: "Take 1 tablet once daily." }], status: "Dispensed" },
];

export const notifications: NotificationItem[] = [
  { id: "n1", title: "Appointment Reminder",  message: "Your General Consultation is tomorrow. Clinic consultation hours are 8:00 AM – 5:00 PM.", time: "2h ago", read: false, type: "reminder" },
  { id: "n2", title: "Queue Update",          message: "You are checked in. Queue A-009 is waiting for triage.",                              time: "10m ago", read: false, type: "update"   },
  { id: "n3", title: "Booking Confirmed",     message: "Booking reference APT-2026-0098 is confirmed. Present it when checking in.",          time: "1d ago",  read: true,  type: "update"   },
  { id: "n4", title: "Health Advisory",       message: "Flu vaccines are now available. Walk-ins accepted Mon-Fri.",                        time: "2d ago",  read: true,  type: "alert"    },
];

// Trend data for charts
export const weeklyTrends = [
  { day: "Mon", respiratory: 14, gi: 8,  htn: 11, diabetes: 5 },
  { day: "Tue", respiratory: 18, gi: 10, htn: 9,  diabetes: 6 },
  { day: "Wed", respiratory: 22, gi: 12, htn: 13, diabetes: 7 },
  { day: "Thu", respiratory: 19, gi: 9,  htn: 12, diabetes: 8 },
  { day: "Fri", respiratory: 27, gi: 15, htn: 14, diabetes: 7 },
  { day: "Sat", respiratory: 31, gi: 11, htn: 10, diabetes: 5 },
  { day: "Sun", respiratory: 12, gi: 6,  htn: 7,  diabetes: 3 },
];

export const monthlyAppointments = [
  { week: "W1", booked: 142, served: 128, noShow: 9 },
  { week: "W2", booked: 168, served: 151, noShow: 12 },
  { week: "W3", booked: 155, served: 144, noShow: 7 },
  { week: "W4", booked: 189, served: 172, noShow: 11 },
];

export const serviceDemand = services.map((s, i) => ({
  name: s.name.split(" ")[0],
  value: [42, 28, 35, 18, 24, 15][i],
}));

export const helpers = {
  getPatient: (id: string) => patients.find((p) => p.id === id)!,
  getService: (id: string) => services.find((s) => s.id === id)!,
  formatDate: (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" }),
};
