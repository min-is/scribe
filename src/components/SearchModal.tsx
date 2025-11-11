'use client';

import { Command } from 'cmdk';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx/lite';
import { PATH_PRACTICE_TYPING, PATH_ADMIN, PATH_ADMIN_CONFIGURATION } from '@/app/paths';
import Modal from './Modal';
import CommandKItem from '@/cmdk/CommandKItem';
import { FaUserMd, FaHospital, FaFileAlt, FaKeyboard } from 'react-icons/fa';
import { HiDocumentText } from 'react-icons/hi';
import { RiToolsFill } from 'react-icons/ri';
import Spinner from './Spinner';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';

const DIALOG_TITLE = 'Search Medical Scribe Dashboard';
const DIALOG_DESCRIPTION = 'For searching features, settings, and resources';

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
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const heightMaximum = '18rem';
  const maxHeight = heightMaximum;

  // Define medical dashboard sections
  const physicianPreferencesSection: CommandKSection = useMemo(() => ({
    heading: 'Physician Preferences',
    accessory: <FaUserMd size={14} />,
    items: [
      {
        label: 'Dr. Smith - Cardiology',
        annotation: 'Detailed HPI',
        keywords: ['smith', 'cardiology', 'heart', 'preferences'],
        path: '#physician-smith',
        accessory: <FaUserMd size={14} className="text-gray-500 dark:text-gray-400" />,
      },
      {
        label: 'Dr. Johnson - Family Medicine',
        annotation: 'Brief notes',
        keywords: ['johnson', 'family', 'medicine', 'preferences'],
        path: '#physician-johnson',
        accessory: <FaUserMd size={14} className="text-gray-500 dark:text-gray-400" />,
      },
    ],
  }), []);

  const scenariosSection: CommandKSection = useMemo(() => ({
    heading: 'Scenarios',
    accessory: <FaHospital size={14} />,
    items: [
      {
        label: 'Chest Pain Presentation',
        annotation: 'Cardiac',
        keywords: ['chest', 'pain', 'cardiac', 'heart', 'scenario'],
        path: '#scenario-chest-pain',
        accessory: <FaHospital size={14} className="text-gray-500 dark:text-gray-400" />,
      },
      {
        label: 'Diabetic Follow-up',
        annotation: 'Endocrine',
        keywords: ['diabetes', 'follow', 'endocrine', 'scenario'],
        path: '#scenario-diabetes',
        accessory: <FaHospital size={14} className="text-gray-500 dark:text-gray-400" />,
      },
    ],
  }), []);

  const epicDotPhrasesSection: CommandKSection = useMemo(() => ({
    heading: 'EPIC Dot Phrases',
    accessory: <HiDocumentText size={14} />,
    items: [
      {
        label: '.chestpain',
        annotation: 'Chest pain template',
        keywords: ['chest', 'pain', 'dot', 'phrase', 'epic', 'template'],
        path: '#dotphrase-chestpain',
        accessory: <HiDocumentText size={14} className="text-gray-500 dark:text-gray-400" />,
      },
      {
        label: '.physicalexam',
        annotation: 'Physical exam template',
        keywords: ['physical', 'exam', 'dot', 'phrase', 'epic', 'template'],
        path: '#dotphrase-physical',
        accessory: <HiDocumentText size={14} className="text-gray-500 dark:text-gray-400" />,
      },
      {
        label: '.rosgeneral',
        annotation: 'Review of systems',
        keywords: ['ros', 'review', 'systems', 'dot', 'phrase', 'epic'],
        path: '#dotphrase-ros',
        accessory: <HiDocumentText size={14} className="text-gray-500 dark:text-gray-400" />,
      },
    ],
  }), []);

  const miscellaneousSection: CommandKSection = useMemo(() => ({
    heading: 'Miscellaneous',
    accessory: <FaFileAlt size={14} />,
    items: [
      {
        label: 'Typing Practice',
        annotation: 'Improve your speed',
        keywords: ['typing', 'practice', 'medical', 'terms', 'speed', 'wpm', 'trainer', 'keyboard'],
        path: PATH_PRACTICE_TYPING,
        accessory: <FaKeyboard size={14} className="text-gray-500 dark:text-gray-400" />,
      },
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
    physicianPreferencesSection,
    scenariosSection,
    epicDotPhrasesSection,
    miscellaneousSection,
  ], [physicianPreferencesSection, scenariosSection, epicDotPhrasesSection, miscellaneousSection]);

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

  const handleSelect = (item: CommandKItem) => {
    if (item.path) {
      router.push(item.path);
    } else if (item.action) {
      item.action();
    }
    onClose();
    setQuery('');
  };

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      anchor="top"
      fast
      noPadding
    >
      <VisuallyHidden.Root>
        <DialogTitle>{DIALOG_TITLE}</DialogTitle>
        <DialogDescription>{DIALOG_DESCRIPTION}</DialogDescription>
      </VisuallyHidden.Root>

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
