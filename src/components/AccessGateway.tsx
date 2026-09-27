import { useEffect, useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/super-health-center-jones-logo.png";
import type { StaffUser } from "@/lib/prototype-store";
import {
  claimOnsiteAccount,
  confirmAccountEmail,
  inspectAccountEmail,
  patientCurrent,
  resetPasswordByEmail,
  reviewOnsiteAccount,
  sendPasswordReset,
  sendRegistrationVerification,
  setApiAccessToken,
  setupFirstAdministrator,
  staffCurrent,
  staffSetupStatus,
  unifiedLogin,
  type ApiPatient,
  type ApiStaffUser,
  type EmailReview,
} from "@/lib/api";

type Mode =
  | "login"
  | "signup"
  | "forgot"
  | "reset"
  | "setup"
  | "verified"
  | "claim"
  | "activation";
export const roleLabels: Record<string, string> = {
  front_desk: "Front desk",
  nurse_triage: "Nurse / Triage",
  doctor: "Doctor",
  pharmacy: "Pharmacy",
  administrator: "Administrator",
  patient: "Patient",
};
export const asStaffUser = (user: ApiStaffUser): StaffUser => ({
  id: String(user.id),
  fullName: user.name,
  username: user.username || "",
  password: "",
  role: roleLabels[user.role] as StaffUser["role"],
  active: true,
  passwordChangeRequired: user.must_change_password,
  recoveryEmail: user.email || undefined,
  assignedAreas: user.assigned_care_areas.includes("Animal Bite Center")
    ? ["Animal Bite Center"]
    : ["General Clinic"],
});

export function AccessGateway({
  onPatientAuthenticated,
  onPatientRegistration,
  onStaffAuthenticated,
  initialNotice = "",
}: {
  onPatientAuthenticated: (patient: ApiPatient) => void;
  onPatientRegistration: (email: string, token: string) => void;
  onStaffAuthenticated: (user: StaffUser) => void;
  initialNotice?: string;
}) {
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const registrationEmail = params.get("registration_email") || "";
  const registrationToken = params.get("registration_token") || "";
  const resetEmail = params.get("reset_email") || "";
  const resetToken = params.get("reset_token") || "";
  const accountToken = params.get("account_token") || "";
  const [mode, setMode] = useState<Mode>(
    accountToken
      ? "activation"
      : registrationEmail && registrationToken
        ? params.get("claim_onsite") === "1"
          ? "claim"
          : "verified"
        : resetEmail && resetToken
          ? "reset"
          : "login",
  );
  const [identifier, setIdentifier] = useState(registrationEmail);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState(initialNotice);
  const [error, setError] = useState(
    params.has("verification_expired")
      ? "This verification link expired or was used. Request another through Sign up."
      : "",
  );
  const [busy, setBusy] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setup, setSetup] = useState({ fullName: "", username: "", email: "" });
  const [review, setReview] = useState<EmailReview | null>(null);
  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [claimStep, setClaimStep] = useState<"unlock" | "review" | "consent">(
    "unlock",
  );
  useEffect(() => {
    let active = true;
    void staffSetupStatus()
      .then((result) => {
        if (active) setSetupRequired(result.setup_required);
      })
      .catch(() => undefined);
    if (accountToken)
      void inspectAccountEmail(accountToken)
        .then((result) => {
          if (active) setReview(result);
        })
        .catch((failure) => {
          if (active) setError(failure.message);
        });
    return () => {
      active = false;
    };
  }, [accountToken]);
  const show = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
    setPassword("");
    setConfirmation("");
  };
  const returnToLogin = (message: string) => {
    window.history.replaceState({}, "", window.location.pathname);
    show("login");
    setNotice(message);
  };
  const checkPassword = () => {
    if (password.length < 12)
      throw new Error("Use at least 12 characters for your password.");
    if (password !== confirmation) throw new Error("The passwords must match.");
  };
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "login") {
        const result = await unifiedLogin(identifier.trim(), password);
        setApiAccessToken(result.token);
        try {
          if (result.role === "patient")
            onPatientAuthenticated((await patientCurrent()).patient);
          else onStaffAuthenticated(asStaffUser((await staffCurrent()).user));
        } catch (failure) {
          setApiAccessToken(null);
          throw failure;
        }
      } else if (mode === "signup") {
        setNotice((await sendRegistrationVerification(identifier.trim())).message);
      } else if (mode === "forgot") {
        await sendPasswordReset(identifier.trim());
        setNotice(
          "If this matches an active, verified account, a password-reset link has been sent to its email.",
        );
      } else if (mode === "reset") {
        checkPassword();
        await resetPasswordByEmail({
          email: resetEmail,
          token: resetToken,
          password,
          password_confirmation: confirmation,
        });
        returnToLogin(
          "Password saved. Patients: sign in with email. Clinic team: sign in with username.",
        );
      } else if (mode === "setup") {
        checkPassword();
        await setupFirstAdministrator({
          name: setup.fullName.trim(),
          username: setup.username.trim().toLowerCase(),
          email: setup.email.trim(),
          password,
          password_confirmation: confirmation,
        });
        setSetupRequired(false);
        setIdentifier(setup.username);
        returnToLogin(
          "Administrator created. Check your email to activate your account before signing in.",
        );
      } else if (mode === "activation" && review) {
        if (review.purpose === "activation") checkPassword();
        const result = await confirmAccountEmail({
          token: accountToken,
          ...(review.purpose === "activation"
            ? { password, password_confirmation: confirmation }
            : {}),
        });
        setIdentifier(result.username || "");
        setApiAccessToken(null);
        returnToLogin(
          `${result.message} Clinic team members use their username and password.`,
        );
      } else if (mode === "claim") {
        const identity = {
          email: registrationEmail,
          registration_email_token: registrationToken,
          temporary_password: temporaryPassword,
        };
        if (claimStep === "unlock") {
          setPatient((await reviewOnsiteAccount(identity)).patient);
          setClaimStep("review");
        } else if (claimStep === "review") {
          setClaimStep("consent");
        } else {
          checkPassword();
          if (!consent)
            throw new Error(
              "Confirm your reviewed information, treatment consent, and privacy acknowledgment.",
            );
          await claimOnsiteAccount({
            ...identity,
            password,
            password_confirmation: confirmation,
            consent_to_treatment: consent,
            privacy_acknowledged: consent,
            profile: patient || undefined,
          });
          setIdentifier(registrationEmail);
          returnToLogin(
            "Your information was successfully saved and your account is activated. Sign in with your email and new password.",
          );
        }
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to complete this request. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const headings: Record<Mode, string> = {
    login: "Welcome back",
    signup: "Verify your email",
    forgot: "Forgot password?",
    reset: "Choose a new password",
    setup: "Create the first administrator",
    verified: "Email confirmed",
    claim: "Activate your patient account",
    activation: "Welcome to your clinic account",
  };
  const needsPassword =
    mode === "reset" ||
    mode === "setup" ||
    (mode === "activation" && review?.purpose === "activation") ||
    (mode === "claim" && claimStep === "consent");
  const labels: Partial<Record<Mode, string>> = {
    login: "Sign in",
    signup: "Send verification link",
    forgot: "Send password-reset link",
    reset: "Save new password",
    setup: "Create administrator",
    activation:
      review?.purpose === "email_change"
        ? "Confirm new email"
        : "Verify and activate account",
    claim:
      claimStep === "unlock"
        ? "Review my patient information"
        : claimStep === "review"
          ? "Confirm details and continue"
          : "Save and activate account",
  };
  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-5 sm:grid sm:place-items-center sm:py-10">
      <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <header className="mb-6 text-center">
          <img
            src={logo}
            alt="Super Health Center seal"
            className="mx-auto h-16 w-16 object-contain"
          />
          <p className="mt-3 text-xl font-bold text-slate-900">
            Super Health Center
          </p>
          <p className="text-sm text-slate-700">Jones, Isabela</p>
        </header>
        <h1 className="text-xl font-bold text-slate-900">{headings[mode]}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {mode === "login"
            ? "Sign in to your Super Health Center account."
            : mode === "forgot"
              ? "Enter your registered email or clinic username to request a password-reset link."
            : mode === "signup"
              ? "Enter your email to register as a patient or activate the clinic account created for you. Already activated? Sign in or use Forgot password."
            : "Secure access to your Super Health Center account."}
        </p>
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
            {["login", "signup", "forgot"].includes(mode) && (
              <AccessField
                label={
                  mode === "signup"
                    ? "Email address"
                    : mode === "forgot"
                      ? "Email address or clinic username"
                      : "Email"
                }
                type={mode === "signup" ? "email" : "text"}
                value={identifier}
                onChange={setIdentifier}
                autoComplete="username"
              />
            )}
            {mode === "login" && (
              <AccessField
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
            )}
            {mode === "setup" && (
              <>
                <AccessField
                  label="Full name"
                  value={setup.fullName}
                  onChange={(fullName) => setSetup({ ...setup, fullName })}
                />
                <AccessField
                  label="Username"
                  value={setup.username}
                  onChange={(username) => setSetup({ ...setup, username })}
                />
                <AccessField
                  label="Email address"
                  type="email"
                  value={setup.email}
                  onChange={(email) => setSetup({ ...setup, email })}
                />
              </>
            )}
            {mode === "activation" && review && (
              <div className="space-y-2 rounded-xl bg-sky-50 p-4 text-sm text-slate-900">
                <p className="font-semibold">Please review your account</p>
                <p>{review.name}</p>
                <p>{roleLabels[review.role] || review.role}</p>
                <p className="break-all">{review.email}</p>
                <p>
                  Username: <strong>{review.username}</strong>
                </p>
                <p>
                  {review.purpose === "email_change"
                    ? "Confirm this new recovery email. You will need to sign in again."
                    : "Verify your email and choose your personal password to activate access."}
                </p>
              </div>
            )}
            {mode === "claim" && claimStep === "unlock" && (
              <>
                <p className="text-sm text-slate-700">
                  Enter the temporary password provided by the clinic to view
                  your existing patient information.
                </p>
                <AccessField
                  label="Temporary onsite password"
                  type="password"
                  value={temporaryPassword}
                  onChange={setTemporaryPassword}
                />
              </>
            )}
            {mode === "claim" && claimStep === "review" && patient && (
              <>
                <p className="rounded-xl bg-sky-50 p-3 text-sm text-slate-900">
                  Review your existing record {patient.patient_number}. Your
                  consultation history stays attached to this account.
                </p>
                {(
                  [
                    ["given_name", "First name"],
                    ["family_name", "Last name"],
                    ["middle_name", "Middle name"],
                    ["date_of_birth", "Date of birth"],
                    ["mobile_number", "Mobile number"],
                    ["emergency_contact_name", "Emergency contact"],
                    ["emergency_contact_phone", "Emergency phone"],
                  ] as const
                ).map(([key, label]) => (
                  <AccessField
                    key={key}
                    label={label}
                    required={
                      ![
                        "middle_name",
                        "emergency_contact_name",
                        "emergency_contact_phone",
                      ].includes(key)
                    }
                    type={key === "date_of_birth" ? "date" : "text"}
                    value={patient[key] || ""}
                    onChange={(value) =>
                      setPatient({
                        ...patient,
                        [key]:
                          key === "mobile_number"
                            ? value.replace(/\D/g, "").slice(0, 11)
                            : value,
                      })
                    }
                  />
                ))}
                <label className="block text-sm font-medium">
                  Sex
                  <select
                    className="mt-1 h-11 w-full rounded-lg border bg-white px-3"
                    value={patient.sex}
                    onChange={(event) =>
                      setPatient({
                        ...patient,
                        sex: event.target.value as ApiPatient["sex"],
                      })
                    }
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>
                <div className="rounded-xl border p-3 text-sm text-slate-700">
                  <p>
                    Address: {patient.address?.address_line},{" "}
                    {patient.address?.barangay_name},{" "}
                    {patient.address?.municipality_name}
                  </p>
                  <p className="mt-2">
                    PhilHealth: {patient.philhealth_pin || "Not provided"}
                  </p>
                  <p className="mt-2">
                    Contact the clinic for corrections to your address or
                    insurance record.
                  </p>
                </div>
              </>
            )}
            {needsPassword && (
              <>
                <AccessField
                  label="New password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                />
                <p className="text-sm text-slate-700">
                  Use at least 12 characters. A few unrelated words with numbers
                  or symbols work well.
                </p>
                <AccessField
                  label="Confirm new password"
                  type="password"
                  value={confirmation}
                  onChange={setConfirmation}
                  autoComplete="new-password"
                />
              </>
            )}
            {mode === "claim" && claimStep === "consent" && (
              <>
                <label className="flex items-start gap-3 text-sm text-slate-900">
                  <input
                    required
                    type="checkbox"
                    className="mt-1"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  I reviewed my information, consent to clinic care, and
                  acknowledge processing of my information for clinic services.
                </label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setClaimStep("review")}
                >
                  Back to review details
                </Button>
              </>
            )}
            {mode === "verified" && (
              <>
                <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-950">
                  Your email is verified. You can now complete your patient
                  information.
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    onPatientRegistration(registrationEmail, registrationToken)
                  }
                >
                  Continue to patient information
                </Button>
              </>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                {error}
              </p>
            )}
            {notice && (
              <p
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950"
              >
                {notice}
              </p>
            )}
            {mode !== "verified" && (
              <Button
                className="h-11 w-full"
                type="submit"
                disabled={busy || (mode === "activation" && !review)}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {busy ? "Please wait…" : labels[mode]}
              </Button>
            )}
          </fieldset>
        </form>
        <div className="mt-4 space-y-3 text-center text-sm">
          {mode === "login" ? (
            <>
              <button
                className="block w-full font-medium text-sky-800"
                onClick={() => show("forgot")}
              >
                Forgot password?
              </button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => show("signup")}
              >
                Sign up / activate account
              </Button>
              {setupRequired && (
                <button
                  className="text-slate-700 underline"
                  onClick={() => show("setup")}
                >
                  Set up first administrator
                </button>
              )}
            </>
          ) : (
            <button
              className="text-sky-800 underline"
              onClick={() => returnToLogin("")}
            >
              Back to sign in
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export function AccessField({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        required={required}
        maxLength={type === "password" ? 128 : 255}
        className="mt-1 h-11 text-base"
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
