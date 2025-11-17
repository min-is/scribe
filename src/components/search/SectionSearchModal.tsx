'use client';

import { Command } from 'cmdk';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx/lite';
import Modal from '../Modal';
import CommandKItem from '@/cmdk/CommandKItem';
import Spinner from '../Spinner';
import { PageType } from '@prisma/client';

type SearchResult = {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  type: PageType;
  snippet?: string;
  viewCount: number;
  updatedAt: string;
};

const SECTION_TITLES: Record<PageType, string> = {
  PROVIDER: 'Providers',
  PROCEDURE: 'Procedures',
  SMARTPHRASE: 'Smart Phrases',
  SCENARIO: 'Scenarios',
  WIKI: 'Pages',
  FOLDER: 'Folders',
  PHYSICIAN_DIRECTORY: 'Physicians',
  MEDICATION: 'Medications',
};

export default function SectionSearchModal({
  isOpen,
  onClose,
  section,
}: {
  isOpen: boolean;
  onClose: () => void;
  section: PageType;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const heightMaximum = '24rem';

  // Fetch results when query changes
  useEffect(() => {
    if (!query || query.trim() === '') {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&type=${section}`
        );
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query, section]);

  const handleSelect = (result: SearchResult) => {
    router.push(`/home/pages/${result.slug}`);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  const sectionTitle = SECTION_TITLES[section];

  return (
    <Modal onClose={onClose} anchor="top" fast noPadding>
      <Command shouldFilter={false}>
        {/* Search Input */}
        <div className="px-3 md:px-4 pt-3 md:pt-4 relative">
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder={`Search ${sectionTitle}...`}
            className={clsx(
              'w-full min-w-0!',
              'focus:ring-0',
              'border-gray-200! dark:border-gray-800!',
              'focus:border-gray-200 dark:focus:border-gray-800',
              'placeholder:text-gray-400/80',
              'dark:placeholder:text-gray-700',
              'focus:outline-hidden'
            )}
            autoFocus
          />
          {isSearching && (
            <div className="absolute top-[9px] right-4 w-10 flex items-center justify-center">
              <Spinner size={16} />
            </div>
          )}
        </div>

        {/* Results List */}
        <Command.List className="overflow-y-auto" style={{ maxHeight: heightMaximum }}>
          <div className="pt-2 pb-3 px-3 flex flex-col gap-2">
            {query.trim() === '' ? (
              <div className="mt-1 pl-3 text-dim text-base pb-0.5">
                Start typing to search {sectionTitle.toLowerCase()}
              </div>
            ) : results.length === 0 && !isSearching ? (
              <Command.Empty className="mt-1 pl-3 text-dim text-base pb-0.5">
                No {sectionTitle.toLowerCase()} found
              </Command.Empty>
            ) : (
              <Command.Group
                heading={
                  <div
                    className={clsx(
                      'flex items-center',
                      'px-2 py-1',
                      'text-xs font-medium text-dim tracking-wider'
                    )}
                  >
                    {sectionTitle}
                  </div>
                }
                className="uppercase select-none"
              >
                {results.map((result) => (
                  <CommandKItem
                    key={result.id}
                    label={
                      <div className="flex items-center gap-2">
                        {result.icon && <span>{result.icon}</span>}
                        <span>{result.title}</span>
                      </div>
                    }
                    value={result.title}
                    onSelect={() => handleSelect(result)}
                    annotation={result.snippet}
                  />
                ))}
              </Command.Group>
            )}
          </div>
        </Command.List>
      </Command>
    </Modal>
  );
}
