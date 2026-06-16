import type { Metadata } from "next";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Partner Login | HighLife Live",
  description:
    "Sign in to access your HighLife Live booking dashboard. Venues and promoters can track inquiries, manage requests, and browse bookable artists.",
  openGraph: {
    title: "Partner Login | HighLife Live",
    description:
      "Access the HighLife Live booking portal. Track inquiries and manage artist requests.",
    url: "https://highlifelive.com/login",
    siteName: "HighLife Live",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Partner Login | HighLife Live",
    description:
      "Access the HighLife Live partner booking portal.",
  },
};

export default function LoginPage() {
  return <LoginPageClient />;
}
