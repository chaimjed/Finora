import PageMeta from "../../common/PageMeta";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
import AuthLayout from "./AuthPageLayout";

export default function ResetPassword() {
  return (
    <>
      <PageMeta title="Reset password | Money Manager" description="Reset your password" />
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    </>
  );
}