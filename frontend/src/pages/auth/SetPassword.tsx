import PageMeta from "../../common/PageMeta";
import SetPasswordForm from "../../components/auth/SetPasswordForm";
import AuthLayout from "./AuthPageLayout";

export default function SetPassword() {
  return (
    <>
      <PageMeta title="Set a password | Money Manager" description="Secure your account with a password" />
      <AuthLayout>
        <SetPasswordForm />
      </AuthLayout>
    </>
  );
}