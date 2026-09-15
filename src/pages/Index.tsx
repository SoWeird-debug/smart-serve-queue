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
        <div
          className={
            workspace === "admin"
              ? "flex items-center justify-between gap-4 px-4 py-3 sm:px-6 xl:px-8"
              : "container flex items-center justify-between gap-4 py-3"
          }
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-sm font-bold leading-tight md:text-base">
                An integrated web application for service booking with Disease
                trend monitoring in Super Health Center of Jones, Isabela
              </h1>
            </div>
          </div>
          {workspace !== "admin" ? (
            <Button size="sm" variant="outline" onClick={returnToAccess}>
              <LogOut className="mr-2 h-4 w-4" />
              {workspace === "patient" ? "Change access" : "Sign out"}
            </Button>
          ) : null}
        </div>
      </header>
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
