import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Button, Label, TextInput, Alert, Spinner } from "flowbite-react";
import { ChevronLeftIcon } from "../../icons";
import { authService } from "../../services/authService";
import { HiCheckCircle, HiOutlineEnvelope, HiXCircle } from "react-icons/hi2";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("verifying");
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    authService
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResendLoading(true);
    try {
      await authService.resendVerification(email);
    } finally {
      setResendLoading(false);
      setResendSent(true);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-md pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5 rtl:rotate-180" />
          Back to dashboard
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center text-center">
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <Spinner size="lg" className="fill-brand-500" />
            </div>
            <div>
              <h1 className="mb-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">
                Verifying your email
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This will only take a moment...
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10">
              <HiCheckCircle className="size-8" />
            </div>
            <div>
              <h1 className="mb-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">
                Email verified
              </h1>
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                Your account is now active.
              </p>
              <Link to="/signin">
                <Button size="sm">Go to sign in</Button>
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/10">
              <HiXCircle className="size-8" />
            </div>
            <div className="w-full">
              <h1 className="mb-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">
                Link expired or invalid
              </h1>
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                Enter your email to receive a new verification link.
              </p>

              {resendSent ? (
                <Alert color="info" icon={HiOutlineEnvelope}>
                  If an account exists and isn't verified yet, a new link has
                  been sent.
                </Alert>
              ) : (
                <form
                  className="flex flex-col gap-4 text-left"
                  onSubmit={handleResend}
                >
                  <div>
                    <Label htmlFor="resend-email">Email</Label>
                    <TextInput
                      id="resend-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={resendLoading}>
                    {resendLoading ? "Sending..." : "Resend verification email"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
