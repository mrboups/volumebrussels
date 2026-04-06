import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Real data from Airtable - published offers only
const clubs = [
  {
    name: "Bloody Louis",
    slug: "bloody-louis",
    address: "Av. Louise 32, Brussels",
    description: "Hip-hop party in an exclusive uptown club",
    pictures: [] as string[],
    instagramUrl: "",
    facebookUrl: "",
    openDays: ["saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "saturday" as const,
    payPerVisit: 20,
  },
  {
    name: "Spirito",
    slug: "spirito",
    address: "Rue de Stassart 18, Brussels",
    description: "Huge dance floor in the innovative decor made of crystal and gold in this old anglican church",
    pictures: [] as string[],
    instagramUrl: "",
    facebookUrl: "",
    openDays: ["friday", "saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "both" as const,
    payPerVisit: 20,
  },
  {
    name: "Mirano",
    slug: "mirano",
    address: "Ch. de Louvain 38, Brussels",
    description: "Famous classy club in an old theatre",
    pictures: [] as string[],
    instagramUrl: "",
    facebookUrl: "",
    openDays: ["friday", "saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "both" as const,
    payPerVisit: 20,
  },
  {
    name: "Fuse",
    slug: "fuse",
    address: "Rue Blaes 208, Brussels",
    description: "Legendary club with finest techno line-ups since 1994",
    pictures: [] as string[],
    instagramUrl: "",
    facebookUrl: "",
    openDays: ["friday", "saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "both" as const,
    payPerVisit: 20,
  },
  {
    name: "C12",
    slug: "c12",
    address: "Rue du Marché Aux Herbes 116, Brussels",
    description: "Massive party in the hall designed by Horta located under the Central Train Station",
    pictures: [] as string[],
    instagramUrl: "",
    facebookUrl: "",
    openDays: ["saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "saturday" as const,
    payPerVisit: 20,
  },
  {
    name: "Madame Moustache",
    slug: "madame-moustache",
    address: "Quai au Bois à Brûler 5/7, Brussels",
    description: "Back to the future in a bizarre club in the old part of town",
    pictures: [] as string[],
    instagramUrl: "https://www.instagram.com/madamemoustachebrussels/",
    facebookUrl: "https://www.facebook.com/MadameMoustacheBrussels/",
    openDays: ["friday", "saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "both" as const,
    payPerVisit: 10,
  },
  {
    name: "Chez Ginette",
    slug: "chez-ginette",
    address: "Rue Duquesnoy 18, Brussels",
    description: "Festive club around French music and Brussels culture",
    pictures: [] as string[],
    instagramUrl: "https://www.instagram.com/chezginette.bxl/",
    facebookUrl: "https://www.facebook.com/ChezGinette.Brussels/",
    openDays: ["friday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "friday" as const,
    payPerVisit: 20,
  },
  {
    name: "UMI",
    slug: "umi",
    address: "Rue du Marché aux Fromages 10, Brussels",
    description: "Small, intimate club with quality musical programming.",
    pictures: [] as string[],
    instagramUrl: "",
    facebookUrl: "",
    openDays: ["friday", "saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "both" as const,
    payPerVisit: 20,
  },
  {
    name: "Jalousy",
    slug: "jalousy",
    address: "Rue Haute 4, Brussels",
    description: "A cocktail bar at the crossroad between a club and a speakeasy",
    pictures: [] as string[],
    instagramUrl: "",
    facebookUrl: "",
    openDays: ["friday", "saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "both" as const,
    payPerVisit: 20,
  },
];

const museums = [
  {
    name: "Atomium",
    slug: "atomium",
    address: "Place de Belgique, Brussels",
    description: "The most popular tourist attraction in the capital of Europe.",
    pictures: [] as string[],
    websiteUrl: "https://www.atomium.be",
    payPerVisit: 8,
  },
  {
    name: "Design Museum Brussels",
    slug: "design-museum",
    address: "Place de l'Atomium 1, Brussels",
    description: "A space dedicated to design from the 20th and 21st centuries.",
    pictures: [] as string[],
    websiteUrl: "https://www.adamuseum.be",
    payPerVisit: 0,
  },
  {
    name: "GardeRobe MannekenPis",
    slug: "garderobe-mannekenpis",
    address: "Rue du Chêne 19, Brussels",
    description: "Manneken-Pis is the only statue in the world with an actual dressing room!",
    pictures: [] as string[],
    websiteUrl: "https://mannekenpis.brussels",
    payPerVisit: 5,
  },
  {
    name: "Sewer Museum",
    slug: "sewer-museum",
    address: "Porte d'Anderlecht, Brussels",
    description: "Descend deep into the bowels of the city for this unique experience!",
    pictures: [] as string[],
    websiteUrl: "",
    payPerVisit: 5,
  },
  {
    name: "Fashion & Lace Museum",
    slug: "fashion-lace-museum",
    address: "Rue de la Violette 12, Brussels",
    description: "Until the 19th century, this fabric made the Brussels famous across the globe.",
    pictures: [] as string[],
    websiteUrl: "",
    payPerVisit: 5,
  },
  {
    name: "La Maison du Roi",
    slug: "maison-du-roi",
    address: "Grand-Place, Brussels",
    description: "The most important work in our collection is undoubtedly the building that houses the museum.",
    pictures: [] as string[],
    websiteUrl: "https://brusselscitymuseum.brussels",
    payPerVisit: 5,
  },
];

async function main() {
  console.log("Seeding database with real Airtable data...");

  // Delete existing data to avoid duplicates
  await prisma.passScan.deleteMany();
  await prisma.pass.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.pricingPhase.deleteMany();
  await prisma.event.deleteMany();
  await prisma.clubAccount.deleteMany();
  await prisma.club.deleteMany();
  await prisma.museum.deleteMany();
  console.log("  Cleared existing data");

  for (const club of clubs) {
    await prisma.club.create({ data: club });
    console.log(`  Club: ${club.name}`);
  }

  for (const museum of museums) {
    await prisma.museum.create({ data: museum });
    console.log(`  Museum: ${museum.name}`);
  }

  console.log(`\nSeeded ${clubs.length} clubs + ${museums.length} museums`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
