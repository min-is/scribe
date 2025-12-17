'use client';

import { X } from 'lucide-react';
import { clsx } from 'clsx/lite';
import { ButtonHTMLAttributes } from 'react';

type CloseButtonSize = 'sm' | 'md' | 'lg';

const sizeConfig = {
  sm: { icon: 16, padding: 'p-1.5' },
  md: { icon: 20, padding: 'p-2' },
  lg: { icon: 24, padding: 'p-2.5' },
};

export default function CloseButton({
  size = 'md',
  className,
  ...props
}: {
  size?: CloseButtonSize;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  const config = sizeConfig[size];

  return (
    <button
      type="button"
      aria-label="Close"
      className={clsx(
        config.padding,
        'text-gray-400 dark:text-gray-500',
        'hover:text-gray-600 dark:hover:text-gray-300',
        'transition-colors duration-150',
        'rounded-full',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50',
        className,
      )}
      {...props}
    >
      <X
        size={config.icon}
        strokeWidth={1.5}
      />
    </button>
  );
}
