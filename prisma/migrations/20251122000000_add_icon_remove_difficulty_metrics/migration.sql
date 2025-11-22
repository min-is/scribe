-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "icon" TEXT;

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "speedDifficulty";

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "terminologyDifficulty";

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "noteDifficulty";
