import type { Metadata } from "next";
import HearthApp from "../HearthApp";

export const metadata: Metadata = {
  title: "HEARTH Demo · No sign-in needed",
  description: "Explore HEARTH with a made-up caregiver household. No account is required.",
};

export default function DemoPage() {
  return <HearthApp />;
}
