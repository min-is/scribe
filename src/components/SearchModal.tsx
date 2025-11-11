'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle theme mounting
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Get theme-aware colors for animation
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-24 px-4 bg-white dark:bg-black backdrop-blur-md"
          initial={{
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)',
          }}
          animate={{
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.80)' : 'rgba(255, 255, 255, 0.80)',
          }}
          exit={{
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)',
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-black rounded-lg md:rounded-xl shadow-2xl/20 dark:shadow-2xl/100 max-w-2xl w-full overflow-hidden border border-gray-200 dark:border-gray-800"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search features..."
                className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-0"
                autoFocus
              />
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                aria-label="Close search"
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
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100/60 dark:hover:bg-gray-900/75 transition-colors text-left"
                    >
                      <div className="text-gray-500 dark:text-gray-400">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  No results found for &quot;{query}&quot;
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
              <span>Press ESC to close</span>
              <span>⌘K to toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
