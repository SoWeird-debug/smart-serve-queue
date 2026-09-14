import { useState } from "react";
import { Heart, LogOut } from "lucide-react";

import { AccessGateway } from "@/components/AccessGateway";
import { PatientApp } from "@/components/PatientApp";
import { QueueTvDisplay, StaffApp } from "@/components/StaffApp";
import { AdminApp } from "@/components/AdminApp";
import { DoctorApp } from "@/components/DoctorApp";
import { PharmacyApp } from "@/components/PharmacyApp";
import { Button } from "@/components/ui/button";
import type { StaffUser } from "@/lib/prototype-store";

type Workspace = "patient" | "staff" | "doctor" | "pharmacy" | "admin";

const workspaceForRole = (role: StaffUser["role"]): Workspace => {
  if (role === "Doctor") return "doctor";
  if (role === "Pharmacy") return "pharmacy";
  if (role === "Administrator") return "admin";
  return "staff";
};

const workspaceLabel: Record<Workspace, string> = {
  patient: "Patient portal",
  staff: "Front desk & triage",
  doctor: "Doctor consultation",
  pharmacy: "Pharmacy inventory",
  admin: "Administration",
};

const workspaceLabelForUser = (
  workspace: Workspace,
  user: StaffUser | null,
) => {
  if (workspace !== "staff") return workspaceLabel[workspace];
  return user?.role === "Nurse / Triage" ? "Nurse / triage" : "Front desk";
};

const Index = () => {
  const displayMode = new URLSearchParams(window.location.search).get("display");
  const isAnimalBiteQueueDisplay = window.location.pathname === "/animal-bite-queue";
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [signedInUser, setSignedInUser] = useState<StaffUser | null>(null);
  const enterStaffWorkspace = (user: StaffUser) => {
    setSignedInUser(user);
    setWorkspace(workspaceForRole(user.role));
  };
  const returnToAccess = () => {
    setSignedInUser(null);
    setWorkspace(null);
  };

  if (isAnimalBiteQueueDisplay) return <QueueTvDisplay area="Animal Bite Center" />;
  if (displayMode === "queue-tv") return <QueueTvDisplay />;

  if (!workspace) {
    return (
      <AccessGateway
        onPatientAccess={() => setWorkspace("patient")}
        onStaffAuthenticated={enterStaffWorkspace}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-xl">
        <div className="container flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-none">SmartServe</h1>
              <p className="mt-1 text-xs text-muted-foreground">{workspaceLabelForUser(workspace, signedInUser)}{signedInUser ? ` · ${signedInUser.fullName}` : ""}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={returnToAccess}>
            <LogOut className="mr-2 h-4 w-4" />
            {workspace === "patient" ? "Change access" : "Sign out"}
          </Button>
        </div>
      </header>
      <main className="container animate-fade-in py-8 md:py-12" key={workspace}>
        {workspace === "patient" ? <PatientApp /> : null}
        {workspace === "staff" ? <StaffApp currentUser={signedInUser || undefined} /> : null}
        {workspace === "doctor" ? <DoctorApp currentUser={signedInUser || undefined} /> : null}
        {workspace === "pharmacy" ? <PharmacyApp /> : null}
        {workspace === "admin" ? <AdminApp /> : null}
      </main>
      <footer className="mt-16 border-t border-border bg-card/50">
        <div className="container py-6 text-center text-xs text-muted-foreground">SmartServe · Prototype for the Super Health Center of Jones, Isabela</div>
      </footer>
    </div>
  );
};

export default Index;
