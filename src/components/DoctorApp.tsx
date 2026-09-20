import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ClipboardPlus,
  FileText,
  Pill,
  Plus,
  Search,
  Settings2,
  Syringe,
  Trash2,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AnimalBiteTreatment, MedicalRecord } from "@/data/mockData";
import { cn } from "@/lib/utils";
import {
  usePrototypeStore,
  type DoctorAvailability,
  type StaffUser,
} from "@/lib/prototype-store";
import { publishPublicQueueArea } from "@/components/StaffApp";

type PrescriptionDraft = MedicalRecord["prescription"][number];

export function DoctorApp({ currentUser }: { currentUser?: StaffUser }) {
  const {
    appointments,
    patients,
    medicines,
    services,
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
  const assignedCareArea: "General Clinic" | "Animal Bite Center" = currentDoctor?.assignedAreas?.includes("Animal Bite Center")
    ? "Animal Bite Center"
    : "General Clinic";
  const [careArea, setCareArea] = useState<"General Clinic" | "Animal Bite Center">(assignedCareArea);
  useEffect(() => setCareArea(assignedCareArea), [assignedCareArea]);
  useEffect(() => {
    void publishPublicQueueArea(appointments, assignedCareArea, staffUsers).catch(
      () => undefined,
    );
  }, [appointments, assignedCareArea, staffUsers]);
  const ready = appointments.filter(
    (appointment) =>
      (appointment.queueArea || "General Clinic") === careArea &&
      appointment.queueStatus === "Called" ||
      (appointment.queueArea || "General Clinic") === careArea &&
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
  const [animalBiteError, setAnimalBiteError] = useState("");
  const [diagnosis, setDiagnosis] = useState(
    "Acute upper respiratory infection",
  );
  const [notes, setNotes] = useState(
    "Advise rest, fluids, and return if symptoms worsen.",
  );
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpType, setFollowUpType] = useState("Follow-up check-up");
  const [followUpReason, setFollowUpReason] = useState("");
  const [animalBitePlan, setAnimalBitePlan] = useState({
    exposureCategory: "For clinician classification" as AnimalBiteTreatment["exposureCategory"],
    vaccinePlan: "PEP vaccination plan" as AnimalBiteTreatment["vaccinePlan"],
    vaccineId: "",
    dose1Date: new Date().toISOString().slice(0, 10),
    dose2Date: "",
    dose3Date: "",
    administrationSite: "",
    rabiesImmunoglobulin: "Assess / not recorded" as AnimalBiteTreatment["rabiesImmunoglobulin"],
    tetanusProtection: "Assess / not recorded" as AnimalBiteTreatment["tetanusProtection"],
    protocolNote: "",
  });
  const availableMedicines = useMemo(
    () => medicines.filter((medicine) => medicine.stock > 0 && (careArea === "Animal Bite Center" ? medicine.inventoryArea === "Animal Bite Center" : medicine.inventoryArea !== "Animal Bite Center")),
    [medicines, careArea],
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
  const availableRabiesVaccines = useMemo(
    () =>
      availableMedicines.filter(
        (medicine) =>
          medicine.category === "Vaccine" ||
          /rabies|anti-rabies/i.test(`${medicine.name} ${medicine.strength}`),
      ),
    [availableMedicines],
  );
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
    setAnimalBiteError("");
    setAnimalBitePlan({
      exposureCategory: "For clinician classification",
      vaccinePlan: "PEP vaccination plan",
      vaccineId: "",
      dose1Date: new Date().toISOString().slice(0, 10),
      dose2Date: "",
      dose3Date: "",
      administrationSite: "",
      rabiesImmunoglobulin: "Assess / not recorded",
      tetanusProtection: "Assess / not recorded",
      protocolNote: "",
    });
  }, [id]);

  useEffect(() => {
    setDiagnosis(
      careArea === "Animal Bite Center"
        ? "Animal bite exposure"
        : "Acute upper respiratory infection",
    );
    setNotes(
      careArea === "Animal Bite Center"
        ? "Exposure assessed. Document the PEP decision and vaccination plan below."
        : "Advise rest, fluids, and return if symptoms worsen.",
    );
  }, [careArea]);

  const appointment = ready.find((item) => item.id === id);
  const patient =
    appointment && patients.find((item) => item.id === appointment.patientId);
  const triageRecord = triage.find((item) => item.appointmentId === id);
  const history = patient
    ? medicalRecords.filter((record) => record.patientId === patient.id)
    : [];
  const medicine = availableMedicines.find((item) => item.id === medicineId);
  const followUpEnabled = Boolean(
    appointment && services.find((service) => service.id === appointment.serviceId)?.followUpEligible,
  );
  const isAnimalBiteVisit = careArea === "Animal Bite Center";
  const selectedRabiesVaccine = availableRabiesVaccines.find(
    (item) => item.id === animalBitePlan.vaccineId,
  );

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
    if (
      isAnimalBiteVisit &&
      animalBitePlan.vaccinePlan === "PEP vaccination plan" &&
      (!selectedRabiesVaccine || !animalBitePlan.dose1Date)
    ) {
      setAnimalBiteError(
        "Select the in-stock rabies vaccine used and record the first-dose administration date before saving a PEP plan.",
      );
      return;
    }
    const doseDates = [
      animalBitePlan.dose1Date,
      animalBitePlan.dose2Date,
      animalBitePlan.dose3Date,
    ].filter(Boolean);
    if (isAnimalBiteVisit && doseDates.some((date, index) => index > 0 && date < doseDates[index - 1])) {
      setAnimalBiteError("Enter vaccine dose dates in chronological order.");
      return;
    }
    const animalBiteTreatment: AnimalBiteTreatment | undefined = isAnimalBiteVisit
      ? {
          exposureCategory: animalBitePlan.exposureCategory,
          vaccinePlan: animalBitePlan.vaccinePlan,
          rabiesImmunoglobulin: animalBitePlan.rabiesImmunoglobulin,
          tetanusProtection: animalBitePlan.tetanusProtection,
          protocolNote: animalBitePlan.protocolNote.trim(),
          doses: [
            animalBitePlan.dose1Date
              ? {
                  doseNumber: 1,
                  date: animalBitePlan.dose1Date,
                  status: "Administered" as const,
                  vaccineId: selectedRabiesVaccine?.id,
                  vaccineName: selectedRabiesVaccine
                    ? `${selectedRabiesVaccine.name} ${selectedRabiesVaccine.strength}`
                    : undefined,
                  batch: selectedRabiesVaccine?.batch,
                  administrationSite: animalBitePlan.administrationSite.trim() || undefined,
                }
              : null,
            animalBitePlan.dose2Date
              ? {
                  doseNumber: 2,
                  date: animalBitePlan.dose2Date,
                  status: "Scheduled" as const,
                  vaccineId: selectedRabiesVaccine?.id,
                  vaccineName: selectedRabiesVaccine
                    ? `${selectedRabiesVaccine.name} ${selectedRabiesVaccine.strength}`
                    : undefined,
                  batch: selectedRabiesVaccine?.batch,
                }
              : null,
            animalBitePlan.dose3Date
              ? {
                  doseNumber: 3,
                  date: animalBitePlan.dose3Date,
                  status: "Scheduled" as const,
                  vaccineId: selectedRabiesVaccine?.id,
                  vaccineName: selectedRabiesVaccine
                    ? `${selectedRabiesVaccine.name} ${selectedRabiesVaccine.strength}`
                    : undefined,
                  batch: selectedRabiesVaccine?.batch,
                }
              : null,
          ].filter(Boolean) as AnimalBiteTreatment["doses"],
        }
      : undefined;
    const vaccineFollowUps = animalBiteTreatment?.doses
      .filter((dose) => dose.status === "Scheduled")
      .map((dose) => ({
        date: dose.date,
        type: `Rabies vaccine dose ${dose.doseNumber}`,
        reason: "Animal Bite PEP follow-up",
      }));
    completeConsultation(
      appointment.id,
      diagnosis.trim(),
      notes.trim(),
      prescription,
      currentDoctor.id,
      isAnimalBiteVisit
        ? vaccineFollowUps
        : followUpDate
        ? { date: followUpDate, type: followUpType, reason: followUpReason }
        : undefined,
      animalBiteTreatment,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end border-b border-border/70 pb-4">
        {currentDoctor?.role === "Doctor" ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline" title="Set patient-facing availability" aria-label="Set patient-facing availability">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Patient-facing availability</DialogTitle>
                <DialogDescription>Choose the status patients see before booking.</DialogDescription>
              </DialogHeader>
              <select
                aria-label="Your availability"
                value={currentDoctor.doctorStatus || "Available"}
                onChange={(event) =>
                  updateStaffUser(currentDoctor.id, {
                    doctorStatus: event.target.value as DoctorAvailability,
                  })
                }
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium"
              >
                {["Available", "With patient", "On break", "Off duty", "On leave"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
      <div className="grid min-h-0 gap-5 lg:grid-cols-[300px,minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-soft lg:max-h-[calc(100dvh-13rem)]">
          <div className="flex items-center gap-2 mb-4">
            <UserRound className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold">Ready for consultation</h3>
          </div>
          <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
          {ready.map((item) => (
            <button
              key={item.id}
              onClick={() => setId(item.id)}
              className={cn(
                "w-full text-left rounded-xl border p-3",
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
          </div>
        </aside>
        <div className="space-y-5 lg:max-h-[calc(100dvh-13rem)] lg:overflow-y-auto lg:pr-1">
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
                {triageRecord?.animalExposure ? (
                  <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
                    <p className="font-semibold">Animal Bite assessment</p>
                    <p className="mt-1 text-xs text-muted-foreground">{triageRecord.animalExposure.animal} · {triageRecord.animalExposure.exposure} · {triageRecord.animalExposure.woundSite || "wound site not recorded"} · {triageRecord.animalExposure.animalStatus}</p>
                    <p className="mt-1 text-xs text-muted-foreground">First aid: {triageRecord.animalExposure.firstAid || "not recorded"}</p>
                  </div>
                ) : null}
              </section>
              {isAnimalBiteVisit ? (
                <AnimalBiteVaccinationPlan
                  plan={animalBitePlan}
                  setPlan={setAnimalBitePlan}
                  vaccines={availableRabiesVaccines}
                  selectedVaccine={selectedRabiesVaccine}
                  error={animalBiteError}
                />
              ) : null}
              {!isAnimalBiteVisit ? <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
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
              </section> : null}
              <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardPlus className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-bold">
                    Consultation record
                  </h3>
                </div>
                {!isAnimalBiteVisit && availableConsultationTemplates.length ? (
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
                ) : !isAnimalBiteVisit ? (
                  <p className="mb-4 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                    No active Admin consultation template is available. You can
                    still document this consultation manually.
                  </p>
                ) : (
                  <div className="mb-4 rounded-xl border border-primary/15 bg-primary-soft/40 px-4 py-3 text-xs text-muted-foreground">
                    The Animal Bite vaccination record above is used instead of a general consultation template. Add any case-specific assessment details below.
                  </div>
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
                {!isAnimalBiteVisit && followUpEnabled ? <div className="mt-4 rounded-xl border border-primary/15 bg-primary-soft/40 p-3">
                  <p className="text-sm font-semibold">Doctor follow-up plan</p>
                  <p className="mt-1 text-xs text-muted-foreground">Creates a linked follow-up appointment and patient alert. Animal Bite visits stay in the Animal Bite Center queue.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div><Label>Follow-up date</Label><Input className="mt-1" type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></div>
                    <div><Label>Session type</Label><Input className="mt-1" value={followUpType} onChange={(event) => setFollowUpType(event.target.value)} placeholder="Vaccine dose / wound review" /></div>
                  </div>
                  <Label className="mt-3 block">Clinical reason</Label>
                  <Input className="mt-1" value={followUpReason} onChange={(event) => setFollowUpReason(event.target.value)} placeholder="Doctor's follow-up instruction" />
                </div> : null}
                <Button
                  disabled={!diagnosis.trim() || currentDoctor?.role !== "Doctor"}
                  onClick={complete}
                  className="mt-4"
                >
                  {isAnimalBiteVisit
                    ? "Complete assessment & save vaccination plan"
                    : "Complete consultation & send prescription"}
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
                    {(record.followUpPlans || (record.followUpPlan ? [record.followUpPlan] : [])).map((plan) => (
                      <p key={`${plan.date}-${plan.type}`} className="mt-2 rounded-lg bg-primary-soft px-3 py-2 text-xs text-primary">Follow-up: {plan.type} on {plan.date} · {plan.reason || "Doctor review"}</p>
                    ))}
                    {record.animalBiteTreatment ? (
                      <div className="mt-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs">
                        <p className="font-semibold">Animal Bite vaccination record</p>
                        <p className="mt-1 text-muted-foreground">{record.animalBiteTreatment.exposureCategory} · {record.animalBiteTreatment.vaccinePlan} · RIG: {record.animalBiteTreatment.rabiesImmunoglobulin} · Tetanus: {record.animalBiteTreatment.tetanusProtection}</p>
                        {record.animalBiteTreatment.doses.map((dose) => (
                          <p key={`${dose.doseNumber}-${dose.date}`} className="mt-1 text-muted-foreground">Dose {dose.doseNumber}: {dose.status.toLowerCase()} on {dose.date}{dose.vaccineName ? ` · ${dose.vaccineName}` : ""}{dose.administrationSite ? ` · ${dose.administrationSite}` : ""}</p>
                        ))}
                      </div>
                    ) : null}
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

function AnimalBiteVaccinationPlan({
  plan,
  setPlan,
  vaccines,
  selectedVaccine,
  error,
}: {
  plan: {
    exposureCategory: AnimalBiteTreatment["exposureCategory"];
    vaccinePlan: AnimalBiteTreatment["vaccinePlan"];
    vaccineId: string;
    dose1Date: string;
    dose2Date: string;
    dose3Date: string;
    administrationSite: string;
    rabiesImmunoglobulin: AnimalBiteTreatment["rabiesImmunoglobulin"];
    tetanusProtection: AnimalBiteTreatment["tetanusProtection"];
    protocolNote: string;
  };
  setPlan: React.Dispatch<React.SetStateAction<typeof plan>>;
  vaccines: ReturnType<typeof usePrototypeStore>["medicines"];
  selectedVaccine?: ReturnType<typeof usePrototypeStore>["medicines"][number];
  error: string;
}) {
  const update = <Key extends keyof typeof plan>(key: Key, value: (typeof plan)[Key]) =>
    setPlan((current) => ({ ...current, [key]: value }));

  return (
    <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-warning/10 p-2 text-warning"><Syringe className="h-5 w-5" /></div>
        <div>
          <h3 className="font-display font-bold">Animal Bite vaccination plan</h3>
          <p className="mt-1 text-xs text-muted-foreground">Record the clinician's PEP decision, first-dose administration, and planned return doses. This form does not impose a fixed clinical schedule.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div>
          <Label>Exposure classification</Label>
          <select value={plan.exposureCategory} onChange={(event) => update("exposureCategory", event.target.value as AnimalBiteTreatment["exposureCategory"])} className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
            <option>For clinician classification</option><option>Category I</option><option>Category II</option><option>Category III</option>
          </select>
        </div>
        <div>
          <Label>Care decision</Label>
          <select value={plan.vaccinePlan} onChange={(event) => update("vaccinePlan", event.target.value as AnimalBiteTreatment["vaccinePlan"])} className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
            <option>PEP vaccination plan</option><option>No rabies vaccine ordered</option><option>Refer / escalate</option>
          </select>
        </div>
        <div>
          <Label>Rabies vaccine used</Label>
          <select value={plan.vaccineId} onChange={(event) => update("vaccineId", event.target.value)} disabled={plan.vaccinePlan !== "PEP vaccination plan"} className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
            <option value="">Select in-stock vaccine</option>
            {vaccines.map((vaccine) => <option key={vaccine.id} value={vaccine.id}>{vaccine.name} {vaccine.strength} · {vaccine.stock} in stock</option>)}
          </select>
        </div>
      </div>

      {plan.vaccinePlan === "PEP vaccination plan" && !vaccines.length ? (
        <p className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">No in-stock rabies vaccine is recorded for the Animal Bite Center. Update inventory or choose a referral decision.</p>
      ) : null}
      {selectedVaccine ? <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">Selected stock: <span className="font-medium text-foreground">{selectedVaccine.stock} {selectedVaccine.form.toLowerCase()}(s)</span> · Batch {selectedVaccine.batch} · expires {selectedVaccine.expiry}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div><Label>Rabies immunoglobulin</Label><select value={plan.rabiesImmunoglobulin} onChange={(event) => update("rabiesImmunoglobulin", event.target.value as AnimalBiteTreatment["rabiesImmunoglobulin"])} className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option>Assess / not recorded</option><option>Indicated</option><option>Not indicated</option><option>Given / referred</option></select></div>
        <div><Label>Tetanus protection</Label><select value={plan.tetanusProtection} onChange={(event) => update("tetanusProtection", event.target.value as AnimalBiteTreatment["tetanusProtection"])} className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option>Assess / not recorded</option><option>Indicated</option><option>Not indicated</option><option>Given / referred</option></select></div>
        <div><Label>Administration site</Label><Input className="mt-1" value={plan.administrationSite} onChange={(event) => update("administrationSite", event.target.value)} placeholder="e.g. Left deltoid" /></div>
      </div>

      <div className="mt-5 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Vaccine doses and return visits</p><Badge variant="secondary" className="bg-primary-soft text-primary">Clinic protocol dates</Badge></div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div><Label>Dose 1 — administered</Label><Input className="mt-1" type="date" value={plan.dose1Date} disabled={plan.vaccinePlan !== "PEP vaccination plan"} onChange={(event) => update("dose1Date", event.target.value)} /></div>
          <div><Label>Dose 2 — return visit</Label><Input className="mt-1" type="date" value={plan.dose2Date} disabled={plan.vaccinePlan !== "PEP vaccination plan"} onChange={(event) => update("dose2Date", event.target.value)} /></div>
          <div><Label>Dose 3 — return visit</Label><Input className="mt-1" type="date" value={plan.dose3Date} disabled={plan.vaccinePlan !== "PEP vaccination plan"} onChange={(event) => update("dose3Date", event.target.value)} /></div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Scheduled dose dates automatically create Animal Bite follow-up appointments and patient alerts when the consultation is completed.</p>
      </div>

      <Label className="mt-4 block">Protocol / clinical note</Label>
      <Textarea className="mt-1 min-h-20" value={plan.protocolNote} onChange={(event) => update("protocolNote", event.target.value)} placeholder="Document protocol decision, wound management, referral, or return instructions." />
      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
    </section>
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
