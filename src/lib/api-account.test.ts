import { afterEach, expect, it, vi } from "vitest";
import { sendPasswordReset, setApiAccessToken, unifiedLogin } from "./api";
afterEach(() => {
  vi.unstubAllGlobals();
  setApiAccessToken(null);
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
