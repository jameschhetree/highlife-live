export interface Artist {
  slug: string;
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

// Demo artists (Tone Brady, Nyla Vale) removed per data cleanup scope.
// Remaining artists are the active roster placeholders.
export const artists: Artist[] = [
  {
    slug: "foolery",
    name: "Foolery",
    genre: "Alternative Rap",
    category: "Hip-Hop",
    city: "DMV",
    priceRange: "$2,500 - $6,000",
    available: true,
    bio: "Foolery defies genre boundaries with a sound that fuses alternative rap, punk energy, and introspective lyricism. Based in the DMV, Foolery has carved a lane as one of the most unpredictable and electrifying performers in the mid-Atlantic scene. Every show is an experience, never just a set.",
    shortDesc: "DMV alternative rap with punk energy and genre-defying live shows.",
    performanceTypes: ["Headline Set", "Festival", "Showcase", "College Tour"],
    pastEvents: ["Black Room DC 2025", "Broccoli City Warmup", "Howard Homecoming"],
    travelAvailability: "East Coast + Select International",
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80",
  },
  {
    slug: "dj-saint-noir",
    name: "DJ Saint Noir",
    genre: "DJ / Electronic",
    category: "DJ",
    city: "Washington, DC",
    priceRange: "$2,000 - $5,000",
    available: true,
    bio: "DJ Saint Noir is DC's premier nightlife selector. Specializing in afrobeats-to-house transitions, premium club sets, and brand activations, Saint Noir has held residencies at the city's most exclusive venues. Known for reading rooms with surgical precision and creating atmospheres that feel curated, not chaotic.",
    shortDesc: "DC nightlife selector specializing in premium club sets and brand activations.",
    performanceTypes: ["Club Residency", "Brand Activation", "Private Event", "Festival"],
    pastEvents: ["Black Room Showcase DC", "Hennessy Artistry DC", "HighLife Industry Mixer"],
    travelAvailability: "East Coast",
    image: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80",
  },
  {
    slug: "mali-wave",
    name: "Mali Wave",
    genre: "Afrobeats",
    category: "Afrobeats",
    city: "Baltimore",
    priceRange: "$3,500 - $7,000",
    available: false,
    bio: "Mali Wave brings West African rhythms to East Coast stages. Born in Lagos, raised in Baltimore, Mali fuses traditional afrobeats structures with modern production and a live performance style that gets every body in the room moving. A true cultural bridge in the live music space.",
    shortDesc: "Baltimore-based afrobeats artist bridging Lagos energy with East Coast stages.",
    performanceTypes: ["Headline Set", "Cultural Festival", "Private Event", "Brand Campaign"],
    pastEvents: ["Afro Nation Warmup", "Baltimore Artscape", "HighLife Live Night"],
    travelAvailability: "Domestic + West Africa",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  },
  {
    slug: "riko-lux",
    name: "Riko Lux",
    genre: "Hip-Hop",
    category: "Hip-Hop",
    city: "New York",
    priceRange: "$5,000 - $12,000",
    available: true,
    bio: "Riko Lux is New York hip-hop royalty. With a flow that pays homage to the golden era while pushing into uncharted sonic territory, Riko has become one of the most respected names in the independent circuit. His live shows are legendary, tight, energetic, and always backed by a full band.",
    shortDesc: "New York hip-hop with golden era soul and a live band that hits different.",
    performanceTypes: ["Headline Set", "Festival", "Private Event", "Corporate"],
    pastEvents: ["SOBs NYC Residency", "Rolling Loud Afterparty", "HighLife Sessions NY"],
    travelAvailability: "Worldwide",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80",
  },
  {
    slug: "amara-seven",
    name: "Amara Seven",
    genre: "R&B",
    category: "R&B",
    city: "Los Angeles",
    priceRange: "$4,500 - $9,000",
    available: true,
    bio: "Amara Seven is LA R&B at its most refined. With influences spanning jazz, neo-soul, and modern pop production, Amara delivers performances that feel like private concerts even in rooms of thousands. Known for her ability to turn any venue into an intimate experience.",
    shortDesc: "LA neo-soul with jazz roots and a live presence that turns venues intimate.",
    performanceTypes: ["Headline Set", "Brand Dinner", "Festival", "Private Event"],
    pastEvents: ["Coachella Lounge", "HighLife Sessions LA", "Grammy Week Private"],
    travelAvailability: "Worldwide",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
  },
  {
    slug: "vanta-rose",
    name: "Vanta Rose",
    genre: "Rap",
    category: "Hip-Hop",
    city: "Atlanta",
    priceRange: "$2,500 - $6,500",
    available: true,
    bio: "Vanta Rose is Atlanta's darkest secret, an artist whose sound exists at the intersection of trap, goth, and cinematic production. Every performance feels like stepping into a film. Known for theatrical staging, moody lighting demands, and sets that leave audiences in silence before eruption.",
    shortDesc: "Atlanta rap with cinematic production and theatrical live staging.",
    performanceTypes: ["Headline Set", "Showcase", "Festival", "Art Event"],
    pastEvents: ["HighLife Live Night ATL", "Underground Atlanta Series", "Art Basel Side Show"],
    travelAvailability: "Domestic",
    image: "https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=800&q=80",
  },
];

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
