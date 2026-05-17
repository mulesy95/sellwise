import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status — SellWise",
  description: "Live health of SellWise services.",
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
