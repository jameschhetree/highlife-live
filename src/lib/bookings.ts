"use client";

export interface BookingSubmission {
  id: string;
  artistSlug: string;
  artistName: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  proposedOffer: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  eventDescription: string;
  messageToAgent: string;
  submittedAt: string;
  status: "Pending Review" | "Availability Check" | "Confirmed" | "Declined";
  source: "authenticated" | "public";
}

const BOOKINGS_KEY = "highlife_bookings";

export function getBookings(): BookingSubmission[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(BOOKINGS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveBooking(
  booking: Omit<BookingSubmission, "id" | "submittedAt" | "status">
): BookingSubmission {
  const bookings = getBookings();
  const newBooking: BookingSubmission = {
    ...booking,
    id: `HL-${1024 + bookings.length}`,
    submittedAt: new Date().toISOString(),
    status: "Pending Review",
  };
  bookings.push(newBooking);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  return newBooking;
}
