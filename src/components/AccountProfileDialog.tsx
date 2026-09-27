import { useEffect, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AccessField, roleLabels } from "@/components/AccessGateway";
import {
  getAccountProfile,
  updateAccountProfile,
  updateAccountPassword,
  type AccountProfile,
} from "@/lib/api";

export function AccountProfileDialog({
  open,
  onOpenChange,
  onSaved,
  onSignOut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (user: AccountProfile) => void;
  onSignOut: (message?: string) => void;
}) {
  const [user, setUser] = useState<AccountProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setUser(null);
    setError("");
    setNotice("");
    setCurrentPassword("");
    setPassword("");
    setConfirmation("");
    void getAccountProfile()
      .then(({ user: account }) => {
        if (active) {
          setUser(account);
          setName(account.name);
          setEmail(account.email);
        }
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, [open]);
  const save = async (changePassword = false) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (changePassword) {
        if (password.length < 12 || password !== confirmation)
          throw new Error("Use at least 12 characters and matching passwords.");
        const result = await updateAccountPassword({
          current_password: currentPassword,
          password,
          password_confirmation: confirmation,
        });
        onOpenChange(false);
        onSignOut(result.message);
      } else {
        const result = await updateAccountProfile({
          name: name.trim(),
          email: email.trim(),
          current_password: currentPassword,
        });
        setUser(result.user);
        setEmail(result.user.email);
        setCurrentPassword("");
        setNotice(result.message);
        toast.success(result.message);
        onSaved(result.user);
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>My profile</DialogTitle>
          <DialogDescription className="text-slate-700">
            Manage your account details and security.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950"
          >
            {notice}
          </p>
        )}
        {user ? (
          <>
            <div className="flex items-center gap-3 rounded-xl bg-sky-50 p-4">
              <ShieldCheck className="h-7 w-7 shrink-0 text-sky-700" />
              <div className="min-w-0">
                <p className="font-semibold">
                  {roleLabels[user.role] || user.role}
                </p>
                <p className="break-all text-sm text-slate-700">
                  Username: {user.username}
                </p>
              </div>
            </div>
            {user.pending_email && (
              <p
                role="status"
                className="break-words rounded-xl bg-amber-50 p-3 text-sm text-amber-950"
              >
                Verification pending: {user.pending_email}. Your current email
                remains active. To resend, enter the pending address below and
                save again.
              </p>
            )}
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <AccessField label="Full name" value={name} onChange={setName} />
              <AccessField
                label="Recovery email"
                type="email"
                value={email}
                onChange={setEmail}
              />
              <p className="text-sm text-slate-700">
                Use your username and password to sign in. Forgot password sends
                a link to your verified recovery email.
              </p>
              <AccessField
                label="Current password (required for email or password changes)"
                required={email.trim().toLowerCase() !== user.email}
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
              <Button disabled={busy} className="w-full" type="submit">
                {busy ? "Saving…" : "Save profile"}
              </Button>
            </form>
            <form
              className="space-y-4 border-t pt-4"
              onSubmit={(event) => {
                event.preventDefault();
                void save(true);
              }}
            >
              <h3 className="font-semibold">Change password</h3>
              <AccessField
                label="New password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
              />
              <p className="text-sm text-slate-700">
                Use at least 12 characters. Changing your password signs you out
                of all devices.
              </p>
              <AccessField
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={setConfirmation}
              />
              <Button
                disabled={busy}
                variant="outline"
                className="w-full"
                type="submit"
              >
                Change password
              </Button>
            </form>
          </>
        ) : !error ? (
          <p role="status">Loading your profile…</p>
        ) : null}
        <Button
          disabled={busy}
          variant="ghost"
          className="w-full text-red-700"
          onClick={() => onSignOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </DialogContent>
    </Dialog>
  );
}
