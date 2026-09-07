import type { Appointment, TriagePriority } from "@/data/mockData";

const priorityRank: Record<TriagePriority, number> = {
  Emergency: 0,
  Urgent: 1,
  Priority: 2,
  Normal: 3,
};

export function appointmentPriority(appointment: Appointment): TriagePriority {
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
export function orderDoctorQueue(appointments: Appointment[]) {
  return appointments
    .filter(appointment => appointment.queueStatus === "Waiting for Doctor")
    .toSorted((left, right) => {
      const priorityDifference = priorityRank[appointmentPriority(left)] - priorityRank[appointmentPriority(right)];
      if (priorityDifference !== 0) return priorityDifference;

      const queueDifference = queueNumberRank(left.queueNumber) - queueNumberRank(right.queueNumber);
      if (queueDifference !== 0) return queueDifference;

      const enteredDifference = new Date(left.queueEnteredAt ?? left.createdAt).getTime() - new Date(right.queueEnteredAt ?? right.createdAt).getTime();
      if (Number.isFinite(enteredDifference) && enteredDifference !== 0) return enteredDifference;

      return left.id.localeCompare(right.id);
    });
}
