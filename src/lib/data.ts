export interface Artist {
  slug: string;
  epkUrl?: string;
  name: string;
  genre: string;
  category: string;
  city: string;
  priceRange: string;
  available: boolean;
  bio: string;
  shortDesc: string;
  performanceTypes: string[];
  pastEvents: string[];
  travelAvailability: string;
  image: string;
  links?: { title: string; url: string }[];
  assets?: { id: string; kind: string; blobUrl: string; filename: string; mimeType: string }[];
  pressQuotes?: string[];
  secondaryGenres?: string[];
  performanceType?: string;
  cleanExplicit?: string;
  typicalSetLength?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  city: string;
  venue: string;
  featuredArtists: string[];
  ticketStatus: "Available" | "Limited" | "Sold Out";
  isPast: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  sizes: string[];
  category: string;
}

export interface BookingRequest {
  id: string;
  artistName: string;
  eventType: string;
  status: "Pending Review" | "Availability Check" | "Confirmed";
  date: string;
  description: string;
}

// All fake/placeholder artists removed 2026-06-03 per Dok directive
// ("all these fake artists i want em gone, every piece of fake data gone,
//  make it empty so we can start to populate").
// Real artists populate through the admin portal → /api/admin/artists → DB.
// /roster, /artists, /book consume this array; they render empty states gracefully
// until real artists are added.
export const artists: Artist[] = [];

// Demo events removed per cleanup scope.
// Events page now uses its own inline data.
export const events: Event[] = [];

export const products: Product[] = [
  {
    id: "prod-1",
    name: "HighLife Live Black Tee",
    price: 45,
    image: "black-tee",
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "Apparel",
  },
  {
    id: "prod-2",
    name: "HighLife Live White Tee",
    price: 45,
    image: "white-tee",
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "Apparel",
  },
  {
    id: "prod-3",
    name: "HighLife Live Hoodie",
    price: 95,
    image: "hoodie",
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "Apparel",
  },
  {
    id: "prod-4",
    name: "HighLife Vinyl Club Poster",
    price: 30,
    image: "poster",
    sizes: ["18x24", "24x36"],
    category: "Print",
  },
  {
    id: "prod-5",
    name: "HighLife Studio Cap",
    price: 40,
    image: "cap",
    sizes: ["One Size"],
    category: "Accessories",
  },
  {
    id: "prod-6",
    name: "HighLife Members Jacket",
    price: 160,
    image: "jacket",
    sizes: ["S", "M", "L", "XL"],
    category: "Apparel",
  },
];

// Demo booking requests removed per cleanup scope.
export const dummyBookingRequests: BookingRequest[] = [];

export const categories = [
  "All",
  "Hip-Hop",
  "R&B",
  "Afrobeats",
  "DJ",
  "Producer",
  "Live Performance",
];
