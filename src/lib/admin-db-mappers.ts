// HighLife Live -- DB <-> Admin-Data type mappers
// Bridges the gap between Prisma model shapes and the admin-data.ts interfaces
// used by the frontend. Keeps schema and admin-data.ts untouched.

import type {
  Artist as PrismaArtist,
  Venue as PrismaVenue,
  Campaign as PrismaCampaign,
  Opportunity as PrismaOpportunity,
  EPK as PrismaEPK,
  Contact as PrismaContact,
} from "@prisma/client";

import type {
  AdminArtist,
  AdminVenue,
  AdminCampaign,
  AdminOpportunity,
  AdminEpk,
  ResearchContact,
  CampaignEmail,
} from "./admin-data";

// ── Artists ─────────────────────────────────────────────────

export function dbArtistToAdmin(
  a: PrismaArtist
): AdminArtist {
  return {
    id: a.id,
    name: a.name,
    status: a.status as AdminArtist["status"],
    legalName: a.legalName,
    email: a.email,
    phone: a.phone,
    managerContact: a.managerContact,
    primaryGenre: a.primaryGenre,
    secondaryGenres: a.secondaryGenres,
    performanceType: a.performanceType as AdminArtist["performanceType"],
    typicalSetLength: a.typicalSetLength,
    bookingFeeRange: a.bookingFeeRange,
    travelWillingness: a.travelWillingness,
    targetVenueTypes: a.targetVenueTypes,
    ageDemoAppeal: a.ageDemoAppeal,
    cleanExplicit: a.cleanExplicit,
    bio: a.bio,
    shortPitch: a.shortPitch,
    pressQuotes: a.pressQuotes,
    internalNotes: a.internalNotes,
    image: a.image,
    socials: {
      instagram: a.socialInstagram || undefined,
      tiktok: a.socialTiktok || undefined,
      youtube: a.socialYoutube || undefined,
      spotify: a.socialSpotify || undefined,
      appleMusic: a.socialAppleMusic || undefined,
      soundcloud: a.socialSoundcloud || undefined,
      website: a.socialWebsite || undefined,
      linktree: a.socialLinktree || undefined,
    },
    isDemo: a.isDemo as true,
  };
}

export function adminArtistToDbInput(a: Partial<AdminArtist>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (a.name !== undefined) data.name = a.name;
  if (a.status !== undefined) data.status = a.status;
  if (a.legalName !== undefined) data.legalName = a.legalName;
  if (a.email !== undefined) data.email = a.email;
  if (a.phone !== undefined) data.phone = a.phone;
  if (a.managerContact !== undefined) data.managerContact = a.managerContact;
  if (a.primaryGenre !== undefined) data.primaryGenre = a.primaryGenre;
  if (a.secondaryGenres !== undefined) data.secondaryGenres = a.secondaryGenres;
  if (a.performanceType !== undefined) data.performanceType = a.performanceType;
  if (a.typicalSetLength !== undefined) data.typicalSetLength = a.typicalSetLength;
  if (a.bookingFeeRange !== undefined) data.bookingFeeRange = a.bookingFeeRange;
  if (a.travelWillingness !== undefined) data.travelWillingness = a.travelWillingness;
  if (a.targetVenueTypes !== undefined) data.targetVenueTypes = a.targetVenueTypes;
  if (a.ageDemoAppeal !== undefined) data.ageDemoAppeal = a.ageDemoAppeal;
  if (a.cleanExplicit !== undefined) data.cleanExplicit = a.cleanExplicit;
  if (a.bio !== undefined) data.bio = a.bio;
  if (a.shortPitch !== undefined) data.shortPitch = a.shortPitch;
  if (a.pressQuotes !== undefined) data.pressQuotes = a.pressQuotes;
  if (a.internalNotes !== undefined) data.internalNotes = a.internalNotes;
  if (a.image !== undefined) data.image = a.image;
  if (a.isDemo !== undefined) data.isDemo = a.isDemo;

  // Flatten socials
  if (a.socials) {
    data.socialInstagram = a.socials.instagram ?? "";
    data.socialTiktok = a.socials.tiktok ?? "";
    data.socialYoutube = a.socials.youtube ?? "";
    data.socialSpotify = a.socials.spotify ?? "";
    data.socialAppleMusic = a.socials.appleMusic ?? "";
    data.socialSoundcloud = a.socials.soundcloud ?? "";
    data.socialWebsite = a.socials.website ?? "";
    data.socialLinktree = a.socials.linktree ?? "";
  }

  return data;
}

// ── Venues ──────────────────────────────────────────────────

export function dbVenueToAdmin(v: PrismaVenue): AdminVenue {
  return {
    id: v.id,
    name: v.name,
    contactPerson: v.contactPerson,
    contactTitle: v.contactTitle,
    email: v.email,
    phone: v.phone,
    website: v.website,
    instagram: v.instagram,
    facebook: (v as PrismaVenue & { facebook?: string }).facebook ?? "",
    address: v.address,
    city: v.city,
    state: v.state,
    region: v.region,
    zipCode: v.zipCode,
    venueType: v.venueType as AdminVenue["venueType"],
    capacity: v.capacity,
    typicalGenres: v.typicalGenres,
    bookingEmail: v.bookingEmail,
    talentBuyerEmail: v.talentBuyerEmail,
    source: v.source as AdminVenue["source"],
    sourceUrl: v.sourceUrl,
    sourceDate: v.sourceDate,
    contactConfidence: v.contactConfidence,
    reviewStatus: v.reviewStatus as AdminVenue["reviewStatus"],
    tags: v.tags,
    lastContacted: v.lastContacted
      ? v.lastContacted.toISOString().slice(0, 10)
      : null,
    nextFollowUp: v.nextFollowUp
      ? v.nextFollowUp.toISOString().slice(0, 10)
      : null,
    relationshipStatus: v.relationshipStatus as AdminVenue["relationshipStatus"],
    isDemo: v.isDemo as true,
  };
}

export function adminVenueToDbInput(v: Partial<AdminVenue>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (v.name !== undefined) data.name = v.name;
  if (v.contactPerson !== undefined) data.contactPerson = v.contactPerson;
  if (v.contactTitle !== undefined) data.contactTitle = v.contactTitle;
  if (v.email !== undefined) data.email = v.email;
  if (v.phone !== undefined) data.phone = v.phone;
  if (v.website !== undefined) data.website = v.website;
  if (v.instagram !== undefined) data.instagram = v.instagram;
  if (v.facebook !== undefined) data.facebook = v.facebook;
  if (v.address !== undefined) data.address = v.address;
  if (v.city !== undefined) data.city = v.city;
  if (v.state !== undefined) data.state = v.state;
  if (v.region !== undefined) data.region = v.region;
  if (v.zipCode !== undefined) data.zipCode = v.zipCode;
  if (v.venueType !== undefined) data.venueType = v.venueType;
  if (v.capacity !== undefined) data.capacity = v.capacity;
  if (v.typicalGenres !== undefined) data.typicalGenres = v.typicalGenres;
  if (v.bookingEmail !== undefined) data.bookingEmail = v.bookingEmail;
  if (v.talentBuyerEmail !== undefined) data.talentBuyerEmail = v.talentBuyerEmail;
  if (v.source !== undefined) data.source = v.source;
  if (v.sourceUrl !== undefined) data.sourceUrl = v.sourceUrl;
  if (v.sourceDate !== undefined) data.sourceDate = v.sourceDate;
  if (v.contactConfidence !== undefined) data.contactConfidence = v.contactConfidence;
  if (v.reviewStatus !== undefined) data.reviewStatus = v.reviewStatus;
  if (v.tags !== undefined) data.tags = v.tags;
  if (v.relationshipStatus !== undefined) data.relationshipStatus = v.relationshipStatus;
  if (v.isDemo !== undefined) data.isDemo = v.isDemo;

  // Convert date strings to Date objects for Prisma
  if (v.lastContacted !== undefined) {
    data.lastContacted = v.lastContacted ? new Date(v.lastContacted) : null;
  }
  if (v.nextFollowUp !== undefined) {
    data.nextFollowUp = v.nextFollowUp ? new Date(v.nextFollowUp) : null;
  }

  return data;
}

// ── Campaigns ───────────────────────────────────────────────

type PrismaCampaignWithArtist = PrismaCampaign & {
  artist?: { name: string };
};

export function dbCampaignToAdmin(
  c: PrismaCampaignWithArtist
): AdminCampaign {
  return {
    id: c.id,
    name: c.name,
    artistId: c.artistId,
    artistName: c.artist?.name ?? "",
    targetMarket: c.targetMarket,
    targetSegment: c.targetSegment,
    status: c.status as AdminCampaign["status"],
    outreachPlatform: c.outreachPlatform,
    objective: c.objective as AdminCampaign["objective"],
    contactCount: c.contactCount,
    emailSequence: (c.emailSequence as unknown as CampaignEmail[]) ?? [],
    owner: c.owner,
    createdDate: c.createdDate,
    approvedBy: c.approvedBy ?? null,
    sentDate: c.sentDate ?? null,
    notes: c.notes,
    isDemo: c.isDemo as true,
  };
}

export function adminCampaignToDbInput(c: Partial<AdminCampaign>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (c.name !== undefined) data.name = c.name;
  if (c.artistId !== undefined) data.artistId = c.artistId;
  if (c.targetMarket !== undefined) data.targetMarket = c.targetMarket;
  if (c.targetSegment !== undefined) data.targetSegment = c.targetSegment;
  if (c.status !== undefined) data.status = c.status;
  if (c.outreachPlatform !== undefined) data.outreachPlatform = c.outreachPlatform;
  if (c.objective !== undefined) data.objective = c.objective;
  if (c.contactCount !== undefined) data.contactCount = c.contactCount;
  if (c.emailSequence !== undefined) data.emailSequence = JSON.parse(JSON.stringify(c.emailSequence));
  if (c.owner !== undefined) data.owner = c.owner;
  if (c.createdDate !== undefined) data.createdDate = c.createdDate;
  if (c.approvedBy !== undefined) data.approvedBy = c.approvedBy;
  if (c.sentDate !== undefined) data.sentDate = c.sentDate;
  if (c.notes !== undefined) data.notes = c.notes;
  if (c.isDemo !== undefined) data.isDemo = c.isDemo;

  return data;
}

// ── Opportunities ───────────────────────────────────────────

type PrismaOpportunityWithRelations = PrismaOpportunity & {
  artist?: { name: string };
  venue?: { name: string };
};

export function dbOpportunityToAdmin(
  o: PrismaOpportunityWithRelations
): AdminOpportunity {
  return {
    id: o.id,
    artistId: o.artistId,
    artistName: o.artist?.name ?? "",
    venueId: o.venueId,
    venueName: o.venue?.name ?? "",
    campaignId: o.campaignId ?? null,
    eventDate: o.eventDate ? o.eventDate.toISOString().slice(0, 10) : null,
    proposedFee: o.proposedFee,
    expectedFee: o.expectedFee,
    confirmedFee: o.confirmedFee ?? null,
    status: o.status as AdminOpportunity["status"],
    probability: o.probability,
    nextTask: o.nextTask,
    owner: o.owner,
    notes: o.notes,
    isDemo: o.isDemo as true,
  };
}

export function adminOpportunityToDbInput(o: Partial<AdminOpportunity>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (o.artistId !== undefined) data.artistId = o.artistId;
  if (o.venueId !== undefined) data.venueId = o.venueId;
  if (o.campaignId !== undefined) data.campaignId = o.campaignId;
  if (o.proposedFee !== undefined) data.proposedFee = o.proposedFee;
  if (o.expectedFee !== undefined) data.expectedFee = o.expectedFee;
  if (o.confirmedFee !== undefined) data.confirmedFee = o.confirmedFee;
  if (o.status !== undefined) data.status = o.status;
  if (o.probability !== undefined) data.probability = o.probability;
  if (o.nextTask !== undefined) data.nextTask = o.nextTask;
  if (o.owner !== undefined) data.owner = o.owner;
  if (o.notes !== undefined) data.notes = o.notes;
  if (o.isDemo !== undefined) data.isDemo = o.isDemo;

  if (o.eventDate !== undefined) {
    data.eventDate = o.eventDate ? new Date(o.eventDate) : null;
  }

  return data;
}

// ── EPKs ────────────────────────────────────────────────────

type PrismaEPKWithArtist = PrismaEPK & {
  artist?: { name: string };
};

export function dbEpkToAdmin(e: PrismaEPKWithArtist): AdminEpk {
  return {
    id: e.id,
    artistId: e.artistId,
    artistName: e.artist?.name ?? "",
    status: e.status as AdminEpk["status"],
    createdDate: e.createdAt.toISOString().slice(0, 10),
    lastEdited: e.updatedAt.toISOString().slice(0, 10),
    publishUrl: e.publishUrl ?? null,
    isDemo: e.isDemo as true,
  };
}

export function adminEpkToDbInput(e: Partial<AdminEpk>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (e.artistId !== undefined) data.artistId = e.artistId;
  if (e.status !== undefined) data.status = e.status;
  if (e.publishUrl !== undefined) data.publishUrl = e.publishUrl;
  if (e.isDemo !== undefined) data.isDemo = e.isDemo;

  return data;
}

// ── Research (Contact model) ────────────────────────────────

export function dbContactToResearch(c: PrismaContact): ResearchContact {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    organization: c.organization,
    role: c.role,
    sourceUrl: c.sourceUrl,
    sourceDate: c.sourceDate,
    region: c.region,
    venueType: c.venueType as ResearchContact["venueType"],
    action: c.action as ResearchContact["action"],
    notes: c.notes,
    isDemo: c.isDemo as true,
  };
}

export function adminResearchToDbInput(r: Partial<ResearchContact>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (r.name !== undefined) data.name = r.name;
  if (r.email !== undefined) data.email = r.email;
  if (r.organization !== undefined) data.organization = r.organization;
  if (r.role !== undefined) data.role = r.role;
  if (r.sourceUrl !== undefined) data.sourceUrl = r.sourceUrl;
  if (r.sourceDate !== undefined) data.sourceDate = r.sourceDate;
  if (r.region !== undefined) data.region = r.region;
  if (r.venueType !== undefined) data.venueType = r.venueType;
  if (r.action !== undefined) data.action = r.action;
  if (r.notes !== undefined) data.notes = r.notes;
  if (r.isDemo !== undefined) data.isDemo = r.isDemo;

  return data;
}
