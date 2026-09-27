import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RegistrationForm } from "./StaffApp";
import { registerOnsitePatient } from "@/lib/api";

vi.mock("./LocationPickerMap", () => ({ LocationPickerMap: ({ onChange }: { onChange: (pin: { latitude: number; longitude: number }) => void }) => <button onClick={() => onChange({ latitude: 16.56, longitude: 121.70 })}>Place test pin</button> }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), registerOnsitePatient: vi.fn() }));
vi.mock("@/lib/location-address", () => ({ reverseGeocodePhilippineAddress: vi.fn().mockResolvedValue({}) }));
vi.mock("@/data/isabela-locations", () => ({
  barangaysForMunicipality: () => [],
  fetchPsgcBarangays: vi.fn().mockResolvedValue(["Abulan"]),
  isabelaMunicipalities: ["Jones"],
}));
afterEach(cleanup);

it("validates a step and retains identity when navigating back", () => {
  render(<RegistrationForm onRegistered={vi.fn()} onContinueToWalkIn={vi.fn()} />);
  expect(screen.getByRole("heading", { name: "Onsite registration · Identity" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Complete the required fields");
  fireEvent.change(screen.getByLabelText(/Last \/ family name/), { target: { value: "Example" } });
  fireEvent.change(screen.getByLabelText(/First \/ given name/), { target: { value: "Patient" } });
  fireEvent.change(screen.getByLabelText(/Date of birth/), { target: { value: "1990-01-01" } });
  fireEvent.change(screen.getByLabelText(/Sex \/ administrative gender/), { target: { value: "Female" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("heading", { name: "Onsite registration · Contact" })).toBeVisible();
  expect(screen.getByLabelText(/Last \/ family name/)).not.toBeVisible();
  expect(screen.queryByRole("button", { name: "Register patient" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("alert")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByLabelText(/Last \/ family name/)).toHaveValue("Example");
});

it("requires a verified pin and consent, then saves only from the review step", async () => {
  const onRegistered = vi.fn();
  vi.mocked(registerOnsitePatient).mockResolvedValue({ data: { id: 123, patient_number: "TEST-123", default_password: "test-only" } } as Awaited<ReturnType<typeof registerOnsitePatient>>);
  render(<RegistrationForm onRegistered={onRegistered} onContinueToWalkIn={vi.fn()} />);
  const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
  const next = () => fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fill(/Last \/ family name/, "Example"); fill(/First \/ given name/, "Patient");
  fill(/Date of birth/, "1990-01-01"); fill(/Sex \/ administrative gender/, "Female"); next();
  fill(/^Mobile number/, "09123456789"); next();
  fill(/House no./, "Sample street"); fill(/Postal code/, "3313");
  fill(/Municipality \/ city/, "Jones");
  await screen.findByRole("option", { name: "Abulan" });
  fill(/^Barangay/, "Abulan"); next(); next(); next();
  next();
  expect(screen.getByRole("alert")).toHaveTextContent("Place the residence pin");
  fireEvent.click(screen.getByRole("button", { name: "Place test pin" }));
  await screen.findByText(/area details were not available/);
  fireEvent.click(screen.getByRole("checkbox", { name: /Location verified/ })); next();
  expect(screen.getByRole("heading", { name: "Onsite registration · Review & consent" })).toBeVisible();
  expect(registerOnsitePatient).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Register patient" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox", { name: /consent to treatment/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Privacy notice/ }));
  fireEvent.click(screen.getByRole("button", { name: "Register patient" }));
  await screen.findByRole("status");
  expect(onRegistered).toHaveBeenCalledWith("123");
  expect(registerOnsitePatient).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Register patient" })).toBeDisabled();
});
