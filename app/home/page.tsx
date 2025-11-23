import { Metadata } from 'next';
import { PageType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: 'Home | Scribe',
  description: 'Medical knowledge base for clinical documentation',
};

async function getHomePageContent() {
  try {
    let content = await prisma.homePageContent.findFirst();

    // Create default content if it doesn't exist
    if (!content) {
      content = await prisma.homePageContent.create({
        data: {
          id: 'default',
          announcementText: 'Welcome! Check back here for important updates and announcements.',
          gettingStartedText: 'Welcome to your home!\n\n• Browse provider preferences in the Quick Actions above\n• Use the search (Cmd+K) to find specific information\n• Check back here for important announcements',
        },
      });
    }

    return {
      announcementText: content.announcementText,
      gettingStartedText: content.gettingStartedText,
    };
  } catch (error) {
    console.error('Failed to fetch home page content:', error);
    // Return fallback content on error
    return {
      announcementText: 'Welcome! Check back here for important updates and announcements.',
      gettingStartedText: 'Welcome to your home!',
    };
  }
}

export default async function HomePage() {
  // Fetch content on the server before rendering
  const content = await getHomePageContent();

  return <HomePageClient initialContent={content} />;
}
