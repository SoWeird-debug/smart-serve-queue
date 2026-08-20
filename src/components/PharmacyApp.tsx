import { useMemo, useState } from "react";
import { AlertTriangle, ClipboardCheck, PackagePlus, Pill, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { usePrototypeStore } from "@/lib/prototype-store";

export function PharmacyApp() {
  const { patients, medicines, appointments, dispense, receiveStock } = usePrototypeStore();
  const [patientQuery, setPatientQuery] = useState("");
  const [medicineId, setMedicineId] = useState("m1");
  const [quantity, setQuantity] = useState("12");
  const [dispenseStatus, setDispenseStatus] = useState("Not dispensed");
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [inventoryId, setInventoryId] = useState("m1");
  const [receivedQuantity, setReceivedQuantity] = useState("");
  const [stockMessage, setStockMessage] = useState("");
  const selectedMedicine = medicines.find(m => m.id === medicineId)!;
  const selectedInventory = medicines.find(m => m.id === inventoryId)!;
  const visibleStock = useMemo(() => medicines.filter(m => `${m.name} ${m.strength} ${m.form}`.toLowerCase().includes(inventoryQuery.toLowerCase())), [medicines, inventoryQuery]);
  const matchedPatient = patients.find(p => p.fullName.toLowerCase().includes(patientQuery.toLowerCase()) || appointments.some(a => a.patientId === p.id && a.queueNumber === patientQuery.padStart(3, "0")));
  const consultationComplete = Boolean(matchedPatient && appointments.some(a => a.patientId === matchedPatient.id && a.queueStatus === "Consultation Completed"));
  const recordDispense = () => { if (!matchedPatient) return; const actual = dispense(matchedPatient.id, medicineId, Number(quantity) || 0); setDispenseStatus(actual === Number(quantity) ? "Fully dispensed" : actual ? "Partially dispensed" : "Unavailable"); };
  const receive = () => { const ok = receiveStock(inventoryId, Number(receivedQuantity)); setStockMessage(ok ? `${receivedQuantity} ${selectedInventory.form.toLowerCase()}(s) added to ${selectedInventory.name}. Doctor availability is updated now.` : "Enter a valid quantity greater than zero."); if (ok) setReceivedQuantity(""); };

  return <div className="space-y-6">
    <div className="text-center max-w-2xl mx-auto"><Badge variant="secondary" className="mb-2 bg-secondary-soft text-secondary border-0">Clinic pharmacy & inventory</Badge><h2 className="text-2xl md:text-3xl font-display font-bold">Verify, dispense, and keep medicine availability current</h2><p className="text-muted-foreground text-sm mt-1">Pharmacy stock is shared with the doctor’s read-only medicine availability view.</p></div>
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <div className="flex gap-2 mb-4"><ClipboardCheck className="w-5 h-5 text-primary"/><div><h3 className="font-display font-bold">Patient dispensing</h3><p className="text-xs text-muted-foreground">Verify the patient and clinic-approved/manual prescription before recording actual quantity given.</p></div></div>
        <Label>Find patient by private name or queue number</Label><Input value={patientQuery} onChange={e => setPatientQuery(e.target.value)} placeholder="Maria Santos Cruz or 001" className="mt-1"/>
        {matchedPatient && <p className={cn("text-xs mt-2", consultationComplete ? "text-secondary" : "text-warning")}>{matchedPatient.fullName} · {consultationComplete ? "Consultation completed" : "Consultation must be completed first"}</p>}
        <div className="mt-4"><Label>Medicine on presented prescription</Label><select value={medicineId} onChange={e => { setMedicineId(e.target.value); setDispenseStatus("Not dispensed"); }} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{medicines.map(m => <option key={m.id} value={m.id}>{m.name} {m.strength} · {m.form}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3 mt-4"><div><Label>Quantity actually dispensed</Label><Input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" min="1" className="mt-1"/></div><div><Label>Status</Label><Input readOnly value={dispenseStatus} className="mt-1"/></div></div>
        <div className="rounded-xl bg-muted/50 p-3 text-sm mt-4"><p className="font-semibold">Batch {selectedMedicine.batch} · Expires {selectedMedicine.expiry}</p><p className="text-xs text-muted-foreground">Available stock: {selectedMedicine.stock} {selectedMedicine.form.toLowerCase()}s</p></div>
        <Button disabled={!consultationComplete || selectedMedicine.stock === 0} onClick={recordDispense} className="mt-4"><Pill className="w-4 h-4 mr-2"/>Record dispensing</Button>
      </section>
      <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <div className="flex gap-2 mb-4"><PackagePlus className="w-5 h-5 text-secondary"/><div><h3 className="font-display font-bold">Search & update medicine stock</h3><p className="text-xs text-muted-foreground">Search, select the exact medicine, then record the quantity physically received.</p></div></div>
        <div className="relative"><Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground"/><Input value={inventoryQuery} onChange={e => setInventoryQuery(e.target.value)} placeholder="Search medicine, strength, or form" className="pl-9"/></div>
        <div className="max-h-52 overflow-y-auto mt-3 space-y-2">{visibleStock.map(m => { const low = m.stock <= m.reorderLevel; return <button key={m.id} onClick={() => setInventoryId(m.id)} className={cn("w-full text-left border rounded-xl p-3 flex justify-between gap-3", inventoryId === m.id ? "border-primary bg-primary-soft" : "border-border hover:bg-muted/50")}><div><p className="font-semibold text-sm">{m.name} {m.strength}</p><p className="text-xs text-muted-foreground">{m.form} · Batch {m.batch} · Exp. {m.expiry}</p></div><div className="text-right"><p className={cn("font-display font-bold text-lg", low && "text-warning")}>{m.stock}</p>{low ? <Badge className="bg-warning/15 text-warning border-0"><AlertTriangle className="w-3 h-3 mr-1"/>Low</Badge> : <Badge className="bg-secondary-soft text-secondary border-0"><ShieldCheck className="w-3 h-3 mr-1"/>Available</Badge>}</div></button>; })}</div>
        <div className="mt-5 rounded-xl border border-secondary/20 bg-secondary-soft/40 p-4"><p className="font-semibold text-sm">Selected: {selectedInventory.name} {selectedInventory.strength}</p><p className="text-xs text-muted-foreground mt-1">Current: {selectedInventory.stock} · Reorder level: {selectedInventory.reorderLevel}</p><div className="flex flex-col sm:flex-row gap-2 mt-3"><Input value={receivedQuantity} onChange={e => setReceivedQuantity(e.target.value)} type="number" min="1" placeholder="Quantity received"/><Button onClick={receive}><PackagePlus className="w-4 h-4 mr-2"/>Add stock</Button></div>{stockMessage && <p className={cn("text-xs mt-3", stockMessage.startsWith("Enter") ? "text-destructive" : "text-secondary")}>{stockMessage}</p>}</div>
      </section>
    </div>
  </div>;
}
