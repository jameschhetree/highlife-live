import type { Metadata } from "next";
import EventsPageClient from "./EventsPageClient";

export const metadata: Metadata = {
  title: "Events | HighLife Live",
  description:
    "Premium live showcases, intimate sessions, and private industry events powered by HighLife Live. Browse upcoming and past events.",
  openGraph: {
    title: "Events | HighLife Live",
    description:
      "Premium live showcases and events powered by HighLife Live. Browse upcoming shows, buy tickets, and discover new artists.",
    url: "https://highlifelive.com/events",
    siteName: "HighLife Live",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Events | HighLife Live",
    description:
      "Premium live showcases and events powered by HighLife Live.",
  },
};

export default function EventsPage() {
  return <EventsPageClient />;
}
