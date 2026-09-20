import { useState } from "react";
import { LogOut } from "lucide-react";

import { AccessGateway } from "@/components/AccessGateway";
import { PatientApp } from "@/components/PatientApp";
import { QueueTvDisplay, StaffApp } from "@/components/StaffApp";
import { AdminApp } from "@/components/AdminApp";
import { DoctorApp } from "@/components/DoctorApp";
import { PharmacyApp } from "@/components/PharmacyApp";
import { Button } from "@/components/ui/button";
import type { StaffUser } from "@/lib/prototype-store";
import superHealthCenterLogo from "@/assets/super-health-center-jones-logo.png";

type Workspace = "patient" | "staff" | "doctor" | "pharmacy" | "admin";

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
  const enterStaffWorkspace = (user: StaffUser) => {
    setSignedInUser(user);
    setWorkspace(workspaceForRole(user.role));
  };
  const returnToAccess = () => {
    setSignedInUser(null);
    setWorkspace(null);
  };

  if (queueBoardPath === "/queue/animal-bite" || queueBoardPath === "/animal-bite-queue") {
    return <QueueTvDisplay area="Animal Bite Center" />;
  }
  if (queueBoardPath === "/queue/general-clinic") return <QueueTvDisplay area="General Clinic" />;
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
      {workspace !== "admin" ? (
        <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-xl">
          <div className="container flex items-center justify-between gap-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <img
                src={superHealthCenterLogo}
                alt="Jones Super Health Center seal"
                className="h-11 w-11 shrink-0 object-contain drop-shadow-sm"
              />
              <div className="min-w-0">
                <h1 className="font-display text-sm font-bold leading-tight md:text-base">
                  AN INTEGRATED WEB APPLICATION FOR SERVICE BOOKING WITH DISEASE
                  TREND MONITORING IN SUPER HEALTH CENTER OF JONES, ISABELA
                </h1>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={returnToAccess}>
              <LogOut className="mr-2 h-4 w-4" />
              {workspace === "patient" ? "Change access" : "Sign out"}
            </Button>
          </div>
        </header>
      ) : null}
      <main
        className={
          workspace === "admin"
            ? "animate-fade-in"
            : "container animate-fade-in py-8 md:py-12"
        }
        key={workspace}
      >
        {workspace === "patient" ? <PatientApp /> : null}
        {workspace === "staff" ? <StaffApp currentUser={signedInUser || undefined} /> : null}
        {workspace === "doctor" ? <DoctorApp currentUser={signedInUser || undefined} /> : null}
        {workspace === "pharmacy" ? <PharmacyApp /> : null}
        {workspace === "admin" ? (
          <AdminApp
            currentUser={signedInUser || undefined}
            onSignOut={returnToAccess}
          />
        ) : null}
      </main>
      {workspace !== "admin" ? (
        <footer className="mt-16 border-t border-border bg-card/50">
          <div className="container py-6 text-center text-xs text-muted-foreground">
            SmartServe · Prototype for the Super Health Center of Jones, Isabela
          </div>
        </footer>
      ) : null}
    </div>
  );
};

export default Index;
