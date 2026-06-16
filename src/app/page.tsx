import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "HighLife Live | Talent Booking for Venues & Promoters",
  description:
    "HighLife Live connects venues, promoters, and talent buyers with a curated roster of artists. Inquiry-based bookings, live event culture, premium experiences.",
  openGraph: {
    title: "HighLife Live | Talent Booking for Venues & Promoters",
    description:
      "A curated booking home for live moments, music drops, and the culture around them. Built for venues, promoters, and talent buyers.",
    url: "https://highlifelive.com",
    siteName: "HighLife Live",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HighLife Live | Talent Booking for Venues & Promoters",
    description:
      "A curated booking home for live moments, music drops, and the culture around them.",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
