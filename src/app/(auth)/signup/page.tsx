import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Sign up",
  description: "Create a free SellWise account. Start your 7-day free trial, no card required.",
  robots: { index: false },
};

export default function SignupPage() {
  return <SignupForm />;
}
