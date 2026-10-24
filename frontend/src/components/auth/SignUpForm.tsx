import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Label, TextInput, Checkbox, Button, Alert } from "flowbite-react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { authService } from "../../services/authService";
import { usersService } from "../../services/usersService";
import { useAuthStore } from "../../store/authStore";
import BirthDatePicker from "../../common/BirthDatePicker";
import PasswordRequirements from "../../common/PasswordRequirements";
import { isPasswordValid } from "../../lib/passwordRules";
import { MIN_AGE, getAge } from "../../lib/age";

type FieldName =
  | "firstName"
  | "lastName"
  | "dateOfBirth"
  | "email"
  | "password"
  | "terms";
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

export default function SignUpForm() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  function clearFieldError(field: FieldName) {
    setFieldErrors((prev) =>
      prev[field] ? { ...prev, [field]: undefined } : prev,
    );
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!lastName.trim()) errors.lastName = "Last name is required.";
    if (!dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required.";
    } else if (getAge(dateOfBirth) < MIN_AGE) {
      errors.dateOfBirth = `You must be at least ${MIN_AGE} years old to create an account.`;
    }
    if (!email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim()))
      errors.email = "Please enter a valid email address.";
    if (!password) {
      errors.password = "Password is required.";
    } else if (!isPasswordValid(password)) {
      errors.password = "Password does not meet all the requirements.";
    }
    if (!isChecked) errors.terms = "You must accept the Terms and Conditions.";

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
      await authService.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        dateOfBirth,
      });
      setRegistered(true);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        setFieldErrors({ email: "This email is already registered." });
      } else {
        setError(
          err?.response?.data?.message ??
            "Something went wrong. Please try again.",
        );
      }
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
      setTokens(data.accessToken, data.refreshToken);
      const { data: me } = await usersService.getMe();
      setUser(me);
      navigate(me.hasPassword ? "/" : "/set-password", { replace: true });
    } catch {
      setError("Google sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">
          Check your email
        </h1>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
          We sent a verification link to <strong>{email}</strong>. Click it to
          activate your account, then{" "}
          <Link to="/signin" className="text-brand-500 hover:text-brand-600">
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="no-scrollbar flex w-full flex-1 flex-col overflow-y-auto lg:w-1/2">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign up!
            </p>
          </div>
          <div>
            {error && (
              <Alert color="failure" className="mb-5">
                {error}
              </Alert>
            )}

            <div className="mb-3 flex justify-center [&>div]:w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setError("Google sign-up failed. Please try again.")
                }
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
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <Label htmlFor="fname">
                      First Name<span className="text-error-500">*</span>
                    </Label>
                    <TextInput
                      type="text"
                      id="fname"
                      placeholder="Enter your first name"
                      color={fieldErrors.firstName ? "failure" : "gray"}
                      aria-invalid={!!fieldErrors.firstName}
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        clearFieldError("firstName");
                      }}
                    />
                    <FieldError message={fieldErrors.firstName} />
                  </div>
                  <div className="sm:col-span-1">
                    <Label htmlFor="lname">
                      Last Name<span className="text-error-500">*</span>
                    </Label>
                    <TextInput
                      type="text"
                      id="lname"
                      placeholder="Enter your last name"
                      color={fieldErrors.lastName ? "failure" : "gray"}
                      aria-invalid={!!fieldErrors.lastName}
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        clearFieldError("lastName");
                      }}
                    />
                    <FieldError message={fieldErrors.lastName} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">
                    Date of birth<span className="text-error-500">*</span>
                  </Label>
                  <BirthDatePicker
                    id="dateOfBirth"
                    value={dateOfBirth}
                    hasError={!!fieldErrors.dateOfBirth}
                    onChange={(v) => {
                      setDateOfBirth(v);
                      clearFieldError("dateOfBirth");
                    }}
                  />
                  <FieldError message={fieldErrors.dateOfBirth} />
                </div>

                <div>
                  <Label htmlFor="email">
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <TextInput
                    type="email"
                    id="email"
                    placeholder="Enter your email"
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
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <TextInput
                      id="password"
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
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
{(password || fieldErrors.password) && <PasswordRequirements password={password} />}                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      className="h-5 w-5"
                      checked={isChecked}
                      onChange={(e) => {
                        setIsChecked(e.target.checked);
                        clearFieldError("terms");
                      }}
                    />
                    <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                      By creating an account means you agree to the{" "}
                      <span className="text-gray-800 dark:text-white/90">
                        Terms and Conditions,
                      </span>{" "}
                      and our{" "}
                      <span className="text-gray-800 dark:text-white">
                        Privacy Policy
                      </span>
                    </p>
                  </div>
                  <FieldError message={fieldErrors.terms} />
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
                  >
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
