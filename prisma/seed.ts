import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const clubs = [
  {
    name: "Fuse",
    slug: "fuse",
    address: "208 Rue Blaes, 1000 Brussels",
    description: "Legendary techno club in the heart of Brussels, a staple of the European electronic music scene since 1994.",
    pictures: ["https://agendabrussels2.imgix.net/9889c1565b407d816d0cedc7b9ee734bb2b3cc28.jpg"],
    instagramUrl: "https://instagram.com/fusebrussels",
    facebookUrl: "https://facebook.com/fusebrussels",
    openDays: ["friday", "saturday"],
    passInclusion: "both",
  },
  {
    name: "C12",
    slug: "c12",
    address: "Rue de la Bourse, 1000 Brussels",
    description: "Underground venue beneath the Bourse building, known for cutting-edge electronic and experimental music.",
    pictures: ["https://agendabrussels2.imgix.net/457c87a0c5fbce4ab6c6d7a452295991a260d886.png"],
    instagramUrl: "https://instagram.com/c12brussels",
    facebookUrl: "https://facebook.com/c12brussels",
    openDays: ["friday", "saturday"],
    passInclusion: "both",
  },
  {
    name: "Madame Moustache",
    slug: "madame-moustache",
    address: "Quai au Bois à Brûler 5/7, 1000 Brussels",
    description: "Eclectic bar and club offering a mix of electro-swing, funk, and house in a vintage setting.",
    pictures: ["https://agendabrussels2.imgix.net/34bd2d840dc0d3b12db0911e4305df9c4d9305d3.jpg"],
    instagramUrl: "https://instagram.com/madamemoustache",
    facebookUrl: "https://facebook.com/madamemoustache",
    openDays: ["friday", "saturday"],
    passInclusion: "both",
  },
  {
    name: "Mirano Brussels",
    slug: "mirano",
    address: "Chaussée de Louvain 38, 1210 Brussels",
    description: "Iconic Brussels venue blending art-deco glamour with world-class DJs and immersive events.",
    pictures: ["https://agendabrussels2.imgix.net/f05d18f7d49d0aa53b11a6f1edd194e8dda3b3d7.png"],
    instagramUrl: "https://instagram.com/miranobrussels",
    facebookUrl: "https://facebook.com/miranobrussels",
    openDays: ["friday", "saturday"],
    passInclusion: "both",
  },
  {
    name: "UMI",
    slug: "umi",
    address: "Brussels",
    description: "Contemporary art and music space hosting immersive electronic music nights.",
    pictures: ["https://agendabrussels2.imgix.net/03dc9e8e50c2dc7ffc6caf31d6d3470953ab51ee.jpg"],
    instagramUrl: "https://instagram.com/umibrussels",
    facebookUrl: "https://facebook.com/umibrussels",
    openDays: ["friday", "saturday"],
    passInclusion: "both",
  },
  {
    name: "Chez Ginette",
    slug: "chez-ginette",
    address: "Brussels",
    description: "Homemade club with a unique and intimate atmosphere for underground music lovers.",
    pictures: ["https://agendabrussels2.imgix.net/509e17890b0b9e4072f3b29cb631b8dcfacb9497.png"],
    instagramUrl: "",
    facebookUrl: "",
    openDays: ["friday", "saturday"],
    passInclusion: "both",
  },
];

const museums = [
  {
    name: "Atomium",
    slug: "atomium",
    address: "Place de l'Atomium 1, 1020 Brussels",
    description: "The iconic Atomium, symbol of Brussels and a must-visit landmark.",
    pictures: [],
    websiteUrl: "https://www.atomium.be",
    payPerVisit: 8,
  },
  {
    name: "Brussels Design Museum",
    slug: "brussels-design-museum",
    address: "Place de Belgique 1, 1020 Brussels",
    description: "Contemporary design museum located next to the Atomium.",
    pictures: [],
    websiteUrl: "https://www.adamuseum.be",
    payPerVisit: 8,
  },
];

async function main() {
  console.log("Seeding database...");

  for (const club of clubs) {
    await prisma.club.upsert({
      where: { slug: club.slug },
      update: club,
      create: club,
    });
    console.log(`  Club: ${club.name}`);
  }

  for (const museum of museums) {
    await prisma.museum.upsert({
      where: { slug: museum.slug },
      update: museum,
      create: museum,
    });
    console.log(`  Museum: ${museum.name}`);
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
