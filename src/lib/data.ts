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

export const artists: Artist[] = [
  {
    slug: "tone-brady",
    name: "Tone Brady",
    genre: "Hip-Hop",
    category: "Hip-Hop",
    city: "Atlanta",
    priceRange: "$3,000 - $8,000",
    available: true,
    bio: "Tone Brady brings raw Atlanta energy to every stage. With roots in the underground scene and a sound that bridges trap, soul, and modern hip-hop, Tone has become one of the most sought-after performers in the Southeast. Known for commanding rooms of any size with a presence that turns first-time listeners into lifelong fans.",
    shortDesc: "Atlanta's hardest-hitting live hip-hop act with a sound built for premium rooms.",
    performanceTypes: ["Headline Set", "Festival", "Private Event", "Club Residency"],
    pastEvents: ["HighLife Sessions ATL 2025", "Culture Room Miami", "A3C Festival"],
    travelAvailability: "Domestic + International",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
  },
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
    slug: "nyla-vale",
    name: "Nyla Vale",
    genre: "R&B",
    category: "R&B",
    city: "Atlanta",
    priceRange: "$4,000 - $10,000",
    available: true,
    bio: "Nyla Vale is the voice of new Atlanta R&B. With a catalog that spans intimate acoustic sessions to full-band productions, Nyla delivers performances that are both technically stunning and deeply emotional. Her live show is a masterclass in presence, vocal control, and audience connection.",
    shortDesc: "Atlanta R&B vocalist with a voice built for rooms that demand elegance.",
    performanceTypes: ["Headline Set", "Brand Dinner", "Private Event", "Festival"],
    pastEvents: ["HighLife Sessions ATL 2025", "Essence Fest Lounge", "Art Basel Private"],
    travelAvailability: "Domestic + International",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
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
    pastEvents: ["Afro Nation Warmup", "Baltimore Artscape", "HighLife Records Night"],
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
    pastEvents: ["HighLife Records Night ATL", "Underground Atlanta Series", "Art Basel Side Show"],
    travelAvailability: "Domestic",
    image: "https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=800&q=80",
  },
];

export const events: Event[] = [
  {
    id: "evt-1",
    title: "HighLife Sessions ATL",
    date: "June 21, 2026",
    city: "Atlanta, GA",
    venue: "The Velvet Room",
    featuredArtists: ["Tone Brady", "Nyla Vale", "Vanta Rose"],
    ticketStatus: "Available",
    isPast: false,
  },
  {
    id: "evt-2",
    title: "Black Room Showcase",
    date: "July 12, 2026",
    city: "Washington, DC",
    venue: "The Anthem (Private Floor)",
    featuredArtists: ["Foolery", "DJ Saint Noir"],
    ticketStatus: "Limited",
    isPast: false,
  },
  {
    id: "evt-3",
    title: "HighLife Records Night",
    date: "August 2, 2026",
    city: "Baltimore, MD",
    venue: "Ottobar",
    featuredArtists: ["Mali Wave", "Vanta Rose", "DJ Saint Noir"],
    ticketStatus: "Available",
    isPast: false,
  },
  {
    id: "evt-4",
    title: "Private Industry Mixer",
    date: "September 14, 2026",
    city: "New York, NY",
    venue: "Members Only Loft, SoHo",
    featuredArtists: ["Riko Lux", "Amara Seven"],
    ticketStatus: "Limited",
    isPast: false,
  },
  {
    id: "evt-5",
    title: "HighLife Sessions DC",
    date: "March 15, 2026",
    city: "Washington, DC",
    venue: "9:30 Club (Backroom)",
    featuredArtists: ["Foolery", "Tone Brady"],
    ticketStatus: "Sold Out",
    isPast: true,
  },
  {
    id: "evt-6",
    title: "Culture Room Miami",
    date: "January 28, 2026",
    city: "Miami, FL",
    venue: "Culture Room",
    featuredArtists: ["Tone Brady", "Amara Seven"],
    ticketStatus: "Sold Out",
    isPast: true,
  },
];

export const products: Product[] = [
  {
    id: "prod-1",
    name: "HighLife Records Black Tee",
    price: 45,
    image: "black-tee",
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "Apparel",
  },
  {
    id: "prod-2",
    name: "HighLife Records White Tee",
    price: 45,
    image: "white-tee",
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "Apparel",
  },
  {
    id: "prod-3",
    name: "HighLife Records Hoodie",
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

export const dummyBookingRequests: BookingRequest[] = [
  {
    id: "HL-1021",
    artistName: "Tone Brady",
    eventType: "Private Event",
    status: "Pending Review",
    date: "July 5, 2026",
    description: "Private rooftop event, 200 guests, full production provided.",
  },
  {
    id: "HL-1022",
    artistName: "DJ Saint Noir",
    eventType: "Club Night",
    status: "Availability Check",
    date: "August 15, 2026",
    description: "Saturday night residency slot, 11pm-2am, venue capacity 500.",
  },
  {
    id: "HL-1023",
    artistName: "Nyla Vale",
    eventType: "Brand Dinner",
    status: "Confirmed",
    date: "September 2, 2026",
    description: "Luxury brand dinner, 80 guests, acoustic set preferred.",
  },
];

export const categories = [
  "All",
  "Hip-Hop",
  "R&B",
  "Afrobeats",
  "DJ",
  "Producer",
  "Live Performance",
];
