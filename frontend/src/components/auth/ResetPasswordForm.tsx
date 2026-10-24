import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button, Label, TextInput, Alert } from "flowbite-react";
import { EyeCloseIcon, EyeIcon, ChevronLeftIcon } from "../../icons";
import { authService } from "../../services/authService";
import { HiCheckCircle } from "react-icons/hi2";
import FieldError from "../../common/FieldError";
import PasswordRequirements from "../../common/PasswordRequirements";
import { isPasswordValid } from "../../lib/passwordRules";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  if (!token) return <RequestResetForm />;
  return (
    <SetNewPasswordForm
      token={token}
      onDone={() => navigate("/signin", { replace: true })}
    />
  );
}

function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <AuthShell
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10">
            <HiCheckCircle className="size-8" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If an account exists for <strong>{email}</strong>, a reset link has been sent.
          </p>
        </div>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div>
            <Label htmlFor="email">
              Email <span className="text-error-500">*</span>
            </Label>
            <TextInput
              id="email"
              type="email"
              color={emailError ? "failure" : "gray"}
              aria-invalid={!!emailError}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(undefined);
              }}
              placeholder="you@example.com"
            />
            <FieldError message={emailError} />
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="mt-5 text-center text-sm font-normal text-gray-700 dark:text-gray-400">
        Remembered it?{" "}
        <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
          Sign In
        </Link>
      </p>
    </AuthShell>
  );
}

type PasswordField = "newPassword" | "confirmNewPassword";
type PasswordErrors = Partial<Record<PasswordField, string>>;

function SetNewPasswordForm({ token, onDone }: { token: string; onDone: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PasswordErrors>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function clearFieldError(field: PasswordField) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function validate(): PasswordErrors {
    const errors: PasswordErrors = {};

    if (!newPassword) errors.newPassword = "New password is required.";
    else if (!isPasswordValid(newPassword))
      errors.newPassword = "Password does not meet all the requirements.";

    if (!confirmNewPassword) errors.confirmNewPassword = "Please confirm your new password.";
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
      await authService.resetPassword({ token, newPassword, confirmNewPassword });
      setDone(true);
      setTimeout(onDone, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "This link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="" subtitle="">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10">
            <HiCheckCircle className="size-8" />
          </div>
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            Password updated
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting you to sign in...</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password for your account."
    >
      {error && (
        <Alert color="failure" className="mb-5">
          {error}
        </Alert>
      )}
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div>
          <Label htmlFor="newPassword">
            New password <span className="text-error-500">*</span>
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
              placeholder="Enter your new password"
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
            Confirm new password <span className="text-error-500">*</span>
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
            placeholder="Confirm your new password"
          />
          <FieldError message={fieldErrors.confirmNewPassword} />
        </div>
        <Button type="submit" size="sm" className="w-full" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-md pt-10">
       
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
            {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}