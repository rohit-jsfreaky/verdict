import type { Metadata } from "next";
import { Desk } from "@/components/Desk";

export const metadata: Metadata = { title: "Check an advisory · Verdict" };

export default function CheckPage() {
  return <Desk />;
}
