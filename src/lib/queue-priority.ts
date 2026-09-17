import type { Appointment, TriagePriority } from "@/data/mockData";

export type QueueOrderableAppointment = Pick<
  Appointment,
  | "id"
  | "queueNumber"
  | "queueStatus"
  | "triagePriority"
  | "queueEnteredAt"
  | "createdAt"
  | "visitType"
>;

const priorityRank: Record<TriagePriority, number> = {
  Emergency: 0,
  Urgent: 1,
  Priority: 2,
  Normal: 3,
};

export function appointmentPriority(appointment: QueueOrderableAppointment): TriagePriority {
  return appointment.triagePriority ?? "Normal";
}

function queueNumberRank(queueNumber: string) {
  const parsed = Number.parseInt(queueNumber.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

/**
 * Returns doctor-ready patients in clinical priority order. Patients with the
 * same triage level retain their physical queue-number order.
 */
export function orderDoctorQueue(appointments: QueueOrderableAppointment[]) {
  const ready = appointments
    .filter(appointment => appointment.queueStatus === "Waiting for Doctor")
    .toSorted((left, right) => {
      const queueDifference = queueNumberRank(left.queueNumber) - queueNumberRank(right.queueNumber);
      if (queueDifference !== 0) return queueDifference;

      const enteredDifference = new Date(left.queueEnteredAt ?? left.createdAt).getTime() - new Date(right.queueEnteredAt ?? right.createdAt).getTime();
      if (Number.isFinite(enteredDifference) && enteredDifference !== 0) return enteredDifference;

      return left.id.localeCompare(right.id);
    });
  const ordered: QueueOrderableAppointment[] = [];
  for (const priority of Object.keys(priorityRank) as TriagePriority[]) {
    let remaining = ready.filter((appointment) => appointmentPriority(appointment) === priority);
    if (!remaining.length) continue;
    let nextVisitType = remaining[0].visitType || "Scheduled";
    while (remaining.length) {
      const preferred = remaining.find((appointment) =>
        (appointment.visitType || "Scheduled") === nextVisitType,
      );
      const selected = preferred || remaining[0];
      ordered.push(selected);
      remaining = remaining.filter((appointment) => appointment.id !== selected.id);
      nextVisitType = selected.visitType === "Walk-in" ? "Scheduled" : "Walk-in";
    }
  }
  return ordered;
}
