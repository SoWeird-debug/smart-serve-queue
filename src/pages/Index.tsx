import { lazy, Suspense, useState } from "react";
import { UserRound } from "lucide-react";
import { AccountProfileDialog } from "@/components/AccountProfileDialog";

import { AccessGateway } from "@/components/AccessGateway";
import { Button } from "@/components/ui/button";
import type { StaffUser } from "@/lib/prototype-store";
import superHealthCenterLogo from "@/assets/super-health-center-jones-logo.png";
import { logoutAccount, setApiAccessToken, type ApiPatient } from "@/lib/api";

type Workspace = "patient" | "staff" | "doctor" | "pharmacy" | "admin";
const PatientApp = lazy(() => import("@/components/PatientApp").then((module) => ({ default: module.PatientApp })));
const StaffApp = lazy(() => import("@/components/StaffApp").then((module) => ({ default: module.StaffApp })));
const QueueTvDisplay = lazy(() => import("@/components/StaffApp").then((module) => ({ default: module.QueueTvDisplay })));
const AdminApp = lazy(() => import("@/components/AdminApp").then((module) => ({ default: module.AdminApp })));
const DoctorApp = lazy(() => import("@/components/DoctorApp").then((module) => ({ default: module.DoctorApp })));
const PharmacyApp = lazy(() => import("@/components/PharmacyApp").then((module) => ({ default: module.PharmacyApp })));

const workspaceForRole = (role: StaffUser["role"]): Workspace => {
  if (role === "Doctor") return "doctor";
  if (role === "Pharmacy") return "pharmacy";
  if (role === "Administrator") return "admin";
  return "staff";
};

const Index = () => {
  const displayMode = new URLSearchParams(window.location.search).get("display");
  const queueBoardPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [signedInUser, setSignedInUser] = useState<StaffUser | null>(null);
  const [signedInPatient, setSignedInPatient] = useState<ApiPatient | null>(null);
  const [patientRegistration, setPatientRegistration] = useState<{ email: string; token: string } | null>(null);
  const [accessNotice, setAccessNotice] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const enterStaffWorkspace = (user: StaffUser) => {
    setSignedInUser(user);
    setWorkspace(workspaceForRole(user.role));
  };
  const returnToAccess = () => {
    setApiAccessToken(null);
    setProfileOpen(false);
    window.history.replaceState({}, "", window.location.pathname);
    setSignedInUser(null);
    setSignedInPatient(null);
    setPatientRegistration(null);
    setWorkspace(null);
  };
  const signOut = async (message = "You have been signed out.") => {
    try { await logoutAccount(); } catch { /* Always clear local access, even if the session expired. */ }
    setAccessNotice(message);
    returnToAccess();
  };

  if (queueBoardPath === "/queue/animal-bite" || queueBoardPath === "/animal-bite-queue") {
    return <QueueTvDisplay area="Animal Bite Center" />;
  }
  if (queueBoardPath === "/queue/general-clinic") return <QueueTvDisplay area="General Clinic" />;
  if (displayMode === "queue-tv") return <QueueTvDisplay />;

  if (!workspace) {
    return (
      <AccessGateway
        initialNotice={accessNotice}
        onPatientAuthenticated={(patient) => { setSignedInPatient(patient); setPatientRegistration(null); setWorkspace("patient"); }}
        onPatientRegistration={(email, token) => { setPatientRegistration({ email, token }); setSignedInPatient(null); setWorkspace("patient"); }}
        onStaffAuthenticated={enterStaffWorkspace}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {workspace !== "admin" && workspace !== "patient" ? (
        <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-xl">
          <div className="flex w-full items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <img
                src={superHealthCenterLogo}
                alt="Jones Super Health Center seal"
                className="h-11 w-11 shrink-0 object-contain drop-shadow-sm"
              />
              <div className="min-w-0">
                <h1 className="font-display text-sm font-bold leading-tight md:text-base">
                  Super Health Center
                </h1>
                <p className="text-xs text-slate-700">Jones, Isabela · {signedInUser?.role}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setProfileOpen(true)}>
              <UserRound className="mr-2 h-4 w-4" />My profile
            </Button>
          </div>
        </header>
      ) : null}
      <main
        className={
          workspace === "admin"
            ? "animate-fade-in"
            : workspace === "patient"
              ? "animate-fade-in"
            : workspace === "staff"
              ? "h-[calc(100dvh-69px)] min-w-0 overflow-hidden px-2 py-2 sm:px-3"
            : "container min-w-0 animate-fade-in px-3 py-4 sm:px-6 md:py-6"
        }
        key={workspace}
      >
        {workspace === "patient" ? <PatientApp initialPatient={signedInPatient || undefined} registrationEmail={patientRegistration?.email} registrationToken={patientRegistration?.token} onExit={returnToAccess} onRegistrationComplete={() => { setAccessNotice("You successfully registered. Sign in with your email address and password."); returnToAccess(); }} /> : null}
        {workspace === "staff" ? <StaffApp currentUser={signedInUser || undefined} /> : null}
        {workspace === "doctor" ? <DoctorApp currentUser={signedInUser || undefined} /> : null}
        {workspace === "pharmacy" ? <PharmacyApp /> : null}
        {workspace === "admin" ? (
          <AdminApp
            currentUser={signedInUser || undefined}
            onSignOut={() => void signOut()}
            onOpenProfile={() => setProfileOpen(true)}
          />
        ) : null}
      </main>
      {signedInUser && <AccountProfileDialog open={profileOpen} onOpenChange={setProfileOpen} onSignOut={(message) => void signOut(message)} onSaved={(user) => setSignedInUser((current) => current ? { ...current, fullName: user.name, recoveryEmail: user.email } : current)} />}
    </div>
  );
};

export default function IndexPage() {
  return <Suspense fallback={<div role="status" className="grid min-h-dvh place-items-center text-slate-700">Loading your clinic workspace…</div>}><Index /></Suspense>;
}
