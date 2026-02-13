import SecondBrainDashboard from "@/components/second-brain-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Second Brain — INKredible Tools",
  description: "Mobile-first OpenClaw memory browser with global fuzzy search.",
};

export default function SecondBrainPage() {
  return <SecondBrainDashboard />;
}
