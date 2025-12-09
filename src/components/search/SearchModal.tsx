'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Loader2, X } from 'lucide-react';
import { clsx } from 'clsx/lite';

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  type: string;
  snippet: string;
  viewCount: number;
}

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setResults(data);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    }
  };

  const navigateToResult = (result: SearchResult) => {
    router.push(`/home/pages/${result.slug}`);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-main">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-main border border-main rounded-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-main">
          <Search size={20} className="text-dim flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="flex-1 bg-transparent border-none outline-none text-main placeholder-dim text-base"
          />
          {isSearching && (
            <Loader2 size={20} className="text-dim animate-spin flex-shrink-0" />
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-dim rounded transition-colors"
          >
            <X size={20} className="text-dim" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && query.trim() && !isSearching && (
            <div className="px-4 py-8 text-center text-dim">
              No pages found for &quot;{query}&quot;
            </div>
          )}

          {results.length === 0 && !query.trim() && (
            <div className="px-4 py-8 text-center text-dim">
              <div className="mb-2">Quick search</div>
              <div className="text-sm">
                Type to search across all pages
              </div>
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => navigateToResult(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={clsx(
                'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                index === selectedIndex
                  ? 'bg-dim'
                  : 'hover:bg-dim'
              )}
            >
              <div className="text-2xl flex-shrink-0 mt-0.5">
                {result.icon || <FileText size={20} className="text-dim" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-main mb-1">
                  {highlightMatch(result.title, query)}
                </div>
                {result.snippet && (
                  <div className="text-sm text-dim line-clamp-2">
                    {highlightMatch(result.snippet, query)}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-dim">
                  <span className="px-2 py-0.5 bg-medium rounded text-xs">
                    {result.type}
                  </span>
                  <span>•</span>
                  <span>{result.viewCount} views</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-main bg-dim text-xs text-dim">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-medium border border-main rounded text-xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-medium border border-main rounded text-xs ml-1">↓</kbd>
              {' '}to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-medium border border-main rounded text-xs">↵</kbd>
              {' '}to select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-medium border border-main rounded text-xs">esc</kbd>
              {' '}to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
