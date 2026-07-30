import { useState } from "react";
import { RoleSwitcher, type RoleView } from "@/components/RoleSwitcher";
import { PatientApp } from "@/components/PatientApp";
import { StaffApp } from "@/components/StaffApp";
import { AdminApp } from "@/components/AdminApp";

const Index = () => {
  const [role, setRole] = useState<RoleView>("patient");

  return (
    <div className="min-h-screen bg-background">
      <RoleSwitcher value={role} onChange={setRole} />
      <main className="container py-8 md:py-12 animate-fade-in" key={role}>
        {role === "patient" && <PatientApp />}
        {role === "staff"   && <StaffApp />}
        {role === "admin"   && <AdminApp />}
      </main>
      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="container py-6 text-center text-xs text-muted-foreground">
          SmartServe · Prototype for the Super Health Center of Jones, Isabela
        </div>
      </footer>
    </div>
  );
};

export default Index;
