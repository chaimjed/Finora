
import PageMeta from "../../common/PageMeta";
import SignInForm from "../../components/auth/SignInForm";
import AuthLayout from "./AuthPageLayout";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Welcome back to Finora | Finora - Where your money finds its flow."
        description="Take control of your money, all in one place.
Sign in to continue managing your finances."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
