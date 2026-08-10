import { useState } from "react";
import { ClipboardPlus, FileText, Pill, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { helpers, medicalRecords, medicines, patients } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function DoctorApp() {
  const [selectedPatientId, setSelectedPatientId] = useState("p1");
  const [medicineId, setMedicineId] = useState("m1");
  const [completed, setCompleted] = useState(false);
  const patient = helpers.getPatient(selectedPatientId);
  const selectedMedicine = medicines.find((medicine) => medicine.id === medicineId)!;
  const history = medicalRecords.filter((record) => record.patientId === selectedPatientId);

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <Badge variant="secondary" className="mb-2 bg-primary-soft text-primary border-0">Clinical workspace</Badge>
        <h2 className="text-2xl md:text-3xl font-display font-bold">Consult, document care, and check medicine availability</h2>
        <p className="text-muted-foreground text-sm mt-1">SmartServe records the consultation; clinic-approved physical/manual prescriptions remain outside the system.</p>
      </div>

      <div className="grid lg:grid-cols-[280px,1fr] gap-5">
        <aside className="bg-card border border-border rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2 mb-4"><UserRound className="w-5 h-5 text-primary" /><h3 className="font-display font-bold">Today’s patients</h3></div>
          <div className="space-y-2">
            {patients.slice(0, 5).map((item) => (
              <button key={item.id} onClick={() => { setSelectedPatientId(item.id); setCompleted(false); }} className={cn("w-full text-left rounded-xl p-3 border transition-smooth", selectedPatientId === item.id ? "border-primary bg-primary-soft" : "border-border hover:bg-muted/50")}>
                <p className="font-semibold text-sm">A-00{item.id.slice(1)} · {item.fullName}</p><p className="text-xs text-muted-foreground">General consultation · Normal triage priority</p>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-5">
          <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-display font-bold text-xl">{patient.fullName}</h3><p className="text-sm text-muted-foreground">{patient.gender} · Born {patient.dob} · {patient.barangay}, {patient.municipality}</p></div><Badge className="bg-secondary-soft text-secondary border-0">Consent verified</Badge></div>
            <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm"><Info label="Allergies" value="No known drug allergies" /><Info label="Triage" value="Cough and fever · Normal" /><Info label="Latest BP" value="120 / 80 mmHg" /></div>
          </section>

          <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-4"><ClipboardPlus className="w-5 h-5 text-primary" /><h3 className="font-display font-bold">Consultation record</h3></div>
            <div className="grid md:grid-cols-2 gap-4"><div><Label>Assessment / diagnosis</Label><Input defaultValue="Acute upper respiratory infection" className="mt-1" /></div><div><Label>Follow-up date</Label><Input type="date" className="mt-1" /></div></div>
            <div className="mt-4"><Label>Clinical notes</Label><Textarea defaultValue="Advise rest, fluids, and return if symptoms worsen." className="mt-1 min-h-20" /></div><div className="grid md:grid-cols-2 gap-4 mt-4"><div><Label>Care plan / recommendations</Label><Textarea className="mt-1" placeholder="Care instructions" /></div><div><Label>Referral (if required)</Label><Input className="mt-1" placeholder="Referral destination or none" /></div></div><div className="flex gap-2 mt-4"><Button variant="outline">Save draft</Button><Button onClick={() => setCompleted(true)}>Complete consultation</Button></div>{completed && <p className="mt-3 text-sm text-secondary">Consultation completed. The queue status can now be updated to Consultation Completed.</p>}
          </section>

          <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3 mb-4"><div className="flex items-center gap-2"><Pill className="w-5 h-5 text-secondary" /><h3 className="font-display font-bold">Medicine availability</h3></div><span className="text-xs text-muted-foreground">Read-only pharmacy stock</span></div>
            <div><Label>Search medicine</Label><select value={medicineId} onChange={(event) => setMedicineId(event.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name} {medicine.strength} · {medicine.form}</option>)}</select></div>
            <div className={cn("mt-4 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3", selectedMedicine.stock > 0 ? "bg-secondary-soft" : "bg-destructive/10")}><div><p className="font-semibold text-sm">{selectedMedicine.stock > 0 ? "Available at clinic pharmacy" : "Not available"}</p><p className="text-xs text-muted-foreground">{selectedMedicine.stock} {selectedMedicine.form.toLowerCase()}s in stock · Batch {selectedMedicine.batch} · Expires {selectedMedicine.expiry}</p></div><Badge className={selectedMedicine.stock <= selectedMedicine.reorderLevel ? "bg-warning/15 text-warning border-0" : "bg-secondary text-secondary-foreground border-0"}>{selectedMedicine.stock <= selectedMedicine.reorderLevel ? "Low stock" : "In stock"}</Badge></div>
            <p className="mt-4 text-xs text-muted-foreground">If medication is needed, use the clinic-approved physical/manual prescription process. SmartServe does not transmit prescriptions to pharmacy.</p>
          </section>

          <section className="bg-card border border-border rounded-2xl p-5 shadow-soft"><div className="flex items-center gap-2 mb-3"><FileText className="w-5 h-5 text-accent" /><h3 className="font-display font-bold">Medical record history</h3></div>{history.length ? history.map((record) => <div key={record.id} className="border-t border-border py-3 first:border-t-0"><p className="font-semibold text-sm">{record.diagnosis}</p><p className="text-xs text-muted-foreground mt-1">{record.date} · {record.clinician}</p><p className="text-sm mt-2">{record.notes}</p></div>) : <p className="text-sm text-muted-foreground">No prior digital records found. Scan or encode the clinic’s paper record before consultation.</p>}</section>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="bg-muted/50 rounded-xl p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium mt-1">{value}</p></div>; }
