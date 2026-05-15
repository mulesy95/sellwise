import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return <LoginForm searchParams={searchParams} />;
}
