// Seed the test venue login into the VenueLogin table.
// Run: npx tsx scripts/seed-venue-login.ts

import dotenv from "dotenv";
import path from "path";
import crypto from "node:crypto";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error("No DATABASE_URL set in .env.local");
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return `${salt}:${hash.toString("hex")}`;
}

async function main() {
  console.log("Seeding test venue login...");
  const passwordHash = await hashPassword("testingVenues3307");
  const result = await prisma.venueLogin.upsert({
    where: { email: "testvenue3307@gmail.com" },
    update: { passwordHash },
    create: {
      email: "testvenue3307@gmail.com",
      passwordHash,
      displayName: "Venue Partner",
      organizationName: "Test Venue",
      accountType: "Venue",
      isActive: true,
    },
  });
  console.log("Seeded venue login:", result.id, result.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
