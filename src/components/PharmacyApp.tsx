import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardCheck, PackagePlus, Pill, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { usePrototypeStore } from "@/lib/prototype-store";

export function PharmacyApp() {
  const { patients, medicines, appointments, medicalRecords, dispense, receiveStock } = usePrototypeStore();
  const [patientQuery, setPatientQuery] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dispenseStatus, setDispenseStatus] = useState("Select a prescribed medicine");
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [inventoryId, setInventoryId] = useState("m1");
  const [receivedQuantity, setReceivedQuantity] = useState("");
  const [stockMessage, setStockMessage] = useState("");
  const selectedInventory = medicines.find(medicine => medicine.id === inventoryId) || medicines[0];
  const visibleStock = useMemo(() => medicines.filter(medicine => `${medicine.name} ${medicine.strength} ${medicine.form}`.toLowerCase().includes(inventoryQuery.toLowerCase())), [medicines, inventoryQuery]);
  const matchedPatient = patientQuery.trim() ? patients.find(patient => patient.fullName.toLowerCase().includes(patientQuery.toLowerCase()) || appointments.some(appointment => appointment.patientId === patient.id && appointment.queueNumber === patientQuery.padStart(3, "0"))) : undefined;
  const prescriptionRecord = matchedPatient ? medicalRecords.find(record => record.patientId === matchedPatient.id && record.prescription.some(item => (item.dispensedQuantity ?? 0) < item.quantity)) : undefined;
  const prescribedItems = prescriptionRecord?.prescription.filter(item => (item.dispensedQuantity ?? 0) < item.quantity) || [];
  const selectedPrescription = prescribedItems.find(item => item.medicineId === medicineId);
  const selectedMedicine = medicines.find(medicine => medicine.id === medicineId);
  const remaining = selectedPrescription ? selectedPrescription.quantity - (selectedPrescription.dispensedQuantity ?? 0) : 0;

  useEffect(() => {
    if (!prescribedItems.some(item => item.medicineId === medicineId)) setMedicineId(prescribedItems[0]?.medicineId || "");
  }, [medicineId, prescriptionRecord?.id, prescribedItems]);

  useEffect(() => {
    if (selectedPrescription) {
      setQuantity(String(selectedPrescription.quantity - (selectedPrescription.dispensedQuantity ?? 0)));
      setDispenseStatus("Ready to dispense");
    }
  }, [medicineId, selectedPrescription?.dispensedQuantity, selectedPrescription?.quantity]);

  const recordDispense = () => {
    if (!matchedPatient || !selectedPrescription) return;
    const requested = Math.floor(Number(quantity));
    const actual = dispense(matchedPatient.id, selectedPrescription.medicineId, requested);
    if (!actual) return setDispenseStatus("Unable to dispense — verify stock and remaining prescription quantity.");
    setDispenseStatus(actual === remaining ? "Fully dispensed" : `Partially dispensed: ${actual} released`);
  };

  const receive = () => {
    if (!selectedInventory) return;
    const ok = receiveStock(inventoryId, Number(receivedQuantity));
    setStockMessage(ok ? `${receivedQuantity} ${selectedInventory.form.toLowerCase()}(s) added to ${selectedInventory.name}. Doctor availability is updated now.` : "Enter a valid quantity greater than zero.");
    if (ok) setReceivedQuantity("");
  };

  return <div className="space-y-6"><div className="text-center max-w-2xl mx-auto"><Badge variant="secondary" className="mb-2 bg-secondary-soft text-secondary border-0">Clinic pharmacy & inventory</Badge><h2 className="text-2xl md:text-3xl font-display font-bold">Verify, dispense, and keep medicine availability current</h2><p className="text-muted-foreground text-sm mt-1">Doctor-issued clinic prescriptions and live stock are shared in this local workflow.</p></div><div className="grid lg:grid-cols-2 gap-5"><section className="bg-card border border-border rounded-2xl p-5 shadow-soft"><div className="flex gap-2 mb-4"><ClipboardCheck className="w-5 h-5 text-primary"/><div><h3 className="font-display font-bold">Patient dispensing</h3><p className="text-xs text-muted-foreground">Find the patient, select a doctor-issued medicine, then record what was actually released.</p></div></div><Label>Find patient by private name or queue number</Label><Input value={patientQuery} onChange={event=>{setPatientQuery(event.target.value);setMedicineId("");setQuantity("");setDispenseStatus("Select a prescribed medicine");}} placeholder="Maria Santos Cruz or 001" className="mt-1"/>{matchedPatient?<p className="mt-2 text-xs text-secondary">{matchedPatient.fullName} · doctor prescription lookup ready</p>:patientQuery?<p className="mt-2 text-xs text-warning">No matching patient found.</p>:null}{matchedPatient&&prescriptionRecord?<div className="mt-4 overflow-hidden rounded-xl border border-border"><div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2"><p className="text-sm font-semibold">Doctor’s clinic prescription</p><Badge className="border-0 bg-secondary-soft text-secondary">{prescriptionRecord.status}</Badge></div>{prescribedItems.map(item=>{const itemMedicine=medicines.find(medicine=>medicine.id===item.medicineId);const itemRemaining=item.quantity-(item.dispensedQuantity??0);return <button type="button" key={item.medicineId} onClick={()=>{setMedicineId(item.medicineId);setDispenseStatus("Ready to dispense");}} className={cn("flex w-full items-center justify-between gap-3 border-b border-border px-3 py-3 text-left last:border-0",medicineId===item.medicineId?"bg-primary-soft":"hover:bg-muted/50")}><div><p className="font-medium text-sm">{itemMedicine?.name} {itemMedicine?.strength}</p><p className="mt-1 text-xs text-muted-foreground">{item.instructions||"No special instructions recorded."}</p></div><Badge variant="outline">Remaining {itemRemaining}</Badge></button>})}</div>:matchedPatient?<div className="mt-4 rounded-xl bg-muted p-4 text-sm text-muted-foreground">No clinic medicine is awaiting dispensing for this patient.</div>:null}{selectedMedicine&&selectedPrescription?<><div className="grid grid-cols-2 gap-3 mt-4"><div><Label>Quantity to dispense</Label><Input value={quantity} onChange={event=>setQuantity(event.target.value)} type="number" min="1" max={Math.min(remaining,selectedMedicine.stock)} className="mt-1"/></div><div><Label>Status</Label><Input readOnly value={dispenseStatus} className="mt-1"/></div></div><div className="rounded-xl bg-muted/50 p-3 text-sm mt-4"><p className="font-semibold">Batch {selectedMedicine.batch} · Expires {selectedMedicine.expiry}</p><p className="text-xs text-muted-foreground">Prescribed remaining: {remaining} · Available stock: {selectedMedicine.stock} {selectedMedicine.form.toLowerCase()}(s)</p></div><Button disabled={selectedMedicine.stock===0||!Number(quantity)} onClick={recordDispense} className="mt-4"><Pill className="w-4 h-4 mr-2"/>Record dispensing</Button></>:null}</section><section className="bg-card border border-border rounded-2xl p-5 shadow-soft"><div className="flex gap-2 mb-4"><PackagePlus className="w-5 h-5 text-secondary"/><div><h3 className="font-display font-bold">Search & update medicine stock</h3><p className="text-xs text-muted-foreground">Search, select the exact medicine, then record the quantity physically received.</p></div></div><div className="relative"><Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground"/><Input value={inventoryQuery} onChange={event=>setInventoryQuery(event.target.value)} placeholder="Search medicine, strength, or form" className="pl-9"/></div><div className="max-h-52 overflow-y-auto mt-3 space-y-2">{visibleStock.map(medicine=>{const low=medicine.stock<=medicine.reorderLevel;return <button key={medicine.id} onClick={()=>setInventoryId(medicine.id)} className={cn("w-full text-left border rounded-xl p-3 flex justify-between gap-3",inventoryId===medicine.id?"border-primary bg-primary-soft":"border-border hover:bg-muted/50")}><div><p className="font-semibold text-sm">{medicine.name} {medicine.strength}</p><p className="text-xs text-muted-foreground">{medicine.form} · Batch {medicine.batch} · Exp. {medicine.expiry}</p></div><div className="text-right"><p className={cn("font-display font-bold text-lg",low&&"text-warning")}>{medicine.stock}</p>{low?<Badge className="bg-warning/15 text-warning border-0"><AlertTriangle className="w-3 h-3 mr-1"/>Low</Badge>:<Badge className="bg-secondary-soft text-secondary border-0"><ShieldCheck className="w-3 h-3 mr-1"/>Available</Badge>}</div></button>})}</div>{selectedInventory?<div className="mt-5 rounded-xl border border-secondary/20 bg-secondary-soft/40 p-4"><p className="font-semibold text-sm">Selected: {selectedInventory.name} {selectedInventory.strength}</p><p className="text-xs text-muted-foreground mt-1">Current: {selectedInventory.stock} · Reorder level: {selectedInventory.reorderLevel}</p><div className="flex flex-col sm:flex-row gap-2 mt-3"><Input value={receivedQuantity} onChange={event=>setReceivedQuantity(event.target.value)} type="number" min="1" placeholder="Quantity received"/><Button onClick={receive}><PackagePlus className="w-4 h-4 mr-2"/>Add stock</Button></div>{stockMessage?<p className={cn("text-xs mt-3",stockMessage.startsWith("Enter")?"text-destructive":"text-secondary")}>{stockMessage}</p>:null}</div>:null}</section></div></div>;
}
