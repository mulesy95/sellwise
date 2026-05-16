import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Sign up",
  description: "Create a free SellWise account. Start your 7-day free trial, no card required.",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ ref?: string }>;
}

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  return <SignupForm refCode={params.ref ?? null} />;
}
