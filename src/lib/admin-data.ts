// HighLife Live — Admin Demo Data
// All records are synthetic demo data. Replace before launching outreach.

// ── Artist Types ──────────────────────────────────────────────

export type ArtistStatus = "Testing" | "Active" | "Priority" | "Paused" | "Archived";
export type PerformanceType =
  | "Solo Artist"
  | "Band"
  | "DJ"
  | "Rapper"
  | "Singer"
  | "Opera Vocalist"
  | "RnB Vocalist"
  | "Dembow/Latin Club Act"
  | "Producer/DJ Hybrid"
  | "Other";

export interface ArtistScoring {
  potential: number;
  livePerformance: number;
  marketability: number;
  reliability: number;
  bookingPriority: number;
  overall: number;
  notes: string;
}

export interface ArtistSocials {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  spotify?: string;
  appleMusic?: string;
  soundcloud?: string;
  website?: string;
  linktree?: string;
}

export interface ArtistStats {
  instagramFollowers: number;
  tiktokFollowers: number;
  youtubeSubscribers: number;
  spotifyMonthlyListeners: number;
  avgEngagement: string;
  estimatedTotalAudience: number;
  lastRefreshed: string;
}

export interface AdminArtist {
  id: string;
  name: string;
  status: ArtistStatus;
  legalName: string;
  email: string;
  phone: string;
  managerContact: string;
  homeCity: string;
  homeState: string;
  primaryMarket: string;
  primaryGenre: string;
  secondaryGenres: string[];
  performanceType: PerformanceType;
  typicalSetLength: string;
  bookingFeeRange: string;
  travelWillingness: string;
  targetVenueTypes: string[];
  ageDemoAppeal: string;
  cleanExplicit: string;
  bio: string;
  shortPitch: string;
  longPitch: string;
  pressQuotes: string[];
  highlights: string[];
  internalNotes: string;
  reliabilityNotes: string;
  bestFitVenueNotes: string;
  socials: ArtistSocials;
  stats: ArtistStats;
  scoring: ArtistScoring;
  image: string;
  isDemo: true;
}

// ── Venue Types ──────────────────────────────────────────────

export type VenueType =
  | "Club"
  | "Lounge"
  | "Festival"
  | "Theater"
  | "College"
  | "Restaurant/Bar"
  | "Private Event Buyer"
  | "Promoter"
  | "Cultural Center"
  | "Church/Event Hall"
  | "Other";

export type VenueSource = "Manual" | "CSV Import" | "Public Research" | "Authorized API" | "Referral";
export type ReviewStatus = "Needs Review" | "Verified" | "Do Not Contact" | "Duplicate";
export type RelationshipStatus =
  | "Cold"
  | "Warm"
  | "Active Relationship"
  | "Booked Before"
  | "Not a Fit"
  | "Do Not Contact";

export interface AdminVenue {
  id: string;
  name: string;
  contactPerson: string;
  contactTitle: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  address: string;
  city: string;
  state: string;
  region: string;
  venueType: VenueType;
  capacity: number;
  typicalGenres: string[];
  bookingEmail: string;
  talentBuyerEmail: string;
  source: VenueSource;
  sourceUrl: string;
  sourceDate: string;
  contactConfidence: number;
  reviewStatus: ReviewStatus;
  notes: string;
  tags: string[];
  lastContacted: string | null;
  nextFollowUp: string | null;
  relationshipStatus: RelationshipStatus;
  isDemo: true;
}

// ── Campaign Types ──────────────────────────────────────────

export type CampaignStatus =
  | "Draft"
  | "Needs Approval"
  | "Approved"
  | "Running"
  | "Paused"
  | "Completed"
  | "Archived";

export type CampaignObjective =
  | "Book Show"
  | "Open for Local Act"
  | "Club Performance"
  | "Festival Slot"
  | "Private Event"
  | "College Event"
  | "Brand/Cultural Event";

export interface CampaignEmail {
  step: number;
  label: string;
  subject: string;
  body: string;
  delayDays: number;
}

export interface AdminCampaign {
  id: string;
  name: string;
  artistId: string;
  artistName: string;
  targetMarket: string;
  targetSegment: string;
  status: CampaignStatus;
  outreachPlatform: string;
  objective: CampaignObjective;
  contactCount: number;
  emailSequence: CampaignEmail[];
  owner: string;
  createdDate: string;
  approvedBy: string | null;
  sentDate: string | null;
  notes: string;
  isDemo: true;
}

// ── Opportunity Types ───────────────────────────────────────

export type OpportunityStatus =
  | "Lead"
  | "Contacted"
  | "Replied"
  | "Interested"
  | "Negotiating"
  | "Contract Pending"
  | "Booked"
  | "Completed"
  | "Lost"
  | "Follow-up Later";

export interface AdminOpportunity {
  id: string;
  artistId: string;
  artistName: string;
  venueId: string;
  venueName: string;
  campaignId: string | null;
  eventDate: string | null;
  proposedFee: number;
  expectedFee: number;
  confirmedFee: number | null;
  status: OpportunityStatus;
  probability: number;
  nextTask: string;
  owner: string;
  notes: string;
  isDemo: true;
}

// ── EPK Types ───────────────────────────────────────────────

export type EpkStatus = "Draft" | "Approved" | "Published" | "Archived";

export interface AdminEpk {
  id: string;
  artistId: string;
  artistName: string;
  status: EpkStatus;
  createdDate: string;
  lastEdited: string;
  publishUrl: string | null;
  isDemo: true;
}

// ── Research Queue Types ────────────────────────────────────

export type ResearchAction = "Pending" | "Verified" | "Duplicate" | "Do Not Contact";

export interface ResearchContact {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  sourceUrl: string;
  sourceDate: string;
  region: string;
  venueType: VenueType;
  action: ResearchAction;
  notes: string;
  isDemo: true;
}

// ══════════════════════════════════════════════════════════════
// DEMO DATA
// ══════════════════════════════════════════════════════════════

export const demoArtists: AdminArtist[] = [
  {
    id: "art-001",
    name: "Isabella Vega",
    status: "Priority",
    legalName: "Isabella M. Vega",
    email: "isabella@vegamusic.com",
    phone: "(202) 555-0141",
    managerContact: "Marco Reyes (marco@vegamgmt.com)",
    homeCity: "Washington",
    homeState: "DC",
    primaryMarket: "DMV",
    primaryGenre: "Opera / Classical Crossover",
    secondaryGenres: ["Jazz Vocal", "Art Pop"],
    performanceType: "Opera Vocalist",
    typicalSetLength: "45-60 min",
    bookingFeeRange: "$3,000 - $8,000",
    travelWillingness: "East Coast + Select International",
    targetVenueTypes: ["Theater", "Cultural Center", "Private Event Buyer", "Church/Event Hall"],
    ageDemoAppeal: "30-65, upscale cultural audiences",
    cleanExplicit: "Clean only",
    bio: "Classically trained mezzo-soprano with a modern edge. Isabella trained at Peabody Conservatory and has performed at venues ranging from the Kennedy Center Millennium Stage to private embassy events across DC. Her crossover style blends operatic power with jazz phrasing.",
    shortPitch: "Classically trained vocalist available for elevated cultural, private, and special event programming in the DMV.",
    longPitch: "Isabella Vega is a Peabody-trained mezzo-soprano who brings classical vocal power to contemporary settings. With experience at the Kennedy Center, embassy events, and private galas, she delivers performances that elevate any room. Her repertoire spans Italian opera, jazz standards, and original art-pop compositions.",
    pressQuotes: ["\"A voice that stops rooms.\" — Washington City Paper", "\"The future of crossover classical.\" — DCist"],
    highlights: ["Kennedy Center Millennium Stage 2025", "French Embassy Cultural Gala", "Baltimore Symphony guest artist"],
    internalNotes: "Great for premium/upscale bookings. Avoid dive bars and loud club environments.",
    reliabilityNotes: "Always on time, professional rider requests. Easy to work with.",
    bestFitVenueNotes: "Cultural centers, theaters, embassy events, upscale restaurants with live music programs, private galas.",
    socials: { instagram: "@isabellavegamusic", youtube: "IsabellaVegaOfficial", spotify: "Isabella Vega", website: "isabellavega.com" },
    stats: { instagramFollowers: 12400, tiktokFollowers: 3200, youtubeSubscribers: 8900, spotifyMonthlyListeners: 15600, avgEngagement: "4.2%", estimatedTotalAudience: 40100, lastRefreshed: "2026-05-28" },
    scoring: { potential: 8, livePerformance: 9, marketability: 7, reliability: 10, bookingPriority: 9, overall: 8.6, notes: "Strong classical niche, excellent reliability, premium bookings" },
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    isDemo: true,
  },
  {
    id: "art-002",
    name: "El Fuego",
    status: "Active",
    legalName: "Carlos Jimenez",
    email: "elfuego@gmail.com",
    phone: "(301) 555-0198",
    managerContact: "Self-managed",
    homeCity: "Silver Spring",
    homeState: "MD",
    primaryMarket: "DMV",
    primaryGenre: "Dembow / Reggaeton",
    secondaryGenres: ["Latin Trap", "Club"],
    performanceType: "Dembow/Latin Club Act",
    typicalSetLength: "30-45 min",
    bookingFeeRange: "$1,500 - $4,000",
    travelWillingness: "DMV + East Coast",
    targetVenueTypes: ["Club", "Lounge", "Festival", "College"],
    ageDemoAppeal: "18-35, Latin nightlife audiences",
    cleanExplicit: "Explicit (clean versions available)",
    bio: "El Fuego is the DMV's hottest Latin club act. Born in the Dominican Republic and raised in Silver Spring, he brings authentic dembow energy fused with modern reggaeton production. His sets are high-energy, bilingual, and built for dance floors.",
    shortPitch: "High-energy Latin/Dembow act available for club night support or themed event in the DMV.",
    longPitch: "El Fuego combines authentic Dominican dembow rhythms with modern club production. Based in Silver Spring, MD, he has become a fixture in the DMV Latin nightlife scene with residencies at multiple venues and a growing regional following. His bilingual sets keep dance floors packed from open to close.",
    pressQuotes: ["\"DMV's dembow king.\" — El Tiempo Latino"],
    highlights: ["Latin Night residency at Ultrabar DC", "Fiesta DC Main Stage 2025", "Opening for Farruko at Echostage"],
    internalNotes: "Best for Latin nights, club events, college Latin parties. Strong crowd pull in MD/DC Latin communities.",
    reliabilityNotes: "Generally reliable. Has been late to 1 of 8 bookings. Improving.",
    bestFitVenueNotes: "Latin clubs, college Latin nights, lounges with Latin programming, festivals with Latin stages.",
    socials: { instagram: "@elfuegodmv", tiktok: "@elfuegodmv", spotify: "El Fuego DMV" },
    stats: { instagramFollowers: 28500, tiktokFollowers: 45000, youtubeSubscribers: 5600, spotifyMonthlyListeners: 22000, avgEngagement: "6.1%", estimatedTotalAudience: 101100, lastRefreshed: "2026-05-25" },
    scoring: { potential: 7, livePerformance: 8, marketability: 8, reliability: 7, bookingPriority: 8, overall: 7.6, notes: "Strong Latin niche, high social engagement, good crowd pull" },
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    isDemo: true,
  },
  {
    id: "art-003",
    name: "Tone Brady",
    status: "Priority",
    legalName: "Antoine Brady",
    email: "tone@tonebrady.com",
    phone: "(404) 555-0177",
    managerContact: "Dee Williams (dee@tbookmgmt.com)",
    homeCity: "Atlanta",
    homeState: "GA",
    primaryMarket: "Atlanta / DMV",
    primaryGenre: "Hip-Hop",
    secondaryGenres: ["Trap Soul", "R&B Rap"],
    performanceType: "Rapper",
    typicalSetLength: "45-60 min",
    bookingFeeRange: "$3,000 - $8,000",
    travelWillingness: "Domestic + International",
    targetVenueTypes: ["Club", "Festival", "College", "Private Event Buyer"],
    ageDemoAppeal: "18-34, hip-hop / urban audiences",
    cleanExplicit: "Both available",
    bio: "Tone Brady brings raw Atlanta energy to every stage. With roots in the underground scene and a sound that bridges trap, soul, and modern hip-hop, Tone has become one of the most sought-after performers in the Southeast.",
    shortPitch: "Atlanta hip-hop artist with a commanding live show, available for club dates, festivals, and private events.",
    longPitch: "Tone Brady is an Atlanta-based hip-hop artist whose sound bridges trap, soul, and modern rap. With a growing regional following and a live show known for its energy and crowd control, Tone is ready for stages of any size. Currently building his DMV market presence through strategic bookings.",
    pressQuotes: ["\"Atlanta's next big export.\" — Creative Loafing", "\"A performer who earns every room.\" — HipHopDX"],
    highlights: ["HighLife Sessions ATL 2025", "A3C Festival", "Culture Room Miami headliner"],
    internalNotes: "Top priority artist. Strong performer, reliable, good media presence. Push for DMV club and college bookings.",
    reliabilityNotes: "Excellent. Always early to soundcheck. Professional team.",
    bestFitVenueNotes: "Hip-hop clubs, college shows, festivals with urban stages, private events with younger demos.",
    socials: { instagram: "@tonebrady", tiktok: "@tonebrady", youtube: "ToneBradyOfficial", spotify: "Tone Brady", website: "tonebrady.com" },
    stats: { instagramFollowers: 67000, tiktokFollowers: 120000, youtubeSubscribers: 34000, spotifyMonthlyListeners: 185000, avgEngagement: "5.8%", estimatedTotalAudience: 406000, lastRefreshed: "2026-05-29" },
    scoring: { potential: 9, livePerformance: 9, marketability: 9, reliability: 10, bookingPriority: 10, overall: 9.4, notes: "Top-tier artist. Push aggressively for bookings." },
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
    isDemo: true,
  },
  {
    id: "art-004",
    name: "Nyla Vale",
    status: "Active",
    legalName: "Nyla Valentine",
    email: "nyla@nylavale.com",
    phone: "(404) 555-0233",
    managerContact: "James Carter (james@highliferecords.com)",
    homeCity: "Atlanta",
    homeState: "GA",
    primaryMarket: "Atlanta / East Coast",
    primaryGenre: "R&B",
    secondaryGenres: ["Neo-Soul", "Jazz"],
    performanceType: "RnB Vocalist",
    typicalSetLength: "45-60 min",
    bookingFeeRange: "$4,000 - $10,000",
    travelWillingness: "Domestic + International",
    targetVenueTypes: ["Lounge", "Restaurant/Bar", "Private Event Buyer", "Festival"],
    ageDemoAppeal: "25-45, upscale audiences",
    cleanExplicit: "Clean",
    bio: "Nyla Vale is the voice of new Atlanta R&B. With a catalog that spans intimate acoustic sessions to full-band productions, Nyla delivers performances that are both technically stunning and deeply emotional.",
    shortPitch: "Atlanta R&B vocalist with a voice built for rooms that demand elegance and atmosphere.",
    longPitch: "Nyla Vale is an Atlanta-based R&B vocalist whose performances blend technical vocal mastery with deep emotional connection. From intimate lounge sets to festival main stages, Nyla transforms every venue into an experience. Ideal for upscale programming, brand dinners, and curated live music nights.",
    pressQuotes: ["\"The voice Atlanta has been waiting for.\" — Earmilk"],
    highlights: ["Essence Fest Lounge 2025", "Art Basel Private Performance", "HighLife Sessions ATL"],
    internalNotes: "Strong for lounge, upscale, and brand event bookings. Pairs well with DJ Saint Noir.",
    reliabilityNotes: "Reliable. Clear communication. Prefers acoustic/intimate setups when possible.",
    bestFitVenueNotes: "Lounges, upscale restaurants with live music, private events, brand dinners, jazz clubs.",
    socials: { instagram: "@nylavale", spotify: "Nyla Vale", appleMusic: "Nyla Vale", website: "nylavale.com" },
    stats: { instagramFollowers: 34000, tiktokFollowers: 18000, youtubeSubscribers: 12000, spotifyMonthlyListeners: 78000, avgEngagement: "4.9%", estimatedTotalAudience: 142000, lastRefreshed: "2026-05-27" },
    scoring: { potential: 8, livePerformance: 9, marketability: 8, reliability: 9, bookingPriority: 8, overall: 8.4, notes: "Premium R&B talent, strong for upscale bookings" },
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    isDemo: true,
  },
  {
    id: "art-005",
    name: "Foolery",
    status: "Testing",
    legalName: "Marcus Thorne",
    email: "foolery@gmail.com",
    phone: "(202) 555-0312",
    managerContact: "Self-managed",
    homeCity: "Washington",
    homeState: "DC",
    primaryMarket: "DMV",
    primaryGenre: "Alternative Rap",
    secondaryGenres: ["Punk Rap", "Indie Hip-Hop"],
    performanceType: "Rapper",
    typicalSetLength: "30-45 min",
    bookingFeeRange: "$2,500 - $6,000",
    travelWillingness: "East Coast",
    targetVenueTypes: ["Club", "College", "Festival"],
    ageDemoAppeal: "18-28, alt/indie audiences",
    cleanExplicit: "Explicit",
    bio: "Foolery defies genre boundaries with a sound that fuses alternative rap, punk energy, and introspective lyricism. Based in the DMV, Foolery has carved a lane as one of the most unpredictable and electrifying performers in the mid-Atlantic scene.",
    shortPitch: "DMV alternative rap with punk energy and genre-defying live shows.",
    longPitch: "Foolery is a DC-based alternative rap artist whose live shows are legendary for their intensity and unpredictability. Blending punk energy with introspective hip-hop, Foolery appeals to a cross-genre audience and has built a loyal following in the DMV indie scene. Ideal for college shows, showcases, and festivals with diverse programming.",
    pressQuotes: ["\"DC's most electrifying performer.\" — Bandwidth"],
    highlights: ["Black Room DC 2025", "Howard Homecoming", "Broccoli City Warmup Set"],
    internalNotes: "Currently in testing phase. Strong live performer but needs more consistent booking history.",
    reliabilityNotes: "Mostly reliable. Can be hard to reach for pre-production details. Working on it.",
    bestFitVenueNotes: "Indie venues, college shows, alternative programming, punk/rap crossover events.",
    socials: { instagram: "@foolerydc", tiktok: "@foolerydc", soundcloud: "foolery" },
    stats: { instagramFollowers: 8900, tiktokFollowers: 15000, youtubeSubscribers: 3400, spotifyMonthlyListeners: 11000, avgEngagement: "7.2%", estimatedTotalAudience: 38300, lastRefreshed: "2026-05-20" },
    scoring: { potential: 7, livePerformance: 8, marketability: 6, reliability: 6, bookingPriority: 6, overall: 6.6, notes: "High energy, needs more consistency. Testing phase." },
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80",
    isDemo: true,
  },
  {
    id: "art-006",
    name: "DJ Saint Noir",
    status: "Active",
    legalName: "David St. Claire",
    email: "djsaintnoir@gmail.com",
    phone: "(202) 555-0456",
    managerContact: "Self-managed",
    homeCity: "Washington",
    homeState: "DC",
    primaryMarket: "DMV",
    primaryGenre: "DJ / Electronic",
    secondaryGenres: ["Afrobeats", "House", "Amapiano"],
    performanceType: "DJ",
    typicalSetLength: "2-4 hours",
    bookingFeeRange: "$2,000 - $5,000",
    travelWillingness: "East Coast",
    targetVenueTypes: ["Club", "Lounge", "Private Event Buyer", "Festival"],
    ageDemoAppeal: "21-40, nightlife / premium crowds",
    cleanExplicit: "N/A (DJ sets)",
    bio: "DJ Saint Noir is DC's premier nightlife selector. Specializing in afrobeats-to-house transitions, premium club sets, and brand activations, Saint Noir has held residencies at the city's most exclusive venues.",
    shortPitch: "DC nightlife selector specializing in premium club sets, brand activations, and curated events.",
    longPitch: "DJ Saint Noir is Washington DC's go-to nightlife DJ for premium events. With residencies at top DC venues and experience with brand activations for Hennessy, Moet, and local luxury brands, Saint Noir brings a curated sonic experience that elevates any room. His ability to read and control a room is unmatched in the DMV.",
    pressQuotes: ["\"DC's most trusted selector.\" — Washington Nightlife Guide"],
    highlights: ["Hennessy Artistry DC", "HighLife Industry Mixer", "Echostage support sets"],
    internalNotes: "Great add-on for any DMV event. Can pair with vocalists for premium lounge bookings.",
    reliabilityNotes: "Extremely reliable. Owns his own equipment. Always professional.",
    bestFitVenueNotes: "Clubs, lounges, brand activations, private events, rooftop parties.",
    socials: { instagram: "@djsaintnoir", website: "djsaintnoir.com" },
    stats: { instagramFollowers: 15800, tiktokFollowers: 4500, youtubeSubscribers: 1200, spotifyMonthlyListeners: 0, avgEngagement: "3.8%", estimatedTotalAudience: 21500, lastRefreshed: "2026-05-22" },
    scoring: { potential: 7, livePerformance: 8, marketability: 7, reliability: 10, bookingPriority: 7, overall: 7.8, notes: "Reliable DJ, great for pairing with other artists" },
    image: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&q=80",
    isDemo: true,
  },
  {
    id: "art-007",
    name: "The Velvet Collective",
    status: "Testing",
    legalName: "Velvet Collective LLC",
    email: "booking@velvetcollective.band",
    phone: "(410) 555-0789",
    managerContact: "Sarah Kim (sarah@velvetcollective.band)",
    homeCity: "Baltimore",
    homeState: "MD",
    primaryMarket: "Baltimore / DMV",
    primaryGenre: "Indie Rock",
    secondaryGenres: ["Dream Pop", "Shoegaze"],
    performanceType: "Band",
    typicalSetLength: "45-75 min",
    bookingFeeRange: "$2,000 - $5,000",
    travelWillingness: "Mid-Atlantic + East Coast",
    targetVenueTypes: ["Club", "Festival", "College", "Theater"],
    ageDemoAppeal: "20-35, indie/alt audiences",
    cleanExplicit: "Clean",
    bio: "The Velvet Collective is a 5-piece indie band from Baltimore blending dream pop textures with shoegaze intensity. Their live shows feature immersive visuals and a sonic experience that reviewers have called transcendent.",
    shortPitch: "Baltimore indie band with immersive live shows, ideal for college circuits and indie venues.",
    longPitch: "The Velvet Collective is a Baltimore-based 5-piece indie band whose sound sits at the intersection of dream pop and shoegaze. With a growing mid-Atlantic following and a live show that features custom visuals, they offer a complete performance experience. Currently building out their venue circuit beyond Baltimore.",
    pressQuotes: ["\"Baltimore's best-kept secret.\" — Baltimore Sun Arts"],
    highlights: ["Ottobar headliner 2025", "Baltimore Artscape", "SXSW unofficial showcase"],
    internalNotes: "Exploring fit for college circuit and indie festival bookings. Need 2-3 more shows to evaluate.",
    reliabilityNotes: "New relationship. First booking went smoothly.",
    bestFitVenueNotes: "Indie venues, college shows, festivals with indie/alt stages, art events.",
    socials: { instagram: "@velvetcollectiveband", spotify: "The Velvet Collective", website: "velvetcollective.band" },
    stats: { instagramFollowers: 4200, tiktokFollowers: 2100, youtubeSubscribers: 890, spotifyMonthlyListeners: 6500, avgEngagement: "5.5%", estimatedTotalAudience: 13690, lastRefreshed: "2026-05-15" },
    scoring: { potential: 6, livePerformance: 7, marketability: 5, reliability: 7, bookingPriority: 5, overall: 6.0, notes: "Promising indie act, needs more road testing" },
    image: "https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=400&q=80",
    isDemo: true,
  },
  {
    id: "art-008",
    name: "Kira Moon",
    status: "Paused",
    legalName: "Kira Montague",
    email: "kira@kiramoon.com",
    phone: "(703) 555-0621",
    managerContact: "Self-managed",
    homeCity: "Arlington",
    homeState: "VA",
    primaryMarket: "DMV",
    primaryGenre: "R&B",
    secondaryGenres: ["Pop", "Dance"],
    performanceType: "Singer",
    typicalSetLength: "30-45 min",
    bookingFeeRange: "$1,500 - $3,500",
    travelWillingness: "DMV only currently",
    targetVenueTypes: ["Lounge", "Restaurant/Bar", "Private Event Buyer"],
    ageDemoAppeal: "21-35, R&B / pop audiences",
    cleanExplicit: "Clean",
    bio: "Kira Moon is a NoVA-based R&B vocalist with a smooth, radio-ready sound. Currently on pause from active bookings due to personal commitments but remains on the HighLife roster for future opportunities.",
    shortPitch: "DMV R&B vocalist with pop crossover appeal, currently on pause.",
    longPitch: "Kira Moon is an Arlington, VA-based R&B and pop vocalist whose smooth vocal style and stage presence have made her a favorite in the DMV lounge scene. Currently on a booking pause but expected to return to active status in late 2026.",
    pressQuotes: [],
    highlights: ["DMV Voices showcase 2025", "Northern Virginia Jazz Fest"],
    internalNotes: "PAUSED: Taking a break from bookings through Q3 2026. Check back September.",
    reliabilityNotes: "Was reliable when active. Keep on roster for when she returns.",
    bestFitVenueNotes: "Lounges, wine bars, upscale restaurants, private events.",
    socials: { instagram: "@kiramoonmusic" },
    stats: { instagramFollowers: 6100, tiktokFollowers: 3800, youtubeSubscribers: 450, spotifyMonthlyListeners: 4200, avgEngagement: "4.0%", estimatedTotalAudience: 14550, lastRefreshed: "2026-04-10" },
    scoring: { potential: 6, livePerformance: 7, marketability: 6, reliability: 8, bookingPriority: 2, overall: 5.8, notes: "Good talent, currently paused. Re-evaluate in Q4." },
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    isDemo: true,
  },
];

export const demoVenues: AdminVenue[] = [
  {
    id: "ven-001",
    name: "Echostage",
    contactPerson: "Mike Chen",
    contactTitle: "Talent Buyer",
    email: "talent@echostage.com",
    phone: "(202) 555-0901",
    website: "echostage.com",
    instagram: "@echostage",
    address: "2135 Queens Chapel Rd NE",
    city: "Washington",
    state: "DC",
    region: "Washington, DC",
    venueType: "Club",
    capacity: 3000,
    typicalGenres: ["EDM", "Hip-Hop", "Latin", "Pop"],
    bookingEmail: "talent@echostage.com",
    talentBuyerEmail: "mike@echostage.com",
    source: "Manual",
    sourceUrl: "",
    sourceDate: "2026-03-15",
    contactConfidence: 9,
    reviewStatus: "Verified",
    notes: "Top venue in DC. Hard to book without established draw. Start with support slots.",
    tags: ["premium", "high-capacity", "hip-hop", "latin"],
    lastContacted: "2026-05-10",
    nextFollowUp: "2026-06-10",
    relationshipStatus: "Warm",
    isDemo: true,
  },
  {
    id: "ven-002",
    name: "9:30 Club",
    contactPerson: "Patricia Brooks",
    contactTitle: "Booking Manager",
    email: "booking@930.com",
    phone: "(202) 555-0930",
    website: "930.com",
    instagram: "@930club",
    address: "815 V St NW",
    city: "Washington",
    state: "DC",
    region: "Washington, DC",
    venueType: "Club",
    capacity: 1200,
    typicalGenres: ["Indie", "Hip-Hop", "Rock", "R&B", "Electronic"],
    bookingEmail: "booking@930.com",
    talentBuyerEmail: "patricia@930.com",
    source: "Manual",
    sourceUrl: "",
    sourceDate: "2026-02-20",
    contactConfidence: 8,
    reviewStatus: "Verified",
    notes: "Iconic DC venue. Very selective on bookings. Need proven ticket sales or strong press.",
    tags: ["iconic", "indie", "hip-hop", "all-ages"],
    lastContacted: "2026-04-22",
    nextFollowUp: "2026-06-15",
    relationshipStatus: "Warm",
    isDemo: true,
  },
  {
    id: "ven-003",
    name: "The Anthem",
    contactPerson: "David Marsh",
    contactTitle: "VP Talent",
    email: "talent@theanthemdc.com",
    phone: "(202) 555-0800",
    website: "theanthemdc.com",
    instagram: "@theanthemdc",
    address: "901 Wharf St SW",
    city: "Washington",
    state: "DC",
    region: "Washington, DC",
    venueType: "Theater",
    capacity: 6000,
    typicalGenres: ["All genres", "Major acts"],
    bookingEmail: "talent@theanthemdc.com",
    talentBuyerEmail: "david@theanthemdc.com",
    source: "Manual",
    sourceUrl: "",
    sourceDate: "2026-01-10",
    contactConfidence: 7,
    reviewStatus: "Verified",
    notes: "Large venue. Realistic goal is support slot, not headline. Target for Tone Brady.",
    tags: ["premium", "large", "support-slot"],
    lastContacted: "2026-05-01",
    nextFollowUp: "2026-06-01",
    relationshipStatus: "Cold",
    isDemo: true,
  },
  {
    id: "ven-004",
    name: "Ultrabar",
    contactPerson: "Ana Morales",
    contactTitle: "Events Director",
    email: "events@ultrabardc.com",
    phone: "(202) 555-0444",
    website: "ultrabardc.com",
    instagram: "@ultrabardc",
    address: "911 F St NW",
    city: "Washington",
    state: "DC",
    region: "Washington, DC",
    venueType: "Club",
    capacity: 800,
    typicalGenres: ["Latin", "Hip-Hop", "Top 40", "Reggaeton"],
    bookingEmail: "events@ultrabardc.com",
    talentBuyerEmail: "ana@ultrabardc.com",
    source: "Manual",
    sourceUrl: "",
    sourceDate: "2026-03-01",
    contactConfidence: 9,
    reviewStatus: "Verified",
    notes: "Great for El Fuego Latin nights. Already has relationship through DJ Saint Noir.",
    tags: ["latin", "nightlife", "club", "mid-capacity"],
    lastContacted: "2026-05-18",
    nextFollowUp: "2026-06-05",
    relationshipStatus: "Active Relationship",
    isDemo: true,
  },
  {
    id: "ven-005",
    name: "Creative Alliance",
    contactPerson: "Jen Patterson",
    contactTitle: "Program Director",
    email: "programs@creativealliance.org",
    phone: "(410) 555-0276",
    website: "creativealliance.org",
    instagram: "@creativealliance",
    address: "3134 Eastern Ave",
    city: "Baltimore",
    state: "MD",
    region: "Baltimore, MD",
    venueType: "Cultural Center",
    capacity: 300,
    typicalGenres: ["Indie", "World", "Jazz", "Classical", "Experimental"],
    bookingEmail: "programs@creativealliance.org",
    talentBuyerEmail: "jen@creativealliance.org",
    source: "Public Research",
    sourceUrl: "https://creativealliance.org/about/contact",
    sourceDate: "2026-04-12",
    contactConfidence: 7,
    reviewStatus: "Verified",
    notes: "Great fit for Isabella Vega and Velvet Collective. Intimate, arts-focused venue.",
    tags: ["cultural", "intimate", "arts", "baltimore"],
    lastContacted: null,
    nextFollowUp: null,
    relationshipStatus: "Cold",
    isDemo: true,
  },
  {
    id: "ven-006",
    name: "Ottobar",
    contactPerson: "Keisha Williams",
    contactTitle: "Booking",
    email: "booking@theottobar.com",
    phone: "(410) 555-0662",
    website: "theottobar.com",
    instagram: "@ottobar",
    address: "2549 N Howard St",
    city: "Baltimore",
    state: "MD",
    region: "Baltimore, MD",
    venueType: "Club",
    capacity: 500,
    typicalGenres: ["Indie", "Punk", "Hip-Hop", "Electronic"],
    bookingEmail: "booking@theottobar.com",
    talentBuyerEmail: "keisha@theottobar.com",
    source: "Referral",
    sourceUrl: "",
    sourceDate: "2026-02-28",
    contactConfidence: 8,
    reviewStatus: "Verified",
    notes: "Strong Baltimore indie venue. Good fit for Foolery, Velvet Collective. Already booked Mali Wave here.",
    tags: ["indie", "punk", "baltimore", "mid-capacity"],
    lastContacted: "2026-04-30",
    nextFollowUp: "2026-06-20",
    relationshipStatus: "Booked Before",
    isDemo: true,
  },
  {
    id: "ven-007",
    name: "Pearl Street Warehouse",
    contactPerson: "Tom Rivera",
    contactTitle: "Talent Coordinator",
    email: "talent@pearlstreetwarehouse.com",
    phone: "(202) 555-0333",
    website: "pearlstreetwarehouse.com",
    instagram: "@pearlstwarehouse",
    address: "33 Pearl St SW",
    city: "Washington",
    state: "DC",
    region: "Washington, DC",
    venueType: "Club",
    capacity: 300,
    typicalGenres: ["Indie", "Folk", "R&B", "Jazz", "Singer-Songwriter"],
    bookingEmail: "talent@pearlstreetwarehouse.com",
    talentBuyerEmail: "tom@pearlstreetwarehouse.com",
    source: "Manual",
    sourceUrl: "",
    sourceDate: "2026-03-10",
    contactConfidence: 8,
    reviewStatus: "Verified",
    notes: "Intimate Wharf venue. Excellent for Nyla Vale, Isabella Vega acoustic sets. Upscale crowd.",
    tags: ["intimate", "wharf", "upscale", "singer-songwriter"],
    lastContacted: "2026-05-05",
    nextFollowUp: "2026-06-05",
    relationshipStatus: "Warm",
    isDemo: true,
  },
  {
    id: "ven-008",
    name: "Broccoli City Festival",
    contactPerson: "Brandon Irving",
    contactTitle: "Artist Relations",
    email: "artists@broccolicity.com",
    phone: "(202) 555-0777",
    website: "broccolicity.com",
    instagram: "@broccolicity",
    address: "RFK Festival Grounds",
    city: "Washington",
    state: "DC",
    region: "Washington, DC",
    venueType: "Festival",
    capacity: 40000,
    typicalGenres: ["Hip-Hop", "R&B", "Afrobeats", "Pop"],
    bookingEmail: "artists@broccolicity.com",
    talentBuyerEmail: "brandon@broccolicity.com",
    source: "Public Research",
    sourceUrl: "https://broccolicity.com/contact",
    sourceDate: "2026-04-20",
    contactConfidence: 6,
    reviewStatus: "Needs Review",
    notes: "Major DC festival. Long shot for headline but support/emerging stage is realistic.",
    tags: ["festival", "major", "hip-hop", "large-scale"],
    lastContacted: null,
    nextFollowUp: null,
    relationshipStatus: "Cold",
    isDemo: true,
  },
  {
    id: "ven-009",
    name: "Nightclub 1722",
    contactPerson: "Ray Thompson",
    contactTitle: "Owner",
    email: "ray@1722nightclub.com",
    phone: "(202) 555-0172",
    website: "1722nightclub.com",
    instagram: "@1722dc",
    address: "1722 I St NW",
    city: "Washington",
    state: "DC",
    region: "Washington, DC",
    venueType: "Lounge",
    capacity: 200,
    typicalGenres: ["R&B", "Hip-Hop", "Jazz", "Neo-Soul"],
    bookingEmail: "ray@1722nightclub.com",
    talentBuyerEmail: "ray@1722nightclub.com",
    source: "Manual",
    sourceUrl: "",
    sourceDate: "2026-03-05",
    contactConfidence: 9,
    reviewStatus: "Verified",
    notes: "Intimate downtown DC lounge. Perfect for Nyla Vale, Kira Moon. Owner is responsive.",
    tags: ["lounge", "intimate", "rnb", "downtown"],
    lastContacted: "2026-05-20",
    nextFollowUp: "2026-06-03",
    relationshipStatus: "Active Relationship",
    isDemo: true,
  },
  {
    id: "ven-010",
    name: "Howard University Cramton",
    contactPerson: "Danielle Adams",
    contactTitle: "Student Activities Coordinator",
    email: "events@howard.edu",
    phone: "(202) 555-0411",
    website: "howard.edu",
    instagram: "@howardu",
    address: "2455 6th St NW",
    city: "Washington",
    state: "DC",
    region: "Washington, DC",
    venueType: "College",
    capacity: 1500,
    typicalGenres: ["Hip-Hop", "R&B", "Afrobeats", "Neo-Soul"],
    bookingEmail: "events@howard.edu",
    talentBuyerEmail: "danielle.adams@howard.edu",
    source: "CSV Import",
    sourceUrl: "",
    sourceDate: "2026-04-01",
    contactConfidence: 6,
    reviewStatus: "Needs Review",
    notes: "HBCU market entry point. Homecoming and spring fest are key booking windows.",
    tags: ["college", "hbcu", "hip-hop", "rnb"],
    lastContacted: null,
    nextFollowUp: null,
    relationshipStatus: "Cold",
    isDemo: true,
  },
  {
    id: "ven-011",
    name: "The Hamilton Live",
    contactPerson: "Rebecca Torres",
    contactTitle: "Live Music Director",
    email: "live@thehamiltondc.com",
    phone: "(202) 555-0614",
    website: "thehamiltondc.com",
    instagram: "@thehamiltondc",
    address: "600 14th St NW",
    city: "Washington",
    state: "DC",
    region: "Washington, DC",
    venueType: "Restaurant/Bar",
    capacity: 400,
    typicalGenres: ["Jazz", "R&B", "Blues", "Singer-Songwriter", "Classical Crossover"],
    bookingEmail: "live@thehamiltondc.com",
    talentBuyerEmail: "rebecca@thehamiltondc.com",
    source: "Public Research",
    sourceUrl: "https://thehamiltondc.com/live-music",
    sourceDate: "2026-04-18",
    contactConfidence: 7,
    reviewStatus: "Verified",
    notes: "Upscale restaurant with dedicated live music space. Great for Isabella Vega, Nyla Vale.",
    tags: ["restaurant", "upscale", "jazz", "classical"],
    lastContacted: "2026-05-12",
    nextFollowUp: "2026-06-12",
    relationshipStatus: "Warm",
    isDemo: true,
  },
  {
    id: "ven-012",
    name: "Reyes Entertainment Group",
    contactPerson: "Luis Reyes",
    contactTitle: "Promoter",
    email: "luis@reyesentertainment.com",
    phone: "(301) 555-0888",
    website: "reyesentertainment.com",
    instagram: "@reyesentdc",
    address: "P.O. Box 5541",
    city: "Hyattsville",
    state: "MD",
    region: "Prince George's County, MD",
    venueType: "Promoter",
    capacity: 0,
    typicalGenres: ["Latin", "Reggaeton", "Dembow", "Bachata"],
    bookingEmail: "luis@reyesentertainment.com",
    talentBuyerEmail: "luis@reyesentertainment.com",
    source: "Referral",
    sourceUrl: "",
    sourceDate: "2026-04-05",
    contactConfidence: 8,
    reviewStatus: "Verified",
    notes: "Key Latin promoter in PG County / DC. Books Latin nights at multiple venues. Priority contact for El Fuego.",
    tags: ["promoter", "latin", "pg-county", "multi-venue"],
    lastContacted: "2026-05-22",
    nextFollowUp: "2026-06-08",
    relationshipStatus: "Active Relationship",
    isDemo: true,
  },
];

export const demoCampaigns: AdminCampaign[] = [
  {
    id: "C-101",
    name: "El Fuego — DMV Latin Club Push",
    artistId: "art-002",
    artistName: "El Fuego",
    targetMarket: "Washington, DC / PG County",
    targetSegment: "Latin Clubs & Promoters",
    status: "Running",
    outreachPlatform: "Smartlead",
    objective: "Club Performance",
    contactCount: 24,
    emailSequence: [
      { step: 1, label: "Intro Pitch", subject: "High-energy Dembow act for your next Latin night", body: "Hi {{first_name}},\n\nMy name is James from HighLife. We manage El Fuego, a Dominican-born Dembow/Reggaeton artist based in Silver Spring who has been tearing up Latin nights across the DMV.\n\nHe recently held a residency at Ultrabar and opened for Farruko at Echostage. His sets are high-energy, bilingual, and built for dance floors.\n\nWould {{venue_name}} be interested in booking El Fuego for an upcoming Latin night or club event?\n\nHappy to send his EPK and sample set videos.\n\nBest,\nJames\nHighLife", delayDays: 0 },
      { step: 2, label: "Follow-up 1", subject: "Re: El Fuego — quick follow-up", body: "Hi {{first_name}},\n\nJust wanted to bump this in case it got buried. El Fuego is actively booking DMV dates for summer 2026 and I think he could bring great energy to {{venue_name}}.\n\nLet me know if you are open to reviewing his material.\n\nBest,\nJames", delayDays: 3 },
      { step: 3, label: "Social Proof", subject: "El Fuego — 45K TikTok followers + Echostage opener", body: "Hi {{first_name}},\n\nOne more note — El Fuego recently crossed 45,000 TikTok followers and his content consistently pulls 6%+ engagement. His live show at Fiesta DC Main Stage drew a packed crowd.\n\nIf Latin programming is on your calendar, he is worth a look.\n\nEPK available on request.\n\nBest,\nJames", delayDays: 5 },
      { step: 4, label: "Final Check", subject: "Last note — El Fuego availability", body: "Hi {{first_name}},\n\nLast note from me on this. El Fuego has a few DMV dates filling up for summer and I wanted to give {{venue_name}} first consideration.\n\nIf the timing is not right now, no worries at all — happy to reconnect later in the year.\n\nBest,\nJames", delayDays: 7 },
    ],
    owner: "James Carter",
    createdDate: "2026-05-01",
    approvedBy: "James Carter",
    sentDate: "2026-05-05",
    notes: "First Latin-focused campaign. Testing messaging with promoters and club bookers.",
    isDemo: true,
  },
  {
    id: "C-102",
    name: "Isabella Vega — Cultural & Private Events",
    artistId: "art-001",
    artistName: "Isabella Vega",
    targetMarket: "Washington, DC / Montgomery County",
    targetSegment: "Cultural Centers & Private Event Buyers",
    status: "Approved",
    outreachPlatform: "None/Manual",
    objective: "Private Event",
    contactCount: 12,
    emailSequence: [
      { step: 1, label: "Intro Pitch", subject: "Classically trained vocalist for cultural programming", body: "Hi {{first_name}},\n\nI am reaching out from HighLife regarding Isabella Vega, a Peabody-trained mezzo-soprano based in Washington, DC.\n\nIsabella has performed at the Kennedy Center Millennium Stage, embassy cultural galas, and private events throughout the DMV. She brings classical vocal power to contemporary settings and is ideal for elevated cultural, private, and special event programming.\n\nWould {{venue_name}} be open to exploring a performance opportunity?\n\nI would be happy to share her full EPK and performance footage.\n\nBest,\nJames\nHighLife", delayDays: 0 },
      { step: 2, label: "Follow-up 1", subject: "Re: Isabella Vega — cultural performance inquiry", body: "Hi {{first_name}},\n\nJust following up on my note about Isabella Vega. She has availability for select engagements this summer and fall, and I thought {{venue_name}} could be a wonderful fit for her artistry.\n\nHappy to arrange a brief call or send her EPK directly.\n\nBest,\nJames", delayDays: 4 },
      { step: 3, label: "Value Add", subject: "Isabella Vega — Kennedy Center + embassy experience", body: "Hi {{first_name}},\n\nQuick additional context — Isabella was recently featured at the French Embassy Cultural Gala and has a guest artist credit with the Baltimore Symphony. Her press describes her as \"a voice that stops rooms.\"\n\nIf you are programming cultural or special events, she brings a rare level of artistry.\n\nBest,\nJames", delayDays: 6 },
      { step: 4, label: "Final Check", subject: "Closing note — Isabella Vega availability", body: "Hi {{first_name}},\n\nFinal note from me. Isabella Vega is selectively booking for the remainder of 2026 and I wanted to ensure {{venue_name}} had the opportunity to connect.\n\nIf the timing does not work now, I am happy to revisit later in the year.\n\nWarm regards,\nJames", delayDays: 8 },
    ],
    owner: "James Carter",
    createdDate: "2026-05-10",
    approvedBy: "James Carter",
    sentDate: null,
    notes: "Manual outreach — cultural venues and private event contacts. High-touch approach.",
    isDemo: true,
  },
  {
    id: "C-103",
    name: "Foolery — DMV College Circuit",
    artistId: "art-005",
    artistName: "Foolery",
    targetMarket: "DMV",
    targetSegment: "Colleges & Indie Venues",
    status: "Completed",
    outreachPlatform: "Instantly",
    objective: "College Event",
    contactCount: 28,
    emailSequence: [
      { step: 1, label: "Intro Pitch", subject: "DMV artist available for upcoming campus programming", body: "Hi {{first_name}},\n\nMy name is James from HighLife. We are working with Foolery, an alternative rap artist based in DC who has been building a strong following in the DMV indie scene.\n\nFoolery has performed at Howard Homecoming, Broccoli City warmup shows, and Black Room DC. His live show is high-energy and works well for college audiences who appreciate genre-bending hip-hop.\n\nWould it make sense to connect about a possible date at {{venue_name}}?\n\nBest,\nJames\nHighLife", delayDays: 0 },
      { step: 2, label: "Follow-up 1", subject: "Re: Foolery — campus booking follow-up", body: "Hi {{first_name}},\n\nQuick follow-up on Foolery. He is actively looking for campus dates this fall and has clean versions of his set available for campus compliance requirements.\n\nHappy to send his EPK and performance clips.\n\nBest,\nJames", delayDays: 3 },
      { step: 3, label: "Social Proof", subject: "Foolery — 7%+ engagement rate + Howard Homecoming", body: "Hi {{first_name}},\n\nOne more data point — Foolery pulls a 7.2% average engagement rate on social media, well above industry average. His Howard Homecoming performance was standing room only.\n\nIf you are booking hip-hop or alternative acts, he is worth reviewing.\n\nBest,\nJames", delayDays: 5 },
      { step: 4, label: "Final Check", subject: "Last note — Foolery fall availability", body: "Hi {{first_name}},\n\nFinal follow-up. Foolery has limited fall availability remaining and I wanted to give {{venue_name}} the chance to connect before his schedule fills.\n\nNo pressure — happy to revisit in the spring if timing is better.\n\nBest,\nJames", delayDays: 7 },
    ],
    owner: "Maria Lopez",
    createdDate: "2026-04-01",
    approvedBy: "James Carter",
    sentDate: "2026-04-05",
    notes: "College circuit test campaign. Got 3 positive replies, 1 booking.",
    isDemo: true,
  },
  {
    id: "C-104",
    name: "Nyla Vale — DC Lounge Promoters",
    artistId: "art-004",
    artistName: "Nyla Vale",
    targetMarket: "Washington, DC",
    targetSegment: "Lounges & Upscale Venues",
    status: "Needs Approval",
    outreachPlatform: "None/Manual",
    objective: "Book Show",
    contactCount: 18,
    emailSequence: [
      { step: 1, label: "Intro Pitch", subject: "R&B vocalist for your live music programming", body: "Hi {{first_name}},\n\nI am reaching out from HighLife regarding Nyla Vale, an Atlanta-based R&B vocalist who is expanding her presence in the DC market.\n\nNyla has performed at Essence Fest, Art Basel privates, and HighLife Sessions. Her sound is perfect for upscale lounge environments — intimate, soulful, and premium.\n\nWould {{venue_name}} be interested in exploring a live performance booking?\n\nHappy to share her EPK and recent performance footage.\n\nBest,\nJames\nHighLife", delayDays: 0 },
      { step: 2, label: "Follow-up 1", subject: "Re: Nyla Vale — DC lounge dates", body: "Hi {{first_name}},\n\nFollowing up on Nyla Vale. She is planning a DC market push this summer and has a few select dates available.\n\nHer style works beautifully in intimate, upscale settings. Let me know if you would like to review her material.\n\nBest,\nJames", delayDays: 4 },
      { step: 3, label: "Value Add", subject: "Nyla Vale — 78K Spotify monthly listeners", body: "Hi {{first_name}},\n\nQuick note — Nyla recently crossed 78,000 monthly listeners on Spotify and has been featured on several editorial playlists. Her audience skews 25-45 with strong purchasing power.\n\nIf you are looking for live music that draws an upscale crowd, she is a strong fit.\n\nBest,\nJames", delayDays: 6 },
      { step: 4, label: "Final Check", subject: "Closing note — Nyla Vale summer availability", body: "Hi {{first_name}},\n\nLast note from me. Nyla Vale has limited summer availability and I wanted to make sure {{venue_name}} had the opportunity to connect.\n\nHappy to circle back later if the timing is better.\n\nBest,\nJames", delayDays: 8 },
    ],
    owner: "Maria Lopez",
    createdDate: "2026-05-25",
    approvedBy: null,
    sentDate: null,
    notes: "Draft campaign for DC lounge market. Awaiting James's approval.",
    isDemo: true,
  },
  {
    id: "C-105",
    name: "Tone Brady — DMV Club Buyers",
    artistId: "art-003",
    artistName: "Tone Brady",
    targetMarket: "DMV",
    targetSegment: "Hip-Hop Clubs & Festival Stages",
    status: "Draft",
    outreachPlatform: "Smartlead",
    objective: "Book Show",
    contactCount: 32,
    emailSequence: [
      { step: 1, label: "Intro Pitch", subject: "Atlanta hip-hop artist expanding into DMV market", body: "Hi {{first_name}},\n\nI am reaching out from HighLife. We manage Tone Brady, an Atlanta-based hip-hop artist with 185K Spotify monthly listeners who is looking to build his presence in the DMV market.\n\nTone has headlined HighLife Sessions ATL, performed at A3C Festival, and headlined Culture Room Miami. His live show is high-energy and professionally produced.\n\nWould {{venue_name}} be open to discussing a booking for an upcoming date?\n\nHappy to share his EPK and full press kit.\n\nBest,\nJames\nHighLife", delayDays: 0 },
      { step: 2, label: "Follow-up 1", subject: "Re: Tone Brady — DMV booking inquiry", body: "Hi {{first_name}},\n\nJust bumping this. Tone Brady is specifically targeting DMV dates for late summer / fall 2026 and we are being selective about the right venues.\n\n{{venue_name}} stood out as a strong fit for his audience. Let me know if you are open to reviewing his material.\n\nBest,\nJames", delayDays: 3 },
      { step: 3, label: "Social Proof", subject: "Tone Brady — 185K Spotify + HipHopDX feature", body: "Hi {{first_name}},\n\nQuick context — Tone was recently featured in HipHopDX as \"a performer who earns every room\" and crossed 120K TikTok followers this month. His Atlanta shows consistently sell out.\n\nIf hip-hop programming is on your calendar, he brings proven draw and energy.\n\nBest,\nJames", delayDays: 5 },
      { step: 4, label: "Final Check", subject: "Final note — Tone Brady DMV availability", body: "Hi {{first_name}},\n\nLast note from me on this. Tone Brady has a few DMV dates remaining on his summer/fall calendar and I wanted to give {{venue_name}} the opportunity before his schedule is finalized.\n\nHappy to circle back later if the timing does not work now.\n\nBest,\nJames", delayDays: 7 },
    ],
    owner: "James Carter",
    createdDate: "2026-05-28",
    approvedBy: null,
    sentDate: null,
    notes: "High-priority campaign draft. Need to finalize contact list before sending for approval.",
    isDemo: true,
  },
];

export const demoOpportunities: AdminOpportunity[] = [
  {
    id: "opp-001",
    artistId: "art-005",
    artistName: "Foolery",
    venueId: "ven-002",
    venueName: "9:30 Club",
    campaignId: "C-103",
    eventDate: "2026-08-15",
    proposedFee: 4500,
    expectedFee: 4000,
    confirmedFee: null,
    status: "Negotiating",
    probability: 60,
    nextTask: "Send updated rider and confirm date availability",
    owner: "James Carter",
    notes: "Venue interested in Foolery as support act for a larger indie show. Negotiating fee.",
    isDemo: true,
  },
  {
    id: "opp-002",
    artistId: "art-004",
    artistName: "Nyla Vale",
    venueId: "ven-003",
    venueName: "The Anthem (Support)",
    campaignId: null,
    eventDate: "2026-09-20",
    proposedFee: 8000,
    expectedFee: 7000,
    confirmedFee: null,
    status: "Replied",
    probability: 30,
    nextTask: "Follow up with talent buyer on support slot details",
    owner: "James Carter",
    notes: "Inbound reply from Anthem talent buyer. Interested in Nyla as support for a larger R&B show.",
    isDemo: true,
  },
  {
    id: "opp-003",
    artistId: "art-006",
    artistName: "DJ Saint Noir",
    venueId: "ven-001",
    venueName: "Echostage",
    campaignId: null,
    eventDate: "2026-07-18",
    proposedFee: 6000,
    expectedFee: 5500,
    confirmedFee: 5500,
    status: "Contract Pending",
    probability: 90,
    nextTask: "Review contract draft and sign",
    owner: "James Carter",
    notes: "Contract received from Echostage for DJ Saint Noir support set. Under review.",
    isDemo: true,
  },
  {
    id: "opp-004",
    artistId: "art-003",
    artistName: "Tone Brady",
    venueId: "ven-002",
    venueName: "9:30 Club",
    campaignId: "C-105",
    eventDate: "2026-10-05",
    proposedFee: 12000,
    expectedFee: 10000,
    confirmedFee: null,
    status: "Interested",
    probability: 40,
    nextTask: "Schedule call with booking manager",
    owner: "James Carter",
    notes: "Booking manager expressed interest after reviewing EPK. Need to schedule call.",
    isDemo: true,
  },
  {
    id: "opp-005",
    artistId: "art-002",
    artistName: "El Fuego",
    venueId: "ven-004",
    venueName: "Ultrabar",
    campaignId: "C-101",
    eventDate: "2026-07-04",
    proposedFee: 3000,
    expectedFee: 2500,
    confirmedFee: 2500,
    status: "Booked",
    probability: 100,
    nextTask: "Confirm production requirements and send advance",
    owner: "Maria Lopez",
    notes: "Booked for July 4th Latin night. Confirmed through Luis Reyes / Reyes Entertainment.",
    isDemo: true,
  },
  {
    id: "opp-006",
    artistId: "art-001",
    artistName: "Isabella Vega",
    venueId: "ven-011",
    venueName: "The Hamilton Live",
    campaignId: "C-102",
    eventDate: "2026-08-22",
    proposedFee: 5000,
    expectedFee: 4500,
    confirmedFee: null,
    status: "Contacted",
    probability: 20,
    nextTask: "Wait for reply to initial pitch email",
    owner: "James Carter",
    notes: "Initial outreach sent. Hamilton has classical crossover programming that fits Isabella well.",
    isDemo: true,
  },
  {
    id: "opp-007",
    artistId: "art-007",
    artistName: "The Velvet Collective",
    venueId: "ven-006",
    venueName: "Ottobar",
    campaignId: null,
    eventDate: "2026-09-10",
    proposedFee: 3500,
    expectedFee: 3000,
    confirmedFee: null,
    status: "Lead",
    probability: 15,
    nextTask: "Draft outreach email for Ottobar booking contact",
    owner: "Maria Lopez",
    notes: "Ottobar is a known Velvet Collective fan venue. Good shot at a headliner spot.",
    isDemo: true,
  },
  {
    id: "opp-008",
    artistId: "art-002",
    artistName: "El Fuego",
    venueId: "ven-010",
    venueName: "Howard University Cramton",
    campaignId: "C-101",
    eventDate: null,
    proposedFee: 2000,
    expectedFee: 1800,
    confirmedFee: null,
    status: "Lost",
    probability: 0,
    nextTask: "Archive — budget did not align",
    owner: "Maria Lopez",
    notes: "Student activities budget could not accommodate. Will revisit for spring semester.",
    isDemo: true,
  },
  {
    id: "opp-009",
    artistId: "art-003",
    artistName: "Tone Brady",
    venueId: "ven-008",
    venueName: "Broccoli City Festival",
    campaignId: null,
    eventDate: "2026-06-14",
    proposedFee: 15000,
    expectedFee: 12000,
    confirmedFee: null,
    status: "Follow-up Later",
    probability: 25,
    nextTask: "Re-engage in January when lineup planning begins",
    owner: "James Carter",
    notes: "Too late for 2026 lineup. Building relationship for 2027 consideration.",
    isDemo: true,
  },
  {
    id: "opp-010",
    artistId: "art-004",
    artistName: "Nyla Vale",
    venueId: "ven-009",
    venueName: "Nightclub 1722",
    campaignId: null,
    eventDate: "2026-07-25",
    proposedFee: 4000,
    expectedFee: 3500,
    confirmedFee: 3500,
    status: "Booked",
    probability: 100,
    nextTask: "Send advance materials and confirm load-in time",
    owner: "James Carter",
    notes: "Confirmed for a Friday night R&B showcase. Owner excited about the booking.",
    isDemo: true,
  },
];

export const demoEpks: AdminEpk[] = [
  { id: "epk-001", artistId: "art-001", artistName: "Isabella Vega", status: "Published", createdDate: "2026-04-15", lastEdited: "2026-05-20", publishUrl: "/epk/isabella-vega", isDemo: true },
  { id: "epk-002", artistId: "art-002", artistName: "El Fuego", status: "Approved", createdDate: "2026-04-20", lastEdited: "2026-05-18", publishUrl: null, isDemo: true },
  { id: "epk-003", artistId: "art-003", artistName: "Tone Brady", status: "Published", createdDate: "2026-03-10", lastEdited: "2026-05-25", publishUrl: "/epk/tone-brady", isDemo: true },
  { id: "epk-004", artistId: "art-004", artistName: "Nyla Vale", status: "Draft", createdDate: "2026-05-25", lastEdited: "2026-05-28", publishUrl: null, isDemo: true },
  { id: "epk-005", artistId: "art-005", artistName: "Foolery", status: "Draft", createdDate: "2026-05-10", lastEdited: "2026-05-15", publishUrl: null, isDemo: true },
  { id: "epk-006", artistId: "art-006", artistName: "DJ Saint Noir", status: "Approved", createdDate: "2026-04-28", lastEdited: "2026-05-22", publishUrl: null, isDemo: true },
  { id: "epk-007", artistId: "art-007", artistName: "The Velvet Collective", status: "Archived", createdDate: "2026-03-01", lastEdited: "2026-04-01", publishUrl: null, isDemo: true },
  { id: "epk-008", artistId: "art-008", artistName: "Kira Moon", status: "Archived", createdDate: "2026-02-15", lastEdited: "2026-03-10", publishUrl: null, isDemo: true },
];

export const demoResearchQueue: ResearchContact[] = [
  { id: "rq-001", name: "Marcus Johnson", email: "marcus@blueplanetdc.com", organization: "Blue Planet Lounge", role: "Owner", sourceUrl: "https://blueplanetdc.com/about", sourceDate: "2026-05-28", region: "Washington, DC", venueType: "Lounge", action: "Pending", notes: "Found via Google Maps search for DC lounges with live music.", isDemo: true },
  { id: "rq-002", name: "Sandra Lee", email: "sandra@georgetownarts.org", organization: "Georgetown Arts Council", role: "Events Coordinator", sourceUrl: "https://georgetownarts.org/staff", sourceDate: "2026-05-27", region: "Washington, DC", venueType: "Cultural Center", action: "Pending", notes: "Arts council that programs cultural events. May be a good fit for Isabella Vega.", isDemo: true },
  { id: "rq-003", name: "DJ Haze", email: "djhaze@hotmail.com", organization: "Haze Events", role: "Promoter", sourceUrl: "https://instagram.com/djhaze_events", sourceDate: "2026-05-26", region: "Montgomery County, MD", venueType: "Promoter", action: "Pending", notes: "MoCo promoter running hip-hop events at multiple venues. Source: Instagram bio link.", isDemo: true },
  { id: "rq-004", name: "Rachel Kim", email: "rachel@songbyrddc.com", organization: "Songbyrd Music House", role: "Talent Buyer", sourceUrl: "https://songbyrddc.com/contact", sourceDate: "2026-05-25", region: "Washington, DC", venueType: "Club", action: "Pending", notes: "Adams Morgan venue with indie and hip-hop programming.", isDemo: true },
  { id: "rq-005", name: "Anthony Brooks", email: "anthony@piemontemgmt.com", organization: "Piemonte Management", role: "Booking Agent", sourceUrl: "https://piemontemgmt.com/team", sourceDate: "2026-05-24", region: "Northern Virginia", venueType: "Other", action: "Pending", notes: "NoVA-based booking agency. May have venue connections we can leverage.", isDemo: true },
  { id: "rq-006", name: "Duplicate — Mike Chen", email: "talent@echostage.com", organization: "Echostage", role: "Talent Buyer", sourceUrl: "https://echostage.com/contact", sourceDate: "2026-05-28", region: "Washington, DC", venueType: "Club", action: "Pending", notes: "Possible duplicate of existing Echostage contact.", isDemo: true },
  { id: "rq-007", name: "Patricia Wells", email: "patricia@blackcatdc.com", organization: "Black Cat DC", role: "Booking Manager", sourceUrl: "https://blackcatdc.com/contact.html", sourceDate: "2026-05-23", region: "Washington, DC", venueType: "Club", action: "Pending", notes: "Historic DC indie/punk venue. Good fit for Foolery and Velvet Collective.", isDemo: true },
  { id: "rq-008", name: "Carlos Mendez", email: "cmendez@salsa-nights.com", organization: "Salsa Nights DMV", role: "Event Producer", sourceUrl: "https://salsa-nights.com/team", sourceDate: "2026-05-22", region: "Prince George's County, MD", venueType: "Promoter", action: "Pending", notes: "Latin event producer in PG County. Potential partner for El Fuego bookings.", isDemo: true },
];

// ── Helper functions ────────────────────────────────────────

export function getArtistById(id: string): AdminArtist | undefined {
  return demoArtists.find((a) => a.id === id);
}

export function getVenueById(id: string): AdminVenue | undefined {
  return demoVenues.find((v) => v.id === id);
}

export function getCampaignById(id: string): AdminCampaign | undefined {
  return demoCampaigns.find((c) => c.id === id);
}

export function getOpportunityById(id: string): AdminOpportunity | undefined {
  return demoOpportunities.find((o) => o.id === id);
}
