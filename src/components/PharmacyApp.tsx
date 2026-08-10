import { useMemo, useState } from "react";
import { AlertTriangle, ClipboardCheck, PackagePlus, Pill, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { medicines, patients } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function PharmacyApp() {
  const [stock, setStock] = useState(medicines);
  const [query, setQuery] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  const [medicineId, setMedicineId] = useState("m1");
  const [quantity, setQuantity] = useState("12");
  const [status, setStatus] = useState("Not dispensed");
  const [received, setReceived] = useState(false);
  const selectedMedicine = stock.find((medicine) => medicine.id === medicineId)!;
  const visibleStock = useMemo(() => stock.filter((medicine) => medicine.name.toLowerCase().includes(query.toLowerCase())), [stock, query]);
  const matchedPatient = patients.find((patient) => patient.fullName.toLowerCase().includes(patientQuery.toLowerCase()));
  const dispense = () => {
    const actual = Math.min(Number(quantity) || 0, selectedMedicine.stock);
    setStock((current) => current.map((medicine) => medicine.id === medicineId ? { ...medicine, stock: medicine.stock - actual } : medicine));
    setStatus(actual === Number(quantity) ? "Fully dispensed" : actual > 0 ? "Partially dispensed" : "Unavailable");
  };
  const receiveStock = () => { setStock((current) => current.map((medicine) => medicine.id === medicineId ? { ...medicine, stock: medicine.stock + 100 } : medicine)); setReceived(true); };

  return <div className="space-y-6">
    <div className="text-center max-w-2xl mx-auto"><Badge variant="secondary" className="mb-2 bg-secondary-soft text-secondary border-0">Clinic pharmacy & inventory</Badge><h2 className="text-2xl md:text-3xl font-display font-bold">Verify physical prescriptions, dispense, and maintain accountable stock</h2><p className="text-muted-foreground text-sm mt-1">SmartServe does not receive electronic prescriptions. Stock changes only after pharmacy records actual dispensing.</p></div>
    <div className="grid lg:grid-cols-[1fr,1.1fr] gap-5">
      <section className="bg-card border border-border rounded-2xl p-5 shadow-soft"><div className="flex items-center gap-2 mb-4"><ClipboardCheck className="w-5 h-5 text-primary" /><div><h3 className="font-display font-bold">Patient dispensing</h3><p className="text-xs text-muted-foreground">Find a patient who presents a physical or clinic-approved prescription, then verify and record the actual quantity given.</p></div></div><div className="space-y-4"><div><Label>Find patient (name, patient ID, queue, or visit reference)</Label><Input value={patientQuery} onChange={(event) => setPatientQuery(event.target.value)} placeholder="Maria Santos Cruz" className="mt-1" />{matchedPatient && <p className="text-xs text-secondary mt-2">Patient found: {matchedPatient.fullName} · Consultation completed</p>}</div><div><Label>Medicine on presented prescription</Label><select value={medicineId} onChange={(event) => { setMedicineId(event.target.value); setStatus("Not dispensed"); }} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{stock.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name} {medicine.strength} · {medicine.form}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><div><Label>Quantity actually dispensed</Label><Input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="1" className="mt-1" /></div><div><Label>Dispensing status</Label><Input readOnly value={status} className="mt-1" /></div></div><div className="rounded-xl bg-muted/50 p-3 text-sm"><p className="font-semibold">Batch {selectedMedicine.batch} · Expires {selectedMedicine.expiry}</p><p className="text-xs text-muted-foreground mt-1">Available stock: {selectedMedicine.stock} {selectedMedicine.form.toLowerCase()}s</p></div><Button disabled={!matchedPatient || selectedMedicine.stock === 0} onClick={dispense}><Pill className="w-4 h-4 mr-2" />Record dispensing</Button>{status !== "Not dispensed" && <p className="text-xs text-secondary">Dispensing receipt recorded for this demo. Inventory deducted by the actual quantity only.</p>}</div></section>
      <section className="bg-card border border-border rounded-2xl p-5 shadow-soft"><div className="flex flex-wrap justify-between gap-3 mb-4"><div className="flex items-center gap-2"><PackagePlus className="w-5 h-5 text-secondary" /><div><h3 className="font-display font-bold">Medicine inventory</h3><p className="text-xs text-muted-foreground">Inventory staff receive stock, monitor batches and expiry, and make authorized adjustments.</p></div></div><Button variant="outline" size="sm" onClick={receiveStock}><PackagePlus className="w-4 h-4 mr-1" />Receive stock +100</Button></div>{received && <p className="mb-3 text-xs text-secondary">Demo stock-in recorded with source, reference, batch, expiry, and notes to be completed in the backend phase.</p>}<div className="relative mb-4"><Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search medicine" className="pl-9" /></div><div className="space-y-2">{visibleStock.map((medicine) => { const low = medicine.stock <= medicine.reorderLevel; return <div key={medicine.id} className="border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-sm">{medicine.name} {medicine.strength}</p><p className="text-xs text-muted-foreground">{medicine.form} · Batch {medicine.batch} · Exp. {medicine.expiry}</p></div><div className="text-right"><p className={cn("font-display font-bold text-lg", low && "text-warning")}>{medicine.stock}</p><p className="text-[10px] text-muted-foreground">Reorder at {medicine.reorderLevel}</p></div>{low ? <Badge className="bg-warning/15 text-warning border-0"><AlertTriangle className="w-3 h-3 mr-1" />Low stock</Badge> : <Badge className="bg-secondary-soft text-secondary border-0"><ShieldCheck className="w-3 h-3 mr-1" />Available</Badge>}</div>; })}</div></section>
    </div>
  </div>;
}
