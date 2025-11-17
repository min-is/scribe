import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AnimatedMessagesClient from './AnimatedMessagesClient';

export const metadata: Metadata = {
  title: 'Animated Messages | Admin',
  description: 'Manage animated messages for the home page',
};

export const dynamic = 'force-dynamic';

export default async function AnimatedMessagesPage() {
  const messages = await prisma.animatedMessage.findMany({
    orderBy: { order: 'asc' },
  });

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-main mb-2">Animated Messages</h1>
          <p className="text-medium">
            Manage the typewriter messages that appear on the home page subheading.
          </p>
        </div>

        <AnimatedMessagesClient initialMessages={messages} />
      </div>
    </div>
  );
}
