import type { Metadata } from "next";
import RosterPageClient from "./RosterPageClient";

export const metadata: Metadata = {
  title: "Artist Roster | HighLife Live",
  description:
    "Browse the HighLife Live roster of curated talent built for unforgettable rooms. Filter by genre, search artists, and request a booking.",
  openGraph: {
    title: "Artist Roster | HighLife Live",
    description:
      "Browse the HighLife Live roster of curated talent built for unforgettable rooms. Filter by genre and request a booking.",
    url: "https://highlifelive.com/roster",
    siteName: "HighLife Live",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Artist Roster | HighLife Live",
    description:
      "Curated talent built for unforgettable rooms. Browse and book through HighLife Live.",
  },
};

export default function RosterPage() {
  return <RosterPageClient />;
}
