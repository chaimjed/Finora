import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button, Label, TextInput, Alert } from "flowbite-react";
import { HiOutlineShieldCheck } from "react-icons/hi2";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import FieldError from "../../common/FieldError";
import PasswordRequirements from "../../common/PasswordRequirements";
import { isPasswordValid } from "../../lib/passwordRules";

type PasswordField = "newPassword" | "confirmNewPassword";
type PasswordErrors = Partial<Record<PasswordField, string>>;

export default function SetPasswordForm() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PasswordErrors>({});
  const [loading, setLoading] = useState(false);

  function clearFieldError(field: PasswordField) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function validate(): PasswordErrors {
    const errors: PasswordErrors = {};

    if (!newPassword) errors.newPassword = "Password is required.";
    else if (!isPasswordValid(newPassword))
      errors.newPassword = "Password does not meet all the requirements.";

    if (!confirmNewPassword) errors.confirmNewPassword = "Please confirm your password.";
    else if (newPassword !== confirmNewPassword)
      errors.confirmNewPassword = "Passwords do not match.";

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await authService.setPassword(newPassword);
      if (user) setUser({ ...user, hasPassword: true });
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not set password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">
            <HiOutlineShieldCheck className="size-6" />
          </div>
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">
            Secure your account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You signed in with Google. Set a password so you can also sign in with your email.
          </p>
        </div>

        {error && (
          <Alert color="failure" className="mb-5">
            {error}
          </Alert>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div>
            <Label htmlFor="newPassword">
              Password <span className="text-error-500">*</span>
            </Label>
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
                placeholder="Enter your password"
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
            {(newPassword || fieldErrors.newPassword) && (
              <PasswordRequirements password={newPassword} />
            )}
          </div>
          <div>
            <Label htmlFor="confirmNewPassword">
              Confirm password <span className="text-error-500">*</span>
            </Label>
            <TextInput
              id="confirmNewPassword"
              type={showPassword ? "text" : "password"}
              color={fieldErrors.confirmNewPassword ? "failure" : "gray"}
              aria-invalid={!!fieldErrors.confirmNewPassword}
              value={confirmNewPassword}
              onChange={(e) => {
                setConfirmNewPassword(e.target.value);
                clearFieldError("confirmNewPassword");
              }}
              placeholder="Confirm your password"
            />
            <FieldError message={fieldErrors.confirmNewPassword} />
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Set password"}
          </Button>
        </form>

        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}