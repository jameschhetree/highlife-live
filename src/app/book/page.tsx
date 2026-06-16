import type { Metadata } from "next";
import BookPageClient from "./BookPageClient";

export const metadata: Metadata = {
  title: "Book Talent | HighLife Live",
  description:
    "Submit a booking inquiry for any artist on the HighLife Live roster. Open to venues, promoters, and talent buyers.",
  openGraph: {
    title: "Book Talent | HighLife Live",
    description:
      "Submit a booking inquiry for curated talent through HighLife Live. Venues, promoters, and talent buyers welcome.",
    url: "https://highlifelive.com/book",
    siteName: "HighLife Live",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Book Talent | HighLife Live",
    description:
      "Submit a booking inquiry for curated talent through HighLife Live.",
  },
};

export default function BookPage() {
  return <BookPageClient />;
}
