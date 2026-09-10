import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ClipboardPlus,
  FileText,
  Pill,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MedicalRecord } from "@/data/mockData";
import { cn } from "@/lib/utils";
import {
  usePrototypeStore,
  type DoctorAvailability,
  type StaffUser,
} from "@/lib/prototype-store";

type PrescriptionDraft = MedicalRecord["prescription"][number];

export function DoctorApp({ currentUser }: { currentUser?: StaffUser }) {
  const {
    appointments,
    patients,
    medicines,
    consultationTemplates,
    medicalRecords,
    triage,
    completeConsultation,
    staffUsers,
    updateStaffUser,
  } = usePrototypeStore();
  const currentDoctor = currentUser
    ? staffUsers.find((user) => user.id === currentUser.id)
    : undefined;
  const ready = appointments.filter(
    (appointment) =>
      appointment.queueStatus === "Called" ||
      appointment.queueStatus === "In Consultation",
  );
  const [id, setId] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [medicineQuery, setMedicineQuery] = useState("");
  const [isMedicinePickerOpen, setIsMedicinePickerOpen] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [instructions, setInstructions] = useState("");
  const [prescription, setPrescription] = useState<PrescriptionDraft[]>([]);
  const [prescriptionError, setPrescriptionError] = useState("");
  const [diagnosis, setDiagnosis] = useState(
    "Acute upper respiratory infection",
  );
  const [notes, setNotes] = useState(
    "Advise rest, fluids, and return if symptoms worsen.",
  );
  const availableMedicines = useMemo(
    () => medicines.filter((medicine) => medicine.stock > 0),
    [medicines],
  );
  const filteredMedicines = useMemo(() => {
    const query = medicineQuery.trim().toLowerCase();
    if (!query) return availableMedicines;
    return availableMedicines.filter((medicine) =>
      `${medicine.name} ${medicine.strength} ${medicine.form}`
        .toLowerCase()
        .includes(query),
    );
  }, [availableMedicines, medicineQuery]);
  const availableConsultationTemplates = useMemo(
    () => consultationTemplates.filter((template) => template.active),
    [consultationTemplates],
  );
  const filteredConsultationTemplates = useMemo(() => {
    const query = templateQuery.trim().toLowerCase();
    if (!query) return availableConsultationTemplates;
    return availableConsultationTemplates.filter((template) =>
      `${template.assessment} ${template.clinicalNotes}`
        .toLowerCase()
        .includes(query),
    );
  }, [availableConsultationTemplates, templateQuery]);

  useEffect(() => {
    if (!ready.some((appointment) => appointment.id === id))
      setId(ready[0]?.id || "");
  }, [ready, id]);

  useEffect(() => {
    if (!availableMedicines.some((medicine) => medicine.id === medicineId)) {
      setMedicineId("");
    }
  }, [availableMedicines, medicineId]);

  useEffect(() => {
    setPrescription([]);
    setPrescriptionError("");
    setQuantity("1");
    setInstructions("");
    setMedicineQuery("");
    setIsMedicinePickerOpen(false);
    setTemplateQuery("");
    setIsTemplatePickerOpen(false);
  }, [id]);

  const appointment = ready.find((item) => item.id === id);
  const patient =
    appointment && patients.find((item) => item.id === appointment.patientId);
  const triageRecord = triage.find((item) => item.appointmentId === id);
  const history = patient
    ? medicalRecords.filter((record) => record.patientId === patient.id)
    : [];
  const medicine = availableMedicines.find((item) => item.id === medicineId);

  const selectMedicine = (selectedId: string) => {
    setMedicineId(selectedId);
    setMedicineQuery("");
    setIsMedicinePickerOpen(false);
    setPrescriptionError("");
  };
  const selectConsultationTemplate = (
    template: (typeof consultationTemplates)[number],
  ) => {
    setDiagnosis(template.assessment);
    setNotes(template.clinicalNotes);
    setTemplateQuery("");
    setIsTemplatePickerOpen(false);
  };

  const addMedicine = () => {
    const prescribedQuantity = Math.floor(Number(quantity));
    if (!medicine || prescribedQuantity < 1)
      return setPrescriptionError(
        "Choose an available medicine and a quantity of at least 1.",
      );
    if (prescribedQuantity > medicine.stock)
      return setPrescriptionError(
        `Only ${medicine.stock} ${medicine.form.toLowerCase()}(s) are currently available at the clinic.`,
      );
    if (prescription.some((item) => item.medicineId === medicine.id))
      return setPrescriptionError(
        "This medicine is already in the prescription list. Remove it first if the quantity or instructions need to change.",
      );

    setPrescription((current) => [
      ...current,
      {
        medicineId: medicine.id,
        quantity: prescribedQuantity,
        instructions: instructions.trim(),
      },
    ]);
    setQuantity("1");
    setInstructions("");
    setPrescriptionError("");
  };

  const removeMedicine = (idToRemove: string) =>
    setPrescription((current) =>
      current.filter((item) => item.medicineId !== idToRemove),
    );
  const complete = () => {
    if (!appointment || !diagnosis.trim() || currentDoctor?.role !== "Doctor")
      return;
    completeConsultation(
      appointment.id,
      diagnosis.trim(),
      notes.trim(),
      prescription,
      currentDoctor.id,
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <Badge
          variant="secondary"
          className="mb-2 bg-primary-soft text-primary border-0"
        >
          Clinical workspace
        </Badge>
        <h2 className="text-2xl md:text-3xl font-display font-bold">
          Review triage, document care, and prescribe clinic stock
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Clinic prescriptions are saved with the consultation for Pharmacy to
          verify and dispense. External prescriptions remain outside SmartServe.
        </p>
      </div>
      {currentDoctor?.role === "Doctor" ? (
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-primary-soft/50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Your patient-facing availability</p>
            <p className="text-xs text-muted-foreground">Patients see a privacy-safe availability message before booking.</p>
          </div>
          <select
            aria-label="Your availability"
            value={currentDoctor.doctorStatus || "Available"}
            onChange={(event) =>
              updateStaffUser(currentDoctor.id, {
                doctorStatus: event.target.value as DoctorAvailability,
              })
            }
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium"
          >
            {[
              "Available",
              "With patient",
              "On break",
              "Off duty",
              "On leave",
            ].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="grid lg:grid-cols-[280px,1fr] gap-5">
        <aside className="bg-card border border-border rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <UserRound className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold">Ready for consultation</h3>
          </div>
          {ready.map((item) => (
            <button
              key={item.id}
              onClick={() => setId(item.id)}
              className={cn(
                "w-full text-left rounded-xl p-3 border mb-2",
                id === item.id
                  ? "border-primary bg-primary-soft"
                  : "border-border",
              )}
            >
              <p className="font-semibold text-sm">
                {item.queueNumber} ·{" "}
                {patients.find(
                  (patientItem) => patientItem.id === item.patientId,
                )?.fullName || "Unknown patient"}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.visitType || "Scheduled"} ·{" "}
                {triage.find((record) => record.appointmentId === item.id)
                  ?.priority || "Triage pending"}
              </p>
            </button>
          ))}
          {!ready.length ? (
            <p className="text-sm text-muted-foreground">
              No patient is currently being served.
            </p>
          ) : null}
        </aside>
        <div className="space-y-5">
          {patient && appointment ? (
            <>
              <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-display font-bold text-xl">
                      {patient.fullName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {patient.gender} · Born {patient.dob} · {patient.barangay}
                    </p>
                  </div>
                  <Badge className="bg-secondary-soft text-secondary border-0">
                    Consent verified
                  </Badge>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
                  <Info
                    label="Allergies"
                    value={triageRecord?.allergies || "Not recorded"}
                  />
                  <Info
                    label="Triage"
                    value={`${triageRecord?.complaint || "Not recorded"} · ${triageRecord?.priority || "—"}`}
                  />
                  <Info
                    label="Latest BP"
                    value={triageRecord?.bloodPressure || "Not recorded"}
                  />
                </div>
              </section>
              <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-4">
                  <Pill className="w-5 h-5 text-secondary" />
                  <div>
                    <h3 className="font-display font-bold">
                      Clinic prescription & availability
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Add one or more in-stock medicines to this patient’s
                      pharmacy list.
                    </p>
                  </div>
                </div>
                {availableMedicines.length ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr),120px,1.25fr,auto]">
                      <div className="relative">
                        <Label>Available medicine</Label>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-1 h-10 w-full justify-between font-normal"
                          onClick={() =>
                            setIsMedicinePickerOpen((open) => !open)
                          }
                          aria-expanded={isMedicinePickerOpen}
                          aria-haspopup="listbox"
                        >
                          <span className="truncate">
                            {medicine
                              ? `${medicine.name} ${medicine.strength} · ${medicine.form}`
                              : "Select medicine"}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 transition-transform",
                              isMedicinePickerOpen && "rotate-180",
                            )}
                          />
                        </Button>
                        {isMedicinePickerOpen ? (
                          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-card">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                autoFocus
                                value={medicineQuery}
                                onChange={(event) =>
                                  setMedicineQuery(event.target.value)
                                }
                                placeholder="Search medicine, strength, or form"
                                className="pl-9"
                              />
                            </div>
                            <div
                              role="listbox"
                              aria-label="Available medicines"
                              className="mt-2 max-h-56 overflow-y-auto"
                            >
                              {filteredMedicines.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  role="option"
                                  aria-selected={item.id === medicineId}
                                  onClick={() => selectMedicine(item.id)}
                                  className={cn(
                                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                                    item.id === medicineId &&
                                      "bg-primary-soft text-primary",
                                  )}
                                >
                                  <span className="min-w-0">
                                    <span className="block truncate font-medium">
                                      {item.name} {item.strength}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                      {item.form} · Batch {item.batch}
                                    </span>
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="shrink-0 bg-secondary-soft text-secondary"
                                  >
                                    {item.stock} available
                                  </Badge>
                                </button>
                              ))}
                              {!filteredMedicines.length ? (
                                <p className="px-3 py-5 text-center text-sm text-muted-foreground">
                                  No in-stock medicine matches that search.
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          value={quantity}
                          onChange={(event) => setQuantity(event.target.value)}
                          type="number"
                          min="1"
                          max={medicine?.stock}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Instructions</Label>
                        <Input
                          value={instructions}
                          onChange={(event) =>
                            setInstructions(event.target.value)
                          }
                          placeholder="e.g. Take 1 tablet every 8 hours"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          size="icon"
                          onClick={addMedicine}
                          title="Add medicine to prescription"
                          aria-label="Add medicine to prescription"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {medicine ? (
                      <div className="mt-3 rounded-xl bg-muted p-3 text-sm">
                        <p className="font-semibold">
                          Available at clinic pharmacy
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {medicine.stock} {medicine.form.toLowerCase()}(s) ·
                          Batch {medicine.batch} · Expires {medicine.expiry}
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                    No medicine is currently available in clinic inventory.
                  </p>
                )}
                {prescriptionError ? (
                  <p className="mt-3 text-xs text-destructive">
                    {prescriptionError}
                  </p>
                ) : null}
                <div className="mt-4 overflow-hidden rounded-xl border border-border">
                  <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
                    <p className="text-sm font-semibold">
                      Medicines for clinic pharmacy
                    </p>
                    <Badge variant="secondary">
                      {prescription.length} item
                      {prescription.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  {prescription.map((item) => {
                    const prescribedMedicine = medicines.find(
                      (medicineItem) => medicineItem.id === item.medicineId,
                    );
                    return (
                      <div
                        key={item.medicineId}
                        className="flex items-start gap-3 border-b border-border px-3 py-3 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {prescribedMedicine?.name}{" "}
                            {prescribedMedicine?.strength} · {item.quantity}{" "}
                            {prescribedMedicine?.form.toLowerCase()}(s)
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.instructions ||
                              "No special instructions recorded."}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeMedicine(item.medicineId)}
                          title="Remove medicine"
                          aria-label={`Remove ${prescribedMedicine?.name || "medicine"}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  {!prescription.length ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground">
                      No clinic medicine added. You may still complete the
                      consultation without a pharmacy prescription.
                    </p>
                  ) : null}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Adding a medicine records the intended prescription only.
                  Stock is deducted only when Pharmacy records the actual
                  dispensing.
                </p>
              </section>
              <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardPlus className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-bold">
                    Consultation record
                  </h3>
                </div>
                {availableConsultationTemplates.length ? (
                  <div className="relative mb-4">
                    <Label>Start from an admin consultation template</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-1 h-10 w-full justify-between font-normal"
                      onClick={() => setIsTemplatePickerOpen((open) => !open)}
                      aria-expanded={isTemplatePickerOpen}
                      aria-haspopup="listbox"
                    >
                      <span className="truncate">
                        Search assessment or clinical notes
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform",
                          isTemplatePickerOpen && "rotate-180",
                        )}
                      />
                    </Button>
                    {isTemplatePickerOpen ? (
                      <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-card">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            autoFocus
                            value={templateQuery}
                            onChange={(event) =>
                              setTemplateQuery(event.target.value)
                            }
                            placeholder="Type an assessment, diagnosis, or note"
                            className="pl-9"
                          />
                        </div>
                        <div
                          role="listbox"
                          aria-label="Admin consultation templates"
                          className="mt-2 max-h-56 overflow-y-auto"
                        >
                          {filteredConsultationTemplates.map((template) => (
                            <button
                              key={template.id}
                              type="button"
                              role="option"
                              onClick={() =>
                                selectConsultationTemplate(template)
                              }
                              className="block w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                            >
                              <span className="block truncate text-sm font-medium">
                                {template.assessment}
                              </span>
                              <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">
                                {template.clinicalNotes}
                              </span>
                            </button>
                          ))}
                          {!filteredConsultationTemplates.length ? (
                            <p className="px-3 py-5 text-center text-sm text-muted-foreground">
                              No active template matches that search.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Selecting a template fills both fields below. You can
                      change the assessment and clinical notes for this patient
                      before completing the consultation.
                    </p>
                  </div>
                ) : (
                  <p className="mb-4 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                    No active Admin consultation template is available. You can
                    still document this consultation manually.
                  </p>
                )}
                <Label>Assessment / diagnosis</Label>
                <Input
                  value={diagnosis}
                  onChange={(event) => setDiagnosis(event.target.value)}
                  className="mt-1"
                />
                <Label className="block mt-4">Clinical notes</Label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-1 min-h-24"
                />
                <Button
                  disabled={!diagnosis.trim() || currentDoctor?.role !== "Doctor"}
                  onClick={complete}
                  className="mt-4"
                >
                  Complete consultation & send prescription
                </Button>
              </section>
              <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-accent" />
                  <h3 className="font-display font-bold">
                    Medical record history
                  </h3>
                </div>
                {history.map((record) => (
                  <div key={record.id} className="border-t border-border py-3">
                    <p className="font-semibold text-sm">{record.diagnosis}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.date} · {record.clinician} · {record.status}
                    </p>
                    <p className="text-sm mt-2">{record.notes}</p>
                    {record.prescription.length ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Clinic medicines:{" "}
                        {record.prescription
                          .map(
                            (item) =>
                              `${medicines.find((medicineItem) => medicineItem.id === item.medicineId)?.name || "Medicine"} × ${item.quantity}`,
                          )
                          .join(", ")}
                      </p>
                    ) : null}
                  </div>
                ))}
                {!history.length ? (
                  <p className="text-sm text-muted-foreground">
                    No prior digital record found.
                  </p>
                ) : null}
              </section>
            </>
          ) : (
            <section className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
              Select a patient after the queue desk marks them as arrived.
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-xl p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium mt-1">{value}</p>
    </div>
  );
}
