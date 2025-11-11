'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/state/AppState';
import { Provider } from '@prisma/client';
import { getTopProviders } from '@/provider/actions';
import SearchModal from './SearchModal';

export default function CommandK() {
  const { isCommandKOpen, setIsCommandKOpen } = useAppState();
  const [topProviders, setTopProviders] = useState<Provider[]>([]);

  useEffect(() => {
    // Fetch top providers for search modal
    const fetchTopProviders = async () => {
      const providers = await getTopProviders(10);
      setTopProviders(providers);
    };

    fetchTopProviders();
  }, []);

  return (
    <SearchModal
      isOpen={isCommandKOpen ?? false}
      onClose={() => setIsCommandKOpen?.(false)}
      topProviders={topProviders}
    />
  );
}
