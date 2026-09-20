import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  PackagePlus,
  Pill,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { usePrototypeStore } from "@/lib/prototype-store";

export function PharmacyApp() {
  const {
    patients,
    medicines,
    appointments,
    medicalRecords,
    dispense,
    receiveStock,
  } = usePrototypeStore();
  const [patientQuery, setPatientQuery] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dispenseStatus, setDispenseStatus] = useState(
    "Select a prescribed medicine",
  );
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [inventoryId, setInventoryId] = useState("");
  const [receivedQuantity, setReceivedQuantity] = useState("");
  const [stockMessage, setStockMessage] = useState("");

  const visibleStock = useMemo(() => {
    const query = inventoryQuery.trim().toLowerCase();
    return medicines.filter((medicine) =>
      `${medicine.name} ${medicine.strength} ${medicine.form}`
        .toLowerCase()
        .includes(query),
    );
  }, [inventoryQuery, medicines]);
  const matchedPatient = patientQuery.trim()
    ? patients.find(
        (patient) =>
          patient.fullName.toLowerCase().includes(patientQuery.toLowerCase()) ||
          appointments.some(
            (appointment) =>
              appointment.patientId === patient.id &&
              appointment.queueNumber === patientQuery.padStart(3, "0"),
          ),
      )
    : undefined;
  const prescriptionRecord = matchedPatient
    ? medicalRecords.find(
        (record) =>
          record.patientId === matchedPatient.id &&
          record.prescription.some(
            (item) => (item.dispensedQuantity ?? 0) < item.quantity,
          ),
      )
    : undefined;
  const prescribedItems =
    prescriptionRecord?.prescription.filter(
      (item) => (item.dispensedQuantity ?? 0) < item.quantity,
    ) || [];
  const prescribedMedicineIds = prescribedItems
    .map((item) => item.medicineId)
    .sort()
    .join("|");
  const selectedPrescription = prescribedItems.find(
    (item) => item.medicineId === medicineId,
  );
  const selectedMedicine = medicines.find(
    (medicine) => medicine.id === medicineId,
  );
  const selectedInventory = medicines.find(
    (medicine) => medicine.id === inventoryId,
  );
  const remaining = selectedPrescription
    ? selectedPrescription.quantity - (selectedPrescription.dispensedQuantity ?? 0)
    : 0;

  useEffect(() => {
    if (
      !medicineId ||
      prescribedItems.some((item) => item.medicineId === medicineId)
    )
      return;
    setMedicineId("");
    setQuantity("");
    setDispenseStatus("Select a prescribed medicine");
  }, [medicineId, prescribedMedicineIds]);

  useEffect(() => {
    if (
      !inventoryId ||
      medicines.some((medicine) => medicine.id === inventoryId)
    )
      return;
    setInventoryId("");
    setReceivedQuantity("");
    setStockMessage("");
  }, [inventoryId, medicines]);

  useEffect(() => {
    if (!selectedPrescription) return;
    setQuantity(
      String(
        selectedPrescription.quantity - (selectedPrescription.dispensedQuantity ?? 0),
      ),
    );
    setDispenseStatus("Ready to dispense");
  }, [
    medicineId,
    selectedPrescription?.dispensedQuantity,
    selectedPrescription?.quantity,
  ]);

  const togglePrescription = (selectedId: string) => {
    if (medicineId === selectedId) {
      setMedicineId("");
      setQuantity("");
      setDispenseStatus("Select a prescribed medicine");
      return;
    }
    setMedicineId(selectedId);
    setDispenseStatus("Ready to dispense");
  };
  const toggleInventory = (selectedId: string) => {
    if (inventoryId === selectedId) {
      setInventoryId("");
      setReceivedQuantity("");
      setStockMessage("");
      return;
    }
    setInventoryId(selectedId);
    setReceivedQuantity("");
    setStockMessage("");
  };
  const recordDispense = () => {
    if (!matchedPatient || !selectedPrescription) return;
    const requested = Math.floor(Number(quantity));
    const actual = dispense(
      matchedPatient.id,
      selectedPrescription.medicineId,
      requested,
    );
    if (!actual) {
      setDispenseStatus(
        "Unable to dispense — verify stock and remaining prescription quantity.",
      );
      return;
    }
    setDispenseStatus(
      actual === remaining
        ? "Fully dispensed"
        : `Partially dispensed: ${actual} released`,
    );
  };
  const receive = () => {
    if (!selectedInventory) return;
    const ok = receiveStock(inventoryId, Number(receivedQuantity));
    setStockMessage(
      ok
        ? `${receivedQuantity} ${selectedInventory.form.toLowerCase()}(s) added to ${selectedInventory.name}. Doctor availability is updated now.`
        : "Enter a valid quantity greater than zero.",
    );
    if (ok) setReceivedQuantity("");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <h3 className="font-display font-bold">Patient dispensing</h3>
          </div>
          <Label>Find patient by private name or queue number</Label>
          <Input
            value={patientQuery}
            onChange={(event) => {
              setPatientQuery(event.target.value);
              setMedicineId("");
              setQuantity("");
              setDispenseStatus("Select a prescribed medicine");
            }}
            placeholder="Maria Santos Cruz or 001"
            className="mt-1"
          />
          {matchedPatient ? (
            <p className="mt-2 text-xs text-secondary">
              {matchedPatient.fullName} · doctor prescription lookup ready
            </p>
          ) : patientQuery ? (
            <p className="mt-2 text-xs text-warning">
              No matching patient found.
            </p>
          ) : null}

          {matchedPatient && prescriptionRecord ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
                <p className="text-sm font-semibold">Doctor’s clinic prescription</p>
                <Badge className="border-0 bg-secondary-soft text-secondary">
                  {prescriptionRecord.status}
                </Badge>
              </div>
              {prescribedItems.map((item) => {
                const itemMedicine = medicines.find(
                  (medicine) => medicine.id === item.medicineId,
                );
                const itemRemaining =
                  item.quantity - (item.dispensedQuantity ?? 0);
                const selected = medicineId === item.medicineId;
                return (
                  <button
                    type="button"
                    key={item.medicineId}
                    onClick={() => togglePrescription(item.medicineId)}
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 border-b border-border px-3 py-3 text-left last:border-0",
                      selected ? "bg-primary-soft" : "hover:bg-muted/50",
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {itemMedicine?.name} {itemMedicine?.strength}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.instructions || "No special instructions recorded."}
                      </p>
                    </div>
                    <Badge variant="outline">Remaining {itemRemaining}</Badge>
                  </button>
                );
              })}
            </div>
          ) : matchedPatient ? (
            <div className="mt-4 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              No clinic medicine is awaiting dispensing for this patient.
            </div>
          ) : null}

          {selectedMedicine && selectedPrescription ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <Label>Quantity to dispense</Label>
                  <Input
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    type="number"
                    min="1"
                    max={Math.min(remaining, selectedMedicine.stock)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Input readOnly value={dispenseStatus} className="mt-1" />
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
                <p className="font-semibold">
                  Batch {selectedMedicine.batch} · Expires {selectedMedicine.expiry}
                </p>
                <p className="text-xs text-muted-foreground">
                  Prescribed remaining: {remaining} · Available stock: {selectedMedicine.stock}{" "}
                  {selectedMedicine.form.toLowerCase()}(s)
                </p>
              </div>
              <Button
                disabled={selectedMedicine.stock === 0 || !Number(quantity)}
                onClick={recordDispense}
                className="mt-4"
              >
                <Pill className="mr-2 h-4 w-4" />
                Record dispensing
              </Button>
            </>
          ) : matchedPatient && prescriptionRecord ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Select a prescribed medicine above to prepare dispensing.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex gap-2">
            <PackagePlus className="h-5 w-5 text-secondary" />
            <div>
              <h3 className="font-display font-bold">Search & update medicine stock</h3>
              <p className="text-xs text-muted-foreground">
                Search, select the exact medicine, then record the quantity
                physically received.
              </p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={inventoryQuery}
              onChange={(event) => setInventoryQuery(event.target.value)}
              placeholder="Search medicine, strength, or form"
              className="pl-9"
            />
          </div>
          <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
            {visibleStock.map((medicine) => {
              const low = medicine.stock <= medicine.reorderLevel;
              const selected = inventoryId === medicine.id;
              return (
                <button
                  type="button"
                  key={medicine.id}
                  onClick={() => toggleInventory(medicine.id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary-soft"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {medicine.name} {medicine.strength}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {medicine.form} · Batch {medicine.batch} · Exp. {medicine.expiry}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-display text-lg font-bold",
                        low && "text-warning",
                      )}
                    >
                      {medicine.stock}
                    </p>
                    {low ? (
                      <Badge className="border-0 bg-warning/15 text-warning">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Low
                      </Badge>
                    ) : (
                      <Badge className="border-0 bg-secondary-soft text-secondary">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Available
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
            {!visibleStock.length ? (
              <p className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">
                No medicine matches this search.
              </p>
            ) : null}
          </div>

          {selectedInventory ? (
            <div className="mt-5 rounded-xl border border-secondary/20 bg-secondary-soft/40 p-4">
              <p className="text-sm font-semibold">
                Selected: {selectedInventory.name} {selectedInventory.strength}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Current: {selectedInventory.stock} · Reorder level: {selectedInventory.reorderLevel}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={receivedQuantity}
                  onChange={(event) => setReceivedQuantity(event.target.value)}
                  type="number"
                  min="1"
                  placeholder="Quantity received"
                />
                <Button onClick={receive}>
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Add stock
                </Button>
              </div>
              {stockMessage ? (
                <p
                  className={cn(
                    "mt-3 text-xs",
                    stockMessage.startsWith("Enter")
                      ? "text-destructive"
                      : "text-secondary",
                  )}
                >
                  {stockMessage}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              Select a medicine to update stock. Click the selected medicine
              again to clear it.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
