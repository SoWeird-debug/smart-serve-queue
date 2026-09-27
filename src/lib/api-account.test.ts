import { afterEach, expect, it, vi } from "vitest";
import { getStoredApiSession, sendPasswordReset, setApiAccessToken, unifiedLogin } from "./api";
afterEach(() => {
  vi.unstubAllGlobals();
  setApiAccessToken(null);
});

it("stores remembered sessions persistently and regular sessions per browser session", () => {
  setApiAccessToken("remembered-token", true, "doctor");
  expect(getStoredApiSession()).toEqual({ token: "remembered-token", role: "doctor" });
  expect(window.localStorage.length).toBe(1);
  expect(window.sessionStorage.length).toBe(0);

  setApiAccessToken("session-token", false, "patient");
  expect(getStoredApiSession()).toEqual({ token: "session-token", role: "patient" });
  expect(window.localStorage.length).toBe(0);
  expect(window.sessionStorage.length).toBe(1);

  setApiAccessToken(null);
  expect(getStoredApiSession()).toBeNull();
});
it("uses the backend identifier contract for sign-in and password recovery", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: "test", role: "doctor" }),
    });
  vi.stubGlobal("fetch", fetchMock);
  await unifiedLogin("doctor_test", "PersonalPassword123!");
  await sendPasswordReset("doctor_test");
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
    identifier: "doctor_test",
    password: "PersonalPassword123!",
  });
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
    identifier: "doctor_test",
  });
});
