import PageMeta from "../../common/PageMeta";
import SignUpForm from "../../components/auth/SignUpForm";
import AuthLayout from "./AuthPageLayout";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Start your financial journey | Finora - Where your money finds its flow."
        description="Bring your finances together in one simple place.

Create your account and take control of your money."
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
