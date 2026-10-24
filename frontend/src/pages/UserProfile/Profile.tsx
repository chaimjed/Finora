import { useRef, useState } from "react";
import { Avatar, Button, Label, TextInput, Alert, Card, Select } from "flowbite-react";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import PageMeta from "../../common/PageMeta";
import { useAuthStore } from "../../store/authStore";
import { usersService } from "../../services/usersService";
import { authService } from "../../services/authService";
import BirthDatePicker from "../../common/BirthDatePicker";
import { COMMON_CURRENCIES } from "../../lib/currencies";
import { getAvailableTimezones } from "../../lib/timezones";
import FieldError from "../../common/FieldError";
import PasswordRequirements from "../../common/PasswordRequirements";
import { isPasswordValid } from "../../lib/passwordRules";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const CARD_CLASS =
  "rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3";
const TITLE_CLASS =
  "mb-4 text-lg font-semibold text-gray-800 dark:text-white/90";

export default function ProfilePage() {
  return (
    <>
      <PageMeta
        title="Profile | Money Manager"
        description="Manage your account"
      />
      <div className="flex flex-col gap-6">
        <AvatarSection />
        <ProfileInfoSection />
        <PasswordSection />
      </div>
    </>
  );
}

function AvatarSection() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PNG, JPEG or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError("Image must be smaller than 2 MB.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await usersService.uploadAvatar(file);
      setUser(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Upload failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setLoading(true);
    try {
      const { data } = await usersService.removeAvatar();
      setUser(data);
    } catch {
      setError("Could not remove avatar. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={CARD_CLASS}>
      {error && (
        <Alert color="failure" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Avatar
          img={user?.profileAvatar ?? undefined}
          placeholderInitials={initials}
          size="xl"
          rounded
        />
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {user ? `${user.firstName} ${user.lastName}` : ""}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user?.email}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button
              size="xs"
              color="light"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Change Photo"}
            </Button>
            {user?.profileAvatar && (
              <Button
                size="xs"
                color="light"
                onClick={handleRemove}
                disabled={loading}
              >
                Remove Photo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileInfoSection() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? "");
  const [timezone, setTimezone] = useState(user?.timezone ?? "UTC");
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency ?? "TND");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const timezones = getAvailableTimezones();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const { data } = await usersService.updateMe({
        firstName, lastName, dateOfBirth: dateOfBirth || undefined, timezone, preferredCurrency,
      });
      setUser(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Profile information</h2>
      {error && <Alert color="failure" className="mb-4">{error}</Alert>}
      {success && <Alert color="success" className="mb-4">Profile updated.</Alert>}
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <TextInput id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required minLength={2} />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <TextInput id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required minLength={2} />
          </div>
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <BirthDatePicker value={dateOfBirth} onChange={(v) => setDateOfBirth(v ?? "")} id="dateOfBirth" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {timezones.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="currency">Preferred currency</Label>
            <Select id="currency" value={preferredCurrency} onChange={(e) => setPreferredCurrency(e.target.value)}>
              {COMMON_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Used as the default currency for new accounts.
            </p>
          </div>
        </div>

        <div>
          <Label>Email</Label>
          <TextInput value={user?.email ?? ""} disabled />
        </div>

        <div>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
type PasswordField = "currentPassword" | "newPassword" | "confirmNewPassword";
type PasswordErrors = Partial<Record<PasswordField, string>>;

function PasswordSection() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PasswordErrors>({});
  const [success, setSuccess] = useState(false);

  const hasPassword = user?.hasPassword ?? true;

  function clearFieldError(field: PasswordField) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function validate(): PasswordErrors {
    const errors: PasswordErrors = {};

    if (hasPassword && !currentPassword) errors.currentPassword = "Current password is required.";

    if (!newPassword) errors.newPassword = "New password is required.";
    else if (!isPasswordValid(newPassword)) errors.newPassword = "Password does not meet all the requirements.";
    else if (hasPassword && newPassword === currentPassword)
      errors.newPassword = "New password must be different from your current password.";

    if (!confirmNewPassword) errors.confirmNewPassword = "Please confirm your new password.";
    else if (newPassword !== confirmNewPassword) errors.confirmNewPassword = "Passwords do not match.";

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      if (hasPassword) {
        await authService.changePassword({ currentPassword, newPassword, confirmNewPassword });
      } else {
        await authService.setPassword(newPassword);
        if (user) setUser({ ...user, hasPassword: true });
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccess(true);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Could not update password.";
      if (err?.response?.status === 401) setFieldErrors({ currentPassword: message });
      else setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={CARD_CLASS} onSubmit={handleSubmit} noValidate>
      <h3 className={hasPassword ? TITLE_CLASS : "mb-1 text-lg font-semibold text-gray-800 dark:text-white/90"}>
        {hasPassword ? "Change Password" : "Set a Password"}
      </h3>
      {!hasPassword && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Your account currently uses Google sign-in only. Set a password to also sign in with email.
        </p>
      )}
      {error && <Alert color="failure" className="mb-4">{error}</Alert>}
      {success && (
        <Alert color="success" className="mb-4">
          Password updated. Other devices have been signed out.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {hasPassword && (
          <div className="sm:col-span-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <TextInput
              id="currentPassword"
              type={showPassword ? "text" : "password"}
              color={fieldErrors.currentPassword ? "failure" : "gray"}
              aria-invalid={!!fieldErrors.currentPassword}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                clearFieldError("currentPassword");
              }}
            />
            <FieldError message={fieldErrors.currentPassword} />
          </div>
        )}

        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <TextInput
              id="newPassword"
              type={showPassword ? "text" : "password"}
              color={fieldErrors.newPassword ? "failure" : "gray"}
              aria-invalid={!!fieldErrors.newPassword}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                clearFieldError("newPassword");
              }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-e-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
            >
              {showPassword ? (
                <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
              ) : (
                <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
              )}
            </span>
          </div>
          <FieldError message={fieldErrors.newPassword} />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <TextInput
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            color={fieldErrors.confirmNewPassword ? "failure" : "gray"}
            aria-invalid={!!fieldErrors.confirmNewPassword}
            value={confirmNewPassword}
            onChange={(e) => {
              setConfirmNewPassword(e.target.value);
              clearFieldError("confirmNewPassword");
            }}
          />
          <FieldError message={fieldErrors.confirmNewPassword} />
        </div>

        {(newPassword || fieldErrors.newPassword) && (
          <div className="sm:col-span-2">
            <PasswordRequirements password={newPassword} className="mt-0" />
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : hasPassword ? "Update Password" : "Set Password"}
        </Button>
      </div>
    </form>
  );
}