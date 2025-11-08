'use client';

import { PATH_ADMIN_CONFIGURATION } from '@/app/paths';
import ResponsiveText from '@/components/primitives/ResponsiveText';
import clsx from 'clsx/lite';
import { usePathname } from 'next/navigation';
import LinkWithLoaderBackground from '@/components/LinkWithLoaderBackground';

// Minimal admin info navigation - photography features removed
const ADMIN_INFO_PAGES = [{
  title: 'App Configuration',
  path: PATH_ADMIN_CONFIGURATION,
}];

export default function AdminInfoPage({
  includeInsights,
}: {
  includeInsights: boolean
}) {
  const pathname = usePathname();

  const pages = ADMIN_INFO_PAGES;
  const hasMultiplePages = pages.length > 1;

  return (
    <div className="flex items-center gap-4 min-h-9">
      <div className={clsx(
        'grow -translate-x-1',
        'flex items-center gap-1.5 md:gap-3',
      )}>
        {pages
          .map(({ title, path }) =>
            <LinkWithLoaderBackground
              key={path}
              href={path}
              className={clsx(
                'relative',
                hasMultiplePages
                  ? pathname === path
                    ? 'font-medium'
                    : 'text-dim'
                  : undefined,
                'hover:text-main active:text-dim',
              )}
            >
              <ResponsiveText>
                {title}
              </ResponsiveText>
            </LinkWithLoaderBackground>)}
      </div>
    </div>
  );
}
