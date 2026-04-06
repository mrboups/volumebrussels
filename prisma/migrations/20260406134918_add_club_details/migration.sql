-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "closeTime" TEXT,
ADD COLUMN     "dresscodeTags" TEXT[],
ADD COLUMN     "musicTags" TEXT[],
ADD COLUMN     "openTime" TEXT,
ADD COLUMN     "websiteUrl" TEXT;
