import { HistoryClient } from "./history-client";

export const metadata = {
  title: "Optimisation History — SellWise",
  description: "Browse every listing you've optimised — compare before and after, re-optimise, or archive old results.",
};

export default function HistoryPage() {
  return <HistoryClient />;
}
