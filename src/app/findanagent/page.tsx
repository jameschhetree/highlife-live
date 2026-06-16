import type { Metadata } from "next";
import FindAnAgentPageClient from "./FindAnAgentPageClient";

export const metadata: Metadata = {
  title: "Auditions | HighLife Live",
  description:
    "Submit your profile for review by the HighLife Live booking team. For external artists seeking representation or a slot on the roster.",
  openGraph: {
    title: "Auditions | HighLife Live",
    description:
      "Submit your artist profile for review by HighLife Live. External artists seeking representation or roster placement.",
    url: "https://highlifelive.com/findanagent",
    siteName: "HighLife Live",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auditions | HighLife Live",
    description:
      "Submit your artist profile for review by the HighLife Live booking team.",
  },
};

export default function FindAnAgentPage() {
  return <FindAnAgentPageClient />;
}
