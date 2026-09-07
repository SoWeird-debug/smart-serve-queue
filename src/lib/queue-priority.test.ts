import { describe, expect, it } from "vitest";
import type { Appointment } from "@/data/mockData";
import { orderDoctorQueue } from "@/lib/queue-priority";

const appointment = (id: string, queueNumber: string, triagePriority: Appointment["triagePriority"]): Appointment => ({
  id,
  patientId: `patient-${id}`,
  serviceId: "service-1",
  date: "2026-09-04",
  timeSlot: "Clinic hours",
  queueNumber,
  attendanceStatus: "Present",
  queueStatus: "Waiting for Doctor",
  createdAt: "2026-09-04T08:00:00.000Z",
  triagePriority,
});

describe("orderDoctorQueue", () => {
  it("orders emergency, urgent, priority, then normal while preserving queue-number order within a level", () => {
    const ordered = orderDoctorQueue([
      appointment("normal-two", "002", "Normal"),
      appointment("priority-one", "004", "Priority"),
      appointment("urgent", "010", "Urgent"),
      appointment("emergency", "100", "Emergency"),
      appointment("normal-one", "001", "Normal"),
      appointment("priority-two", "003", "Priority"),
    ]);

    expect(ordered.map(item => item.id)).toEqual([
      "emergency",
      "urgent",
      "priority-two",
      "priority-one",
      "normal-one",
      "normal-two",
    ]);
  });
});
