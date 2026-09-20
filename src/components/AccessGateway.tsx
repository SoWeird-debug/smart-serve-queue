import { useEffect, useState } from "react";
import { Heart, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type StaffUser } from "@/lib/prototype-store";
import {
  ApiError,
  type ApiStaffUser,
  loginStaff as loginStaffRequest,
  setApiAccessToken,
  setupFirstAdministrator,
  staffSetupStatus,
} from "@/lib/api";

type AccountMode = "staff" | "setup";

export function AccessGateway({
  onPatientAccess,
  onStaffAuthenticated,
}: {
  onPatientAccess: () => void;
  onStaffAuthenticated: (user: StaffUser) => void;
}) {
  const [mode, setMode] = useState<AccountMode>("staff");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [setup, setSetup] = useState({
    fullName: "",
    username: "",
    recoveryEmail: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const asStaffUser = (user: ApiStaffUser): StaffUser => ({
    id: String(user.id),
    fullName: user.name,
    username: user.username,
    password: "",
    role: ({
      front_desk: "Front desk",
      nurse_triage: "Nurse / Triage",
      doctor: "Doctor",
      pharmacy: "Pharmacy",
      administrator: "Administrator",
    } as const)[user.role],
    active: true,
    passwordChangeRequired: user.must_change_password,
    recoveryEmail: user.email || undefined,
    assignedAreas: user.assigned_care_areas.includes("Animal Bite Center")
      ? ["Animal Bite Center"]
      : ["General Clinic"],
  });

  useEffect(() => {
    void staffSetupStatus()
      .then((result) => setSetupRequired(result.setup_required))
      .catch(() => {
        setSetupRequired(null);
        setError("Cannot connect to the SmartServe server. Start Laravel and MySQL, then refresh.");
      });
  }, []);

  const signIn = async () => {
    try {
      const result = await loginStaffRequest(username, password);
      setApiAccessToken(result.token);
      setError("");
      onStaffAuthenticated(asStaffUser(result.user));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Cannot sign in while the SmartServe server is unavailable.");
    }
  };
  const setupAdmin = async () => {
    if (!setup.fullName.trim() || !setup.username.trim() || !setup.recoveryEmail.trim()) {
      setError("Enter the administrator name, username, and email address.");
      return;
    }
    if (setup.password.length < 12 || setup.password !== setup.confirmPassword) {
      setError("Use a password of at least 12 characters and confirm it exactly.");
      return;
    }
    try {
      await setupFirstAdministrator({
        name: setup.fullName,
        username: setup.username,
        email: setup.recoveryEmail,
        password: setup.password,
        password_confirmation: setup.confirmPassword,
      });
      setSetupRequired(false);
      setNotice("Administrator setup is complete in MySQL. Sign in with the credentials you just created.");
      setError("");
      setUsername(setup.username);
      setPassword("");
      setSetup({ fullName: "", username: "", recoveryEmail: "", mobile: "", password: "", confirmPassword: "" });
      setMode("staff");
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Administrator setup could not be saved to MySQL.");
    }
  };

  return (
    <main className="container flex min-h-screen items-center justify-center py-8">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-card lg:grid-cols-[1.05fr,.95fr]">
        <div className="bg-gradient-hero p-8 text-primary-foreground md:p-12">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-card/15 backdrop-blur">
            <Heart className="h-6 w-6" fill="currentColor" />
          </div>
          <Badge className="mt-8 border-0 bg-card/15 text-primary-foreground">SmartServe clinic access</Badge>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight">One secure entry for every clinic role.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-primary-foreground/80">Patients sign in to book and view their care journey. Clinic staff sign in with an administrator-created username and password, then open only their assigned workspace.</p>
          <div className="mt-8 rounded-2xl border border-primary-foreground/15 bg-card/10 p-4 text-sm text-primary-foreground/85">
            <p className="font-semibold">Server authentication</p>
            <p className="mt-1 text-xs leading-5">Staff credentials are verified by the SmartServe Laravel server and MySQL database. They are not saved in browser storage.</p>
          </div>
        </div>
        <div className="p-7 md:p-10">
          <div className="mb-6 flex rounded-xl bg-muted p-1">
            <button type="button" onClick={() => { setMode("staff"); setError(""); }} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === "staff" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"}`}>Staff & admin</button>
            <button type="button" onClick={onPatientAccess} className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"><Smartphone className="h-4 w-4" />Patient sign in</button>
          </div>
          {mode === "staff" ? (
            <div>
              <div className="mb-5">
                <p className="font-display text-2xl font-bold">Staff sign in</p>
                <p className="mt-1 text-sm text-muted-foreground">Use the username and password created by the clinic administrator.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="access-username">Username</Label>
                  <Input id="access-username" value={username} onChange={(event) => setUsername(event.target.value)} onKeyDown={(event) => event.key === "Enter" && signIn()} className="mt-1" autoComplete="username" />
                </div>
                <div>
                  <Label htmlFor="access-password">Password</Label>
                  <Input id="access-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && signIn()} className="mt-1" autoComplete="current-password" />
                </div>
                {error ? <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
                {notice ? <p role="status" className="rounded-xl border border-secondary/20 bg-secondary-soft px-3 py-2 text-sm text-secondary-foreground">{notice}</p> : null}
                <Button onClick={signIn} className="w-full"><LockKeyhole className="mr-2 h-4 w-4" />Sign in to workspace</Button>
              </div>
              {setupRequired ? (
                <button type="button" onClick={() => { setMode("setup"); setError(""); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 px-3 py-3 text-sm font-medium text-primary hover:bg-primary-soft"><ShieldCheck className="h-4 w-4" />First-run administrator setup</button>
              ) : null}
            </div>
          ) : (
            <div>
              <div className="mb-5">
                <p className="font-display text-2xl font-bold">Set up the first administrator</p>
                <p className="mt-1 text-sm text-muted-foreground">Create the first administrator account in the SmartServe MySQL database.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label htmlFor="setup-name">Full name</Label><Input id="setup-name" value={setup.fullName} onChange={(event) => setSetup({ ...setup, fullName: event.target.value })} className="mt-1" /></div>
                <div><Label htmlFor="setup-username">Username</Label><Input id="setup-username" value={setup.username} onChange={(event) => setSetup({ ...setup, username: event.target.value })} className="mt-1" autoComplete="username" /></div>
                <div><Label htmlFor="setup-email">Recovery email</Label><Input id="setup-email" type="email" value={setup.recoveryEmail} onChange={(event) => setSetup({ ...setup, recoveryEmail: event.target.value })} className="mt-1" autoComplete="email" /></div>
                <div className="sm:col-span-2"><Label htmlFor="setup-mobile">Mobile number</Label><Input id="setup-mobile" value={setup.mobile} onChange={(event) => setSetup({ ...setup, mobile: event.target.value })} className="mt-1" autoComplete="tel" /></div>
                <div><Label htmlFor="setup-password">Password</Label><Input id="setup-password" type="password" value={setup.password} onChange={(event) => setSetup({ ...setup, password: event.target.value })} className="mt-1" autoComplete="new-password" /></div>
                <div><Label htmlFor="setup-confirm">Confirm password</Label><Input id="setup-confirm" type="password" value={setup.confirmPassword} onChange={(event) => setSetup({ ...setup, confirmPassword: event.target.value })} className="mt-1" autoComplete="new-password" /></div>
              </div>
              {error ? <p role="alert" className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
              <div className="mt-5 flex gap-3"><Button variant="outline" className="flex-1" onClick={() => { setMode("staff"); setError(""); }}>Cancel</Button><Button className="flex-1" onClick={setupAdmin}><ShieldCheck className="mr-2 h-4 w-4" />Create admin</Button></div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
