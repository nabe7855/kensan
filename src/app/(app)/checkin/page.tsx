import type { Metadata } from "next";
import { CheckinScreen } from "@/components/checkin/CheckinScreen";

export const metadata: Metadata = { title: "週の振り返り | 研鑽" };

export default function CheckinPage() {
  return <CheckinScreen />;
}
