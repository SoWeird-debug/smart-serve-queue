type ApiErrorPayload = { message?: string; errors?: Record<string, string[]> };

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// Deliberately memory-only. Authentication is not written to localStorage or
// sessionStorage; refreshing the browser requires sign-in again until secure
// server-side session handling is introduced.
let accessToken: string | null = null;

export const setApiAccessToken = (token: string | null) => {
  accessToken = token;
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ApiErrorPayload;
    const validation = body.errors ? Object.values(body.errors).flat()[0] : undefined;
    throw new ApiError(validation || body.message || "The server could not complete this request.", response.status);
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export type ApiStaffUser = {
  id: number;
  name: string;
  username: string;
  email: string | null;
  role: "front_desk" | "nurse_triage" | "doctor" | "pharmacy" | "administrator";
  assigned_care_areas: Array<number | string>;
  must_change_password: boolean;
};

type StaffAuthResponse = { token: string; user: ApiStaffUser };

export type ApiPatient = {
  id: number;
  patient_number: string;
  given_name: string;
  family_name: string;
  middle_name: string | null;
  suffix: string | null;
  date_of_birth: string;
  sex: "male" | "female" | "other";
  civil_status: string | null;
  nationality: string | null;
  preferred_language: string | null;
  mobile_number: string;
  alternate_contact: string | null;
  email: string | null;
  email_verified_at: string | null;
  guardian_name: string | null;
  guardian_relationship: string | null;
  guardian_contact: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  address: {
    address_line: string;
    barangay_id: number;
    barangay_name: string;
    municipality_name: string;
    province_name: string;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
    location_accuracy_meters: number | null;
    location_source: string | null;
    location_verified_at: string | null;
  } | null;
};

export type ApiService = {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  daily_capacity: number;
  follow_up_eligible: boolean;
  care_area: string;
  building: string | null;
};

export type ApiAppointment = {
  id: number;
  appointment_date: string;
  time_slot: string | null;
  visit_type: string;
  attendance_status: string;
  status: string;
  service_name: string;
  care_area: string;
  building: string | null;
};

export type ApiStaffAppointment = {
  id: number;
  appointment_date: string;
  time_slot: string | null;
  visit_type: string;
  status: string;
  attendance_status: string;
  patient_number: string;
  given_name: string;
  family_name: string;
  mobile_number: string;
  service_name: string;
};

export type ApiQueueItem = {
  id: number;
  queue_number: number;
  priority: "normal" | "priority" | "urgent" | "emergency";
  source_visit_type: string;
  entered_queue_at: string;
  appointment_id: number;
  status: string;
  visit_type: string;
  patient_number: string;
  family_name: string;
  given_name: string;
  service_name: string;
};

export type ApiPatientSearchResult = {
  id: number;
  patient_number: string;
  given_name: string;
  family_name: string;
  date_of_birth: string;
  mobile_number: string;
  barangay_name: string | null;
};

type PatientAuthResponse = {
  token: string;
  patient: ApiPatient;
  password_change_required?: boolean;
};

export const staffSetupStatus = () =>
  request<{ setup_required: boolean }>("/staff-auth/setup-status");

export const setupFirstAdministrator = (payload: {
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
}) => request<StaffAuthResponse>("/staff-auth/setup-administrator", {
  method: "POST",
  body: JSON.stringify(payload),
});

export const loginStaff = (username: string, password: string) =>
  request<StaffAuthResponse>("/staff-auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const patientLogin = (identifier: string, password: string) =>
  request<PatientAuthResponse>("/patient-auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });

export const patientRegister = (payload: Record<string, unknown>) =>
  request<PatientAuthResponse>("/patient-auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const patientAppointments = () => request<{ data: ApiAppointment[] }>("/appointments");

export const createPatientAppointment = (serviceId: number, appointmentDate: string) =>
  request<{ data: ApiAppointment }>("/appointments", {
    method: "POST",
    body: JSON.stringify({ service_id: serviceId, appointment_date: appointmentDate }),
  });

export const apiServices = () => request<{ data: ApiService[] }>("/services");

export const apiMunicipalities = () => request<{ data: Array<{ id: number; name: string; postal_code: string | null }> }>("/directories/municipalities?province=Isabela");

export const apiBarangays = (municipalityId: number) => request<{ data: Array<{ id: number; name: string; postal_code: string | null }> }>(`/directories/municipalities/${municipalityId}/barangays`);

export const staffScheduledAppointments = (careAreaId: number, search = "") =>
  request<{ data: ApiStaffAppointment[] }>(`/staff/appointments/scheduled?care_area_id=${careAreaId}&search=${encodeURIComponent(search)}`);

export const staffCheckIn = (appointmentId: number) =>
  request<{ data: { active_queue_number: number } }>(`/staff/appointments/${appointmentId}/check-in`, {
    method: "POST",
    body: JSON.stringify({}),
  });

export const staffMarkAbsent = (appointmentId: number) =>
  request<{ message: string }>(`/staff/appointments/${appointmentId}/absent`, {
    method: "POST",
    body: JSON.stringify({}),
  });

export const staffQueue = (careAreaId: number) =>
  request<{ data: ApiQueueItem[] }>(`/staff/queue?care_area_id=${careAreaId}`);

export const searchStaffPatients = (careAreaId: number, query: string) =>
  request<{ data: ApiPatientSearchResult[] }>(`/staff/patients/search?care_area_id=${careAreaId}&query=${encodeURIComponent(query)}`);

export const createStaffWalkIn = (payload: { patient_lookup: string; service_id: number; visit_reason: string }) =>
  request<{ data: { active_queue_number: number } }>("/staff/walk-ins", {
    method: "POST", body: JSON.stringify(payload),
  });

export const registerOnsitePatient = (payload: Record<string, unknown>) =>
  request<{ data: { id: number; patient_number: string; default_password: string } }>("/staff/patients", {
    method: "POST", body: JSON.stringify(payload),
  });

export const startStaffTriage = (appointmentId: number) =>
  request<{ data: unknown }>(`/staff/appointments/${appointmentId}/triage/start`, {
    method: "POST", body: JSON.stringify({}),
  });

export const completeStaffTriage = (appointmentId: number, payload: Record<string, unknown>) =>
  request<{ data: unknown }>(`/staff/appointments/${appointmentId}/triage/complete`, {
    method: "POST", body: JSON.stringify(payload),
  });
