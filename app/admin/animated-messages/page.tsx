import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AnimatedMessagesClient from './AnimatedMessagesClient';

export const metadata: Metadata = {
  title: 'Animated Messages | Admin',
  description: 'Manage animated typewriter messages',
};

export const dynamic = 'force-dynamic';

export default async function AnimatedMessagesPage() {
  const messages = await prisma.animatedMessage.findMany({
    orderBy: { order: 'asc' },
  });

  return <AnimatedMessagesClient initialMessages={messages} />;
}
