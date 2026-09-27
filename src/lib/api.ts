type ApiErrorPayload = { message?: string; errors?: Record<string, string[]> };

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export type ApiAccountRole = ApiStaffUser["role"] | "patient";
export type StoredApiSession = { token: string; role: ApiAccountRole };

const persistentSessionKey = "smartserve.auth.remembered.v1";
const browserSessionKey = "smartserve.auth.session.v1";

const readStoredSession = (storage: Storage, key: string): StoredApiSession | null => {
  try {
    const value = JSON.parse(storage.getItem(key) || "null") as Partial<StoredApiSession> | null;
    return value?.token && value?.role ? value as StoredApiSession : null;
  } catch {
    storage.removeItem(key);
    return null;
  }
};

export const getStoredApiSession = (): StoredApiSession | null => {
  if (typeof window === "undefined") return null;
  return readStoredSession(window.sessionStorage, browserSessionKey)
    || readStoredSession(window.localStorage, persistentSessionKey);
};

let accessToken: string | null = getStoredApiSession()?.token || null;

export const setApiAccessToken = (
  token: string | null,
  remember = false,
  role?: ApiAccountRole,
) => {
  accessToken = token;
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(persistentSessionKey);
  window.sessionStorage.removeItem(browserSessionKey);
  if (!token || !role) return;

  const value = JSON.stringify({ token, role } satisfies StoredApiSession);
  (remember ? window.localStorage : window.sessionStorage).setItem(
    remember ? persistentSessionKey : browserSessionKey,
    value,
  );
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
  username?: string;
  email: string | null;
  role: "front_desk" | "nurse_triage" | "doctor" | "pharmacy" | "administrator";
  assigned_care_areas: Array<number | string>;
  must_change_password: boolean;
};

export type ApiManagedStaffUser = {
  id: number;
  name: string;
  username?: string;
  email: string | null;
  email_verified_at: string | null;
  role: "front_desk" | "nurse_triage" | "doctor" | "pharmacy" | "administrator";
  is_active: boolean;
  must_change_password: boolean;
  assigned_care_area_ids: number[];
  doctor_availability: "available" | "with_patient" | "on_break" | "off_duty" | "on_leave" | null;
};

export type ApiCareArea = { id: number; name: string; building: string | null };

type StaffAuthResponse = { token: string; user: ApiStaffUser };
type UnifiedAuthResponse = { token: string; role: ApiAccountRole };

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
  philhealth_pin?: string | null;
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

export const unifiedLogin = (identifier: string, password: string) =>
  request<UnifiedAuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });

export const sendRegistrationVerification = (email: string) =>
  request<{ message: string }>("/auth/registration/send-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const savePatientRegistrationDraft = (payload: {
  email: string;
  registration_email_token: string;
  draft: Record<string, unknown>;
}) => request<{ message: string }>("/patient-auth/registration-draft", {
  method: "POST",
  body: JSON.stringify(payload),
});

export const sendPasswordReset = (identifier: string) =>
  request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  });

export const claimOnsiteAccount = (payload: { email: string; registration_email_token: string; temporary_password: string; password: string; password_confirmation: string; consent_to_treatment: boolean; privacy_acknowledged: boolean; profile?: Partial<ApiPatient> }) => request<{ message: string }>("/auth/claim-onsite-account", { method: "POST", body: JSON.stringify(payload) });
export const reviewOnsiteAccount = (payload: { email: string; registration_email_token: string; temporary_password: string }) => request<{ patient: ApiPatient }>("/auth/onsite-review", { method: "POST", body: JSON.stringify(payload) });
export const loadRegistrationDraft = (email: string, registration_email_token: string) => request<{ draft: Record<string, string> | null }>("/patient-auth/registration-draft/load", { method: "POST", body: JSON.stringify({ email, registration_email_token }) });
export type AccountProfile = { id: number; name: string; username: string; email: string; role: string; pending_email: string | null; email_verified_at: string | null };
export type EmailReview = { name: string; username: string; email: string; role: string; purpose: "activation" | "email_change" };
export const getAccountProfile = () => request<{ user: AccountProfile }>("/account/profile");
export const updateAccountProfile = (payload: { name: string; email: string; current_password: string }) => request<{ user: AccountProfile; message: string }>("/account/profile", { method: "PATCH", body: JSON.stringify(payload) });
export const updateAccountPassword = (payload: { current_password: string; password: string; password_confirmation: string }) => request<{ message: string }>("/account/password", { method: "POST", body: JSON.stringify(payload) });
export const logoutAccount = () => request<void>("/account/logout", { method: "POST" });
export const resendActivation = (identifier: string) => request<{ message: string }>("/auth/activation/resend", { method: "POST", body: JSON.stringify({ identifier }) });
export const inspectAccountEmail = (token: string) => request<EmailReview>("/auth/email/inspect", { method: "POST", body: JSON.stringify({ token }) });
export const confirmAccountEmail = (payload: { token: string; password?: string; password_confirmation?: string }) => request<{ message: string; username: string }>("/auth/email/confirm", { method: "POST", body: JSON.stringify(payload) });

export const resetPasswordByEmail = (payload: { email: string; token: string; password: string; password_confirmation: string }) =>
  request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const adminStaff = () => request<{ data: ApiManagedStaffUser[] }>("/admin/staff");

export const adminCareAreas = () => request<{ data: ApiCareArea[] }>("/directories/care-areas");

export const createAdminStaff = (payload: {
  name: string;
  username: string;
  email?: string | null;
  password: string;
  password_confirmation: string;
  role: ApiManagedStaffUser["role"];
  is_active: boolean;
  assigned_care_area_ids?: number[];
  doctor_availability?: NonNullable<ApiManagedStaffUser["doctor_availability"]>;
}) => request<{ data: ApiManagedStaffUser }>("/admin/staff", {
  method: "POST",
  body: JSON.stringify(payload),
});

export const updateAdminStaff = (staffId: number, payload: Partial<{
  name: string;
  username?: string;
  email: string | null;
  role: ApiManagedStaffUser["role"];
  is_active: boolean;
  assigned_care_area_ids: number[];
  doctor_availability: NonNullable<ApiManagedStaffUser["doctor_availability"]>;
}>) => request<{ data: ApiManagedStaffUser }>(`/admin/staff/${staffId}`, {
  method: "PATCH",
  body: JSON.stringify(payload),
});

export const resetAdminStaffPassword = (staffId: number, password: string, passwordConfirmation: string) =>
  request<void>(`/admin/staff/${staffId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password, password_confirmation: passwordConfirmation }),
  });

export const patientLogin = (identifier: string, password: string) =>
  request<PatientAuthResponse>("/patient-auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });

export const patientRegister = (payload: Record<string, unknown>) =>
  request<{ patient: ApiPatient; message: string; email_verification_required: boolean }>("/patient-auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const patientAppointments = () => request<{ data: ApiAppointment[] }>("/appointments");

export const patientCurrent = () => request<{ patient: ApiPatient }>("/patient-auth/me");
export const staffCurrent = () => request<{ user: ApiStaffUser }>("/staff-auth/me");

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
