'use client';

import { WikiSection } from '@/provider/wiki-schema';
import { useState, useEffect } from 'react';

interface TableOfContentsProps {
  sections: WikiSection[];
  onNavigate?: (sectionId: string) => void;
}

export function TableOfContents({ sections, onNavigate }: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Find which section is currently in view
      const sectionElements = sections.map((s) =>
        document.getElementById(`section-${s.id}`)
      );

      for (const element of sectionElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
            setActiveSection(element.id.replace('section-', ''));
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    onNavigate?.(sectionId);
  };

  const visibleSections = sections.filter((s) => s.visible);

  if (visibleSections.length === 0) {
    return null;
  }

  return (
    <nav className="sticky top-4 bg-medium border border-main rounded-lg p-4 space-y-2">
      <h3 className="text-sm font-semibold text-main uppercase tracking-wider mb-3">
        Table of Contents
      </h3>
      <div className="space-y-1">
        {visibleSections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`
              w-full text-left px-3 py-2 rounded text-sm transition-colors
              ${
                activeSection === section.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-dim hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-main'
              }
            `}
          >
            {section.title}
          </button>
        ))}
      </div>
    </nav>
  );
}
