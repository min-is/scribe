'use client';

import { Command } from 'cmdk';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx/lite';
import { PATH_ADMIN, PATH_ADMIN_CONFIGURATION, PATH_SMARTPHRASES, PATH_SCENARIOS, PATH_PROCEDURES, PATH_EDITOR_MEDICATIONS, PATH_EDITOR_TERMINOLOGY } from '@/app/paths';
import Modal from './Modal';
import CommandKItem from '@/cmdk/CommandKItem';
import { FaUserMd, FaHospital, FaFileAlt, FaPills, FaBook } from 'react-icons/fa';
import { HiDocumentText } from 'react-icons/hi';
import { RiToolsFill } from 'react-icons/ri';
import { FiActivity } from 'react-icons/fi';
import Spinner from './Spinner';
import { Provider } from '@prisma/client';
import { incrementProviderSearchClick } from '@/provider/actions';

type CommandKItem = {
  label: ReactNode
  keywords?: string[]
  accessory?: ReactNode
  annotation?: ReactNode
  path?: string
  action?: () => void | Promise<void>
}

type CommandKSection = {
  heading: string
  accessory?: ReactNode
  items: CommandKItem[]
}

export default function SearchModal({
  isOpen,
  onClose,
  topProviders = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  topProviders?: Provider[];
}) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const heightMaximum = '18rem';
  const maxHeight = heightMaximum;

  // Define provider preferences section (dynamic)
  const providerPreferencesSection: CommandKSection = useMemo(() => {
    const providerItems = topProviders.map(provider => ({
      label: `${provider.name}${provider.credentials ? `, ${provider.credentials}` : ''}`,
      annotation: provider.generalDifficulty
        ? `Difficulty: ${provider.generalDifficulty}/10`
        : undefined,
      keywords: [
        provider.name.toLowerCase(),
        ...(provider.credentials ? [provider.credentials.toLowerCase()] : []),
        provider.slug,
        'provider',
        'preferences',
      ],
      path: `#provider-${provider.slug}`,
      action: async () => {
        // Track search click
        await incrementProviderSearchClick(provider.slug);
      },
      accessory: <FaUserMd size={14} className="text-gray-500 dark:text-gray-400" />,
    }));

    return {
      heading: 'Provider Preferences',
      accessory: <FaUserMd size={14} />,
      items: providerItems,
    };
  }, [topProviders]);

  const scenariosSection: CommandKSection = useMemo(() => ({
    heading: 'Clinical Scenarios',
    accessory: <FaHospital size={14} />,
    items: [
      {
        label: 'Clinical Scenarios',
        annotation: 'Browse all scenario walkthroughs',
        keywords: ['scenarios', 'scenario', 'walkthrough', 'emergency', 'code', 'blue', 'stroke', 'clinical'],
        path: PATH_SCENARIOS,
        accessory: <FaHospital size={14} className="text-gray-500 dark:text-gray-400" />,
      },
    ],
  }), []);

  const proceduresSection: CommandKSection = useMemo(() => ({
    heading: 'Medical Procedures',
    accessory: <FiActivity size={14} />,
    items: [
      {
        label: 'Medical Procedures',
        annotation: 'Browse all procedure guides',
        keywords: ['procedures', 'procedure', 'lumbar', 'puncture', 'intubation', 'central', 'line', 'medical'],
        path: PATH_PROCEDURES,
        accessory: <FiActivity size={14} className="text-gray-500 dark:text-gray-400" />,
      },
    ],
  }), []);

  const medicationsSection: CommandKSection = useMemo(() => ({
    heading: 'Medications',
    accessory: <FaPills size={14} />,
    items: [
      {
        label: 'Medications',
        annotation: 'Lookup medication information',
        keywords: ['medications', 'medication', 'drugs', 'pharmacy', 'prescriptions', 'meds'],
        path: PATH_EDITOR_MEDICATIONS,
        accessory: <FaPills size={14} className="text-gray-500 dark:text-gray-400" />,
      },
    ],
  }), []);

  const terminologySection: CommandKSection = useMemo(() => ({
    heading: 'Terminology',
    accessory: <FaBook size={14} />,
    items: [
      {
        label: 'Terminology',
        annotation: 'Medical terminology reference',
        keywords: ['terminology', 'terms', 'medical', 'abbreviations', 'definitions', 'glossary'],
        path: PATH_EDITOR_TERMINOLOGY,
        accessory: <FaBook size={14} className="text-gray-500 dark:text-gray-400" />,
      },
    ],
  }), []);

  const epicDotPhrasesSection: CommandKSection = useMemo(() => ({
    heading: 'SmartPhrase Library',
    accessory: <HiDocumentText size={14} />,
    items: [
      {
        label: 'SmartPhrase Library',
        annotation: 'Browse all EPIC SmartPhrases',
        keywords: ['smartphrase', 'smart', 'phrase', 'dot', 'epic', 'template', 'library', 'browse'],
        path: PATH_SMARTPHRASES,
        accessory: <HiDocumentText size={14} className="text-gray-500 dark:text-gray-400" />,
      },
    ],
  }), []);

  const miscellaneousSection: CommandKSection = useMemo(() => ({
    heading: 'Miscellaneous',
    accessory: <FaFileAlt size={14} />,
    items: [
      {
        label: 'App Configuration',
        annotation: 'Dashboard settings',
        keywords: ['settings', 'config', 'configuration', 'admin', 'setup'],
        path: PATH_ADMIN_CONFIGURATION,
        accessory: <RiToolsFill size={14} className="text-gray-500 dark:text-gray-400" />,
      },
      {
        label: 'Admin Dashboard',
        annotation: 'Management',
        keywords: ['admin', 'dashboard', 'management'],
        path: PATH_ADMIN,
        accessory: <RiToolsFill size={14} className="text-gray-500 dark:text-gray-400" />,
      },
    ],
  }), []);

  const categorySections: CommandKSection[] = useMemo(() => [
    providerPreferencesSection,
    scenariosSection,
    proceduresSection,
    medicationsSection,
    terminologySection,
    epicDotPhrasesSection,
    miscellaneousSection,
  ], [providerPreferencesSection, scenariosSection, proceduresSection, medicationsSection, terminologySection, epicDotPhrasesSection, miscellaneousSection]);

  // Filter sections based on query
  const filteredSections = useMemo(() => {
    if (!query || query.trim() === '') {
      return categorySections;
    }

    return categorySections
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          const searchString = [
            typeof item.label === 'string' ? item.label : '',
            ...(item.keywords || []),
          ].join(' ').toLowerCase();
          return searchString.includes(query.toLowerCase());
        }),
      }))
      .filter(section => section.items.length > 0);
  }, [query, categorySections]);

  const handleSelect = async (item: CommandKItem) => {
    // Execute action first (for tracking)
    if (item.action) {
      await item.action();
    }

    // Then navigate
    if (item.path) {
      // Check if it's a hash-only navigation (like #provider-slug)
      if (item.path.startsWith('#')) {
        window.location.hash = item.path;
      } else {
        router.push(item.path);
      }
    }

    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      anchor="top"
      fast
      noPadding
      ariaLabel="Search dialog"
    >
      <Command shouldFilter={false}>
        {/* Search Input */}
        <div className="px-3 md:px-4 pt-3 md:pt-4 relative">
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search features, preferences, scenarios ..."
            className={clsx(
              'w-full min-w-0!',
              'focus:ring-0',
              'border-gray-200! dark:border-gray-800!',
              'focus:border-gray-200 dark:focus:border-gray-800',
              'placeholder:text-gray-400/80',
              'dark:placeholder:text-gray-700',
              'focus:outline-hidden',
            )}
            autoFocus
          />
          {false && (
            <div className="absolute top-[9px] right-0 w-10 flex items-center justify-center">
              <Spinner size={16} />
            </div>
          )}
        </div>

        {/* Results List */}
        <Command.List
          className="overflow-y-auto"
          style={{ maxHeight }}
        >
          <div className="pt-2 pb-3 px-3 flex flex-col gap-2">
            <Command.Empty className="mt-1 pl-3 text-dim text-base pb-0.5">
              No results found
            </Command.Empty>

            {/* Category Sections */}
            {filteredSections.map((section) => (
              <Command.Group
                key={section.heading}
                heading={
                  <div
                    className={clsx(
                      'flex items-center',
                      'px-2 py-1',
                      'text-xs font-medium text-dim tracking-wider',
                    )}
                  >
                    {section.accessory && <div className="w-5">{section.accessory}</div>}
                    {section.heading}
                  </div>
                }
                className="uppercase select-none"
              >
                {section.items.map((item, index) => (
                  <CommandKItem
                    key={`${section.heading}-${index}`}
                    label={item.label}
                    value={typeof item.label === 'string' ? item.label : `${section.heading}-${index}`}
                    keywords={item.keywords}
                    onSelect={() => handleSelect(item)}
                    accessory={item.accessory}
                    annotation={item.annotation}
                  />
                ))}
              </Command.Group>
            ))}
          </div>
        </Command.List>
      </Command>
    </Modal>
  );
}
