import PageMeta from "../../common/PageMeta";
import VerifyEmailForm from "../../components/auth/VerifyEmailForm";
import AuthLayout from "./AuthPageLayout";

export default function VerifyEmail() {
  return (
    <>
      <PageMeta title="Verify email | Money Manager" description="Verify your email address" />
      <AuthLayout>
        <VerifyEmailForm />
      </AuthLayout>
    </>
  );
}