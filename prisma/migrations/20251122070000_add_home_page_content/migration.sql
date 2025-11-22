-- CreateTable
CREATE TABLE "HomePageContent" (
    "id" TEXT NOT NULL,
    "announcementText" TEXT NOT NULL,
    "gettingStartedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePageContent_pkey" PRIMARY KEY ("id")
);

-- Insert default content
INSERT INTO "HomePageContent" ("id", "announcementText", "gettingStartedText", "createdAt", "updatedAt")
VALUES (
    'default',
    'Welcome! Check back here for important updates and announcements.',
    'Welcome to your home!

• Browse provider preferences and documentation
• Access procedure guides and protocols
• Find smart phrases for EPIC documentation
• Review critical scenarios and emergency protocols',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
