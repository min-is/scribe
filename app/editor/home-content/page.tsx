import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AnimatedMessagesClient from '../../admin/animated-messages/AnimatedMessagesClient';

export const metadata: Metadata = {
  title: 'Home Content | Editor',
  description: 'Manage home page content and animated messages',
};

export const dynamic = 'force-dynamic';

export default async function EditorHomeContentPage() {
  const messages = await prisma.animatedMessage.findMany({
    orderBy: { order: 'asc' },
  });

  return <AnimatedMessagesClient initialMessages={messages} showDelete={false} />;
}
