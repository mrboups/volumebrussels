import type { Metadata } from "next";
import ScanSetupClient from "./ScanSetupClient";

export const metadata: Metadata = {
  title: "Scanner Setup",
  robots: { index: false, follow: false, nocache: true },
};

export default function ScanSetupPage() {
  return <ScanSetupClient />;
}
