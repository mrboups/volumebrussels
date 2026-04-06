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
    pictures: ["/clubs/bloody-louis.jpg"],
    instagramUrl: "https://www.instagram.com/bloodylouisgram/",
    facebookUrl: "https://www.facebook.com/BloodyLouis/",
    websiteUrl: "https://xceed.me/fr/brussels/club/bloody-louis/channel--bloody-louis",
    openDays: ["saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "saturday" as const,
    payPerVisit: 20,
    musicTags: ["HIP-HOP"],
    dresscodeTags: ["FASHION", "21+"],
    openTime: "18",
    closeTime: "8",
  },
  {
    name: "Spirito",
    slug: "spirito",
    address: "Rue de Stassart 18, Brussels",
    description: "Huge dance floor in the innovative decor made of crystal and gold in this old anglican church",
    pictures: ["/clubs/spirito.jpg"],
    instagramUrl: "https://www.instagram.com/spiritobrussels/",
    facebookUrl: "https://www.facebook.com/spiritobrussels.be",
    websiteUrl: "https://spiritobrussels.com",
    openDays: ["friday", "saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "both" as const,
    payPerVisit: 20,
    musicTags: ["HIP-HOP", "TECHNO", "HOUSE", "VARIOUS"],
    dresscodeTags: ["CASUAL", "CHIC"],
    openTime: "20",
    closeTime: "8",
  },
  {
    name: "Mirano",
    slug: "mirano",
    address: "Ch. de Louvain 38, Brussels",
    description: "Famous classy club in an old theatre",
    pictures: ["/clubs/mirano.jpg"],
    instagramUrl: "https://www.instagram.com/miranobrussels/",
    facebookUrl: "https://www.facebook.com/miranobrussels/",
    websiteUrl: "https://miranobrussels.com",
    openDays: ["friday", "saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "both" as const,
    payPerVisit: 20,
    musicTags: ["HOUSE", "VARIOUS"],
    dresscodeTags: ["NO DRESSCODE"],
    openTime: "20",
    closeTime: "8",
  },
  {
    name: "Fuse",
    slug: "fuse",
    address: "Rue Blaes 208, Brussels",
    description: "Legendary club with finest techno line-ups since 1994",
    pictures: ["/clubs/fuse.jpg"],
    instagramUrl: "https://www.instagram.com/fusebrussels/",
    facebookUrl: "https://www.facebook.com/fusebrussels/",
    websiteUrl: "https://fuse.be",
    openDays: ["friday", "saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "both" as const,
    payPerVisit: 20,
    musicTags: ["TECHNO"],
    dresscodeTags: ["NO DRESSCODE"],
    openTime: "18",
    closeTime: "8",
  },
  {
    name: "C12",
    slug: "c12",
    address: "Rue du Marché Aux Herbes 116, Brussels",
    description: "Massive party in the hall designed by Horta located under the Central Train Station",
    pictures: ["/clubs/c12.jpg"],
    instagramUrl: "https://www.instagram.com/c12_bxl/",
    facebookUrl: "https://www.facebook.com/C12Bxl/",
    websiteUrl: "https://c12space.com",
    openDays: ["saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "saturday" as const,
    payPerVisit: 20,
    musicTags: ["TECHNO", "HOUSE"],
    dresscodeTags: ["NO DRESSCODE", "21+"],
    openTime: "18",
    closeTime: "8",
  },
  {
    name: "Madame Moustache",
    slug: "madame-moustache",
    address: "Quai au Bois à Brûler 5/7, Brussels",
    description: "Back to the future in a bizarre club in the old part of town",
    pictures: ["/clubs/madame-moustache.jpg"],
    instagramUrl: "https://www.instagram.com/madamemoustachebrussels/",
    facebookUrl: "https://www.facebook.com/MadameMoustacheBrussels/",
    websiteUrl: "https://madamemoustache.be",
    openDays: ["friday", "saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "both" as const,
    payPerVisit: 10,
    musicTags: ["DISCO", "RETRO"],
    dresscodeTags: ["NO DRESSCODE"],
    openTime: "14",
    closeTime: "8",
  },
  {
    name: "Chez Ginette",
    slug: "chez-ginette",
    address: "Rue Duquesnoy 18, Brussels",
    description: "Festive club around French music and Brussels culture",
    pictures: ["/clubs/chez-ginette.jpg"],
    instagramUrl: "https://www.instagram.com/chezginette.bxl/",
    facebookUrl: "https://www.facebook.com/ChezGinette.Brussels/",
    websiteUrl: "https://facebook.com/ChezGinette.Brussels",
    openDays: ["friday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "friday" as const,
    payPerVisit: 20,
    musicTags: ["POP", "EURODANCE"],
    dresscodeTags: ["NO DRESSCODE"],
    openTime: "18",
    closeTime: "8",
  },
  {
    name: "UMI",
    slug: "umi",
    address: "Rue du Marché aux Fromages 10, Brussels",
    description: "Small, intimate club with quality musical programming.",
    pictures: ["/clubs/umi.png"],
    instagramUrl: "https://www.instagram.com/umibrussels/",
    facebookUrl: "https://www.facebook.com/umibrussels",
    websiteUrl: "https://umibrussels.art",
    openDays: ["friday", "saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "both" as const,
    payPerVisit: 20,
    musicTags: ["TECHNO", "HOUSE"],
    dresscodeTags: ["NO DRESSCODE"],
    openTime: "14",
    closeTime: "8",
  },
  {
    name: "Jalousy",
    slug: "jalousy",
    address: "Rue Haute 4, Brussels",
    description: "A cocktail bar at the crossroad between a club and a speakeasy",
    pictures: ["/clubs/jalousy.jpg"],
    instagramUrl: "https://www.instagram.com/jalousybrussels/",
    facebookUrl: "https://www.facebook.com/pages/Sablon-Jalousy-Club/199556050612642",
    websiteUrl: "https://facebook.com/groups/558758214290945/",
    openDays: ["friday", "saturday"] as ("friday" | "saturday" | "sunday")[],
    passInclusion: "both" as const,
    payPerVisit: 20,
    musicTags: ["ELECTRO", "DISCO"],
    dresscodeTags: ["CASUAL", "21+"],
    openTime: "20",
    closeTime: "8",
  },
];

const museums = [
  {
    name: "Atomium",
    slug: "atomium",
    address: "Place de Belgique, Brussels",
    description: "The most popular tourist attraction in the capital of Europe.",
    pictures: ["/museums/atomium.jpg"],
    websiteUrl: "https://atomium.be",
    payPerVisit: 8,
  },
  {
    name: "Design Museum Brussels",
    slug: "design-museum",
    address: "Place de l'Atomium 1, Brussels",
    description: "A space dedicated to design from the 20th and 21st centuries.",
    pictures: ["/museums/design-museum.jpg"],
    websiteUrl: "https://designmuseum.brussels",
    payPerVisit: 0,
  },
  {
    name: "GardeRobe MannekenPis",
    slug: "garderobe-mannekenpis",
    address: "Rue du Chêne 19, Brussels",
    description: "Manneken-Pis is the only statue in the world with an actual dressing room!",
    pictures: ["/museums/garderobe-mannekenpis.jpg"],
    websiteUrl: "https://mannekenpis.brussels",
    payPerVisit: 5,
  },
  {
    name: "Sewer Museum",
    slug: "sewer-museum",
    address: "Porte d'Anderlecht, Brussels",
    description: "Descend deep into the bowels of the city for this unique experience!",
    pictures: ["/museums/sewer-museum.jpg"],
    websiteUrl: "https://sewermuseum.brussels",
    payPerVisit: 5,
  },
  {
    name: "Fashion & Lace Museum",
    slug: "fashion-lace-museum",
    address: "Rue de la Violette 12, Brussels",
    description: "Until the 19th century, this fabric made the Brussels famous across the globe.",
    pictures: ["/museums/fashion-lace-museum.jpg"],
    websiteUrl: "https://fashionandlacemuseum.brussels",
    payPerVisit: 5,
  },
  {
    name: "La Maison du Roi",
    slug: "maison-du-roi",
    address: "Grand-Place, Brussels",
    description: "The most important work in our collection is undoubtedly the building that houses the museum.",
    pictures: ["/museums/maison-du-roi.jpg"],
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

  // --- Events ---
  const eventData = [
    { name: "Gasolina Social Club", slug: "gasolina", venueName: "Various Venues", venueAddress: "Brussels", description: "Reggaeton Party & Salsa Class", date: "2026-04-11" },
    { name: "Ma Jolie", slug: "majolie", venueName: "Brussels", venueAddress: "Brussels", description: "Ma Jolie party night", date: "2026-04-18" },
    { name: "Space x Mirano", slug: "space", venueName: "Mirano Brussels", venueAddress: "Ch. de Louvain 38, Brussels", description: "Space party at Mirano", date: "2026-04-11" },
    { name: "Hangar Festival", slug: "hangarfestival", venueName: "Hangar", venueAddress: "Brussels", description: "Hangar Festival Brussels", date: "2026-05-01" },
    { name: "Coco Club", slug: "cococlub", venueName: "Brussels", venueAddress: "Brussels", description: "Coco Club night", date: "2026-04-18" },
    { name: "AfroBase", slug: "afrobase", venueName: "Mirano Brussels", venueAddress: "Ch. de Louvain 38, Brussels", description: "AfroBase x Mirano", date: "2026-04-12" },
    { name: "Oscar Mulero", slug: "oscarmulero", venueName: "Fuse", venueAddress: "Rue Blaes 208, Brussels", description: "Oscar Mulero at Fuse", date: "2026-04-19" },
    { name: "Madame X", slug: "madamex", venueName: "Madame Moustache", venueAddress: "Quai au Bois à Brûler 5/7, Brussels", description: "Madame X party", date: "2026-04-11" },
    { name: "21AM", slug: "21am", venueName: "Brussels", venueAddress: "Brussels", description: "21AM event", date: "2026-04-25" },
    { name: "On Sunday", slug: "onsunday", venueName: "Brussels", venueAddress: "Brussels", description: "On Sunday party", date: "2026-04-13" },
    { name: "UMI Night", slug: "umi-night", venueName: "UMI", venueAddress: "Rue du Marché aux Fromages 10, Brussels", description: "UMI club night", date: "2026-04-12" },
  ];

  const now = new Date();
  for (const ev of eventData) {
    const eventDate = new Date(ev.date + "T23:00:00Z");
    const event = await prisma.event.create({
      data: {
        name: ev.name,
        slug: ev.slug,
        venueName: ev.venueName,
        venueAddress: ev.venueAddress,
        description: ev.description,
        date: eventDate,
        isActive: true,
      },
    });
    await prisma.pricingPhase.create({
      data: {
        eventId: event.id,
        name: "regular",
        price: 15,
        startDate: now,
        endDate: eventDate,
      },
    });
    console.log(`  Event: ${ev.name}`);
  }

  console.log(`Seeded ${eventData.length} events`);

  // --- Admin user ---
  const bcrypt = require("bcryptjs");
  const hashedPassword = await bcrypt.hash("volume2026", 12);
  await prisma.user.upsert({
    where: { email: "volumebrussels@gmail.com" },
    update: { name: "Volume Admin", role: "admin", password: hashedPassword },
    create: {
      email: "volumebrussels@gmail.com",
      name: "Volume Admin",
      role: "admin",
      password: hashedPassword,
    },
  });
  console.log("  Admin user: volumebrussels@gmail.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
