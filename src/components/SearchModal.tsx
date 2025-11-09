'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PATH_PRACTICE_TYPING, PATH_ADMIN, PATH_ADMIN_CONFIGURATION } from '@/app/paths';
import IconKeyboard from './icons/IconKeyboard';
import AdminAppInfoIcon from '@/admin/AdminAppInfoIcon';
import { IoClose } from 'react-icons/io5';

interface SearchItem {
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  keywords: string[];
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    title: 'Typing Practice',
    description: 'Practice typing medical terminology',
    path: PATH_PRACTICE_TYPING,
    icon: <IconKeyboard size={20} />,
    keywords: ['typing', 'practice', 'medical', 'terms', 'speed', 'wpm', 'trainer', 'keyboard'],
  },
  {
    title: 'App Configuration',
    description: 'Configure dashboard settings',
    path: PATH_ADMIN_CONFIGURATION,
    icon: <AdminAppInfoIcon size="small" />,
    keywords: ['settings', 'config', 'configuration', 'admin', 'setup'],
  },
  {
    title: 'Admin',
    description: 'Admin dashboard',
    path: PATH_ADMIN,
    icon: <AdminAppInfoIcon size="small" />,
    keywords: ['admin', 'dashboard', 'management'],
  },
];

export default function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(SEARCH_ITEMS);
  const router = useRouter();

  useEffect(() => {
    if (query.trim() === '') {
      setFilteredItems(SEARCH_ITEMS);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = SEARCH_ITEMS.filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
      );
      setFilteredItems(filtered);
    }
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSelect = (path: string) => {
    router.push(path);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh] px-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search features..."
            className="flex-1 bg-transparent border-none outline-none text-lg"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredItems.length > 0 ? (
            <div className="py-2">
              {filteredItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="text-gray-600 dark:text-gray-400">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex justify-between">
          <span>Press ESC to close</span>
          <span>⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
}
