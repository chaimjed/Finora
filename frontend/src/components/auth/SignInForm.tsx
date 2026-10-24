import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Label, TextInput, Checkbox, Button, Alert } from "flowbite-react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { authService } from "../../services/authService";
import { usersService } from "../../services/usersService";
import { useAuthStore } from "../../store/authStore";

type FieldName = "email" | "password";
type FieldErrors = Partial<Record<FieldName, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-sm text-error-500" role="alert">
      {message}
    </p>
  );
}

export default function SignInForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const redirectTo =
    (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  function clearFieldError(field: FieldName) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = "Please enter a valid email address.";

    if (!password) errors.password = "Password is required.";

    return errors;
  }

  async function afterAuthSuccess(accessToken: string, refreshToken: string) {
    setTokens(accessToken, refreshToken);
    const { data: me } = await usersService.getMe();
    setUser(me);
    if (!me.hasPassword) {
      navigate("/set-password", { replace: true });
      return;
    }
    navigate(redirectTo, { replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const { data } = await authService.login({ email: email.trim(), password });
      await afterAuthSuccess(data.accessToken, data.refreshToken);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) setError("Please verify your email before signing in.");
      else if (status === 401) setFieldErrors({ password: "Invalid email or password." });
      else setError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) return;
    setError(null);
    setLoading(true);
    try {
      const { data } = await authService.google(credentialResponse.credential);
      await afterAuthSuccess(data.accessToken, data.refreshToken);
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          <div>
            {error && (
              <Alert color="failure" className="mb-5">
                {error}
                {error.includes("verify your email") && (
                  <div className="mt-2">
                    <Link to="/verify-email" className="font-medium underline">
                      Resend verification email
                    </Link>
                  </div>
                )}
              </Alert>
            )}

            <div className="mb-3 flex justify-center [&>div]:w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign-in failed. Please try again.")}
                theme="outline"
                width="384"
              />
            </div>

            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white p-2 text-gray-400 sm:px-5 sm:py-2 dark:bg-gray-900">
                  Or
                </span>
              </div>
            </div>

            {/* noValidate : désactive les bulles natives du navigateur */}
            <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
              <div>
                <Label htmlFor="email">
                  Email <span className="text-error-500">*</span>
                </Label>
                <TextInput
                  id="email"
                  type="email"
                  placeholder="info@gmail.com"
                  color={fieldErrors.email ? "failure" : "gray"}
                  aria-invalid={!!fieldErrors.email}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                />
                <FieldError message={fieldErrors.email} />
              </div>

              <div>
                <Label htmlFor="password">
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <TextInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    color={fieldErrors.password ? "failure" : "gray"}
                    aria-invalid={!!fieldErrors.password}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError("password");
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
                <FieldError message={fieldErrors.password} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="remember"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                  />
                  <Label htmlFor="remember" className="!mb-0 font-normal text-gray-700 dark:text-gray-400">
                    Keep me logged in
                  </Label>
                </div>
                <Link
                  to="/reset-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" size="sm" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-5">
              <p className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}