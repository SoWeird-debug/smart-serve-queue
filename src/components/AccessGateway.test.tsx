import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessGateway } from "./AccessGateway";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  staffSetupStatus: vi.fn().mockResolvedValue({ setup_required: false }),
  unifiedLogin: vi.fn(),
  staffCurrent: vi.fn(),
  patientCurrent: vi.fn(),
  setApiAccessToken: vi.fn(),
  sendPasswordReset: vi.fn(),
  sendRegistrationVerification: vi.fn(),
  inspectAccountEmail: vi.fn(),
  confirmAccountEmail: vi.fn(),
  resendActivation: vi.fn(),
  setupFirstAdministrator: vi.fn(),
  resetPasswordByEmail: vi.fn(),
  claimOnsiteAccount: vi.fn(),
  reviewOnsiteAccount: vi.fn(),
}));
const renderGateway = () => {
  const onStaffAuthenticated = vi.fn();
  const onPatientRegistration = vi.fn();
  render(
    <AccessGateway
      onStaffAuthenticated={onStaffAuthenticated}
      onPatientAuthenticated={vi.fn()}
      onPatientRegistration={onPatientRegistration}
    />,
  );
  return { onStaffAuthenticated, onPatientRegistration };
};
beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState({}, "", "/");
});
afterEach(cleanup);

describe("unified account access", () => {
  it("uses one email signup entry and displays the generic server response", async () => {
    const message = "Check your email for the next steps. If eligible, a link has been sent.";
    vi.mocked(api.sendRegistrationVerification).mockResolvedValue({ message });
    renderGateway();
    expect(screen.queryByText("Clinic account: resend activation email")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign up / activate account" }));
    expect(screen.getByLabelText("Email address")).toHaveAttribute("type", "email");
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "doctor@gmail.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send verification link" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(message));
    expect(api.sendRegistrationVerification).toHaveBeenCalledWith("doctor@gmail.com");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("allows a clinic username and opens the authenticated role", async () => {
    vi.mocked(api.unifiedLogin).mockResolvedValue({
      token: "test-token",
      role: "doctor",
    });
    vi.mocked(api.staffCurrent).mockResolvedValue({
      user: {
        id: 2,
        name: "Doctor Test",
        username: "doctor_test",
        email: "doctor@example.test",
        role: "doctor",
        assigned_care_areas: ["General Clinic"],
        must_change_password: false,
      },
    });
    const { onStaffAuthenticated } = renderGateway();
    const identifier = screen.getByLabelText(
      "Email",
    );
    expect(identifier).toHaveAttribute("type", "text");
    fireEvent.change(identifier, { target: { value: "doctor_test" } });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "PersonalPassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(onStaffAuthenticated).toHaveBeenCalledWith(
        expect.objectContaining({ role: "Doctor", username: "doctor_test" }),
      ),
    );
    expect(api.unifiedLogin).toHaveBeenCalledWith(
      "doctor_test",
      "PersonalPassword123!",
    );
  });

  it("sends a username to forgot password and shows a delivery message", async () => {
    vi.mocked(api.sendPasswordReset).mockResolvedValue({ message: "Sent" });
    renderGateway();
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(
      screen.getByLabelText("Email address or clinic username"),
      { target: { value: "nurse_test" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Send password-reset link" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "password-reset link",
      ),
    );
    expect(api.sendPasswordReset).toHaveBeenCalledWith("nurse_test");
  });

  it("reviews and activates an emailed clinic account before returning to login", async () => {
    window.history.replaceState({}, "", "/?account_token=test-link");
    vi.mocked(api.inspectAccountEmail).mockResolvedValue({
      name: "Doctor Test",
      username: "doctor_test",
      email: "doctor@example.test",
      role: "doctor",
      purpose: "activation",
    });
    vi.mocked(api.confirmAccountEmail).mockResolvedValue({
      message: "Your email is verified. Please sign in.",
      username: "doctor_test",
    });
    renderGateway();
    await screen.findByText("Doctor Test");
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "PersonalPassword123!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "PersonalPassword123!" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Verify and activate account" }),
    );
    await screen.findByRole("heading", { name: "Welcome back" });
    expect(
      screen.getByLabelText("Email"),
    ).toHaveValue("doctor_test");
    expect(window.location.search).toBe("");
  });

  it("clears the token if loading the signed-in account fails", async () => {
    vi.mocked(api.unifiedLogin).mockResolvedValue({
      token: "test-token",
      role: "doctor",
    });
    vi.mocked(api.staffCurrent).mockRejectedValue(new Error("Session expired"));
    const { onStaffAuthenticated } = renderGateway();
    fireEvent.change(
      screen.getByLabelText("Email"),
      { target: { value: "doctor_test" } },
    );
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "PersonalPassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("alert");
    expect(api.setApiAccessToken).toHaveBeenLastCalledWith(null);
    expect(onStaffAuthenticated).not.toHaveBeenCalled();
  });
});
